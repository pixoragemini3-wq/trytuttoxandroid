
import { Article, Deal } from './types';

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: "Le nuove tariffe streaming di YouTube TV partono da 55€ al mese",
    excerpt: "Ogni piano include ora il Cloud DVR illimitato e una selezione di canali 4K inclusi nel prezzo base per i primi sei mesi.",
    content: '',
    category: 'News',
    imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=1200',
    author: 'Kortnee Jackson',
    date: '10 Feb 2024',
    featured: true,
    type: 'hero'
  },
  {
    id: '2',
    title: 'Samsung Galaxy S25 Ultra: Il test della fotocamera in notturna',
    excerpt: 'Abbiamo portato il nuovo flagship tra le strade di Milano per vedere di cosa è capace il sensore da 200MP.',
    content: '',
    category: 'Smartphone',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=600',
    author: 'Luca Bianchi',
    date: 'Oggi',
    type: 'standard'
  },
  {
    id: '3',
    title: 'Guida definitiva: Come installare una Custom ROM nel 2024',
    excerpt: 'Tutto quello che devi sapere per sbloccare il potenziale del tuo smartphone Android in sicurezza.',
    content: '',
    category: 'Modding',
    imageUrl: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&q=80&w=600',
    author: 'Admin',
    date: '2 Giorni fa',
    type: 'standard'
  },
  {
    id: '4',
    title: "Le migliori 10 App per la produttività su Android 15",
    excerpt: 'Dalla gestione dei task alla scrittura, ecco le applicazioni che non possono mancare sul tuo dispositivo.',
    content: '',
    category: 'App & Giochi',
    imageUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=600',
    author: 'Sara Verdi',
    date: '3 Ore fa',
    type: 'standard'
  },
  {
    id: '5',
    title: "Recensione Xiaomi Watch 2 Pro: WearOS al giusto prezzo?",
    excerpt: 'Uno smartwatch elegante e potente che sfida i grandi del settore con un prezzo aggressivo.',
    content: '',
    category: 'Wearable',
    imageUrl: 'https://images.unsplash.com/photo-1544117518-30dd5ff7a986?auto=format&fit=crop&q=80&w=600',
    author: 'Marco Rossi',
    date: '12 Ore fa',
    type: 'standard'
  },
  {
    id: '6',
    title: "Migliori VPN per Android: La nostra classifica 2024",
    excerpt: '',
    content: '',
    category: 'Guide',
    imageUrl: '',
    author: 'Admin',
    date: '1 Giorno fa',
    type: 'mini'
  },
  {
    id: '7',
    title: "Offerta Lampo: Pixel 8 al prezzo più basso di sempre",
    excerpt: '',
    content: '',
    category: 'Offerte',
    imageUrl: '',
    author: 'Admin',
    date: '2 Ore fa',
    type: 'mini'
  },
  {
    id: '8',
    title: "Android 16: Ecco i primi rumors sulla nuova interfaccia",
    excerpt: '',
    content: '',
    category: 'News',
    imageUrl: '',
    author: 'Luca Bianchi',
    date: '10 Min fa',
    type: 'mini'
  },
  {
    id: '9',
    title: "Recensione Garmin Fenix 8: Lo sportivo definitivo",
    excerpt: '',
    content: '',
    category: 'Recensioni',
    imageUrl: '',
    author: 'Marco Rossi',
    date: 'Oggi',
    type: 'mini'
  },
  {
    id: '10',
    title: "Come velocizzare il tuo smartphone Android in 5 passaggi",
    excerpt: '',
    content: '',
    category: 'Tutorial',
    imageUrl: '',
    author: 'Sara Verdi',
    date: '4 Ore fa',
    type: 'mini'
  },
  {
    id: '11',
    title: "I migliori giochi offline per lunghi viaggi in aereo",
    excerpt: '',
    content: '',
    category: 'App & Giochi',
    imageUrl: '',
    author: 'Sara Verdi',
    date: 'Ieri',
    type: 'mini'
  },
  {
    id: '12',
    title: "OnePlus 13: trapelate le specifiche tecniche mostruose",
    excerpt: '',
    content: '',
    category: 'Smartphone',
    imageUrl: '',
    author: 'Luca Bianchi',
    date: '2 Ore fa',
    type: 'mini'
  },
  {
    id: '13',
    title: "Le cuffie Sony WH-1000XM5 sono in sconto del 30%",
    excerpt: '',
    content: '',
    category: 'Offerte',
    imageUrl: '',
    author: 'Admin',
    date: '5 Min fa',
    type: 'mini'
  },
  {
    id: '14',
    title: "Cos'è un Kernel Android e perché dovrebbe interessarti",
    excerpt: '',
    content: '',
    category: 'Modding',
    imageUrl: '',
    author: 'Admin',
    date: '3 Giorni fa',
    type: 'mini'
  }
];

export const MOCK_DEALS: Deal[] = [
  {
    id: 'd1',
    product: 'Apple Watch Series 10',
    oldPrice: '459€',
    newPrice: '359€',
    saveAmount: 'Risparmia 100€',
    link: '#',
    imageUrl: 'https://images.unsplash.com/photo-1434493907317-a46b53b81882?auto=format&fit=crop&q=80&w=400',
    brandColor: 'bg-red-500'
  },
  {
    id: 'd2',
    product: 'Amazon Echo Dot 5a Gen',
    oldPrice: '64€',
    newPrice: '34€',
    saveAmount: 'Risparmia 30€',
    link: '#',
    imageUrl: 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&q=80&w=400',
    brandColor: 'bg-blue-400'
  },
  {
    id: 'd3',
    product: 'Ring Video Doorbell',
    oldPrice: '99€',
    newPrice: '59€',
    saveAmount: 'Risparmia 40€',
    link: '#',
    imageUrl: 'https://images.unsplash.com/photo-1558002038-103792e07a70?auto=format&fit=crop&q=80&w=400',
    brandColor: 'bg-purple-500'
  },
  {
    id: 'd4',
    product: 'Nothing Phone (2a)',
    oldPrice: '349€',
    newPrice: '299€',
    saveAmount: 'Risparmia 50€',
    link: '#',
    imageUrl: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&q=80&w=400',
    brandColor: 'bg-yellow-400'
  }
];
