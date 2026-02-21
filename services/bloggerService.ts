
import { Article, Category, Deal, DealData } from '../types';
import { MOCK_ARTICLES } from '../constants';

// Helper per pulire HTML e decodificare entità (rimuove &nbsp;, &amp; ecc.)
const stripHtml = (html: string): string => {
  if (!html) return "";
  try {
    // Prima rimuoviamo i tag script e style per sicurezza
    let clean = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "");
    
    // Parsiamo l'HTML per ottenere il testo puro decodificato
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    return doc.body.textContent || "";
  } catch (e) {
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  }
};

// Helper per estrarre dati DEAL specifici per la sezione Widget
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

// Helper per parsare la stringa DEAL e rimuoverla dal contenuto
const parseArticleContent = (rawContent: string): { cleanContent: string; dealData: DealData | null } => {
  const dealRegex = /\[DEAL\s+old="([^"]*)"\s+new="([^"]*)"\s+link="([^"]*)"\]/i;
  const match = rawContent.match(dealRegex);

  let dealData: DealData | null = null;
  let cleanContent = rawContent;

  if (match) {
    dealData = {
      oldPrice: match[1],
      newPrice: match[2],
      link: match[3]
    };
    cleanContent = rawContent.replace(dealRegex, '');
  }

  return { cleanContent, dealData };
};

// Funzione helper per forzare l'alta risoluzione delle immagini
const forceHighResImage = (url: string): string => {
  if (!url) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
  
  if (url.includes('googleusercontent.com') || url.includes('bp.blogspot.com')) {
    if (url.match(/\/s\d+(-c)?\//)) {
       return url.replace(/\/s\d+(-c)?\//, '/s1600/');
    }
    if (url.match(/\/w\d+-h\d+(-c)?\//)) {
      return url.replace(/\/w\d+-h\d+(-c)?\//, '/s1600/');
    }
    if (url.match(/=[sNw]\d+/)) {
       return url.replace(/=[sNw]\d+.*$/, '=s1600');
    }
    if (!url.includes('/s1600/')) {
       const parts = url.split('/');
       if (parts.length > 4) {
         return url; 
       }
    }
  }
  return url;
};

// --- CORS PROXY CONFIGURATION ---
const TARGET_DOMAIN = 'https://www.tuttoxandroid.com';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const getFetchUrl = (path: string) => {
  const hostname = window.location.hostname;
  // If we are in Sandbox, Localhost, or Stackblitz, use the Proxy
  if (hostname.includes('localhost') || hostname.includes('stackblitz') || hostname.includes('webcontainer') || hostname.includes('googleusercontent')) {
    const fullTargetUrl = `${TARGET_DOMAIN}${path}`;
    // Encode the target URL to pass it safely to the proxy
    return `${CORS_PROXY}${encodeURIComponent(fullTargetUrl)}`;
  }
  // Otherwise (Production), use the relative path
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

// NEW: Fetch specific article by ID to get full content
export const fetchArticleById = async (id: string): Promise<string | null> => {
  // SANDBOX FIX: If it's a mock ID (short string), return mock content immediately
  // This prevents 404s when trying to fetch "1" or "2" from the real Blogger API
  if (id.length < 5) {
      const mock = MOCK_ARTICLES.find(a => a.id === id);
      return mock ? mock.content : null;
  }

  try {
    // Modified to use getFetchUrl to bypass CORS in sandbox
    const feedUrl = getFetchUrl(`/feeds/posts/default/${id}?alt=json`);
    
    const response = await fetch(feedUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    const rawContent = data.entry?.content?.$t || data.entry?.summary?.$t || "";
    
    const { cleanContent } = parseArticleContent(rawContent);
    return cleanContent;
  } catch (error) {
    console.error("Error fetching full article:", error);
    return null;
  }
};

export const fetchBloggerPosts = async (category?: Category, searchQuery?: string): Promise<Article[]> => {
  try {
    // Removed the "return []" block for localhost to allow Proxy fetching

    // CRITICAL FIX: Only use native posts if we have a significant amount (e.g. > 20).
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

    // Fallback to JSON feed via PROXY
    let feedPath = '/feeds/posts/default?alt=json&max-results=150';
    if (category && category !== 'Tutti') {
       feedPath = `/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=100`;
    }
    
    // Wrap the feed path with the Proxy URL generator
    const response = await fetchWithTimeout(getFetchUrl(feedPath), 8000);
    
    if (!response.ok) {
      // Return empty so App.tsx falls back to MOCK
      return [];
    }
    
    const data = await response.json();
    const entries = data.feed.entry || [];

    return entries.map((entry: any) => {
      const id = entry.id.$t.split('post-')[1];
      const rawTitle = entry.title.$t;
      let rawContent = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
      const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';
      
      const categories = entry.category ? entry.category.map((c: any) => c.term.trim()) : [];
      
      const isFeatured = categories.some((c: string) => 
        c === 'Evidenza' || 
        c === 'Featured' || 
        c.toLowerCase().endsWith('inevidenza')
      );
      
      let mainCategory = categories.length > 0 ? categories[0] : 'News';
      const displayCategory = categories.find((c: string) => !c.toLowerCase().endsWith('inevidenza') && c !== 'Evidenza' && c !== 'Featured');
      if (displayCategory) mainCategory = displayCategory;

      if (mainCategory === 'offerteimperdibili') mainCategory = 'Offerte';

      let imageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
      if (entry.media$thumbnail) {
        imageUrl = entry.media$thumbnail.url;
      } else {
        const imgMatch = rawContent.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) imageUrl = imgMatch[1];
      }
      
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
        tags: categories, // Keep all tags for filtering
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
    // Return empty so App.tsx falls back to MOCK
    return [];
  }
};

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  try {
    // 1. Fetch from Native Blogger Feed (Existing logic)
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
                let imageUrl = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400';
                if (entry.media$thumbnail) imageUrl = entry.media$thumbnail.url;
                else {
                    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
                    if (imgMatch) imageUrl = imgMatch[1];
                }
                const deal = extractDealWidgetData(content, postUrl, title, imageUrl, id);
                if (deal) generatedDeals.push(deal);
            });
            return generatedDeals;
        } catch(e) { return []; }
    })();

    // 2. Fetch from Telegram Public View (New logic)
    const telegramPromise = fetchTelegramDeals();

    const [bloggerDeals, telegramDeals] = await Promise.all([bloggerPromise, telegramPromise]);
    
    // Merge: Telegram deals first (they are usually fresher)
    const allDeals = [...telegramDeals, ...bloggerDeals];
    
    // Assign brand colors cyclically
    const dealColors = ['bg-[#e31b23]', 'bg-blue-600', 'bg-neutral-900', 'bg-purple-600'];
    return allDeals.map((deal, idx) => ({
        ...deal,
        brandColor: dealColors[idx % dealColors.length]
    })).slice(0, 4); // Keep top 4
    
  } catch (error) {
    return [];
  }
};

// NEW: Function to scrape the public Telegram Channel view with better Parsing
export const fetchTelegramDeals = async (): Promise<Deal[]> => {
    try {
        // We use allorigins to bypass CORS and fetch the HTML of the public channel
        // t.me/s/tuttoxandroid is the lightweight web view of the channel
        const telegramUrl = 'https://t.me/s/tuttoxandroid';
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(telegramUrl)}&timestamp=${new Date().getTime()}`;
        
        const response = await fetchWithTimeout(proxyUrl, 5000);
        if (!response.ok) return [];
        
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        const messages = doc.querySelectorAll('.tgme_widget_message');
        const deals: Deal[] = [];
        
        // Iterate backwards (newest first)
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const textContent = msg.querySelector('.tgme_widget_message_text')?.textContent || '';
            const htmlContent = msg.innerHTML;
            
            // Check for Link (Amazon/eBay) and Price
            const hasLink = htmlContent.includes('amzn.to') || htmlContent.includes('amazon.it') || htmlContent.includes('ebay.it');
            
            if (hasLink) {
                 // 1. Extract Link (Regex for Amazon/eBay)
                 const linkMatch = htmlContent.match(/href="(https?:\/\/(?:amzn\.to|www\.amazon\.it|bit\.ly|www\.ebay\.it)[^"]+)"/);
                 const link = linkMatch ? linkMatch[1] : '#';
                 if (link === '#') continue;

                 // 2. Extract Title (First line that isn't empty)
                 const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 2);
                 let product = lines[0] || 'Offerta Tech';
                 // Clean up Emojis from start of title
                 product = product.replace(/^[\p{Emoji}\s]+/gu, '');
                 if (product.length > 55) product = product.substring(0, 55) + '...';

                 // 3. Extract Price Smartly (Find numbers with €)
                 const priceRegex = /€?\s?(\d+[.,]\d{0,2})\s?€?/g;
                 const pricesFound: number[] = [];
                 let match;
                 while ((match = priceRegex.exec(textContent)) !== null) {
                    const val = parseFloat(match[1].replace(',', '.'));
                    if (!isNaN(val)) pricesFound.push(val);
                 }

                 let newPrice = 'OFFERTA';
                 let oldPrice = '';

                 if (pricesFound.length > 0) {
                    // Logic: If multiple prices, min is new, max is old
                    const minP = Math.min(...pricesFound);
                    const maxP = Math.max(...pricesFound);
                    
                    newPrice = minP.toFixed(2).replace('.', ',') + '€';
                    if (pricesFound.length > 1 && maxP > minP) {
                         oldPrice = maxP.toFixed(2).replace('.', ',') + '€';
                    }
                 } else {
                    if (textContent.toLowerCase().includes('gratis')) newPrice = 'GRATIS';
                 }

                 // 4. Extract Image
                 let imageUrl = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=200';
                 const photoWrap = msg.querySelector('.tgme_widget_message_photo_wrap');
                 if (photoWrap) {
                     const style = photoWrap.getAttribute('style');
                     const bgMatch = style?.match(/background-image:url\('([^']+)'\)/);
                     if (bgMatch) imageUrl = bgMatch[1];
                 }
                 
                 // Create Deal Object
                 deals.push({
                     id: `tg-${i}`,
                     product: product,
                     oldPrice: oldPrice, 
                     newPrice: newPrice,
                     saveAmount: 'Telegram',
                     link: link,
                     imageUrl: imageUrl,
                     brandColor: 'bg-[#24A1DE]' // Telegram Blue
                 });
                 
                 if (deals.length >= 4) break; 
            }
        }
        
        return deals;
    } catch (e) {
        console.error("Error scraping Telegram:", e);
        return [];
    }
};
