
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

const parseArticleContent = (rawContent: string): { cleanContent: string; dealData: DealData | null } => {
  const dealRegex = /\[DEAL\s+old="([^"]*)"\s+new="([^"]*)"\s+link="([^"]*)"\]/i;
  const match = rawContent.match(dealRegex);
  let dealData: DealData | null = null;
  let cleanContent = rawContent;

  if (match) {
    dealData = { oldPrice: match[1], newPrice: match[2], link: match[3] };
    cleanContent = rawContent.replace(dealRegex, '');
  }
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
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const getFetchUrl = (path: string) => {
  const hostname = window.location.hostname;
  if (hostname.includes('localhost') || hostname.includes('stackblitz') || hostname.includes('webcontainer') || hostname.includes('googleusercontent')) {
    const fullTargetUrl = `${TARGET_DOMAIN}${path}`;
    return `${CORS_PROXY}${encodeURIComponent(fullTargetUrl)}`;
  }
  return path;
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

export const fetchArticleById = async (id: string): Promise<string | null> => {
  if (id.length < 5) {
      const mock = MOCK_ARTICLES.find(a => a.id === id);
      return mock ? mock.content : null;
  }
  try {
    const feedUrl = getFetchUrl(`/feeds/posts/default/${id}?alt=json`);
    const response = await fetch(feedUrl);
    if (!response.ok) return null;
    const data = await response.json();
    const rawContent = data.entry?.content?.$t || data.entry?.summary?.$t || "";
    const { cleanContent } = parseArticleContent(rawContent);
    return cleanContent;
  } catch (error) {
    return null;
  }
};

export const fetchBloggerPosts = async (category?: Category, searchQuery?: string): Promise<Article[]> => {
  try {
    const nativePosts = (window as any).bloggerNativePosts;
    const shouldUseNative = nativePosts && nativePosts.length > 20;

    if (shouldUseNative) {
      let filtered = nativePosts.map((p: any) => {
          const isFeatured = p.category === 'Evidenza' || p.title.includes('⭐') || (p.tags && p.tags.includes('Evidenza'));
          const { cleanContent, dealData } = parseArticleContent(p.content || '');
          const cleanExcerpt = stripHtml(cleanContent).substring(0, 180).trim() + '...';
          const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => t.trim()) : (p.category ? [p.category] : []);
          
          return {
            ...p,
            title: stripHtml(p.title),
            imageUrl: forceHighResImage(p.imageUrl),
            featured: isFeatured,
            excerpt: cleanExcerpt,
            content: cleanContent,
            dealData: dealData,
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

    let feedPath = '/feeds/posts/default?alt=json&max-results=150';
    if (category && category !== 'Tutti') {
       feedPath = `/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=100`;
    }
    
    const response = await fetchWithTimeout(getFetchUrl(feedPath), 8000);
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

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  try {
    const bloggerPromise = (async () => {
        try {
            const response = await fetchWithTimeout(getFetchUrl('/feeds/posts/default/-/offerteimperdibili?alt=json&max-results=20'), 5000);
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
    return allDeals.map((deal, idx) => ({
        ...deal,
        brandColor: dealColors[idx % dealColors.length]
    })).slice(0, 4); 
    
  } catch (error) {
    return [];
  }
};

export const fetchTelegramDeals = async (): Promise<Deal[]> => {
    // 1. Definiamo la logica di parsing in una funzione riutilizzabile
    const parseDealsFromHtml = (htmlText: string): Deal[] => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const messages = doc.querySelectorAll('.tgme_widget_message');
            const deals: Deal[] = [];
            
            // Iteriamo al contrario per prendere gli ultimi messaggi
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                const textContent = msg.querySelector('.tgme_widget_message_text')?.textContent || '';
                const textLower = textContent.toLowerCase();

                // CHECK 1: Deve contenere #offerte (case insensitive)
                if (!textLower.includes('offerte')) continue;

                // CHECK 2: Deve contenere un link valido
                const linkNode = msg.querySelector('a[href*="amzn.to"], a[href*="amazon.it"], a[href*="ebay.it"], a[href*="bit.ly"]');
                if (!linkNode) continue;
                
                const link = linkNode.getAttribute('href');
                if (!link) continue;

                // Clean raw text to get title
                const cleanText = textContent.replace(/http\S+/g, '').trim(); 
                const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
                let product = lines[0] || 'Offerta Tech';
                
                // Pulizia Titolo: Rimuovi emoji iniziali e hashtag
                product = product.replace(/^[\p{Emoji}\s]+/gu, '').replace(/#\w+/g, '').trim();
                // If title is too short, try second line
                if (product.length < 5 && lines[1]) product = lines[1];
                if (product.length > 55) product = product.substring(0, 55) + '...';

                // Estrazione Prezzo Robustezza
                const priceRegex = /€?\s?(\d+[.,]\d{0,2})\s?€?/g;
                const pricesFound: number[] = [];
                let match;
                while ((match = priceRegex.exec(textContent)) !== null) {
                    const val = parseFloat(match[1].replace(',', '.'));
                    if (!isNaN(val) && val > 1 && val < 5000) pricesFound.push(val);
                }

                let newPrice = 'OFFERTA';
                let oldPrice = '';

                if (pricesFound.length > 0) {
                    const minP = Math.min(...pricesFound);
                    const maxP = Math.max(...pricesFound);
                    newPrice = minP.toFixed(2).replace('.', ',') + '€';
                    if (pricesFound.length > 1 && maxP > minP * 1.1) {
                         oldPrice = maxP.toFixed(2).replace('.', ',') + '€';
                    }
                } else {
                    if (textLower.includes('gratis') || textLower.includes('free')) newPrice = 'GRATIS';
                }

                // Estrazione Immagine background
                let imageUrl = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=200';
                const photoWrap = msg.querySelector('.tgme_widget_message_photo_wrap');
                if (photoWrap) {
                     const style = photoWrap.getAttribute('style');
                     const bgMatch = style?.match(/background-image:url\('([^']+)'\)/);
                     if (bgMatch) imageUrl = bgMatch[1];
                }
                 
                deals.push({
                     id: `tg-${i}`,
                     product: product,
                     oldPrice: oldPrice, 
                     newPrice: newPrice,
                     saveAmount: 'Telegram',
                     link: link,
                     imageUrl: imageUrl,
                     brandColor: 'bg-[#24A1DE]' 
                });
                if (deals.length >= 4) break; 
            }
            return deals;
        } catch(e) {
            console.error("Parse error", e);
            return [];
        }
    };

    // 2. Strategia di Fetch con Fallback (Primary + Backup Proxy)
    const telegramUrl = 'https://t.me/s/tuttoxandroid';
    
    // Lista di proxy da provare in sequenza
    const proxyList = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(telegramUrl)}&timestamp=${Date.now()}`,
        `https://corsproxy.io/?${encodeURIComponent(telegramUrl)}`
    ];

    for (const proxyUrl of proxyList) {
        try {
            const response = await fetchWithTimeout(proxyUrl, 4000); // 4 secondi timeout per tentativo
            if (response.ok) {
                const htmlText = await response.text();
                const deals = parseDealsFromHtml(htmlText);
                if (deals.length > 0) {
                    return deals; // Successo!
                }
            }
        } catch (e) {
            console.warn(`Telegram fetch failed with proxy ${proxyUrl}`, e);
            // Continua con il prossimo proxy
        }
    }

    // Se tutti i proxy falliscono
    console.error("All Telegram proxies failed.");
    return [];
};
