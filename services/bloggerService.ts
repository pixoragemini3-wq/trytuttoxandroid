
import { Article, Category, Deal } from '../types';

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
    // Fallback regex se DOMParser fallisce (es. SSR puro, ma qui siamo client)
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  }
};

// Helper per estrarre i dati DEAL dal contenuto HTML
const extractDealData = (content: string, defaultLink: string, defaultTitle: string, defaultImage: string, id: string): Deal | null => {
  // Regex per cercare pattern come [DEAL old="99€" new="49€" link="..."]
  const regex = /\[DEAL\s+old="([^"]+)"\s+new="([^"]+)"(?:\s+link="([^"]+)")?\]/i;
  const match = content.match(regex);

  if (match) {
    return {
      id: `generated-deal-${id}`,
      product: defaultTitle,
      oldPrice: match[1],
      newPrice: match[2],
      saveAmount: 'OFFERTA',
      link: match[3] || defaultLink, // Usa il link nel tag o il link del post
      imageUrl: defaultImage,
      brandColor: 'bg-[#e31b23]' // Placeholder, verrà sovrascritto
    };
  }
  return null;
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

export const fetchBloggerPosts = async (category?: Category, searchQuery?: string): Promise<Article[]> => {
  try {
    // 1. Tenta prima di leggere i post iniettati dal template XML
    const nativePosts = (window as any).bloggerNativePosts;
    if (nativePosts && nativePosts.length > 0) {
      let filtered = nativePosts.map((p: any) => {
          const isFeatured = p.category === 'Evidenza' || p.title.includes('⭐');
          
          // Rimuove shortcode DEAL dal contenuto grezzo prima di pulirlo
          const contentWithoutDeals = p.excerpt.replace(/\[DEAL.*?\]/g, '');
          const cleanExcerpt = stripHtml(contentWithoutDeals).substring(0, 180).trim() + '...';

          return {
            ...p,
            title: stripHtml(p.title), // Pulisce anche il titolo da eventuali entità
            imageUrl: forceHighResImage(p.imageUrl),
            featured: isFeatured,
            excerpt: cleanExcerpt
          };
      });

      if (category && category !== 'Tutti') {
        filtered = filtered.filter((p: any) => p.category === category);
      }
      if (searchQuery) {
        filtered = filtered.filter((p: any) => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return filtered;
    }

    // 2. Fallback al feed JSON relativo
    let feedPath = '/feeds/posts/default?alt=json&max-results=50';
    if (category && category !== 'Tutti') {
      feedPath = `/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=50`;
    }
    
    const response = await fetch(feedPath);
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const entries = data.feed.entry || [];

    return entries.map((entry: any) => {
      const id = entry.id.$t.split('post-')[1];
      const rawTitle = entry.title.$t;
      let content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
      const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';
      
      const categories = entry.category ? entry.category.map((c: any) => c.term) : [];
      const isFeatured = categories.includes('Evidenza') || categories.includes('Featured');
      
      let mainCategory = categories.length > 0 ? categories[0] : 'News';
      if (mainCategory === 'offerteimperdibili') mainCategory = 'Offerte';

      let imageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
      if (entry.media$thumbnail) {
        imageUrl = entry.media$thumbnail.url;
      } else {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) imageUrl = imgMatch[1];
      }
      
      imageUrl = forceHighResImage(imageUrl);
      const authorImage = entry.author?.[0]?.gd$image?.src;

      // PULIZIA AVANZATA DEL TESTO
      const contentWithoutDeals = content.replace(/\[DEAL.*?\]/g, '');
      const cleanExcerpt = stripHtml(contentWithoutDeals).substring(0, 180).trim() + '...';
      const cleanTitle = stripHtml(rawTitle);

      return {
        id,
        title: cleanTitle,
        excerpt: cleanExcerpt,
        content: content,
        category: mainCategory,
        imageUrl,
        author: entry.author[0].name.$t,
        authorImageUrl: authorImage,
        date: new Date(entry.published.$t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }),
        url: postUrl,
        type: 'standard',
        featured: isFeatured
      };
    });
  } catch (error) {
    return [];
  }
};

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  try {
    const response = await fetch('/feeds/posts/default/-/offerteimperdibili?alt=json&max-results=20');
    if (!response.ok) return [];
    
    const data = await response.json();
    const entries = data.feed.entry || [];
    const generatedDeals: Deal[] = [];
    
    // Palette colori per le card delle offerte (ciclo)
    const dealColors = ['bg-[#e31b23]', 'bg-blue-600', 'bg-neutral-900', 'bg-purple-600'];

    entries.forEach((entry: any, index: number) => {
      const content = entry.content ? entry.content.$t : '';
      const title = stripHtml(entry.title.$t); // Pulisce il titolo
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

      const deal = extractDealData(content, postUrl, title, imageUrl, id);
      if (deal) {
        deal.brandColor = dealColors[index % dealColors.length];
        generatedDeals.push(deal);
      }
    });

    return generatedDeals.length > 0 ? generatedDeals.slice(0, 4) : [];
    
  } catch (error) {
    console.warn("Nessun post 'offerteimperdibili' trovato o errore fetch", error);
    return [];
  }
};
