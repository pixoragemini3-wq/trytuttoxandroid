
import React, { useEffect, useMemo, useState } from 'react';
import { Article } from '../types';
import ArticleCard from './ArticleCard';
import {
  fetchArchiveMonthCounts,
  fetchArchiveYearCounts,
  fetchPostsByDateRange,
} from '../services/bloggerService';
import NewsletterForm from './NewsletterForm';

interface MegaMenuProps {
  category: string;
  onClose: () => void;
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const IT_MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const ARCHIVE_START_YEAR = 2013;

const MegaMenu: React.FC<MegaMenuProps> = ({ category, onClose, articles, onArticleClick }) => {
  const [showAllYears, setShowAllYears] = useState(false);
  const [priceRange, setPriceRange] = useState(1); // 0: <100, 1: <200, 2: <300, 3: <400, 4: <500

  // Archivio storico a cascata: anni → mesi → articoli (conteggi ufficiali Blogger)
  const [archiveYear, setArchiveYear] = useState<number | null>(null);
  const [archiveMonth, setArchiveMonth] = useState<number | null>(null); // 1–12
  const [archiveMonthPosts, setArchiveMonthPosts] = useState<Article[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [yearCountCache, setYearCountCache] = useState<Record<number, number>>({});
  const [monthCountCache, setMonthCountCache] = useState<Record<number, number>>({});
  const [yearCountsLoading, setYearCountsLoading] = useState(false);
  const [yearCountsReady, setYearCountsReady] = useState(false);
  
  // Carica conteggi anno reali da Blogger (openSearch$totalResults)
  useEffect(() => {
    if (category !== 'News') {
      setArchiveYear(null);
      setArchiveMonth(null);
      setArchiveMonthPosts([]);
      setArchiveError(null);
      setMonthCountCache({});
      return;
    }
    if (yearCountsReady) return;

    let cancelled = false;
    const currentYear = new Date().getFullYear();
    const years = Array.from(
      { length: currentYear - ARCHIVE_START_YEAR + 1 },
      (_, i) => currentYear - i
    );

    (async () => {
      setYearCountsLoading(true);
      try {
        const counts = await fetchArchiveYearCounts(years);
        if (!cancelled) {
          setYearCountCache(counts);
          setYearCountsReady(true);
        }
      } catch {
        if (!cancelled) setYearCountsReady(false);
      } finally {
        if (!cancelled) setYearCountsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [category, yearCountsReady]);

  // 1. Get the latest article for this category (Highlight)
  // LOGIC UPDATE: Prioritize 'featured' articles within the specific category.
  const featuredArticle = useMemo(() => {
    // First try to find a featured article in this category (matches tags like 'newsinevidenza' via bloggerService)
    const specificFeatured = articles.find(a => a.category === category && a.featured === true);
    if (specificFeatured) return specificFeatured;
    
    // Fallback to the latest article in this category
    return articles.find(a => a.category === category) || articles[0];
  }, [articles, category]);

  // Secondary articles for News column to fill space
  const secondaryNews = useMemo(() => {
    if (category !== 'News') return [];
    return articles.filter(a => a.id !== featuredArticle.id).slice(0, 2);
  }, [articles, category, featuredArticle]);

  // Offerte Articles (Latest 6)
  const offerArticles = useMemo(() => {
     if (category !== 'Offerte') return [];
     return articles.filter(a => a.category === 'Offerte').slice(0, 6);
  }, [articles, category]);

  // --- LOGICA AGGIORNATA PER APP & GIOCHI ---
  
  // Lista specifica per le APP (Esclude titoli con 'gioc', 'game', 'play' se generici)
  const appList = useMemo(() => {
    if (category !== 'App & Giochi') return [];
    return articles.filter(a => 
      (a.category === 'App & Giochi' || a.category === 'App') && 
      !a.title.toLowerCase().includes('gioc') && 
      !a.title.toLowerCase().includes('game') &&
      !a.title.toLowerCase().includes('offline')
    ).slice(0, 4);
  }, [articles, category]);

  // Lista specifica per i GIOCHI (Include titoli con 'gioc', 'game', 'play' ecc)
  const gamesList = useMemo(() => {
    if (category !== 'App & Giochi') return [];
    return articles.filter(a => 
      (a.category === 'App & Giochi' || a.category === 'App') && 
      (a.title.toLowerCase().includes('gioc') || a.title.toLowerCase().includes('game') || a.title.toLowerCase().includes('offline'))
    ).slice(0, 4);
  }, [articles, category]);

  // 2. Dynamic Brands (Smartphone)
  const activeBrands = useMemo(() => {
    if (category !== 'Smartphone') return [];
    return [
      { name: 'Samsung' },
      { name: 'Xiaomi' },
      { name: 'Pixel' },
      { name: 'OnePlus' },
      { name: 'Motorola' },
      { name: 'Honor' },
      { name: 'Realme' },
      { name: 'Sony' },
      { name: 'Nothing' }
    ];
  }, [category]);

  // Accenti leggeri per categoria (il pannello resta stile “spotlight” del sito)
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'Smartphone':
        return { accent: 'text-blue-600', accentBg: 'bg-blue-50', ring: 'ring-blue-100', bar: 'bg-blue-500' };
      case 'Modding':
        return { accent: 'text-orange-600', accentBg: 'bg-orange-50', ring: 'ring-orange-100', bar: 'bg-orange-500' };
      case 'App & Giochi':
        return { accent: 'text-emerald-600', accentBg: 'bg-emerald-50', ring: 'ring-emerald-100', bar: 'bg-emerald-500' };
      case 'Recensioni':
        return { accent: 'text-violet-600', accentBg: 'bg-violet-50', ring: 'ring-violet-100', bar: 'bg-violet-500' };
      case 'Guide':
        return { accent: 'text-violet-600', accentBg: 'bg-violet-50', ring: 'ring-violet-100', bar: 'bg-violet-500' };
      case 'Offerte':
        return { accent: 'text-amber-600', accentBg: 'bg-amber-50', ring: 'ring-amber-100', bar: 'bg-amber-400' };
      case 'Wearable':
        return { accent: 'text-pink-600', accentBg: 'bg-pink-50', ring: 'ring-pink-100', bar: 'bg-pink-500' };
      default:
        return { accent: 'text-violet-600', accentBg: 'bg-violet-50', ring: 'ring-violet-100', bar: 'bg-violet-500' };
    }
  };

  const theme = getCategoryTheme(category);

  const megaCard =
    'mega-card rounded-2xl bg-white border border-violet-100 shadow-[0_8px_28px_rgba(15,23,42,0.06)] p-5 h-full';
  const megaLink =
    'block text-[13px] font-semibold text-slate-700 hover:text-violet-700 cursor-pointer transition-colors leading-snug py-1';

  // Helper function for Price Slider
  const getPriceLabel = (val: number) => {
    switch(val) {
      case 0: return '100€';
      case 1: return '200€';
      case 2: return '300€';
      case 3: return '400€';
      case 4: return '500€';
      default: return '200€';
    }
  };

  // 3. Helper to render columns based on category
  const renderColumns = () => {
    switch(category) {
      case 'Smartphone':
        return (
          <>
            {/* Col 1: Brands (Styled as Pills/Cards) */}
            <div className="col-span-1">
              <div className={megaCard}>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </span>
                <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Top Brand</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {activeBrands.map(brand => (
                  <button 
                    key={brand.name} 
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-violet-100 bg-white text-slate-700 font-bold text-[10px] uppercase tracking-wider hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition-all group"
                  >
                     {brand.name}
                     <svg className="w-3 h-3 text-gray-300 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                     </svg>
                  </button>
                ))}
              </div>
              <h3 className="font-semibold text-[13px] text-slate-900 mb-3 border-t border-violet-50 pt-3">Guide Acquisto</h3>
              <ul className="space-y-2">
                 <li className="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Migliori Smartphone 2026
                 </li>
                 <li className="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span> Top sotto i 100€
                 </li>
                 <li className="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span> Top sotto i 200€
                 </li>
                 <li className="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span> Top sotto i 300€
                 </li>
                 <li className="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span> Top sotto i 400€
                 </li>
                 <li className="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span> Fino a 500€
                 </li>
              </ul>
              </div>
            </div>

            {/* Col 2: Featured Article (Mini) */}
            <div className="col-span-1">
              <div className={megaCard}>
               <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  </span>
                  <span className="text-[15px] font-semibold text-slate-900 tracking-tight">In Evidenza</span>
               </div>
               <ArticleCard 
                  article={{...featuredArticle, type: 'standard'}} 
                  onClick={() => onArticleClick(featuredArticle)}
                  className="!p-0 !m-0 !bg-transparent !shadow-none hover:!scale-100" 
               />
              </div>
            </div>

            {/* Col 3 & 4: SOCIAL CARDS (Images Updated) */}
            <div className="col-span-2 flex flex-col gap-4">
               {/* Android Italy Card with Background */}
               <a href="https://www.facebook.com/groups/Android.Italy/" target="_blank" rel="noopener noreferrer" className="relative h-32 w-full rounded-2xl overflow-hidden group shadow-lg hover:shadow-xl transition-all border border-blue-100">
                  {/* Updated Background: More visible image */}
                  <img src="https://i.imgur.com/5czWQot.png" className="absolute inset-0 w-full h-full object-cover" alt="Background" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/60 to-transparent"></div>
                  
                  <div className="absolute inset-0 p-5 flex items-center justify-between z-10">
                     <div>
                        <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">Community Ufficiale</span>
                        <h3 className="font-condensed text-3xl font-black uppercase italic text-white leading-none mt-1 shadow-black drop-shadow-md">Android Italy</h3>
                        <p className="text-[10px] text-blue-100 font-medium">Il gruppo di supporto #1 in Italia</p>
                     </div>
                     <div className="text-right">
                        <span className="block text-2xl font-black text-white">36k+</span>
                        <span className="text-[9px] uppercase font-bold text-white/80 bg-black/20 px-2 py-1 rounded-lg">Iscritti</span>
                     </div>
                  </div>
               </a>

               {/* TuttoXAndroid Card - SPECIFIC IMAGE USED */}
               <a href="https://www.facebook.com/tuttoxandroidcom/?ref=embed_page" target="_blank" rel="noopener noreferrer" className="relative h-32 w-full rounded-2xl overflow-hidden group shadow-lg hover:shadow-xl transition-all border border-gray-200">
                  <img src="https://i.imgur.com/GHOv30o.png" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="TuttoXAndroid Cover" />
                  {/* Dark Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

                  <div className="absolute inset-0 p-5 flex items-center justify-between z-10">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full p-1 shadow-lg shrink-0 overflow-hidden">
                           <img src="https://i.imgur.com/HcqNQcO.png" className="w-full h-full object-contain" alt="Logo" />
                        </div>
                        <div>
                           <h3 className="font-condensed text-2xl font-black uppercase text-white leading-none drop-shadow-md">TuttoXAndroid</h3>
                           <span className="text-[9px] text-gray-200 font-black uppercase tracking-widest drop-shadow-sm">Pagina Ufficiale</span>
                        </div>
                     </div>
                     <button className="bg-[#1877F2] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-[#1877F2] transition-colors shadow-lg">
                        Segui
                     </button>
                  </div>
               </a>
            </div>
          </>
        );

      case 'Guide': {
        const guideIcon = (path: string) => (
          <span className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
            </svg>
          </span>
        );
        const guideCols: { title: string; sub: string; path: string; items: string[] }[] = [
          {
            title: 'Troubleshooting',
            sub: 'Risolvi i problemi comuni',
            path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
            items: [
              'Come aumentare durata batteria',
              'Liberare spazio memoria',
              'Velocizzare telefono lento',
              'Problemi Wi-Fi e Dati',
            ],
          },
          {
            title: 'Personalizzazione',
            sub: 'Rendi unico il tuo Android',
            path: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
            items: [
              'Migliori Launcher 2026',
              'Installare Icon Pack',
              'Automazione con Tasker',
              'Sfondi Animati',
            ],
          },
          {
            title: 'Primi Passi',
            sub: 'Per i nuovi utenti',
            path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
            items: [
              'Da iPhone ad Android',
              'Configurazione nuovo telefono',
              'Backup WhatsApp e Foto',
              'Trova il mio dispositivo',
            ],
          },
        ];
        return (
          <>
            {guideCols.map((col) => (
              <div key={col.title} className="col-span-1">
                <div className={megaCard}>
                  <div className="flex items-center gap-2.5 mb-1">
                    {guideIcon(col.path)}
                    <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">{col.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3 pl-[2.65rem] leading-snug">{col.sub}</p>
                  <ul className="space-y-0.5 border-t border-violet-50 pt-3">
                    {col.items.map((item) => (
                      <li key={item}>
                        <button type="button" className={`${megaLink} w-full text-left`}>
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="mt-3 text-[12px] font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    Vedi tutti →
                  </button>
                </div>
              </div>
            ))}

            <div className="col-span-1">
              <div className="mega-card mega-card-promo rounded-2xl p-5 h-full flex flex-col justify-between bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-[0_12px_32px_rgba(109,40,217,0.28)] relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </span>
                    <h3 className="font-semibold text-[15px] tracking-tight">Expert & Modding</h3>
                  </div>
                  <p className="text-[12px] text-violet-100 mb-4 leading-relaxed">
                    Guide avanzate per sblocco, root e custom ROM.
                  </p>
                  <ul className="space-y-2.5">
                    {['Sblocco Bootloader', 'Root con Magisk', 'Custom ROM'].map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          className="flex items-center gap-2 text-[13px] font-medium text-white/90 hover:text-white transition-colors w-full text-left"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-200 shrink-0" />
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  className="relative z-10 mt-5 w-full rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider py-2.5 transition-colors"
                >
                  Esplora le guide →
                </button>
              </div>
            </div>
          </>
        );
      }

      case 'Recensioni': {
        const collabBrands = ['Aukey', 'Blackview', 'Cubot', 'Ezviz', 'Leagoo', 'Lefant', 'Spigen', 'Teclast', 'Ugoos', 'Ulefone', 'Xiaomi'].sort();
        
        return (
          <>
            {/* Col 1: In Evidenza */}
            <div className="col-span-1">
              <div className={megaCard}>
               <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </span>
                  <span className="text-[15px] font-semibold text-slate-900 tracking-tight">In Evidenza</span>
               </div>
               <ArticleCard 
                  article={{...featuredArticle, type: 'standard'}} 
                  onClick={() => onArticleClick(featuredArticle)}
                  className="!p-0 !m-0 !bg-transparent !shadow-none hover:!scale-100" 
               />
              </div>
            </div>

            {/* Col 2: Top Brands */}
            <div className="col-span-1">
              <div className={megaCard}>
                 <div className="flex items-center gap-2.5 mb-4">
                   <span className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   </span>
                   <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Top Brands</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 border-t border-violet-50 pt-3">
                   {collabBrands.map(brand => (
                     <span key={brand} className="text-[13px] font-semibold text-slate-600 hover:text-violet-700 cursor-pointer transition-colors flex items-center gap-2 group">
                       <span className="w-1.5 h-1.5 bg-violet-300 rounded-full group-hover:bg-violet-600 transition-colors"></span> {brand}
                     </span>
                   ))}
                 </div>
              </div>
            </div>

            {/* Col 3: Dispositivi */}
            <div className="col-span-1">
              <div className={megaCard}>
                 <div className="flex items-center gap-2.5 mb-4">
                   <span className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                   </span>
                   <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Dispositivi</h3>
                 </div>
                 <ul className="space-y-0.5 border-t border-violet-50 pt-3">
                   {['Wearables & Smartwatch', 'Audio & Cuffie TWS', 'Tablet Android', 'Smart Home', 'Gadget Tech', 'TV Box & Stick'].map((item) => (
                     <li key={item}>
                       <button type="button" className={`${megaLink} w-full text-left`}>{item}</button>
                     </li>
                   ))}
                 </ul>
              </div>
            </div>

            {/* Col 4: Promo recensioni pro */}
            <div className="col-span-1">
                <div className="mega-card mega-card-promo rounded-2xl p-6 h-full flex flex-col justify-between bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-[0_12px_32px_rgba(109,40,217,0.28)] relative overflow-hidden">
                   <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                   <div className="relative z-10">
                      <h4 className="text-xl font-bold tracking-tight mb-2">Recensioni pro</h4>
                      <p className="text-[12px] text-violet-100 leading-relaxed mb-5">
                        Analisi dettagliate di smartphone, wearable e gadget.
                      </p>
                   </div>
                   <button type="button" className="relative z-10 w-full rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider py-2.5 transition-colors">
                     Leggi la recensione →
                   </button>
                </div>
            </div>
          </>
        );
      }

      case 'Offerte':
         return (
          <>
            {/* Col 1 & 2: Ultime Notizie Offerte (Grid of 6) */}
            <div className="col-span-2 border-r border-gray-100 pr-4">
              <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-yellow-400 pb-2">Ultime Offerte</h3>
              <div className="grid grid-cols-2 gap-3">
                 {offerArticles.length > 0 ? (
                   offerArticles.map(art => (
                     <div key={art.id} onClick={() => onArticleClick(art)} className="group cursor-pointer flex gap-3 items-center p-2 rounded-lg hover:bg-yellow-50 transition-colors">
                        <div className="w-12 h-12 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                           <img src={art.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={art.title} />
                        </div>
                        <div className="min-w-0">
                           <h4 className="text-[10px] font-bold leading-tight text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-2">{art.title}</h4>
                        </div>
                     </div>
                   ))
                 ) : (
                   <p className="text-xs text-gray-400">Nessuna offerta recente.</p>
                 )}
              </div>
              <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-black hover:text-yellow-500 transition-colors w-full text-center py-2 bg-gray-50 rounded-lg">
                Vedi tutte le offerte &rarr;
              </button>
            </div>

            {/* Col 3: Price Slider (Moved from Recensioni) */}
            <div className="col-span-1 border-r border-gray-200 px-4">
              <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-yellow-400 pb-2">
                Budget
              </h3>
              
              <div className="bg-yellow-50 p-6 rounded-2xl text-center border border-yellow-100 h-[calc(100%-3rem)] flex flex-col justify-center">
                 <div className="relative mb-8 pt-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="4" 
                      step="1" 
                      value={priceRange} 
                      onChange={(e) => setPriceRange(parseInt(e.target.value))}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-black uppercase text-gray-400 w-full px-1">
                      <span>100€</span>
                      <span></span>
                      <span>300€</span>
                      <span></span>
                      <span>500€</span>
                    </div>
                 </div>
                 
                 <div className="text-center">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Trova offerte sotto i:</p>
                    <button className="bg-black text-white px-4 py-3 rounded-xl font-black text-sm uppercase tracking-tight shadow-lg hover:bg-yellow-500 transition-colors w-full">
                      {getPriceLabel(priceRange)}
                    </button>
                 </div>
              </div>
            </div>

            {/* Col 4: Telegram Promo Channel (Resized) */}
            <div className="col-span-1 bg-[#24A1DE] p-4 rounded-2xl text-center relative overflow-hidden group shadow-lg flex flex-col justify-center items-center h-full">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
               
               {/* Telegram Icon */}
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#24A1DE]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg>
               </div>

               <h4 className="font-condensed text-2xl font-black uppercase text-white mb-1 relative z-10 italic">Canale<br/>Offerte</h4>
               <p className="text-[10px] text-white/90 mb-4 font-medium relative z-10 max-w-xs">Errori di prezzo e coupon esclusivi.</p>
               
               <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-[#24A1DE] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl relative z-10 w-full">
                 Unisciti
               </a>
            </div>
          </>
         );

      case 'App & Giochi':
         return (
           <>
             {/* Col 1: ULTIME APP */}
             <div className="col-span-1">
               <div className={megaCard}>
               <div className="flex items-center gap-2.5 mb-4">
                 <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                 </span>
                 <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Ultime App</h3>
               </div>
               <div className="space-y-2">
                 {appList.length > 0 ? (
                    appList.map((art) => (
                      <div key={art.id} onClick={() => onArticleClick(art)} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-violet-50/80 transition-colors cursor-pointer group">
                         <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-violet-100">
                            <img src={art.imageUrl} className="w-full h-full object-cover" alt={art.title} />
                         </div>
                         <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 group-hover:text-violet-700 leading-tight line-clamp-2">{art.title}</h4>
                         </div>
                      </div>
                    ))
                 ) : (
                    <p className="text-xs text-slate-400">Nessuna app recente.</p>
                 )}
               </div>
               <button className="mt-3 text-[12px] font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                  Vedi tutte →
               </button>
               </div>
             </div>

             {/* Col 2: ULTIMI GIOCHI */}
             <div className="col-span-1">
               <div className={megaCard}>
               <div className="flex items-center gap-2.5 mb-4">
                 <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </span>
                 <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Ultimi Giochi</h3>
               </div>
               <div className="space-y-2">
                 {gamesList.length > 0 ? (
                    gamesList.map((art) => (
                      <div key={art.id} onClick={() => onArticleClick(art)} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-violet-50/80 transition-colors cursor-pointer group">
                         <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-violet-100">
                            <img src={art.imageUrl} className="w-full h-full object-cover" alt={art.title} />
                         </div>
                         <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 group-hover:text-violet-700 leading-tight line-clamp-2">{art.title}</h4>
                         </div>
                      </div>
                    ))
                 ) : (
                    <p className="text-xs text-slate-400">Nessun gioco recente.</p>
                 )}
               </div>
               <button className="mt-3 text-[12px] font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                  Vedi tutti →
               </button>
               </div>
             </div>

             {/* Col 3: Categories */}
             <div className="col-span-1">
               <div className={megaCard}>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </span>
                  <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Categorie</h3>
                </div>
                <ul className="space-y-0.5 border-t border-violet-50 pt-3">
                  {['Giochi Android Gratis', 'Migliori App Produttività', 'App Foto & Video', 'Personalizzazione', 'Emulatori'].map((item) => (
                    <li key={item}>
                      <button type="button" className={`${megaLink} w-full text-left`}>{item}</button>
                    </li>
                  ))}
                </ul>
               </div>
             </div>

             {/* Col 4: Promo (stile card viola homepage) */}
             <div className="col-span-1">
                <div className="mega-card mega-card-promo rounded-2xl p-6 text-white h-full flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-violet-600 to-violet-700 shadow-[0_12px_32px_rgba(109,40,217,0.28)]">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                   <h4 className="text-xl font-bold tracking-tight mb-2 relative z-10">Google Play Pass</h4>
                   <p className="text-[12px] font-medium text-violet-100 mb-5 relative z-10 leading-relaxed">
                     Centinaia di giochi e app senza pubblicità. Scopri se ne vale la pena.
                   </p>
                   <button className="bg-white/15 hover:bg-white/25 border border-white/20 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors w-fit relative z-10">
                     Leggi articolo →
                   </button>
                </div>
             </div>
           </>
         );

      case 'News': {
        const currentYear = new Date().getFullYear();
        const allYears = Array.from({ length: currentYear - 2013 + 1 }, (_, i) => currentYear - i);
        const displayedYears = showAllYears ? allYears : allYears.slice(0, 9);
        const topViewed = articles.slice(0, 5);

        const hotTopics = [
          'Android 15', 'AI', 'Samsung', 'Sicurezza', 'WhatsApp', 'Google', 'Pixel 9', 'Offerte'
        ];

        const yearTotal =
          archiveYear != null ? (yearCountCache[archiveYear] ?? 0) : 0;

        const openArchiveYear = async (year: number) => {
          setArchiveYear(year);
          setArchiveMonth(null);
          setArchiveMonthPosts([]);
          setMonthCountCache({});
          setArchiveError(null);
          setArchiveLoading(true);
          try {
            const months = await fetchArchiveMonthCounts(year);
            setMonthCountCache(months);
            // Allinea il totale anno al sum dei mesi se Blogger risponde
            const sum = Object.values(months).reduce((a, b) => a + b, 0);
            if (sum > 0) {
              setYearCountCache((prev) => ({ ...prev, [year]: sum }));
            } else if ((yearCountCache[year] ?? 0) === 0) {
              setArchiveError('Nessun articolo trovato per questo anno.');
            }
          } catch {
            setArchiveError('Impossibile caricare l\'archivio. Riprova.');
            setMonthCountCache({});
          } finally {
            setArchiveLoading(false);
          }
        };

        const openArchiveMonth = async (month: number) => {
          if (archiveYear == null) return;
          setArchiveMonth(month);
          setArchiveMonthPosts([]);
          setArchiveError(null);
          setArchiveLoading(true);
          try {
            const posts = await fetchPostsByDateRange(archiveYear, month);
            setArchiveMonthPosts(posts);
            // Mantieni il totale ufficiale Blogger; non ridurlo al campione caricato
            if (posts.length === 0) {
              setArchiveError('Nessun articolo in questo mese.');
            }
          } catch {
            setArchiveError('Impossibile caricare gli articoli. Riprova.');
            setArchiveMonthPosts([]);
          } finally {
            setArchiveLoading(false);
          }
        };

        const backToYears = () => {
          setArchiveYear(null);
          setArchiveMonth(null);
          setArchiveMonthPosts([]);
          setMonthCountCache({});
          setArchiveError(null);
        };

        const backToMonths = () => {
          setArchiveMonth(null);
          setArchiveMonthPosts([]);
          setArchiveError(null);
        };

        return (
          <>
            {/* Col 1: In Evidenza + Filler News */}
            <div className="col-span-1 border-r border-gray-100 pr-4 flex flex-col justify-between">
               <div>
                 <div className="flex items-center gap-2 mb-4 text-[#e31b23]">
                    <span className="w-2 h-2 bg-[#e31b23] rounded-full animate-pulse"></span>
                    <span className="text-xs font-black uppercase tracking-widest">In Evidenza</span>
                 </div>
                 <ArticleCard 
                    article={{...featuredArticle, type: 'standard'}} 
                    onClick={() => onArticleClick(featuredArticle)}
                    className="!p-0 !m-0 !bg-transparent !shadow-none hover:!scale-100 mb-4" 
                 />
               </div>
               <div className="space-y-2 border-t border-gray-100 pt-3">
                  {secondaryNews.map(art => (
                    <div key={art.id} onClick={() => onArticleClick(art)} className="group cursor-pointer">
                       <h4 className="text-[10px] font-bold text-gray-700 leading-tight group-hover:text-[#e31b23] transition-colors line-clamp-2">
                         {art.title}
                       </h4>
                    </div>
                  ))}
               </div>
            </div>

            {/* Col 2: I Più Letti */}
            <div className="col-span-1 border-r border-gray-100 pr-4 pl-2">
               <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-[#e31b23] pb-1 w-fit">
                 I Più Letti
               </h3>
               <ul className="space-y-4">
                 {topViewed.map((art, idx) => (
                   <li key={art.id} className="flex gap-3 group cursor-pointer items-start" onClick={() => onArticleClick(art)}>
                      <span className="text-3xl font-black text-gray-200 leading-none group-hover:text-[#e31b23] transition-colors font-condensed italic select-none">
                        {idx + 1}
                      </span>
                      <div className="pt-0.5 border-b border-gray-50 pb-2 w-full">
                         <h4 className="text-xs font-bold leading-tight text-gray-900 group-hover:text-[#e31b23] transition-colors line-clamp-2">
                           {art.title}
                         </h4>
                         <span className="text-[9px] text-gray-400 mt-1 block uppercase tracking-wider">{art.category}</span>
                      </div>
                   </li>
                 ))}
               </ul>
            </div>

            {/* Col 3: Archivio a cascata */}
            <div className="col-span-1 pl-2 border-r border-gray-100 pr-4 min-h-[220px]">
              <h3 className="font-condensed text-xl font-black uppercase mb-3 text-gray-900 border-b-2 border-gray-200 pb-1 flex items-center gap-2">
                Archivio Storico
              </h3>

              {/* Livello 0: anni — solo conteggi ufficiali Blogger */}
              {archiveYear == null && (
                <div className="flex flex-wrap gap-2 content-start">
                  {yearCountsLoading && !yearCountsReady && (
                    <p className="w-full text-[11px] text-gray-500 font-medium py-2">
                      Conteggio articoli da Blogger…
                    </p>
                  )}
                  {displayedYears.map((year) => {
                    const count = yearCountCache[year];
                    const known = typeof count === 'number';
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => openArchiveYear(year)}
                        className="px-3 py-2 bg-[#e31b23] text-white rounded-lg text-[10px] font-black hover:bg-black transition-colors shadow-sm disabled:opacity-60"
                        title={known ? `${count} articoli pubblicati nel ${year}` : `Apri archivio ${year}`}
                        disabled={yearCountsLoading && !yearCountsReady}
                      >
                        {year}
                        {known && (
                          <span className="opacity-90 font-bold"> ({count})</span>
                        )}
                      </button>
                    );
                  })}
                  {!showAllYears && (
                    <button
                      type="button"
                      onClick={() => setShowAllYears(true)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black hover:bg-black hover:text-white transition-colors"
                    >
                      +
                    </button>
                  )}
                  <p className="w-full text-[9px] text-gray-400 mt-1 font-medium">
                    Numeri ufficiali Blogger · clicca un anno per i mesi
                  </p>
                </div>
              )}

              {/* Livello 1: mesi dell'anno */}
              {archiveYear != null && archiveMonth == null && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={backToYears}
                      className="text-[10px] font-black uppercase tracking-wide text-gray-500 hover:text-[#e31b23] transition-colors"
                    >
                      ← Anni
                    </button>
                    <span className="text-[11px] font-black text-gray-900">
                      {archiveYear}
                      <span className="text-[#e31b23]"> ({yearTotal})</span>
                    </span>
                  </div>
                  {archiveLoading ? (
                    <p className="text-[11px] text-gray-500 font-medium py-4 text-center">Caricamento mesi da Blogger…</p>
                  ) : archiveError && Object.keys(monthCountCache).length === 0 ? (
                    <p className="text-[11px] text-gray-500 font-medium py-2">{archiveError}</p>
                  ) : (
                    <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto pr-1">
                      {IT_MONTH_NAMES.map((name, idx) => {
                        const m = idx + 1;
                        const c = monthCountCache[m] || 0;
                        if (c === 0) return null;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => openArchiveMonth(m)}
                            className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-[#e31b23] hover:text-white transition-colors group"
                          >
                            <span className="text-[11px] font-bold text-gray-800 group-hover:text-white">{name}</span>
                            <span className="text-[10px] font-black text-[#e31b23] group-hover:text-white">({c})</span>
                          </button>
                        );
                      })}
                      {Object.keys(monthCountCache).length === 0 && (
                        <p className="text-[11px] text-gray-500 font-medium py-2">
                          Nessun mese con articoli per {archiveYear}.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Livello 2: lista articoli del mese */}
              {archiveYear != null && archiveMonth != null && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={backToMonths}
                      className="text-[10px] font-black uppercase tracking-wide text-gray-500 hover:text-[#e31b23] transition-colors"
                    >
                      ← Mesi
                    </button>
                    <span className="text-[10px] font-black text-gray-900 text-right leading-tight">
                      {IT_MONTH_NAMES[archiveMonth - 1]} {archiveYear}
                      <span className="text-[#e31b23]"> ({monthCountCache[archiveMonth] ?? archiveMonthPosts.length})</span>
                    </span>
                  </div>
                  {archiveLoading ? (
                    <p className="text-[11px] text-gray-500 font-medium py-4 text-center">Caricamento articoli…</p>
                  ) : (
                    <ul className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
                      {archiveMonthPosts.map((art) => (
                        <li key={art.id}>
                          <button
                            type="button"
                            onClick={() => {
                              onArticleClick(art);
                              onClose();
                            }}
                            className="w-full text-left flex gap-2 p-2 rounded-lg hover:bg-gray-50 group transition-colors"
                          >
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                              <img
                                src={art.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[11px] font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#e31b23]">
                                {art.title}
                              </h4>
                              <span className="text-[9px] text-gray-400 font-medium">{art.date}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                      {!archiveLoading && archiveMonthPosts.length === 0 && (
                        <li className="text-[11px] text-gray-500 py-2">
                          {archiveError || 'Nessun articolo in questo mese.'}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Col 4: Tendenze (Clean Pills, No Emojis) */}
            <div className="col-span-1 pl-2">
               <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 flex items-center gap-2">
                 Tendenze Ora
               </h3>
               <div className="flex flex-wrap gap-2">
                 {hotTopics.map(topic => (
                   <span key={topic} className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-[10px] font-black uppercase tracking-wide cursor-pointer hover:bg-black hover:text-white transition-all">
                     {topic}
                   </span>
                 ))}
               </div>
               
               <div className="mt-8 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <p className="text-[10px] font-bold text-gray-500 mb-3">Non perdere nessuna notizia</p>
                  <NewsletterForm source="home_sidebar" variant="light" buttonLabel="Iscriviti alla Newsletter" />
               </div>
            </div>
          </>
        );
      }

      default:
        // Fallback for default categories
        return (
          <>
             <div className="col-span-1">
              <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">Sezioni</h3>
              <ul className="space-y-3">
                <li className="text-sm font-bold text-gray-500 hover:text-black cursor-pointer transition-colors">Ultime Notizie</li>
                <li className="text-sm font-bold text-gray-500 hover:text-black cursor-pointer transition-colors">Editoriali</li>
                <li className="text-sm font-bold text-gray-500 hover:text-black cursor-pointer transition-colors">Anteprime</li>
              </ul>
            </div>
             <div className="col-span-3">
              {/* Featured article generic */}
               <div className="flex items-center gap-2 mb-4 text-gray-900">
                  <span className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></span>
                  <span className="text-xs font-black uppercase tracking-widest">In Evidenza</span>
               </div>
               <div className="max-w-sm">
                 <ArticleCard 
                    article={{...featuredArticle, type: 'standard'}} 
                    onClick={() => onArticleClick(featuredArticle)}
                    className="!p-0 !m-0 !bg-transparent !shadow-none hover:!scale-100" 
                 />
               </div>
            </div>
          </>
        );
    }
  };

  return (
    <div
      className="mega-menu absolute left-0 top-full w-full z-[80] animate-in fade-in slide-in-from-top-1 duration-200 bg-white"
      onMouseLeave={onClose}
    >
      {/* barra accento sottile (stile sito) */}
      <div className={`h-[3px] w-full ${theme.bar} shrink-0`} />
      {/* Blocco pieno opaco: non lascia trasparire hero / BEST OF */}
      <div className="mega-menu-panel border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-4 gap-4 xl:gap-5">
            {renderColumns()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
