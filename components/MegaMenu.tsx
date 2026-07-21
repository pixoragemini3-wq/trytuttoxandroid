
import React, { useEffect, useMemo, useState } from 'react';
import { Article } from '../types';
import ArticleCard from './ArticleCard';
import {
  budgetIndexToMaxEuro,
  extractArticlePriceEuro,
  fetchArchiveMonthCounts,
  fetchArchiveYearCounts,
  fetchPostsByDateRange,
  filterBudgetTechOffers,
  isTechDealArticle,
} from '../services/bloggerService';
import NewsletterForm from './NewsletterForm';
import { CATEGORY_COLORS, MOCK_ARTICLES } from '../constants';

interface MegaMenuProps {
  category: string;
  onClose: () => void;
  articles: Article[];
  onArticleClick: (article: Article) => void;
  /** Applica filtro budget e apre la lista Offerte in homepage. */
  onBudgetFilter?: (maxEuro: number) => void;
  onSeeAllOffers?: () => void;
  /** Guide Acquisto: fascia smartphone (null = tutti / migliori 2026). */
  onSmartphonePriceGuide?: (maxEuro: number | null) => void;
}

const IT_MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const ARCHIVE_START_YEAR = 2013;

const MegaMenu: React.FC<MegaMenuProps> = ({
  category,
  onClose,
  articles,
  onArticleClick,
  onBudgetFilter,
  onSeeAllOffers,
  onSmartphonePriceGuide,
}) => {
  const [showAllYears, setShowAllYears] = useState(false);
  const [priceRange, setPriceRange] = useState(1); // 0: <100, 1: <200, 2: <300, 3: <400, 4: <500
  const maxBudgetEuro = budgetIndexToMaxEuro(priceRange);

  // Feed reale o mock: evita menu vuoti se articles non è ancora pronto
  const sourceArticles = useMemo(
    () => (articles && articles.length > 0 ? articles : MOCK_ARTICLES),
    [articles]
  );

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

  const articleHay = (a: Article) =>
    `${a.title || ''} ${(a.tags || []).join(' ')} ${a.category || ''} ${a.excerpt || ''}`.toLowerCase();

  // 1. Get the latest article for this category (Highlight)
  // LOGIC UPDATE: Prioritize 'featured' articles within the specific category.
  const featuredArticle = useMemo(() => {
    const specificFeatured = sourceArticles.find(a => a.category === category && a.featured === true);
    if (specificFeatured) return specificFeatured;
    const byCat = sourceArticles.find(a => a.category === category);
    if (byCat) return byCat;
    return sourceArticles[0];
  }, [sourceArticles, category]);

  // Secondary articles for News column to fill space
  const secondaryNews = useMemo(() => {
    if (category !== 'News') return [];
    return sourceArticles.filter(a => a.id !== featuredArticle?.id).slice(0, 2);
  }, [sourceArticles, category, featuredArticle]);

  // Offerte mega-menu: solo deal tech; con budget preferisci smartphone sotto soglia
  const offerArticles = useMemo(() => {
    if (category !== 'Offerte') return [];
    const pool = sourceArticles.filter((a) => isTechDealArticle(a));
    const under = filterBudgetTechOffers(pool, maxBudgetEuro);
    // Se nessun prezzo sotto soglia, ultime offerte tech (senza filler non-tech)
    const list = under.length > 0 ? under : pool;
    return list.slice(0, 6);
  }, [sourceArticles, category, maxBudgetEuro]);

  const offerPriceLabel = (a: Article): string | null => {
    const p = a.priceEuro != null ? a.priceEuro : extractArticlePriceEuro(a);
    return p != null ? `${p}€` : null;
  };

  // --- APP & GIOCHI: pool ampio (come homepage), poi split app/giochi ---
  const isGameArticle = (a: Article) => {
    const hay = articleHay(a);
    const tags = (a.tags || []).map((t) => t.toLowerCase());
    return (
      tags.some((t) => /gioc|game|gaming/.test(t)) ||
      /\b(gioc[oi]|gaming|game|offline|emulator[ei]?|play store|apk pure|gacha|pubg|fortnite|call of duty|roblox)\b/i.test(hay)
    );
  };

  const appGamesPool = useMemo(() => {
    if (category !== 'App & Giochi') return [];
    const matched = sourceArticles.filter((a) => {
      if (a.category === 'App & Giochi' || a.category === 'App') return true;
      return /\bapp\b|gioco|giochi|game|gaming|play store|apk|whatsapp|instagram|telegram|tiktok|android app|google play/i.test(
        articleHay(a)
      );
    });
    // Se il feed recente non ha label App, usa comunque gli ultimi pezzi (meglio di lista vuota)
    return matched.length > 0 ? matched : sourceArticles.slice(0, 16);
  }, [sourceArticles, category]);

  const gamesList = useMemo(() => {
    if (category !== 'App & Giochi') return [];
    const games = appGamesPool.filter(isGameArticle).slice(0, 4);
    if (games.length > 0) return games;
    // fallback: seconda metà del pool se non c’è match “game” nel titolo
    return appGamesPool.slice(Math.min(4, appGamesPool.length), Math.min(8, appGamesPool.length));
  }, [appGamesPool, category]);

  const appList = useMemo(() => {
    if (category !== 'App & Giochi') return [];
    const gameIds = new Set(gamesList.map((g) => g.id));
    const apps = appGamesPool.filter((a) => !isGameArticle(a) && !gameIds.has(a.id)).slice(0, 4);
    if (apps.length > 0) return apps;
    // fallback: primi del pool non già in giochi
    return appGamesPool.filter((a) => !gameIds.has(a.id)).slice(0, 4);
  }, [appGamesPool, gamesList, category]);

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

  // Articoli secondari sotto i banner community nel mega-menu Smartphone
  const secondarySmartphones = useMemo(() => {
    if (category !== 'Smartphone') return [];
    const phoneRe =
      /\b(galaxy|pixel|iphone|xiaomi|redmi|poco|oneplus|smartphone|honor|realme|motorola|nothing|sony|samsung)\b/i;
    return sourceArticles
      .filter((a) => a.id !== featuredArticle?.id)
      .filter(
        (a) =>
          a.category === 'Smartphone' ||
          phoneRe.test(articleHay(a))
      )
      .slice(0, 4);
  }, [sourceArticles, category, featuredArticle]);

  /** Colore ufficiale categoria (stesso del nav) — richiami visibili, non solo grigio */
  const accent = CATEGORY_COLORS[category] || CATEGORY_COLORS['Tutti'] || '#64748b';

  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const rgba = (hex: string, a: number) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  const darken = (hex: string, amount = 0.22) => {
    const { r, g, b } = hexToRgb(hex);
    const f = 1 - amount;
    return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
  };

  const megaCard =
    'mega-card rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.07)] p-5 h-full border';
  const megaCardStyle: React.CSSProperties = {
    borderColor: rgba(accent, 0.22),
  };
  const megaLink =
    'block text-[13px] font-semibold text-slate-700 hover:underline cursor-pointer transition-colors leading-snug py-1 w-full text-left';
  const megaLinkStyle: React.CSSProperties = { color: '#334155' };
  const megaLinkHover = (e: React.MouseEvent<HTMLElement>, on: boolean) => {
    e.currentTarget.style.color = on ? accent : '#334155';
  };
  const MegaIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: rgba(accent, 0.16), color: accent }}
    >
      {children}
    </span>
  );
  const megaSeeAll =
    'mt-3 text-[12px] font-bold transition-opacity hover:opacity-80';
  const megaSeeAllStyle: React.CSSProperties = { color: accent };
  const megaPromo =
    'mega-card mega-card-promo rounded-2xl p-5 h-full flex flex-col justify-between text-white relative overflow-hidden';
  const megaPromoStyle: React.CSSProperties = {
    background: `linear-gradient(145deg, ${accent} 0%, ${darken(accent, 0.18)} 100%)`,
    boxShadow: `0 12px 32px ${rgba(accent, 0.35)}`,
  };

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
              <ul className="space-y-1">
                {(
                  [
                    { label: 'Migliori Smartphone 2026', max: null as number | null, accent: true },
                    { label: 'Top sotto i 100€', max: 100, accent: false },
                    { label: 'Top sotto i 200€', max: 200, accent: false },
                    { label: 'Top sotto i 300€', max: 300, accent: false },
                    { label: 'Top sotto i 400€', max: 400, accent: false },
                    { label: 'Fino a 500€', max: 500, accent: false },
                  ] as const
                ).map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      className="w-full text-left text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2 py-0.5 rounded transition-colors"
                      onClick={() => {
                        onSmartphonePriceGuide?.(item.max);
                        onClose();
                      }}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.accent ? 'bg-blue-600' : 'bg-slate-300'}`}
                      />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
              </div>
            </div>

            {/* Col 2: Featured Article — layout mega, titolo/autore interi */}
            <div className="col-span-1">
              <div className={megaCard} style={megaCardStyle}>
               <div className="flex items-center gap-2.5 mb-4">
                  <MegaIcon>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
                  </MegaIcon>
                  <span className="text-[15px] font-semibold text-slate-900 tracking-tight">In Evidenza</span>
               </div>
               {featuredArticle && (
                 <ArticleCard
                   article={featuredArticle}
                   type="mega"
                   onClick={() => onArticleClick(featuredArticle)}
                   className="!p-0 !m-0 !bg-transparent !shadow-none"
                 />
               )}
              </div>
            </div>

            {/* Col 3 & 4: community + lista che riempie il vuoto sotto i banner */}
            <div className="col-span-2 flex flex-col gap-3 h-full min-h-0">
               <a href="https://www.facebook.com/groups/Android.Italy/" target="_blank" rel="noopener noreferrer" className="relative h-[6.5rem] w-full shrink-0 rounded-2xl overflow-hidden group shadow-lg hover:shadow-xl transition-all border border-blue-100">
                  <img src="https://i.imgur.com/5czWQot.png" className="absolute inset-0 w-full h-full object-cover" alt="Background" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/60 to-transparent"></div>
                  <div className="absolute inset-0 p-4 flex items-center justify-between z-10">
                     <div>
                        <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">Community Ufficiale</span>
                        <h3 className="font-condensed text-2xl md:text-3xl font-black uppercase italic text-white leading-none mt-1 shadow-black drop-shadow-md">Android Italy</h3>
                        <p className="text-[10px] text-blue-100 font-medium">Il gruppo di supporto #1 in Italia</p>
                     </div>
                     <div className="text-right">
                        <span className="block text-xl font-black text-white">36k+</span>
                        <span className="text-[9px] uppercase font-bold text-white/80 bg-black/20 px-2 py-1 rounded-lg">Iscritti</span>
                     </div>
                  </div>
               </a>

               <a href="https://www.facebook.com/tuttoxandroidcom/?ref=embed_page" target="_blank" rel="noopener noreferrer" className="relative h-[6.5rem] w-full shrink-0 rounded-2xl overflow-hidden group shadow-lg hover:shadow-xl transition-all border border-gray-200">
                  <img src="https://i.imgur.com/GHOv30o.png" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="TuttoXAndroid Cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                  <div className="absolute inset-0 p-4 flex items-center justify-between z-10">
                     <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 bg-white rounded-full p-1 shadow-lg shrink-0 overflow-hidden">
                           <img src="https://i.imgur.com/HcqNQcO.png" className="w-full h-full object-contain" alt="Logo" />
                        </div>
                        <div className="min-w-0">
                           <h3 className="font-condensed text-xl md:text-2xl font-black uppercase text-white leading-none drop-shadow-md">TuttoXAndroid</h3>
                           <span className="text-[9px] text-gray-200 font-black uppercase tracking-widest drop-shadow-sm">Pagina Ufficiale</span>
                        </div>
                     </div>
                     <span className="bg-[#1877F2] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-[#1877F2] transition-colors shadow-lg shrink-0">
                        Segui
                     </span>
                  </div>
               </a>

               {/* Riempie lo spazio bianco sotto i banner */}
               <div className={`${megaCard} flex-1 flex flex-col min-h-0`} style={megaCardStyle}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                     <div className="flex items-center gap-2.5 min-w-0">
                        <MegaIcon>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                           </svg>
                        </MegaIcon>
                        <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Altri smartphone</h3>
                     </div>
                     <button
                        type="button"
                        onClick={() => {
                          onSmartphonePriceGuide?.(null);
                          onClose();
                        }}
                        className="text-[10px] font-black uppercase tracking-wide shrink-0 hover:underline"
                        style={{ color: accent }}
                     >
                        Vedi tutti →
                     </button>
                  </div>

                  {secondarySmartphones.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 content-start">
                      {secondarySmartphones.map((art) => (
                        <button
                          type="button"
                          key={art.id}
                          onClick={() => {
                            onArticleClick(art);
                            onClose();
                          }}
                          className="group flex gap-2.5 items-center p-2 rounded-xl text-left transition-colors border border-transparent hover:border-slate-100"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = rgba(accent, 0.06);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div className="w-11 h-11 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                            <img
                              src={art.imageUrl}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              alt=""
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-semibold leading-snug text-slate-800 line-clamp-2 group-hover:text-slate-950">
                              {art.title}
                            </h4>
                            {art.date && (
                              <span className="mt-0.5 block text-[9px] text-slate-400 font-medium">
                                {art.date}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">Nessun altro pezzo smartphone nel feed recente.</p>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <a
                      href="https://t.me/tuttoxandroid"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wide text-white bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:opacity-95 transition-opacity"
                    >
                      Telegram
                    </a>
                    <a
                      href="https://whatsapp.com/channel/0029Va7xizpJ3jv7HZbVVH3a"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wide text-white bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-95 transition-opacity"
                    >
                      WhatsApp
                    </a>
                  </div>
               </div>
            </div>
          </>
        );

      case 'Guide': {
        const guideIcon = (path: string) => (
          <MegaIcon>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
            </svg>
          </MegaIcon>
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
                <div className={megaCard} style={megaCardStyle}>
                  <div className="flex items-center gap-2.5 mb-1">
                    {guideIcon(col.path)}
                    <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">{col.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3 pl-[2.65rem] leading-snug">{col.sub}</p>
                  <ul className="space-y-0.5 border-t border-slate-100 pt-3">
                    {col.items.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          className={megaLink}
                          style={megaLinkStyle}
                          onMouseEnter={(e) => megaLinkHover(e, true)}
                          onMouseLeave={(e) => megaLinkHover(e, false)}
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className={megaSeeAll} style={megaSeeAllStyle}>
                    Vedi tutti →
                  </button>
                </div>
              </div>
            ))}

            <div className="col-span-1">
              <div className={megaPromo} style={megaPromoStyle}>
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
                  <p className="text-[12px] text-white/85 mb-4 leading-relaxed">
                    Guide avanzate per sblocco, root e custom ROM.
                  </p>
                  <ul className="space-y-2.5">
                    {['Sblocco Bootloader', 'Root con Magisk', 'Custom ROM'].map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          className="flex items-center gap-2 text-[13px] font-medium text-white/90 hover:text-white transition-colors w-full text-left"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
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
              <div className={megaCard} style={megaCardStyle}>
               <div className="flex items-center gap-2.5 mb-4">
                  <MegaIcon>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </MegaIcon>
                  <span className="text-[15px] font-semibold text-slate-900 tracking-tight">In Evidenza</span>
               </div>
               {featuredArticle && (
                 <ArticleCard
                   article={featuredArticle}
                   type="mega"
                   onClick={() => onArticleClick(featuredArticle)}
                   className="!p-0 !m-0 !bg-transparent !shadow-none"
                 />
               )}
              </div>
            </div>

            {/* Col 2: Top Brands */}
            <div className="col-span-1">
              <div className={megaCard} style={megaCardStyle}>
                 <div className="flex items-center gap-2.5 mb-4">
                   <MegaIcon>
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                   </MegaIcon>
                   <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Top Brands</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 border-t border-slate-100 pt-3">
                   {collabBrands.map(brand => (
                     <span
                       key={brand}
                       className="text-[13px] font-semibold cursor-pointer transition-colors flex items-center gap-2"
                       style={{ color: '#475569' }}
                       onMouseEnter={(e) => { e.currentTarget.style.color = accent; }}
                       onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
                     >
                       <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} /> {brand}
                     </span>
                   ))}
                 </div>
              </div>
            </div>

            {/* Col 3: Dispositivi */}
            <div className="col-span-1">
              <div className={megaCard} style={megaCardStyle}>
                 <div className="flex items-center gap-2.5 mb-4">
                   <MegaIcon>
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                   </MegaIcon>
                   <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Dispositivi</h3>
                 </div>
                 <ul className="space-y-0.5 border-t border-slate-100 pt-3">
                   {['Wearables & Smartwatch', 'Audio & Cuffie TWS', 'Tablet Android', 'Smart Home', 'Gadget Tech', 'TV Box & Stick'].map((item) => (
                     <li key={item}>
                       <button
                         type="button"
                         className={megaLink}
                         style={megaLinkStyle}
                         onMouseEnter={(e) => megaLinkHover(e, true)}
                         onMouseLeave={(e) => megaLinkHover(e, false)}
                       >
                         {item}
                       </button>
                     </li>
                   ))}
                 </ul>
              </div>
            </div>

            {/* Col 4: Promo recensioni pro */}
            <div className="col-span-1">
                <div className={`${megaPromo} p-6`} style={megaPromoStyle}>
                   <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                   <div className="relative z-10">
                      <h4 className="text-xl font-bold tracking-tight mb-2">Recensioni pro</h4>
                      <p className="text-[12px] text-white/85 leading-relaxed mb-5">
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
            {/* Col 1 & 2: Ultime Offerte */}
            <div className="col-span-2 pr-2">
              <div className={`${megaCard} h-full`} style={megaCardStyle}>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MegaIcon>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </MegaIcon>
                    <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Ultime Offerte</h3>
                  </div>
                  <span
                    className="shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-lg"
                    style={{ backgroundColor: rgba(accent, 0.12), color: accent }}
                  >
                    ≤ {maxBudgetEuro}€
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {offerArticles.length > 0 ? (
                    offerArticles.map((art) => {
                      const price = offerPriceLabel(art);
                      return (
                        <button
                          type="button"
                          key={art.id}
                          onClick={() => onArticleClick(art)}
                          className="group flex gap-2.5 items-center p-2 rounded-xl text-left transition-colors border border-transparent hover:border-slate-100"
                          style={{ backgroundColor: 'transparent' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = rgba(accent, 0.06);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div className="w-11 h-11 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                            <img
                              src={art.imageUrl}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              alt=""
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-semibold leading-snug text-slate-800 line-clamp-2 group-hover:text-slate-950">
                              {art.title}
                            </h4>
                            {price && (
                              <span
                                className="mt-1 inline-block text-[9px] font-black px-1.5 py-0.5 rounded-md"
                                style={{ backgroundColor: rgba(accent, 0.14), color: darken(accent, 0.15) }}
                              >
                                {price}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 col-span-2 py-4">
                      Nessuna offerta tech sotto i {maxBudgetEuro}€ nel feed recente.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSeeAllOffers?.();
                    onClose();
                  }}
                  className={megaSeeAll}
                  style={megaSeeAllStyle}
                >
                  Vedi tutte le offerte →
                </button>
              </div>
            </div>

            {/* Col 3: Budget — stessa card system del mega-menu */}
            <div className="col-span-1">
              <div className={`${megaCard} flex flex-col`} style={megaCardStyle}>
                <div className="flex items-center gap-2.5 mb-1">
                  <MegaIcon>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </MegaIcon>
                  <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Budget</h3>
                </div>
                <p className="text-[11px] text-slate-400 mb-5 pl-[2.65rem] leading-snug">
                  Solo smartphone e gadget tech
                </p>

                <div className="flex-1 flex flex-col justify-center">
                  <div
                    className="rounded-xl px-3 py-4 mb-4 border"
                    style={{
                      backgroundColor: rgba(accent, 0.06),
                      borderColor: rgba(accent, 0.15),
                    }}
                  >
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={priceRange}
                      onChange={(e) => setPriceRange(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        accentColor: accent,
                        background: `linear-gradient(to right, ${accent} 0%, ${accent} ${(priceRange / 4) * 100}%, ${rgba(accent, 0.2)} ${(priceRange / 4) * 100}%, ${rgba(accent, 0.2)} 100%)`,
                      }}
                      aria-label="Budget massimo"
                    />
                    <div className="flex justify-between mt-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 w-full px-0.5">
                      <span className={priceRange === 0 ? 'text-slate-800' : ''}>100€</span>
                      <span className={priceRange === 1 ? 'text-slate-800' : ''}>200€</span>
                      <span className={priceRange === 2 ? 'text-slate-800' : ''}>300€</span>
                      <span className={priceRange === 3 ? 'text-slate-800' : ''}>400€</span>
                      <span className={priceRange === 4 ? 'text-slate-800' : ''}>500€</span>
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider text-center">
                    Trova offerte sotto i
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onBudgetFilter?.(maxBudgetEuro);
                      onClose();
                    }}
                    className="w-full rounded-xl text-white text-[12px] font-black uppercase tracking-wider py-3 transition-all hover:opacity-95 hover:shadow-md active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(145deg, ${accent} 0%, ${darken(accent, 0.18)} 100%)`,
                      boxShadow: `0 8px 20px ${rgba(accent, 0.35)}`,
                    }}
                  >
                    {getPriceLabel(priceRange)}
                  </button>
                </div>
              </div>
            </div>

            {/* Col 4: Canale TG — promo coerente con megaPromo (palette Offerte, non blu “Telegram puro”) */}
            <div className="col-span-1">
              <div className={`${megaPromo} text-center items-center`} style={megaPromoStyle}>
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center flex-1 justify-center w-full">
                  <div className="w-12 h-12 rounded-full bg-white/15 border border-white/25 flex items-center justify-center mb-3 backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z" />
                    </svg>
                  </div>
                  <h4 className="font-condensed text-2xl font-black uppercase text-white tracking-tight leading-none mb-2">
                    Canale
                    <br />
                    Offerte
                  </h4>
                  <p className="text-[11px] text-white/85 leading-relaxed mb-5 max-w-[11rem]">
                    Errori di prezzo e coupon esclusivi su Telegram.
                  </p>
                  <a
                    href="https://t.me/tuttoxandroid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[11px] font-bold uppercase tracking-wider py-2.5 transition-colors"
                  >
                    Unisciti al canale →
                  </a>
                </div>
              </div>
            </div>
          </>
         );

      case 'App & Giochi':
         return (
           <>
             {/* Col 1: ULTIME APP */}
             <div className="col-span-1">
               <div className={megaCard} style={megaCardStyle}>
               <div className="flex items-center gap-2.5 mb-4">
                 <MegaIcon>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                 </MegaIcon>
                 <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Ultime App</h3>
               </div>
               <div className="space-y-2">
                 {appList.length > 0 ? (
                    appList.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => onArticleClick(art)}
                        className="flex items-center gap-3 p-1.5 rounded-xl transition-colors cursor-pointer group"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = rgba(accent, 0.1); }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                         <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border" style={{ borderColor: rgba(accent, 0.25) }}>
                            <img src={art.imageUrl} className="w-full h-full object-cover" alt={art.title} />
                         </div>
                         <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 leading-tight line-clamp-2 group-hover:underline" style={{ textDecorationColor: accent }}>{art.title}</h4>
                         </div>
                      </div>
                    ))
                 ) : (
                    <p className="text-xs" style={{ color: rgba(accent, 0.75) }}>Nessuna app recente.</p>
                 )}
               </div>
               <button type="button" className={megaSeeAll} style={megaSeeAllStyle}>
                  Vedi tutte →
               </button>
               </div>
             </div>

             {/* Col 2: ULTIMI GIOCHI */}
             <div className="col-span-1">
               <div className={megaCard} style={megaCardStyle}>
               <div className="flex items-center gap-2.5 mb-4">
                 <MegaIcon>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </MegaIcon>
                 <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Ultimi Giochi</h3>
               </div>
               <div className="space-y-2">
                 {gamesList.length > 0 ? (
                    gamesList.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => onArticleClick(art)}
                        className="flex items-center gap-3 p-1.5 rounded-xl transition-colors cursor-pointer group"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = rgba(accent, 0.1); }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                         <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border" style={{ borderColor: rgba(accent, 0.25) }}>
                            <img src={art.imageUrl} className="w-full h-full object-cover" alt={art.title} />
                         </div>
                         <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 leading-tight line-clamp-2">{art.title}</h4>
                         </div>
                      </div>
                    ))
                 ) : (
                    <p className="text-xs" style={{ color: rgba(accent, 0.75) }}>Nessun gioco recente.</p>
                 )}
               </div>
               <button type="button" className={megaSeeAll} style={megaSeeAllStyle}>
                  Vedi tutti →
               </button>
               </div>
             </div>

             {/* Col 3: Categories */}
             <div className="col-span-1">
               <div className={megaCard} style={megaCardStyle}>
                <div className="flex items-center gap-2.5 mb-4">
                  <MegaIcon>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </MegaIcon>
                  <h3 className="font-semibold text-[15px] text-slate-900 tracking-tight">Categorie</h3>
                </div>
                <ul className="space-y-0.5 border-t border-slate-100 pt-3">
                  {['Giochi Android Gratis', 'Migliori App Produttività', 'App Foto & Video', 'Personalizzazione', 'Emulatori'].map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className={megaLink}
                        style={megaLinkStyle}
                        onMouseEnter={(e) => megaLinkHover(e, true)}
                        onMouseLeave={(e) => megaLinkHover(e, false)}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
               </div>
             </div>

             {/* Col 4: Promo verde (colore App & Giochi) */}
             <div className="col-span-1">
                <div className={`${megaPromo} p-6 justify-center`} style={megaPromoStyle}>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                   <h4 className="text-xl font-bold tracking-tight mb-2 relative z-10">Google Play Pass</h4>
                   <p className="text-[12px] font-medium text-white/90 mb-5 relative z-10 leading-relaxed">
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
        const topViewed = sourceArticles.slice(0, 5);

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
                 {featuredArticle && (
                   <ArticleCard
                     article={featuredArticle}
                     type="mega"
                     onClick={() => onArticleClick(featuredArticle)}
                     className="!p-0 !m-0 !bg-transparent !shadow-none mb-4"
                   />
                 )}
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
                 {featuredArticle && (
                   <ArticleCard
                     article={featuredArticle}
                     type="mega"
                     onClick={() => onArticleClick(featuredArticle)}
                     className="!p-0 !m-0 !bg-transparent !shadow-none"
                   />
                 )}
               </div>
            </div>
          </>
        );
    }
  };

  return (
    <div
      className="mega-menu absolute left-0 top-full w-full z-[80] animate-in fade-in slide-in-from-top-1 duration-200"
      style={{ backgroundColor: '#ffffff' }}
      onMouseLeave={onClose}
    >
      {/* barra = colore categoria (come underline del nav) */}
      <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: accent }} />
      {/* Blocco pieno opaco con leggera tinta del colore categoria */}
      <div
        className="mega-menu-panel border-b"
        style={{
          background: `linear-gradient(180deg, #ffffff 0%, ${rgba(accent, 0.07)} 100%)`,
          borderColor: rgba(accent, 0.18),
          boxShadow: '0 20px 48px rgba(15, 23, 42, 0.14)',
        }}
      >
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
