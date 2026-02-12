
import { Article, Category, Deal } from '../types';

export const fetchBloggerPosts = async (category?: Category, searchQuery?: string): Promise<Article[]> => {
  try {
    // 1. Tenta prima di leggere i post iniettati dal template XML
    const nativePosts = (window as any).bloggerNativePosts;
    if (nativePosts && nativePosts.length > 0) {
      console.log(`${nativePosts.length} articoli caricati nativamente.`);
      let filtered = nativePosts;
      if (category && category !== 'Tutti') {
        filtered = nativePosts.filter((p: any) => p.category === category);
      }
      if (searchQuery) {
        filtered = filtered.filter((p: any) => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (filtered.length > 0) return filtered;
    }

    // 2. Fallback dinamico al feed JSON (usa percorso relativo per evitare problemi CORS)
    let feedPath = '/feeds/posts/default?alt=json&max-results=50';
    
    if (category && category !== 'Tutti') {
      feedPath = `/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=50`;
    }
    
    if (searchQuery) {
      feedPath = `/feeds/posts/default?q=${encodeURIComponent(searchQuery)}&alt=json`;
    }

    console.log("Tentativo recupero feed da:", feedPath);
    const response = await fetch(feedPath);
    if (!response.ok) throw new Error('Risposta feed non valida');
    
    const data = await response.json();
    const entries = data.feed.entry || [];

    return entries.map((entry: any) => {
      const id = entry.id.$t.split('post-')[1];
      const title = entry.title.$t;
      const content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
      
      // Estrazione immagine: Miniatura -> Immagine nel corpo -> Placeholder
      let imageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
      if (entry.media$thumbnail) {
        // Converte miniatura piccola in immagine grande
        imageUrl = entry.media$thumbnail.url.replace(/\/s[0-9]+(-c)?\//, '/s1600/');
      } else {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) imageUrl = imgMatch[1];
      }

      // Estrazione categoria
      const cat = (entry.category && entry.category[0].term) || 'News';

      return {
        id,
        title,
        excerpt: content.replace(/<[^>]*>?/gm, '').substring(0, 180).trim() + '...',
        content: content,
        category: cat as Category,
        imageUrl,
        author: entry.author[0].name.$t,
        date: new Date(entry.published.$t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }),
        type: 'standard'
      };
    });
  } catch (error) {
    console.error("Errore critico durante il caricamento degli articoli:", error);
    return [];
  }
};

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  try {
    const response = await fetch('/feeds/posts/default/-/offerte?alt=json&max-results=4');
    if (!response.ok) return [];
    const data = await response.json();
    const entries = data.feed.entry || [];

    return entries.map((entry: any) => ({
      id: entry.id.$t,
      product: entry.title.$t,
      oldPrice: 'Vedi',
      newPrice: 'Offerta',
      saveAmount: "TECH DEAL",
      link: entry.link.find((l: any) => l.rel === 'alternate').href,
      imageUrl: entry.media$thumbnail ? entry.media$thumbnail.url.replace(/\/s[0-9]+(-c)?\//, '/s1600/') : 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400',
      brandColor: 'bg-gray-50'
    }));
  } catch (error) {
    return [];
  }
};
