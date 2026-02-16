
export type Category = 'Tutti' | 'News' | 'Recensioni' | 'Offerte' | 'Guide' | 'Tutorial' | 'App & Giochi' | 'Smartphone' | 'Wearable' | 'Modding' | 'offerteimperdibili';

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  imageUrl: string;
  author: string;
  // Added to fix TypeScript error in App.tsx line 436: Property 'authorImageUrl' does not exist on type 'Article'
  authorImageUrl?: string;
  date: string;
  url?: string;
  featured?: boolean;
  type?: 'standard' | 'mini' | 'hero' | 'horizontal';
}

export interface Deal {
  id: string;
  product: string;
  oldPrice: string;
  newPrice: string;
  saveAmount: string;
  link: string;
  imageUrl: string;
  brandColor?: string;
}
