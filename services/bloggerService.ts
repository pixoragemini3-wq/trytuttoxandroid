
import { Article, Category, Deal } from '../types';

// Usiamo il feed pubblico del dominio
const BLOG_URL = 'https://fortnite-trucchi.blogspot.com/';

// Fix: The category parameter now uses the updated Category type which includes 'Tutti'
export const fetchBloggerPosts = async (category?: Category, searchQuery?: string): Promise<Article[]> => {
  try {
    // Se siamo dentro Blogger, potremmo avere i dati già pronti in una variabile globale
    if ((window as any).bloggerNativePosts) {
      return (window as any).bloggerNativePosts;
    }

    let url = `${BLOG_URL}/feeds/posts/default?alt=json&max-results=20`;
    
    // Fix: Comparison is now valid as 'Tutti' is part of the Category type definition in types.ts
    if (category && category !== 'Tutti') {
      url = `${BLOG_URL}/feeds/posts/default/-/${category}?alt=json&max-results=20`;
    }
    
    if (searchQuery) {
      url = `${BLOG_URL}/feeds/posts/default?q=${encodeURIComponent(searchQuery)}&alt=json`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Feed not found');
    
    const data = await response.json();
    const entries = data.feed.entry || [];

    return entries.map((entry: any) => {
      const id = entry.id.$t.split('post-')[1];
      const title = entry.title.$t;
      const content = entry.content ? entry.content.$t : entry.summary.$t;
      
      // Estraiamo la prima immagine
      let imageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
      if (entry.media$thumbnail) {
        imageUrl = entry.media$thumbnail.url.replace('s72-c', 's1600');
      } else {
        const m = content.match(/<img[^>]+src="([^">]+)"/);
        if (m) imageUrl = m[1];
      }

      return {
        id,
        title,
        excerpt: content.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...',
        content: content,
        category: (entry.category && entry.category[0].term) as Category || 'News',
        imageUrl,
        author: entry.author[0].name.$t,
        date: new Date(entry.published.$t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }),
        type: 'standard'
      };
    });
  } catch (error) {
    console.error("Errore recupero feed pubblico:", error);
    return []; // Se fallisce, App.tsx userà i MOCK_ARTICLES come fallback
  }
};

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  try {
    const url = `${BLOG_URL}/feeds/posts/default/-/offerte?alt=json&max-results=4`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    const entries = data.feed.entry || [];

    return entries.map((entry: any) => ({
      id: entry.id.$t,
      product: entry.title.$t,
      oldPrice: 'N/D',
      newPrice: 'Vedi Offerta',
      saveAmount: "OFFERTA",
      link: entry.link.find((l: any) => l.rel === 'alternate').href,
      imageUrl: entry.media$thumbnail ? entry.media$thumbnail.url.replace('s72-c', 's1600') : '',
      brandColor: 'bg-gray-50'
    }));
  } catch (error) {
    return [];
  }
};
