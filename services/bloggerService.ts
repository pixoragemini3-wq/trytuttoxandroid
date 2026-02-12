
import { Article, Category, Deal } from '../types';

/**
 * CONFIGURAZIONE BLOGGER
 * ID recuperato dall'URL fornito: 2656476092848745834
 */
const BLOG_ID: string = '2656476092848745834'; 

export const fetchBloggerPosts = async (category?: Category, searchQuery?: string): Promise<Article[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!BLOG_ID || !apiKey) {
    console.warn("Blogger Service: BLOG_ID o API_KEY mancanti.");
    return [];
  }

  try {
    let url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${apiKey}&maxResults=20`;
    
    if (searchQuery) {
      url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/search?q=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Errore nel recupero dati da Blogger");
    
    const data = await response.json();
    if (!data.items) return [];

    return data.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      excerpt: item.content.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...',
      content: item.content,
      category: (item.labels && (item.labels[0] as Category)) || 'News',
      imageUrl: extractImage(item.content),
      author: item.author.displayName,
      date: new Date(item.published).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }),
      type: 'standard'
    }));
  } catch (error) {
    console.error("fetchBloggerPosts failed:", error);
    return [];
  }
};

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  const apiKey = process.env.API_KEY;
  if (!BLOG_ID || !apiKey) return [];

  try {
    const url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/search?q=label:offertedelgiorno&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.items) return [];

    return data.items.map((item: any) => {
      const content = item.content;
      const oldPriceMatch = content.match(/<span[^>]*class=["']old-price["'][^>]*>([^<]+)<\/span>/i);
      const newPriceMatch = content.match(/<span[^>]*class=["']new-price["'][^>]*>([^<]+)<\/span>/i);
      
      return {
        id: item.id,
        product: item.title,
        oldPrice: oldPriceMatch ? oldPriceMatch[1].trim() : 'N/D',
        newPrice: newPriceMatch ? newPriceMatch[1].trim() : 'N/D',
        saveAmount: "OFFERTA DEL GIORNO",
        link: item.url,
        imageUrl: extractImage(content),
        brandColor: 'bg-gray-50'
      };
    });
  } catch (error) {
    return [];
  }
};

const extractImage = (content: string): string => {
  const m = content.match(/<img[^>]+src="([^">]+)"/);
  if (m) {
    let url = m[1];
    if (url.includes('blogger.googleusercontent.com') || url.includes('bp.blogspot.com')) {
      url = url.replace(/\/s\d+(-c)?\//, '/s1600/');
    }
    return url;
  }
  return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
};
