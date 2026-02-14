
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
      return filtered;
    }

    // 2. Fallback al feed JSON relativo
    let feedPath = '/feeds/posts/default?alt=json&max-results=50';
    if (category && category !== 'Tutti') {
      feedPath = `/feeds/posts/default/-/${encodeURIComponent(category)}?alt=json&max-results=50`;
    }
    
    const response = await fetch(feedPath);
    if (!response.ok) throw new Error('Risposta feed non valida');
    
    const data = await response.json();
    const entries = data.feed.entry || [];

    return entries.map((entry: any) => {
      const id = entry.id.$t.split('post-')[1];
      const title = entry.title.$t;
      const content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
      const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';
      
      let imageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
      if (entry.media$thumbnail) {
        imageUrl = entry.media$thumbnail.url.replace(/\/s[0-9]+(-c)?\//, '/s1600/');
      } else {
        const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) imageUrl = imgMatch[1];
      }

      // Extract author thumbnail from Blogger GData feed if present
      const authorImage = entry.author?.[0]?.gd$image?.src;

      return {
        id,
        title,
        excerpt: content.replace(/<[^>]*>?/gm, '').substring(0, 180).trim() + '...',
        content: content,
        category: (entry.category && entry.category[0].term) || 'News',
        imageUrl,
        author: entry.author[0].name.$t,
        authorImageUrl: authorImage,
        date: new Date(entry.published.$t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }),
        url: postUrl,
        type: 'standard'
      };
    });
  } catch (error) {
    console.error("Errore caricamento articoli:", error);
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
