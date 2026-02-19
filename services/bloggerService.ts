
import { Article, Category, Deal, DealData } from '../types';

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

const fetchWithTimeout = async (url: string, timeout = 8000) => {
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
  try {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('stackblitz')) {
      return null;
    }
    
    // We fetch the specific post JSON which usually contains full content
    const response = await fetch(`/feeds/posts/default/${id}?alt=json`);
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
    const hostname = window.location.hostname;
    // Safety check for local/preview environments
    if (hostname.includes('localhost') || hostname.includes('stackblitz') || hostname.includes('webcontainer')) {
      return [];
    }

    // Check for native posts (injected by XML)
    const nativePosts = (window as any).bloggerNativePosts;
    if (nativePosts && nativePosts.length > 0) {
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

    // Fallback to JSON feed
    // INCREASED LIMIT TO 150 to catch older categories
    let feedPath = '/feeds/posts/default?alt=json&max-results=150';
    if (category && category !== 'Tutti') {
       feedPath = `/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=100`;
    }
    
    const response = await fetchWithTimeout(feedPath, 8000);
    if (!response.ok) {
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
    return [];
  }
};

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  try {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('stackblitz') || hostname.includes('webcontainer')) {
      return [];
    }

    const response = await fetchWithTimeout('/feeds/posts/default/-/offerteimperdibili?alt=json&max-results=20', 5000);
    if (!response.ok) return [];
    
    const data = await response.json();
    const entries = data.feed.entry || [];
    const generatedDeals: Deal[] = [];
    const dealColors = ['bg-[#e31b23]', 'bg-blue-600', 'bg-neutral-900', 'bg-purple-600'];

    entries.forEach((entry: any, index: number) => {
      const content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
      const title = stripHtml(entry.title.$t); 
      const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';
      const id = entry.id.$t;
      
      let imageUrl = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400';
      if (entry.media$thumbnail) {
        imageUrl = entry.media$thumbnail.url;
      } else {
         const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
         if (imgMatch) imageUrl = imgMatch[1];
      }
      imageUrl = forceHighResImage(imageUrl);

      const deal = extractDealWidgetData(content, postUrl, title, imageUrl, id);
      if (deal) {
        deal.brandColor = dealColors[index % dealColors.length];
        generatedDeals.push(deal);
      }
    });

    return generatedDeals.length > 0 ? generatedDeals.slice(0, 4) : [];
    
  } catch (error) {
    return [];
  }
};
