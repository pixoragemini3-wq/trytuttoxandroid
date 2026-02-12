
export type Category = 'Tutti' | 'News' | 'Recensioni' | 'Offerte' | 'Guide' | 'Tutorial' | 'App & Giochi' | 'Smartphone' | 'Wearable' | 'Modding';

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  imageUrl: string;
  author: string;
  date: string;
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
