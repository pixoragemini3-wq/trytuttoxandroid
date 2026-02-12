import { Article, Category, Deal } from '../types';

const BLOG_ID: string = '2656476092848745834'; 

export const fetchBloggerPosts = async (category?: Category, searchQuery?: string): Promise<Article[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) return [];

  try {
    let url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${apiKey}&maxResults=20`;
    if (searchQuery) {
      url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/search?q=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    }

    const response = await fetch(url);
    if (!response.ok) return [];
    
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
    console.error("Blogger API Error:", error);
    return [];
  }
};

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/search?q=label:offertedelgiorno&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.items ? data.items.map((item: any) => ({
        id: item.id,
        product: item.title,
        oldPrice: 'N/D',
        newPrice: 'Vedi Offerta',
        saveAmount: "OFFERTA",
        link: item.url,
        imageUrl: extractImage(item.content),
        brandColor: 'bg-gray-50'
    })) : [];
  } catch (error) {
    return [];
  }
};

const extractImage = (content: string): string => {
  const m = content.match(/<img[^>]+src="([^">]+)"/);
  return m ? m[1] : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
};
