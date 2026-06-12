
export type Category = 'Tutti' | 'News' | 'Recensioni' | 'Offerte' | 'Guide' | 'Tutorial' | 'App & Giochi' | 'Smartphone' | 'Wearable' | 'Modding' | 'offerteimperdibili' | 'App';

export interface DealData {
  oldPrice: string;
  newPrice: string;
  link: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  tags: string[]; // Added: List of all categories/labels for filtering
  imageUrl: string;
  author: string;
  authorImageUrl?: string;
  date: string;
  url?: string;
  featured?: boolean;
  type?: 'standard' | 'mini' | 'hero' | 'horizontal';
  dealData?: DealData | null;
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
