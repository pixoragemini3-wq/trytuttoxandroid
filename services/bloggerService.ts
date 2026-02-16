
import { Article, Category, Deal } from '../types';

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
      brandColor: 'bg-[#e31b23]' // Default branding
    };
  }
  return null;
};

export const fetchBloggerPosts = async (category?: Category, searchQuery?: string): Promise<Article[]> => {
  try {
    // 1. Tenta prima di leggere i post iniettati dal template XML
    const nativePosts = (window as any).bloggerNativePosts;
    if (nativePosts && nativePosts.length > 0) {
      let filtered = nativePosts.map((p: any) => {
          // Controlla se è "In Evidenza" guardando le label/categorie
          // Mappiamo 'offerteimperdibili' a 'Offerte' se finisce nel flusso news, oppure lo lasciamo raw
          const isFeatured = p.category === 'Evidenza' || p.title.includes('⭐');
          
          return {
            ...p,
            featured: isFeatured,
            // Rimuoviamo il tag [DEAL ...] dall'excerpt se presente
            excerpt: p.excerpt.replace(/\[DEAL.*?\]/g, '').trim()
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
      const title = entry.title.$t;
      let content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
      const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';
      
      // Controllo labels per "Evidenza"
      const categories = entry.category ? entry.category.map((c: any) => c.term) : [];
      const isFeatured = categories.includes('Evidenza') || categories.includes('Featured');
      
      // Se troviamo 'offerteimperdibili' tra le categorie, lo mappiamo visivamente a 'Offerte' se necessario, 
      // ma qui prendiamo la prima categoria valida.
      let mainCategory = categories.length > 0 ? categories[0] : 'News';
      if (mainCategory === 'offerteimperdibili') mainCategory = 'Offerte';

      let imageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
      if (entry.media$thumbnail) {
        imageUrl = entry.media$thumbnail.url.replace(/\/s[0-9]+(-c)?\//, '/s1600/');
      } else {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) imageUrl = imgMatch[1];
      }

      const authorImage = entry.author?.[0]?.gd$image?.src;

      // Pulizia excerpt da shortcodes
      const cleanExcerpt = content.replace(/<[^>]*>?/gm, '').replace(/\[DEAL.*?\]/g, '').substring(0, 180).trim() + '...';

      return {
        id,
        title,
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
    // MODIFICA CRUCIALE: Cerchiamo SOLO nel tag 'offerteimperdibili'
    // Questo separa le News (tag 'Offerte') dai Prodotti (tag 'offerteimperdibili')
    const response = await fetch('/feeds/posts/default/-/offerteimperdibili?alt=json&max-results=20');
    if (!response.ok) return [];
    
    const data = await response.json();
    const entries = data.feed.entry || [];
    const generatedDeals: Deal[] = [];

    entries.forEach((entry: any) => {
      const content = entry.content ? entry.content.$t : '';
      const title = entry.title.$t;
      const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';
      const id = entry.id.$t;
      
      let imageUrl = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400';
      if (entry.media$thumbnail) {
        imageUrl = entry.media$thumbnail.url.replace(/\/s[0-9]+(-c)?\//, '/s1600/');
      }

      // Estrai dati deal dal contenuto
      const deal = extractDealData(content, postUrl, title, imageUrl, id);
      if (deal) {
        generatedDeals.push(deal);
      }
    });

    return generatedDeals.length > 0 ? generatedDeals.slice(0, 4) : [];
    
  } catch (error) {
    console.warn("Nessun post 'offerteimperdibili' trovato o errore fetch", error);
    return [];
  }
};
