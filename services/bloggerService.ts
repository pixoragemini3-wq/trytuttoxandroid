
import { Article, Category, Deal, DealData } from '../types';
import { MOCK_ARTICLES } from '../constants';

// Helper per pulire HTML e decodificare entità
const stripHtml = (html: string): string => {
  if (!html) return "";
  try {
    let clean = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "");
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    return doc.body.textContent || "";
  } catch (e) {
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  }
};

// Helper per estrarre dati DEAL
const extractDealWidgetData = (content: string, defaultLink: string, defaultTitle: string, defaultImage: string, id: string): Deal | null => {
  const regex = /\[DEAL\s+old="([^"]+)"\s+new="([^"]+)"(?:\s+link="([^"]+)")?\]/i;
  const match = content.match(regex);

  if (match) {
    return {
      id: `generated-deal-${id}`,
      product: defaultTitle,
      oldPrice: match[1],
      newPrice: match[2],
      saveAmount: 'OFFERTA',
      link: match[3] || defaultLink,
      imageUrl: defaultImage,
      brandColor: 'bg-[#e31b23]'
    };
  }
  return null;
};

const cleanBloggerHtml = (html: string): string => {
  if (!html) return "";
  // 1. Remove all inline styles (style="...")
  let clean = html.replace(/\sstyle="[^"]*"/gi, '');
  // 2. Remove junk classes (class="...") often added by Blogger or Word
  clean = clean.replace(/\sclass="css-[^"]*"/gi, '');
  clean = clean.replace(/\sclass="Mso[^"]*"/gi, '');
  // 3. Remove empty spans that Blogger often leaves behind
  clean = clean.replace(/<span>\s*<\/span>/gi, '');
  return clean;
};

const parseArticleContent = (rawContent: string): { cleanContent: string; dealData: DealData | null } => {
  const dealRegex = /\[DEAL\s+old=["']([^"']*)["']\s+new=["']([^"']*)["']\s+link=["']([^"']*)["']\]/i;
  const summaryRegex = /\[SUMMARY\s+title=["']([^"']*)["']\s+points=["']([^"']*)["']\]/i;
  const gpsPromoRegex = /\[GPS_PROMO\]/i;

  let dealData: DealData | null = null;
  let cleanContent = rawContent;

  const dealMatch = rawContent.match(dealRegex);
  if (dealMatch) {
    dealData = { oldPrice: dealMatch[1], newPrice: dealMatch[2], link: dealMatch[3] };
    cleanContent = cleanContent.replace(dealRegex, '');
  }

  // Replace [SUMMARY] with a placeholder div
  cleanContent = cleanContent.replace(summaryRegex, (match, title, points) => {
    return `<div class="interactive-summary-placeholder" data-title="${title}" data-points="${points}"></div>`;
  });

  // Replace [GPS_PROMO] with a placeholder div
  cleanContent = cleanContent.replace(gpsPromoRegex, () => {
    return `<div class="gps-promo-placeholder"></div>`;
  });
  
  // Clean HTML from Blogger junk
  cleanContent = cleanBloggerHtml(cleanContent);
  
  return { cleanContent, dealData };
};

// IMPROVED: Robust Image Extraction
const forceHighResImage = (url: string): string => {
  if (!url) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
  
  // Handle Blogger/Google Images
  if (url.includes('googleusercontent.com') || url.includes('bp.blogspot.com')) {
    // Replace size params like /s72-c/, /w640-h400/, /s1600/
    const newUrl = url.replace(/\/s\d+(-c)?\//, '/s1600/')
                      .replace(/\/w\d+-h\d+(-c)?\//, '/s1600/')
                      .replace(/=[sNw]\d+.*$/, '=s1600'); // Handle lh3.googleusercontent params
    return newUrl;
  }
  return url;
};

const getFirstImageFromContent = (htmlContent: string): string | null => {
    try {
        const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
        // Prioritize images inside figure or standard img tags
        const img = doc.querySelector('figure img, img');
        return img ? img.getAttribute('src') : null;
    } catch (e) {
        return null;
    }
};

// --- CORS PROXY CONFIGURATION ---
const TARGET_DOMAIN = 'https://www.tuttoxandroid.com';

// List of available proxies
const PROXY_LIST = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
];

const getFetchUrl = (path: string) => {
  // If we are on the target domain, fetch directly
  if (window.location.hostname === 'www.tuttoxandroid.com') {
    return path;
  }
  // Otherwise, we need a proxy. We return the full target URL, 
  // and the fetch function will handle wrapping it with a proxy.
  return `${TARGET_DOMAIN}${path}`;
};

const fetchWithTimeout = async (url: string, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// New helper to try multiple proxies
const fetchWithProxyFallback = async (targetUrl: string, timeout = 10000): Promise<Response> => {
  // If we are on the target domain, just fetch directly
  if (window.location.hostname === 'www.tuttoxandroid.com') {
     return fetchWithTimeout(targetUrl.replace(TARGET_DOMAIN, ''), timeout);
  }

  let lastError;
  
  for (const proxyFn of PROXY_LIST) {
    try {
      const proxyUrl = proxyFn(targetUrl);
      const response = await fetchWithTimeout(proxyUrl, timeout);
      if (response.ok) {
        return response;
      }
      // If 403 or 500, try next proxy
      console.warn(`Proxy failed: ${proxyUrl} - Status: ${response.status}`);
    } catch (e) {
      console.warn(`Proxy error: ${proxyFn(targetUrl)}`, e);
      lastError = e;
    }
  }
  throw lastError || new Error('All proxies failed');
};

export const fetchArticleById = async (id: string): Promise<string | null> => {
  if (id.length < 5) {
      const mock = MOCK_ARTICLES.find(a => a.id === id);
      return mock ? mock.content : null;
  }
  try {
    const targetUrl = `${TARGET_DOMAIN}/feeds/posts/default/${id}?alt=json`;
    const response = await fetchWithProxyFallback(targetUrl);
    if (!response.ok) return null;
    const data = await response.json();
    const rawContent = data.entry?.content?.$t || data.entry?.summary?.$t || "";
    const { cleanContent } = parseArticleContent(rawContent);
    return cleanContent;
  } catch (error) {
    return null;
  }
};

export const fetchBloggerPosts = async (category?: Category, searchQuery?: string, startIndex: number = 1): Promise<Article[]> => {
  try {
    const nativePosts = (window as any).bloggerNativePosts;
    const shouldUseNative = nativePosts && nativePosts.length > 20 && !searchQuery && startIndex === 1;

    if (shouldUseNative) {
      // ... existing native logic ...
      let filtered = nativePosts.map((p: any) => {
          const isFeatured = p.category === 'Evidenza' || p.title.includes('⭐') || (p.tags && p.tags.includes('Evidenza'));
          const { cleanContent, dealData } = parseArticleContent(p.content || '');
          const cleanExcerpt = stripHtml(cleanContent).substring(0, 180).trim() + '...';
          const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => t.trim()) : (p.category ? [p.category] : []);
          
          let mainCategory = p.category;
          if (mainCategory.toLowerCase() === 'recensione' || mainCategory.toLowerCase() === 'recensioni') mainCategory = 'Recensioni';
          if (mainCategory === 'offerteimperdibili') mainCategory = 'Offerte';

          return {
            ...p,
            title: stripHtml(p.title),
            imageUrl: forceHighResImage(p.imageUrl),
            featured: isFeatured,
            excerpt: cleanExcerpt,
            content: cleanContent,
            dealData: dealData,
            category: mainCategory,
            tags: tags
          };
      });

      if (category && category !== 'Tutti') {
        filtered = filtered.filter((p: Article) => {
            return p.category === category || (p.tags && p.tags.includes(category));
        });
      }
      if (searchQuery) {
        filtered = filtered.filter((p: Article) => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return filtered;
    }

    let feedPath = `/feeds/posts/default?alt=json&max-results=150&start-index=${startIndex}`;
    
    if (searchQuery) {
       feedPath = `/feeds/posts/default?alt=json&q=${encodeURIComponent(searchQuery)}&max-results=50&start-index=${startIndex}`;
    } else if (category && category !== 'Tutti') {
       feedPath = `/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=100&start-index=${startIndex}`;
    }
    
    const targetUrl = `${TARGET_DOMAIN}${feedPath}`;
    const response = await fetchWithProxyFallback(targetUrl, 10000);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const entries = data.feed.entry || [];

    return entries.map((entry: any) => {
      const id = entry.id.$t.split('post-')[1];
      const rawTitle = entry.title.$t;
      let rawContent = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
      const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';
      
      const categories = entry.category ? entry.category.map((c: any) => c.term.trim()) : [];
      const isFeatured = categories.some((c: string) => c === 'Evidenza' || c === 'Featured');
      
      let mainCategory = categories.length > 0 ? categories[0] : 'News';
      const displayCategory = categories.find((c: string) => !c.toLowerCase().endsWith('inevidenza') && c !== 'Evidenza');
      if (displayCategory) mainCategory = displayCategory;
      if (mainCategory === 'offerteimperdibili') mainCategory = 'Offerte';
      if (mainCategory.toLowerCase() === 'recensione' || mainCategory.toLowerCase() === 'recensioni') mainCategory = 'Recensioni';

      // 1. Try media$thumbnail
      let imageUrl = '';
      if (entry.media$thumbnail && entry.media$thumbnail.url) {
        imageUrl = entry.media$thumbnail.url;
      } 
      // 2. Try parsing HTML content for first <img> (Much more reliable than Regex)
      else {
        const extracted = getFirstImageFromContent(rawContent);
        if (extracted) imageUrl = extracted;
      }
      
      // 3. Fallback
      if (!imageUrl) imageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
      
      imageUrl = forceHighResImage(imageUrl);
      const authorImage = entry.author?.[0]?.gd$image?.src;

      const { cleanContent, dealData } = parseArticleContent(rawContent);
      const cleanExcerpt = stripHtml(cleanContent).substring(0, 180).trim() + '...';
      const cleanTitle = stripHtml(rawTitle);

      return {
        id,
        title: cleanTitle,
        excerpt: cleanExcerpt,
        content: cleanContent,
        category: mainCategory,
        tags: categories,
        imageUrl,
        author: entry.author[0].name.$t,
        authorImageUrl: authorImage,
        date: new Date(entry.published.$t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }),
        url: postUrl,
        type: 'standard',
        featured: isFeatured,
        dealData: dealData
      };
    });
  } catch (error) {
    return [];
  }
};

export const fetchArticleByUrl = async (url: string): Promise<Article | null> => {
  try {
    // 1. Extract slug/keywords from URL
    // Example: /2015/09/ipmart-forum-italia.html -> ipmart forum italia
    const slugMatch = url.match(/\/([^/]+)\.html$/);
    if (!slugMatch) return null;
    
    const slug = slugMatch[1];
    const keywords = slug.replace(/-/g, ' ');
    
    // 2. Search for the article
    const results = await fetchBloggerPosts(undefined, keywords);
    
    // 3. Find exact match or best candidate
    // We check if the result's URL contains the slug
    const match = results.find(p => p.url.includes(slug));
    
    if (match) return match;
    
    // Fallback: Return first result if highly relevant (optional, maybe risky)
    return results.length > 0 ? results[0] : null;
  } catch (e) {
    console.error("Error fetching by URL", e);
    return null;
  }
};

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  try {
    const bloggerPromise = (async () => {
        try {
            const targetUrl = `${TARGET_DOMAIN}/feeds/posts/default/-/offerteimperdibili?alt=json&max-results=20`;
            const response = await fetchWithProxyFallback(targetUrl, 5000);
            if (!response.ok) return [];
            const data = await response.json();
            const entries = data.feed.entry || [];
            const generatedDeals: Deal[] = [];
            
            entries.forEach((entry: any, index: number) => {
                const content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
                const title = stripHtml(entry.title.$t); 
                const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';
                const id = entry.id.$t;
                
                let imageUrl = '';
                if (entry.media$thumbnail) imageUrl = entry.media$thumbnail.url;
                else {
                    const extracted = getFirstImageFromContent(content);
                    if(extracted) imageUrl = extracted;
                }
                if(!imageUrl) imageUrl = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400';

                const deal = extractDealWidgetData(content, postUrl, title, imageUrl, id);
                if (deal) generatedDeals.push(deal);
            });
            return generatedDeals;
        } catch(e) { return []; }
    })();

    const telegramPromise = fetchTelegramDeals();
    const [bloggerDeals, telegramDeals] = await Promise.all([bloggerPromise, telegramPromise]);
    // Prioritizziamo Telegram se disponibile
    const allDeals = [...telegramDeals, ...bloggerDeals];
    
    const dealColors = ['bg-[#e31b23]', 'bg-blue-600', 'bg-neutral-900', 'bg-purple-600'];
    
    // INCREASED LIMIT TO 12 to support mobile carousel scrolling (at least 10 items)
    return allDeals.map((deal, idx) => ({
        ...deal,
        brandColor: dealColors[idx % dealColors.length]
    })).slice(0, 12); 
    
  } catch (error) {
    return [];
  }
};

export const fetchTelegramDeals = async (): Promise<Deal[]> => {
    const CACHE_KEY = 'txa_telegram_deals';
    const CACHE_TIME_KEY = 'txa_telegram_deals_time';
    const CACHE_EXPIRY = 1000 * 60 * 15; // 15 minutes cache

    // 1. Define Parser
    const parseDealsFromHtml = (htmlText: string): Deal[] => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const messages = doc.querySelectorAll('.tgme_widget_message');
            const deals: Deal[] = [];
            
            // Iterate backwards to get latest messages
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                const textContent = msg.querySelector('.tgme_widget_message_text')?.textContent || '';
                const textLower = textContent.toLowerCase();

                // CHECK 2: Link logic (Prioritized)
                let link = '';
                const allLinks = Array.from(msg.querySelectorAll('a'));
                const storeLink = allLinks.find(a => {
                    const href = a.getAttribute('href') || '';
                    return /amzn|amazon|ebay|unieuro|mediaworld|bit\.ly/i.test(href);
                });
                
                if (storeLink) link = storeLink.getAttribute('href') || '';
                else if (allLinks.length > 0) link = allLinks[0].getAttribute('href') || ''; // Fallback
                
                if (!link) continue;

                // CHECK 1: Filter Logic - RELAXED
                // User request: "selezionare solo le offerte che hanno hashtag"
                // However, if it's failing to find any, we might be too strict.
                // We'll look for hashtags OR clear price/link indicators.
                const hasHashtag = /#\w+/i.test(textContent);
                const hasPrice = /(\d+[.,]\d{0,2})\s?€/i.test(textContent);
                const hasStoreLink = /amzn|amazon|ebay|unieuro|mediaworld|bit\.ly/i.test(textContent);
                
                if (!hasHashtag && !(hasPrice && hasStoreLink)) {
                    continue; 
                }

                // Title Cleanup
                let cleanText = textContent.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').trim(); 
                // Remove tags from title
                cleanText = cleanText.replace(/#\w+/g, '').trim();
                
                const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
                let product = lines[0] || 'Offerta Tech';
                
                // Remove initial emojis
                product = product.replace(/^[\p{Emoji}\s]+/gu, '').trim();
                if (product.length > 65) product = product.substring(0, 65) + '...';

                // Price Extraction - Improved
                const priceRegex = /(\d+[.,]\d{0,2})\s?€/g;
                const pricesFound: number[] = [];
                let match;
                while ((match = priceRegex.exec(textContent)) !== null) {
                    const val = parseFloat(match[1].replace(',', '.'));
                    if (!isNaN(val)) pricesFound.push(val);
                }

                let newPrice = 'OFFERTA';
                let oldPrice = '';

                if (pricesFound.length > 0) {
                    const minP = Math.min(...pricesFound);
                    const maxP = Math.max(...pricesFound);
                    newPrice = minP.toFixed(2).replace('.', ',') + '€';
                    if (pricesFound.length > 1 && maxP > minP) {
                         oldPrice = maxP.toFixed(2).replace('.', ',') + '€';
                    }
                } else {
                    if (textLower.includes('gratis') || textLower.includes('free')) newPrice = 'GRATIS';
                }

                // Image Extraction
                let imageUrl = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=200';
                const photoWrap = msg.querySelector('.tgme_widget_message_photo_wrap');
                if (photoWrap) {
                     const style = photoWrap.getAttribute('style');
                     const bgMatch = style?.match(/background-image:url\('([^']+)'\)/);
                     if (bgMatch) imageUrl = bgMatch[1];
                }
                 
                deals.push({
                     id: `tg-${i}-${Date.now()}`,
                     product: product,
                     oldPrice: oldPrice, 
                     newPrice: newPrice,
                     saveAmount: 'Telegram',
                     link: link,
                     imageUrl: imageUrl,
                     brandColor: 'bg-[#24A1DE]' 
                });
                
                if (deals.length >= 12) break;
            }
            return deals;
        } catch(e) {
            console.error("Parse error", e);
            return [];
        }
    };

    // 2. CACHE CHECK
    let cachedData = null;
    let cachedTime = null;
    try {
        cachedData = sessionStorage.getItem(CACHE_KEY);
        cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
    } catch (e) {
        // sessionStorage blocked
    }
    
    if (cachedData && cachedTime) {
        if (Date.now() - parseInt(cachedTime) < CACHE_EXPIRY) {
            return JSON.parse(cachedData);
        }
    }

    // 3. FETCH STRATEGY - UPDATED PROXIES
    const telegramUrl = 'https://t.me/s/tuttoxandroid';
    
    // Optimized proxy order with fallbacks
    const proxyList = [
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
    ];

    for (const proxyFn of proxyList) {
        try {
            const proxyUrl = typeof proxyFn === 'function' ? proxyFn(telegramUrl) : proxyFn;
            const response = await fetchWithTimeout(proxyUrl, 8000); 
            if (response.ok) {
                const htmlText = await response.text();
                const deals = parseDealsFromHtml(htmlText);
                if (deals.length > 0) {
                    // Save to Cache on Success
                    try {
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify(deals));
                        sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
                    } catch (e) {}
                    return deals;
                }
            }
        } catch (e) {
            console.warn(`Telegram fetch failed with proxy`, e);
        }
    }

    // Fallback: Use stale cache if available
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    return [];
};
