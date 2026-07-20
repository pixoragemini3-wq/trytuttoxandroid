
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_ARTICLES, MOCK_DEALS, NAV_CATEGORIES, LOGO_URL, CATEGORY_COLORS } from './constants';
import ArticleCard from './components/ArticleCard';
import { Article, Deal } from './types';
import {
  fetchBloggerPosts,
  fetchBloggerDeals,
  fetchArticleByUrl,
  resolveAuthorImageUrl,
  hydrateArticle,
  filterBudgetTechOffers,
  isTechDealArticle,
  isNonTechOfferNoise,
} from './services/bloggerService';
import { isInAppBrowser } from './utils/browser';
import SocialSidebar from './components/SocialSidebar';
import SocialSection from './components/SocialSection';
// TopStoriesMobile removed here, moved to Layout
import SocialBannerMobile from './components/SocialBannerMobile';
import ArticleDetail from './components/ArticleDetail';

import DesktopSidebar from './components/DesktopSidebar'; 
import { AboutPage, CollabPage, PrivacyPage } from './components/StaticPages'; 
import GPSCalculator from './components/gps/GPSCalculator';
import Layout from './components/Layout';
import NewsletterForm from './components/NewsletterForm';
import DealImage from './components/DealImage';

// Utility per mescolare l'array (Fisher-Yates shuffle)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const App: React.FC = () => {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Routing Hooks
  const location = useLocation();
  const navigate = useNavigate();

  // Layout State
  const [layoutConfig] = useState({
    showTicker: true,
    boxedLayout: false,
    fixedSidebar: true,
    showFooterSocial: true
  });

  const [articles, setArticles] = useState<Article[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Tutti');
  /** Filtro budget Offerte (prezzo estratto dai post). null = nessun tetto. */
  const [maxBudgetEuro, setMaxBudgetEuro] = useState<number | null>(null);
  
  // Split loading states to prevent blocking UI
  const [isArticlesLoading, setIsArticlesLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  
  // Animation Direction State for Swipe Effect
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  
  // Pagination
  const [visibleNewsCount, setVisibleNewsCount] = useState(6);
  const [hasMoreToFetch, setHasMoreToFetch] = useState(true);
  const [nextStartIndex, setNextStartIndex] = useState(1);
  
  // Sticky Banner
  const [showStickyBanner, setShowStickyBanner] = useState(false);
  const staticBannerRef = useRef<HTMLDivElement>(null);

  // Scroll To Top
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Spotlight cascade — state in App so nested remounts / scroll re-renders don't close it
  const [spotlightExpandedCol, setSpotlightExpandedCol] = useState<'col1' | 'col2' | null>(null);
  const spotlightCascadeRef = useRef<HTMLDivElement>(null);
  const cascadeHScrollRef = useRef<HTMLDivElement>(null);

  const scrollCascadeHorizontal = (direction: 'left' | 'right') => {
    const el = cascadeHScrollRef.current;
    if (!el) return;
    // Una riga di card ~160px: scorri di ~3 card
    const step = Math.min(480, Math.max(320, el.clientWidth * 0.7));
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  };
  
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const newsSectionRef = useRef<HTMLDivElement>(null);

  // Swipe Logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null); 

  // Drag Scroll (Featured)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const topStories = articles.length > 0 ? articles.slice(0, 8) : MOCK_ARTICLES.slice(0, 8);
  
  // Full Category List for Indexing
  const ALL_CATEGORIES = ['Tutti', ...NAV_CATEGORIES];

  // --- ROUTER LOGIC ---
  useEffect(() => {
    // Ensure canonical URL is clean (no trailing slash except root)
    // Redirect trailing slashes (except for root) to non-trailing versions
    if (location.pathname !== '/' && location.pathname.endsWith('/')) {
      navigate(location.pathname.slice(0, -1), { replace: true });
    }
  }, [location.pathname, navigate]);

  const isAbout = location.pathname === '/about';
  const isCollab = location.pathname === '/collab';
  const isPrivacy = location.pathname === '/privacy';
  const isGPS = location.pathname === '/calcolatore-gps';
  const isArticle = location.pathname.endsWith('.html') || location.pathname.startsWith('/article/');
  const isSearch = location.pathname === '/search';
  const isHome = !isAbout && !isCollab && !isPrivacy && !isArticle && !isSearch && !isGPS;
  /** Pagina post Blogger: navigate() SPA non esce dalla .html → serve location.assign */
  const isOnArticlePage = isArticle;

  const enrichArticle = (article: Article): Article => {
    const hydrated = hydrateArticle(article);
    return {
      ...hydrated,
      authorImageUrl: resolveAuthorImageUrl(hydrated.author, hydrated.authorImageUrl),
    };
  };

  // Function to extract the current article based on URL
  const getCurrentArticle = () => {
    if (!isArticle) return undefined;

    const currentPath = decodeURIComponent(location.pathname).replace(/\/$/, '');

    const injectedPost = (window as any).currentSinglePost as Article | null;
    if (injectedPost && currentPath.endsWith('.html')) {
      try {
        const injectedPath = new URL(injectedPost.url).pathname.replace(/\/$/, '');
        if (injectedPath === currentPath) {
          return enrichArticle(injectedPost);
        }
      } catch (e) { /* fall through */ }
    }

    // Legacy ID support
    if (location.pathname.startsWith('/article/')) {
      const parts = location.pathname.split('/');
      const id = parts[parts.length - 1];
      const sourceArticles = articles.length > 0 ? articles : MOCK_ARTICLES;
      const foundById = sourceArticles.find(a => a.id === id);
      if (foundById) return enrichArticle(foundById);
    }

    // Permalink support
    const found = articles.find(a => {
      if (!a.url) return false;
      try {
        const aPath = new URL(a.url).pathname.replace(/\/$/, '');
        return aPath === currentPath;
      } catch (e) { return false; }
    });
    return found ? enrichArticle(found) : undefined;
  };

  const currentArticle = getCurrentArticle();

  /**
   * LEGGI ANCHE: stessa categoria prevalente (~60%), ma mai esclusiva.
   * Inserisce altre sezioni (diverse tra loro) così l'utente scopre il sito.
   */
  const getShuffledRelatedArticles = (current: Article | undefined, limit = 10) => {
    if (!current || articles.length === 0) return [];
    const candidates = articles.filter((a) => a.id !== current.id);
    const same = shuffleArray(candidates.filter((a) => a.category === current.category));
    const othersRaw = shuffleArray(candidates.filter((a) => a.category !== current.category));

    // Altre categorie: round-robin per varietà (non 4 volte la stessa)
    const byCat = new Map<string, Article[]>();
    for (const a of othersRaw) {
      const list = byCat.get(a.category) || [];
      list.push(a);
      byCat.set(a.category, list);
    }
    const queues = [...byCat.values()];
    const diverseOthers: Article[] = [];
    let qi = 0;
    while (diverseOthers.length < othersRaw.length && queues.some((q) => q.length > 0)) {
      const q = queues[qi % queues.length];
      if (q.length) diverseOthers.push(q.shift()!);
      qi++;
    }

    // ~60% stessa cat., almeno 2–3 altre sezioni se disponibili
    const minOther = Math.min(diverseOthers.length, limit >= 8 ? 3 : 2);
    let takeSame = Math.min(same.length, Math.ceil(limit * 0.6));
    let takeOther = Math.min(diverseOthers.length, Math.max(minOther, limit - takeSame));
    takeSame = Math.min(same.length, limit - takeOther);
    if (takeSame + takeOther < limit) {
      takeOther = Math.min(diverseOthers.length, limit - takeSame);
      takeSame = Math.min(same.length, limit - takeOther);
    }

    const pickedSame = same.slice(0, takeSame);
    const pickedOther = diverseOthers.slice(0, takeOther);

    // Interleave 2 same + 1 other (maggioranza stessa cat., altre visibili in lista)
    const result: Article[] = [];
    let si = 0;
    let oi = 0;
    while (result.length < limit && (si < pickedSame.length || oi < pickedOther.length)) {
      if (si < pickedSame.length) result.push(pickedSame[si++]);
      if (result.length >= limit) break;
      if (si < pickedSame.length) result.push(pickedSame[si++]);
      if (result.length >= limit) break;
      if (oi < pickedOther.length) result.push(pickedOther[oi++]);
      else if (si < pickedSame.length) result.push(pickedSame[si++]);
      else break;
    }
    while (result.length < limit && oi < pickedOther.length) result.push(pickedOther[oi++]);
    while (result.length < limit && si < pickedSame.length) result.push(pickedSame[si++]);
    return result;
  };

  const shuffledMoreArticles = useMemo(() => {
    return getShuffledRelatedArticles(currentArticle);
  }, [currentArticle?.id, articles]);

  // Google Analytics Page View Tracking
  useEffect(() => {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('config', 'G-QEJMHS6TCJ', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location.pathname, location.search]);

  // --- BASIC DYNAMIC SEO for category / search / home list pages ---
  useEffect(() => {
    let pageTitle = 'TuttoXAndroid — News Android, Smartphone, App e Offerte Tech';
    let desc = 'TuttoXAndroid: le ultime news su Android, smartphone, app, guide e le migliori offerte tech selezionate ogni giorno. Il portale di riferimento per la community Android italiana.';

    if (isSearch && searchQuery) {
      pageTitle = `Risultati per "${searchQuery}" | TuttoXAndroid`;
      desc = `Risultati della ricerca per "${searchQuery}" su TuttoXAndroid.`;
    } else if (activeCategory && activeCategory !== 'Tutti') {
      pageTitle = `${activeCategory} | TuttoXAndroid`;
      desc = `Tutte le notizie e gli articoli nella categoria ${activeCategory} su TuttoXAndroid.`;
    }

    document.title = pageTitle;

    const metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (metaDesc) metaDesc.content = desc;

    const setMeta = (propOrName: string, val: string) => {
      const isOgOrTw = propOrName.includes(':');
      const selector = isOgOrTw ? `meta[property="${propOrName}"]` : `meta[name="${propOrName}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (el) el.content = val;
    };
    setMeta('og:title', pageTitle);
    setMeta('og:description', desc);
    setMeta('twitter:title', pageTitle);
    setMeta('twitter:description', desc);
  }, [activeCategory, searchQuery, isSearch]);

  // Load Content - SEPARATED FETCHING
  useEffect(() => {
    const init = async () => {
      // 1. Fetch Articles FIRST (Critical for UI)
      setIsArticlesLoading(true);
      try {
         const posts = await fetchBloggerPosts();
         const finalPosts = posts.length > 0 ? posts : MOCK_ARTICLES;
         setArticles(finalPosts);
         setFilteredArticles(finalPosts);
      } catch (e) {
         setArticles(MOCK_ARTICLES);
         setFilteredArticles(MOCK_ARTICLES);
      } finally {
         setIsArticlesLoading(false);
      }

      // 2. Fetch Deals SECOND (Background - doesn't block UI)
      // Prefer real Telegram channel offers, then Blogger. No mock products.
      try {
         const dealsData = await fetchBloggerDeals();
         setDeals(dealsData.length > 0 ? dealsData : []);
      } catch (e) {
         setDeals([]);
      }
    };

    init();

    // Ricarica offerte Telegram ogni 10 minuti (canale aggiornato in tempo reale)
    const dealsInterval = window.setInterval(async () => {
      try {
        try {
          sessionStorage.removeItem('txa_telegram_deals');
          sessionStorage.removeItem('txa_telegram_deals_time');
          sessionStorage.removeItem('txa_telegram_deals_v2');
          sessionStorage.removeItem('txa_telegram_deals_v2_time');
          sessionStorage.removeItem('txa_telegram_deals_v3');
          sessionStorage.removeItem('txa_telegram_deals_v3_time');
          sessionStorage.removeItem('txa_telegram_deals_v4');
          sessionStorage.removeItem('txa_telegram_deals_v4_time');
        } catch { /* private mode */ }
        const dealsData = await fetchBloggerDeals();
        if (dealsData.length > 0) setDeals(dealsData);
      } catch { /* ignore */ }
    }, 10 * 60 * 1000);

    return () => window.clearInterval(dealsInterval);
  }, []);

  // Pulisce l'injection SSR quando l'URL cambia (fix browser Facebook / navigazione SPA)
  useEffect(() => {
    const injected = (window as any).currentSinglePost as Article | null;
    if (!injected || !location.pathname.endsWith('.html')) return;
    try {
      const injectedPath = new URL(injected.url).pathname.replace(/\/$/, '');
      const currentPath = decodeURIComponent(location.pathname).replace(/\/$/, '');
      if (injectedPath !== currentPath) {
        (window as any).currentSinglePost = null;
      }
    } catch {
      (window as any).currentSinglePost = null;
    }
  }, [location.pathname]);

  // EFFECT: Handle Direct URL Access (Deep Linking) for Old Articles
  useEffect(() => {
    const handleDeepLink = async () => {
      const path = location.pathname;
      // Check if it looks like a blog post URL (ends in .html) and we don't have the article
      if (path.endsWith('.html') && !currentArticle && !isResolvingUrl) {
        setIsResolvingUrl(true);
        try {
           const found = await fetchArticleByUrl(path);
           if (found) {
             // Also add to articles list to prevent re-fetching if navigating back
             setArticles(prev => {
                if (prev.find(a => a.id === found.id)) return prev;
                return [found, ...prev];
             });
           }
        } catch (e) {
           console.error("Failed to resolve deep link", e);
        } finally {
           setIsResolvingUrl(false);
        }
      }
    };
    
    if (articles.length > 0 || isArticlesLoading === false) {
        handleDeepLink();
    }
  }, [location.pathname, currentArticle, articles.length, isArticlesLoading]);

  // Scroll handlers — only setState when value changes (avoids remount thrash)
  useEffect(() => {
    const handleScroll = () => {
      if (staticBannerRef.current) {
        const nextSticky = staticBannerRef.current.getBoundingClientRect().bottom < 0;
        setShowStickyBanner((prev) => (prev === nextSticky ? prev : nextSticky));
      }
      const nextTop = window.scrollY > 500;
      setShowScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (featuredScrollRef.current) {
      const scrollAmount = featuredScrollRef.current.clientWidth * 0.6;
      featuredScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Drag Scroll Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!featuredScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - featuredScrollRef.current.offsetLeft);
    setScrollLeft(featuredScrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !featuredScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - featuredScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    featuredScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // --- SWIPE HANDLERS FOR CATEGORY NAVIGATION ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY); 
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    const currentY = e.targetTouches[0].clientY;
    if (touchStartY !== null && Math.abs(currentY - touchStartY) > 50) {
        setTouchStart(null); 
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    
    const isLeftSwipe = distance > 70;  
    const isRightSwipe = distance < -70;
    
    const currentIndex = ALL_CATEGORIES.indexOf(activeCategory);

    if (isLeftSwipe) {
      // Swipe Left -> Next Category
      if (currentIndex < ALL_CATEGORIES.length - 1) {
        handleNavClick(ALL_CATEGORIES[currentIndex + 1]);
      }
    } else if (isRightSwipe) {
      // Swipe Right -> Previous Category
      if (currentIndex > 0) {
        handleNavClick(ALL_CATEGORIES[currentIndex - 1]);
      }
    }
  };

  const handleArticleClick = (article: Article) => {
    setIsDragging(false);
    if (isDragging) return;
    if (article.category === 'Offerte' && article.dealData?.link) {
       window.open(article.dealData.link, '_blank');
       return;
    }
    setActiveMegaMenu(null);

    // Track article views for Telegram popup (show after 2+)
    const count = parseInt(localStorage.getItem('articleViewCount') || '0', 10);
    localStorage.setItem('articleViewCount', String(count + 1));

    (window as any).currentSinglePost = null;

    if (article.url) {
      try {
        const path = new URL(article.url).pathname;
        if (isInAppBrowser()) {
          window.location.assign(path);
          return;
        }
        navigate(path);
      } catch (e) {
        if (isInAppBrowser()) {
          window.location.assign(`/article/${article.id}`);
          return;
        }
        navigate(`/article/${article.id}`);
      }
    } else {
      if (isInAppBrowser()) {
        window.location.assign(`/article/${article.id}`);
        return;
      }
      navigate(`/article/${article.id}`);
    }

    window.scrollTo(0, 0);
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setIsSearchVisible(false);
    
    // Reset pagination
    setVisibleNewsCount(6);
    setNextStartIndex(1);
    setHasMoreToFetch(true);

    if (location.pathname !== '/search') {
      navigate('/search');
    }

    try {
      const results = await fetchBloggerPosts(undefined, searchQuery, 1);
      setFilteredArticles(results);
      if (results.length < 50) setHasMoreToFetch(false);
      else setNextStartIndex(51);
    } catch (e) {
      console.error("Search failed", e);
      setFilteredArticles([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavClick = async (nav: string) => {
    // Da articolo Blogger: hard reload home (+ categoria). navigate() SPA resta sulla .html
    if (isOnArticlePage) {
      try {
        (window as any).currentSinglePost = null;
      } catch { /* */ }
      const dest =
        nav && nav !== 'Tutti'
          ? `${window.location.origin}/?cat=${encodeURIComponent(nav)}`
          : `${window.location.origin}/`;
      window.location.assign(dest);
      return;
    }

    const currentIndex = ALL_CATEGORIES.indexOf(activeCategory);
    const newIndex = ALL_CATEGORIES.indexOf(nav);
    
    if (newIndex > currentIndex) {
      setSlideDirection('right'); 
    } else {
      setSlideDirection('left'); 
    }

    setActiveCategory(nav);
    if (nav !== 'Offerte') setMaxBudgetEuro(null);
    setVisibleNewsCount(6); 
    setNextStartIndex(1);
    setHasMoreToFetch(true);
    setIsMobileMenuOpen(false);
    
    // If it's a specific category, we might want to fetch it specifically to get more than what's in the initial 150
    if (nav !== 'Tutti') {
       setIsArticlesLoading(true);
       try {
          const catPosts = await fetchBloggerPosts(nav as any, undefined, 1);
          const finalCatPosts = catPosts;

          setArticles(prev => {
             // Merge and remove duplicates
             const existingIds = new Set(prev.map(a => a.id));
             const newPosts = finalCatPosts.filter(p => !existingIds.has(p.id));
             return [...prev, ...newPosts];
          });
          
          if (finalCatPosts.length < 50) setHasMoreToFetch(false);
          else setNextStartIndex(finalCatPosts.length + 1);
       } catch(e) {
          console.error("Failed to fetch category posts", e);
       } finally {
          setIsArticlesLoading(false);
       }
    } else {
       // Reset for 'Tutti'
       setNextStartIndex(articles.length + 1);
    }

    // Scroll to news section
    setTimeout(() => {
        newsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    if (!isHome) {
      navigate('/');
    }
  };

  const handleFooterLinkClick = (path: '/about' | '/collab' | '/privacy' | '/') => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const goToHome = () => {
    try {
      (window as any).currentSinglePost = null;
    } catch { /* */ }
    setSearchQuery('');
    setActiveCategory('Tutti');
    setMaxBudgetEuro(null);
    setVisibleNewsCount(6);
    setFilteredArticles(articles);

    const path = window.location.pathname || '';
    // Hard nav se siamo su un post Blogger (anche se React Router non lo classifica come articolo)
    const mustHardNav =
      isOnArticlePage ||
      path.endsWith('.html') ||
      path.startsWith('/article/') ||
      /\/\d{4}\/\d{2}\//.test(path);

    if (mustHardNav) {
      window.location.assign(`${window.location.origin}/`);
      return;
    }
    navigate('/');
    window.scrollTo(0, 0);
  };

  // Home caricata da articolo con ?cat=Smartphone → attiva la categoria
  useEffect(() => {
    if (!isHome) return;
    try {
      const params = new URLSearchParams(location.search);
      const cat = params.get('cat');
      if (!cat) return;
      const match = ALL_CATEGORIES.find(
        (c) => c.toLowerCase() === cat.toLowerCase().trim()
      );
      if (match && match !== 'Tutti') {
        setActiveCategory(match);
        // Pulisci query senza ricaricare
        navigate('/', { replace: true });
        setTimeout(() => {
          newsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome, location.search]);

  const loadMoreNews = async () => {
    const currentDisplayCount = displayArticles.length;
    
    // If we still have local articles to show, just increment the count
    if (visibleNewsCount < currentDisplayCount) {
      setVisibleNewsCount(prev => prev + 6);
      return;
    }

    // If we reached the end of local articles and we think there's more on the server
    if (hasMoreToFetch) {
      setIsArticlesLoading(true);
      try {
        const categoryToFetch = isSearch
          ? undefined
          : (activeCategory === 'Tutti' ? undefined : activeCategory);

        const morePosts = await fetchBloggerPosts(
          categoryToFetch as any,
          isSearch ? searchQuery : undefined,
          nextStartIndex
        );

        if (morePosts.length === 0) {
          setHasMoreToFetch(false);
        } else {
          if (isSearch) {
            setFilteredArticles(prev => [...prev, ...morePosts]);
            setNextStartIndex(prev => prev + 50);
          } else {
            setArticles(prev => {
              const existingIds = new Set(prev.map(a => a.id));
              const newPosts = morePosts.filter(p => !existingIds.has(p.id));
              return [...prev, ...newPosts];
            });
            setNextStartIndex(prev => prev + (activeCategory === 'Tutti' ? 150 : 100));
          }
          setVisibleNewsCount(prev => prev + 6);
          if (morePosts.length < (isSearch ? 50 : (activeCategory === 'Tutti' ? 150 : 100))) {
            setHasMoreToFetch(false);
          }
        }
      } catch (e) {
        console.error("Failed to load more posts", e);
        setHasMoreToFetch(false);
      } finally {
        setIsArticlesLoading(false);
      }
    }
  };

  const getHeroArticle = (): Article | undefined => {
    const featured = articles.find(a => a.featured === true);
    if (featured) return { ...featured, type: 'hero' };
    return articles.length > 0 ? { ...articles[0], type: 'hero' } : undefined;
  };

  const heroArticle = getHeroArticle();

  const featuredCarouselArticles = (() => {
    const pool = articles.length > 0 ? articles : MOCK_ARTICLES;
    const withoutHero = heroArticle ? pool.filter((a) => a.id !== heroArticle.id) : pool;
    return withoutHero.slice(0, 10);
  })();
  
  const getDisplayArticles = () => {
    let list = articles;
    const target = activeCategory.toLowerCase().trim();

    if (activeCategory === 'Tutti' && heroArticle) {
       list = list.filter(a => a.id !== heroArticle.id);
    }
    
    if (activeCategory !== 'Tutti') {
      let target = activeCategory.toLowerCase().trim();
      if (target === 'recensione') target = 'recensioni';
      if (target === 'offerta') target = 'offerte';
      if (target === 'guida') target = 'guide';

      const categoryKeywords: Record<string, string[]> = {
        'smartphone': ['smartphone', 'cellulare', 'telefono', 'samsung', 'xiaomi', 'redmi', 'poco', 'pixel', 'oneplus', 'oppo', 'realme', 'honor', 'motorola', 'asus', 'sony', 'nothing', 'vivo', 'iphone', 'android', 'aukey', 'blackview', 'cubot', 'ezviz', 'leagoo', 'lefant', 'spigen', 'teclast', 'ugoos', 'ulefone'],
        'news': ['news', 'notizie', 'novità', 'aggiornamento', 'leaks', 'rumors', 'anteprima', 'tech', 'tecnologia', 'android', 'google'],
        // Solo etichette forti: "test"/"analisi" nel titolo matchano news tipo "Apple testa…"
        'recensioni': ['recensioni', 'recensione', 'review'],
        'guide': ['guide', 'guida', 'tutorial', 'come fare', 'how to', 'soluzione', 'problemi', 'trucchi', 'tips', 'impostare', 'nascondere'],
        'offerte': ['offerte', 'offerta', 'offerteimperdibili'],
        'app & giochi': ['app', 'applicazione', 'giochi', 'game', 'play store', 'apk', 'whatsapp', 'instagram', 'telegram', 'facebook', 'tiktok'],
        'modding': ['modding', 'root', 'rom', 'custom rom', 'bootloader', 'recovery', 'magisk', 'adb', 'fastboot', 'kernel'],
        'wearable': ['wearable', 'smartwatch', 'smartband', 'cuffie', 'auricolari', 'tws', 'watch', 'fitbit', 'garmin', 'amazfit', 'galaxy watch', 'pixel watch', 'apple watch']
      };

      list = list.filter(a => {
        const articleTags = (a.tags || []).map(t => t.toLowerCase().trim());
        const articleCategory = (a.category || '').toLowerCase().trim();

        // Offerte: solo deal tech (smartphone/gadget). Niente auto, tasse, moda con un €.
        if (target === 'offerte') {
          if (isNonTechOfferNoise(a)) return false;
          if (isTechDealArticle(a)) return true;
          if (
            (articleCategory === 'offerte' ||
              articleTags.some((t) => t === 'offerte' || t === 'offerteimperdibili')) &&
            !isNonTechOfferNoise(a)
          ) {
            // Etichetta Blogger Offerte: tieni solo se c’è contesto tech
            return isTechDealArticle({ ...a, category: 'Offerte' });
          }
          return false;
        }
        
        if (articleCategory === target) return true;
        if (articleTags.includes(target)) return true;

        const labelAliases: Record<string, string[]> = {
          'recensioni': ['recensioni', 'recensione', 'review'],
          'guide': ['guide', 'guida', 'tutorial'],
          'app & giochi': ['app', 'giochi'],
        };
        const aliases = labelAliases[target];
        if (aliases?.some((alias) => articleTags.includes(alias) || articleCategory === alias)) return true;
        
        if (target === 'app & giochi') {
             if (articleTags.some(t => t.includes('app') || t.includes('giochi') || t.includes('game'))) return true;
             if (articleCategory.includes('app') || articleCategory.includes('giochi')) return true;
        }

        // Smartphone: match su titolo (Galaxy, Pixel…) oltre a tag/categoria
        if (target === 'smartphone') {
          const hay = `${a.title} ${a.excerpt || ''}`.toLowerCase();
          if (/\b(galaxy|pixel|iphone|xiaomi|redmi|poco|oneplus|smartphone|honor|realme|motorola|nothing)\b/i.test(hay)) {
            return true;
          }
        }

        // Recensioni: solo titolo/excerpt con segnale esplicito (no "testa", "analisi generica")
        if (target === 'recensioni') {
          const hay = `${a.title} ${a.excerpt || ''}`.toLowerCase();
          if (
            /\brecension[ei]\b|\breview\b|\bprova\s+(?:completa|del|della|di)\b|\bhands[\s-]?on\b/i.test(
              hay
            )
          ) {
            return true;
          }
          return false;
        }

        const keywords = categoryKeywords[target];
        if (keywords) {
           const hasKeywordMatch = keywords.some(k => 
             articleTags.some(t => t.includes(k)) || articleCategory.includes(k)
           );
           if (hasKeywordMatch) return true;
           // Titolo: solo smartphone/guide (recensioni gestite sopra, più strict)
           if (target === 'smartphone' || target === 'guide') {
             const hay = `${a.title} ${a.excerpt || ''}`.toLowerCase();
             if (keywords.some((k) => k.length >= 4 && hay.includes(k))) return true;
           }
        }

        return false;
      });

      // Budget: solo smartphone/gadget tech con prezzo ≤ soglia (no filler non-tech)
      if (target === 'offerte' && maxBudgetEuro != null) {
        list = filterBudgetTechOffers(list, maxBudgetEuro);
      }
    }
    return list;
  };
  
  const displayArticles = isSearch ? filteredArticles : getDisplayArticles();

  const handleBudgetFilter = (maxEuro: number) => {
    setMaxBudgetEuro(maxEuro);
    void handleNavClick('Offerte');
  };

  const handleSeeAllOffers = () => {
    setMaxBudgetEuro(null);
    void handleNavClick('Offerte');
  };

  const handleDealClick = (deal: Deal, location: string) => {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'select_promotion', {
        creative_name: deal.product,
        creative_slot: location,
        promotion_id: deal.id,
        promotion_name: 'daily_deals'
      });
    }
  };

  /** Parse prezzo deal (es. "69,00€") per filtro budget. */
  const parseDealPriceEuro = (raw: string | undefined): number | null => {
    if (!raw) return null;
    const s = String(raw).replace(/[€\s]/g, '').replace(/euro|eur/gi, '').trim();
    if (!s) return null;
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) {
      const n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(n) ? Math.round(n) : null;
    }
    if (/^\d+[.,]\d{1,2}$/.test(s)) {
      const n = parseFloat(s.replace(',', '.'));
      return Number.isFinite(n) ? Math.round(n) : null;
    }
    const n = parseFloat(s.replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  /**
   * Banner deal compatto (scroll orizzontale).
   * Usato a metà pagina solo con filtro budget Offerte — niente griglia 8 card gigante.
   */
  const DealsSection = ({
    compact = true,
    maxEuro = null as number | null,
  }: {
    compact?: boolean;
    maxEuro?: number | null;
  }) => {
    let pool = deals;
    if (maxEuro != null && maxEuro > 0) {
      const under = deals.filter((d) => {
        const p = parseDealPriceEuro(d.newPrice);
        return p != null && p > 0 && p <= maxEuro;
      });
      pool = under.length > 0 ? under : deals;
    }
    const dealCards = pool.slice(0, compact ? 8 : 4);

    if (dealCards.length === 0) return null;

    const dealCard = (deal: typeof deals[0]) => (
      <a
        key={deal.id}
        href={deal.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleDealClick(deal, 'home_deals')}
        className="txa-deal-card shrink-0 w-[132px] sm:w-[140px] snap-start bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-md flex flex-col gap-1.5 p-2 hover:bg-black/55 hover:border-yellow-400/40 transition-all"
        style={{ color: '#ffffff' }}
      >
        <div className="w-full shrink-0 bg-white rounded-lg p-1 flex items-center justify-center h-12">
          <DealImage
            src={deal.imageUrl}
            link={deal.link}
            alt={deal.product}
            className="max-w-full max-h-full object-contain mix-blend-multiply"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <h4
            className="txa-deal-title font-bold leading-snug text-[10px] line-clamp-2 mb-0.5"
            style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
          >
            {deal.product}
          </h4>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span
              className="txa-deal-price font-black tracking-tight text-xs"
              style={{ color: '#fde047', WebkitTextFillColor: '#fde047' }}
            >
              {deal.newPrice}
            </span>
            {deal.oldPrice && (
              <span
                className="txa-deal-old-price text-[9px] font-bold line-through"
                style={{ color: 'rgba(255,255,255,0.75)', WebkitTextFillColor: 'rgba(255,255,255,0.75)' }}
              >
                {deal.oldPrice}
              </span>
            )}
          </div>
        </div>
      </a>
    );

    return (
      <section
        className="txa-deals-banner py-2.5 lg:py-3 bg-gradient-to-r from-gray-900 via-gray-900 to-[#e31b23] rounded-xl lg:rounded-2xl mx-0 overflow-hidden shadow-lg relative border-t-2 border-[#e31b23] mb-4 animate-in fade-in slide-in-from-bottom-2 duration-400"
        style={{ color: '#ffffff' }}
      >
        <style>{`
          .txa-deals-banner,.txa-deals-banner h2,.txa-deals-banner h4,
          .txa-deals-banner span,.txa-deals-banner a:not(.txa-deal-cta-light),
          .txa-deals-banner .txa-deal-title{
            color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;
          }
          .txa-deals-banner .txa-deals-banner-title{
            color:#e8ff00!important;-webkit-text-fill-color:#e8ff00!important;
            text-shadow:0 0 10px rgba(232,255,0,.35),0 1px 2px rgba(0,0,0,.35)!important;
          }
          .txa-deals-banner .txa-deal-price{color:#fde047!important;-webkit-text-fill-color:#fde047!important;}
          .txa-deals-banner .txa-deal-old-price{color:rgba(255,255,255,.75)!important;-webkit-text-fill-color:rgba(255,255,255,.75)!important;}
          .txa-deals-banner .txa-deal-hot{color:#b91c1c!important;-webkit-text-fill-color:#b91c1c!important;}
          .txa-deals-scroll{-webkit-overflow-scrolling:touch;scrollbar-width:none;}
          .txa-deals-scroll::-webkit-scrollbar{display:none;}
        `}</style>

        <div className="px-3 lg:px-4 relative z-10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="txa-deals-banner-title font-condensed text-base sm:text-lg font-black uppercase tracking-tight italic leading-none">
                Offerte del Giorno
              </h2>
              {maxEuro != null && (
                <span className="shrink-0 text-[9px] font-black uppercase tracking-wide bg-yellow-400/20 text-yellow-200 border border-yellow-400/30 px-1.5 py-0.5 rounded">
                  ≤ {maxEuro}€
                </span>
              )}
              <span
                className="txa-deal-hot hidden sm:inline bg-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0"
                style={{ color: '#b91c1c', WebkitTextFillColor: '#b91c1c' }}
              >
                HOT
              </span>
            </div>

            <a
              href="https://t.me/tuttoxandroid"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 bg-[#24A1DE] hover:bg-white/90 pl-1 pr-2 py-0.5 rounded-full transition-all group shadow border border-white/20"
              aria-label="Canale Telegram offerte"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-0.5 shrink-0">
                <img src="https://i.imgur.com/Ux19qMB.png" className="w-full h-full object-cover rounded-full" alt="" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: '#ffffff' }}>
                TG
              </span>
            </a>
          </div>

          {/* Una sola riga compatta, scroll orizzontale (mobile + desktop) */}
          <div className="txa-deals-scroll flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory">
            {dealCards.map((deal) => dealCard(deal))}
          </div>
        </div>
      </section>
    );
  };

  const SmartphoneShowcase = () => (
    <div className="w-full mb-10 animate-in fade-in slide-in-from-right duration-500">
      <div className="bg-[#c0ff8c] border-y-2 border-black/5 py-4 mb-6 overflow-x-auto no-scrollbar shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center min-w-max gap-12 md:gap-0">
            {['SAMSUNG', 'XIAOMI', 'PIXEL', 'ONEPLUS', 'MOTOROLA', 'REALME', 'SONY', 'NOTHING', 'HONOR'].map(brand => (
              <button 
                key={brand} 
                onClick={() => { 
                  setSearchQuery(brand); 
                  handleSearchSubmit({ preventDefault: () => {} } as any);
                  if (typeof (window as any).gtag === 'function') {
                    (window as any).gtag('event', 'search', { search_term: brand });
                  }
                }}
                className="text-black font-black text-sm md:text-xl uppercase tracking-widest cursor-pointer hover:underline decoration-4 underline-offset-4 decoration-black/20 hover:scale-110 transition-all"
              >
                {brand}
              </button>
            ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="https://www.facebook.com/groups/Android.Italy/" target="_blank" rel="noopener noreferrer" className="relative h-48 md:h-60 rounded-[2rem] overflow-hidden group shadow-xl transition-all hover:scale-[1.01]">
            <img src="https://i.imgur.com/5czWQot.png" className="absolute inset-0 w-full h-full object-cover" alt="Background" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-600/70 mix-blend-multiply"></div>
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
               <div className="flex justify-between items-start">
                  <span className="bg-white/20 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/10 backdrop-blur-sm">Community Ufficiale</span>
               </div>
               <div className="flex flex-col items-center text-center">
                   <h3 className="font-condensed text-5xl md:text-6xl font-black uppercase italic leading-none text-white drop-shadow-lg transform -skew-x-6">ANDROID<br/>ITALY</h3>
               </div>
               <div className="flex items-center justify-center">
                   <span className="bg-white text-blue-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-lg">Unisciti al Gruppo &rarr;</span>
               </div>
            </div>
         </a>
         <a href="https://www.facebook.com/tuttoxandroidcom/?ref=embed_page" target="_blank" rel="noopener noreferrer" className="relative h-48 md:h-60 rounded-[2rem] overflow-hidden group shadow-xl transition-all hover:scale-[1.01]">
            <img src="https://i.imgur.com/GHOv30o.png" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Background" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
            <div className="absolute inset-0 p-6 flex flex-col justify-center items-center z-10 text-center">
               <div className="w-14 h-14 bg-white p-1 rounded-full shadow-2xl mb-3 relative group-hover:scale-110 transition-transform duration-500">
                  <img src={LOGO_URL} className="w-full h-full object-contain" alt="Logo" />
               </div>
               <h3 className="font-condensed text-4xl md:text-5xl font-black uppercase text-white mb-4 leading-none drop-shadow-lg">TuttoXAndroid</h3>
               <span className="bg-[#e31b23] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-white group-hover:text-[#e31b23] transition-colors shadow-lg shadow-red-900/50">Segui la Pagina &rarr;</span>
            </div>
         </a>
      </div>
    </div>
  );

  const AppsGamesMenu = () => {
    // Rotazione multi-slot al giorno: Guide, Offerte, Smartphone, App, Recensioni
    // (ogni ~4 ore cambia; seed giornaliero mescola l'ordine così non è sempre la stessa sequenza)
    const spotlightCats = ['App & Giochi', 'Smartphone', 'Offerte', 'Guide', 'Recensioni'];
    const now = new Date();
    const daySeed = now.getFullYear() * 372 + now.getMonth() * 31 + now.getDate();
    const hourSlot = Math.floor(now.getHours() / 4); // 6 slot/giorno
    const rotated = [...spotlightCats].sort((a, b) => {
      const ha = (daySeed * 17 + a.length * 13 + a.charCodeAt(0)) % 97;
      const hb = (daySeed * 17 + b.length * 13 + b.charCodeAt(0)) % 97;
      return ha - hb;
    });
    const spotlightCat = rotated[(hourSlot + daySeed) % rotated.length];

    const allSource = articles.length > 0 ? articles : MOCK_ARTICLES;
    const haystack = (a: Article) => `${a.title} ${(a.tags || []).join(' ')} ${a.category}`.toLowerCase();

    let pool = allSource.filter((a: Article) => a.category === spotlightCat);

    // Allarga il pool (etichette Blogger + keyword titolo) così le card hanno sempre materiale
    if (spotlightCat === 'Offerte') {
      pool = allSource.filter((a: Article) =>
        a.category === 'Offerte' ||
        /offerta|offerte|sconto|prezzo|amazon|deal|black friday|prime|risparmio|cashback|coupon/i.test(haystack(a))
      );
    } else if (spotlightCat === 'Guide') {
      pool = allSource.filter((a: Article) => {
        const cat = (a.category || '').toLowerCase();
        return cat === 'guide' || cat === 'tutorial' ||
          /guida|guide|tutorial|come fare|how to|trucchi|soluzioni|passo.?passo|impostare|nascondere|risolvere/i.test(haystack(a));
      });
    } else if (spotlightCat === 'Recensioni') {
      pool = allSource.filter((a: Article) =>
        a.category === 'Recensioni' ||
        /recensione|review|prova|test\b|analisi|opinioni/i.test(haystack(a))
      );
    } else if (spotlightCat === 'Smartphone') {
      pool = allSource.filter((a: Article) =>
        a.category === 'Smartphone' ||
        /smartphone|galaxy|pixel|iphone|xiaomi|redmi|poco|oneplus|motorola|honor|realme|nothing|oppo|huawei/i.test(haystack(a))
      );
    } else if (spotlightCat === 'App & Giochi') {
      pool = allSource.filter((a: Article) =>
        a.category === 'App & Giochi' ||
        /app\b|gioco|giochi|game|play store|apk|whatsapp|instagram|telegram|tiktok/i.test(haystack(a))
      );
    }

    /** Chiave stabile: id + titolo normalizzato (stesso pezzo con id diversi non raddoppia). */
    const normTitle = (t?: string) =>
      (t || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\wàèéìòùáéíóúäöüß]+/gi, '')
        .trim()
        .slice(0, 96);
    const articleKeys = (a: Article): string[] => {
      const keys: string[] = [];
      const id = String(a?.id ?? '').trim();
      if (id) keys.push(`id:${id}`);
      const t = normTitle(a?.title);
      if (t) keys.push(`t:${t}`);
      return keys;
    };
    const markUsed = (seen: Set<string>, a: Article) => {
      for (const k of articleKeys(a)) seen.add(k);
    };
    const isUsed = (seen: Set<string>, a: Article) =>
      articleKeys(a).some((k) => seen.has(k));

    /** Unisce liste in ordine, senza duplicati (id o titolo), fino a limit. */
    const takeUnique = (lists: Article[][], limit: number, exclude?: Set<string>): Article[] => {
      const out: Article[] = [];
      const seen = new Set<string>(exclude ? [...exclude] : []);
      for (const list of lists) {
        for (const a of list) {
          if (!a || isUsed(seen, a)) continue;
          // Serve almeno id o titolo
          if (articleKeys(a).length === 0) continue;
          markUsed(seen, a);
          out.push(a);
          if (out.length >= limit) return out;
        }
      }
      return out;
    };

    /** Sempre almeno 3 pezzi per card: preferiti → pool → resto feed. */
    const PREVIEW_COUNT = 3;
    /**
     * Col1 e Col2 sempre disgiunte.
     * 1) riempie col1 da primaryA (+ fill)
     * 2) riempie col2 da primaryB escludendo TUTTO ciò che è in col1 (anche per titolo)
     * 3) se col2 resta corta, prende i pezzi successivi del pool/allSource mai usati in col1
     */
    const takePreviewPair = (primaryA: Article[], primaryB: Article[], shared: Article[]) => {
      const col1 = takeUnique([primaryA, shared, pool, allSource], PREVIEW_COUNT);
      const used = new Set<string>();
      for (const a of col1) markUsed(used, a);

      const notUsed = (list: Article[]) => list.filter((a) => a && !isUsed(used, a));
      let col2 = takeUnique(
        [notUsed(primaryB), notUsed(shared), notUsed(pool), notUsed(allSource)],
        PREVIEW_COUNT,
        used
      );

      // Safety net: se per qualche motivo c’è ancora overlap titolo/id, forza slice sequenziale
      const col2StillOverlap = col2.some((a) => isUsed(used, a));
      if (col2StillOverlap || col2.length < PREVIEW_COUNT) {
        const sequential = takeUnique([pool, allSource], PREVIEW_COUNT * 4);
        const rest = sequential.filter((a) => !isUsed(used, a));
        col2 = takeUnique([col2.filter((a) => !isUsed(used, a)), rest], PREVIEW_COUNT, used);
      }

      // Ultima garanzia: nessuna intersezione
      col2 = col2.filter((a) => !isUsed(used, a)).slice(0, PREVIEW_COUNT);
      if (col2.length < PREVIEW_COUNT) {
        col2 = takeUnique([col2, pool, allSource], PREVIEW_COUNT, used);
      }

      return { col1, col2 };
    };

    /** Cascata “Vedi tutti”: preferiti prima, poi fill dal feed (opz. esclude già usati). */
    const fillCascadePool = (primary: Article[], limit = 48, excludeArticles?: Article[]): Article[] => {
      const exclude = new Set<string>();
      for (const a of excludeArticles || []) markUsed(exclude, a);
      return takeUnique([primary, pool, allSource], limit, exclude);
    };

    type SpotlightIconKind = 'tag' | 'star' | 'phone' | 'flame' | 'book' | 'bulb' | 'layers' | 'gamepad' | 'news' | 'note' | 'grid';

    let col1Title = `ULTIMI ${spotlightCat.toUpperCase()}`;
    let col2Title = `IN EVIDENZA ${spotlightCat.toUpperCase()}`;
    let col1Icon: SpotlightIconKind = 'news';
    let col2Icon: SpotlightIconKind = 'star';
    // Default: metà “recenti” vs metà “successive” senza overlap
    let { col1: col1Items, col2: col2Items } = takePreviewPair(
      pool,
      pool.slice(PREVIEW_COUNT),
      pool
    );
    let col1All: Article[] = fillCascadePool(pool, 48);
    let col2All: Article[] = fillCascadePool(pool.slice(PREVIEW_COUNT), 48, col1All);
    let viewAllCat = spotlightCat;

    if (spotlightCat === 'App & Giochi') {
      col1Title = 'ULTIME APP';
      col2Title = 'ULTIMI GIOCHI';
      col1Icon = 'layers';
      col2Icon = 'gamepad';
      const isGameLike = (a: Article) => /gioco|giochi|game|play|arcade|indie/i.test(haystack(a));
      const appItems = pool.filter((a: Article) => !isGameLike(a));
      const gameItems = pool.filter(isGameLike);
      ({ col1: col1Items, col2: col2Items } = takePreviewPair(
        appItems.length > 0 ? appItems : pool,
        gameItems.length > 0 ? gameItems : pool.slice(PREVIEW_COUNT),
        pool
      ));
      col1All = fillCascadePool(appItems.length > 0 ? appItems : pool, 48);
      col2All = fillCascadePool(
        gameItems.length > 0 ? gameItems : pool.slice(PREVIEW_COUNT),
        48,
        col1All
      );
    } else if (spotlightCat === 'Offerte') {
      col1Title = 'ULTIME OFFERTE';
      col2Title = 'LE MIGLIORI OFFERTE';
      col1Icon = 'tag';
      col2Icon = 'star';
      // col2: pezzi successivi del pool, mai quelli già in col1
      ({ col1: col1Items, col2: col2Items } = takePreviewPair(pool, pool.slice(PREVIEW_COUNT), pool));
      col1All = fillCascadePool(pool, 48);
      col2All = fillCascadePool(pool.slice(PREVIEW_COUNT), 48, col1All);
    } else if (spotlightCat === 'Smartphone') {
      col1Title = 'ULTIMI SMARTPHONE';
      col2Title = 'TOP DEVICE';
      col1Icon = 'phone';
      col2Icon = 'flame';
      ({ col1: col1Items, col2: col2Items } = takePreviewPair(pool, pool.slice(PREVIEW_COUNT), pool));
      col1All = fillCascadePool(pool, 48);
      col2All = fillCascadePool(pool.slice(PREVIEW_COUNT), 48, col1All);
    } else if (spotlightCat === 'Guide') {
      col1Title = 'ULTIME GUIDE';
      col2Title = 'TUTORIAL UTILI';
      col1Icon = 'book';
      col2Icon = 'bulb';
      const isTutorialLike = (a: Article) =>
        /tutorial|trucchi|come |how to|passo.?passo|soluzione|risolvere|impostare|prompt|multidevice|due telefoni/i.test(haystack(a))
        || (a.category || '').toLowerCase() === 'tutorial'
        || (a.tags || []).some((t) => /tutorial/i.test(t));
      const tutorialItems = pool.filter(isTutorialLike);
      const guideItems = pool.filter((a: Article) => !isTutorialLike(a));
      // Guide pure in col1; tutorial in col2; fill senza mai riprendere i pezzi di col1
      ({ col1: col1Items, col2: col2Items } = takePreviewPair(
        guideItems.length > 0 ? guideItems : pool,
        tutorialItems.length > 0 ? tutorialItems : pool.slice(PREVIEW_COUNT),
        pool
      ));
      col1All = fillCascadePool(guideItems.length > 0 ? guideItems : pool, 48);
      col2All = fillCascadePool(
        tutorialItems.length > 0 ? tutorialItems : pool.slice(PREVIEW_COUNT),
        48,
        [...col1All, ...col1Items]
      );
    } else if (spotlightCat === 'Recensioni') {
      col1Title = 'ULTIME RECENSIONI';
      col2Title = 'TEST & PROVE';
      col1Icon = 'star';
      col2Icon = 'note';
      ({ col1: col1Items, col2: col2Items } = takePreviewPair(pool, pool.slice(PREVIEW_COUNT), pool));
      col1All = fillCascadePool(pool, 48);
      col2All = fillCascadePool(pool.slice(PREVIEW_COUNT), 48, col1All);
    }

    // Garanzia globale: le due anteprime non condividono mai articoli (id o titolo)
    {
      const usedPreview = new Set<string>();
      for (const a of col1Items) markUsed(usedPreview, a);
      col2Items = col2Items.filter((a) => !isUsed(usedPreview, a));
      if (col2Items.length < PREVIEW_COUNT) {
        col2Items = takeUnique([col2Items, pool, allSource], PREVIEW_COUNT, usedPreview);
      }
    }

    const SpotlightIcon: React.FC<{ kind: SpotlightIconKind; className?: string }> = ({ kind, className = 'w-5 h-5' }) => {
      const common = { className, fill: 'none' as const, stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24', 'aria-hidden': true as const };
      switch (kind) {
        case 'tag':
          return (
            <svg {...common}>
              <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z" />
              <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
            </svg>
          );
        case 'star':
          return (
            <svg {...common}>
              <path d="M12 3.5 14.4 9l5.9.5-4.5 3.9 1.4 5.7L12 16.2 6.8 19.1l1.4-5.7L3.7 9.5 9.6 9 12 3.5Z" />
            </svg>
          );
        case 'phone':
          return (
            <svg {...common}>
              <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
              <path d="M10 5.5h4" />
              <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          );
        case 'flame':
          return (
            <svg {...common}>
              <path d="M12 3c-1.5 3-4 4.5-4 8a4 4 0 0 0 8 0c0-2.5-1.2-4-2-5.5-.5 1.5-1.2 2.2-2 2.5.3-1.8.8-3.5 0-5Z" />
            </svg>
          );
        case 'book':
          return (
            <svg {...common}>
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
              <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
            </svg>
          );
        case 'bulb':
          return (
            <svg {...common}>
              <path d="M9 18h6" />
              <path d="M10 21h4" />
              <path d="M12 3a5.5 5.5 0 0 0-3 10c.4.4.8 1 .9 1.7h4.2c.1-.7.5-1.3.9-1.7A5.5 5.5 0 0 0 12 3Z" />
            </svg>
          );
        case 'layers':
          return (
            <svg {...common}>
              <path d="m12 3 8 4.5-8 4.5L4 7.5 12 3Z" />
              <path d="m4 12 8 4.5 8-4.5" />
              <path d="m4 16.5 8 4.5 8-4.5" />
            </svg>
          );
        case 'gamepad':
          return (
            <svg {...common}>
              <rect x="2.5" y="8" width="19" height="10" rx="4" />
              <path d="M8 11v4M6 13h4" />
              <circle cx="15.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
              <circle cx="17.5" cy="14" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          );
        case 'note':
          return (
            <svg {...common}>
              <path d="M7 3.5h8.5L19 7v13.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
              <path d="M15 3.5V8h4.5" />
              <path d="M9 12h6M9 15.5h4" />
            </svg>
          );
        case 'grid':
          return (
            <svg {...common}>
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
            </svg>
          );
        default:
          return (
            <svg {...common}>
              <path d="M5 5h14v12H5z" />
              <path d="M8 9h8M8 12h5" />
            </svg>
          );
      }
    };

    const categorieList = [
      'Giochi Android Gratis',
      'Migliori App Produttività',
      'App Foto & Video',
      'Personalizzazione',
      'Emulatori'
    ];

    const expandedCol = spotlightExpandedCol;

    const handleCatClick = (label: string) => {
      setSearchQuery(label);
      setTimeout(() => {
        handleSearchSubmit({ preventDefault: () => {} } as any);
      }, 10);
    };

    const handlePlayPass = () => {
      setSearchQuery('Google Play Pass');
      setTimeout(() => {
        handleSearchSubmit({ preventDefault: () => {} } as any);
      }, 10);
    };

    const accent = CATEGORY_COLORS[spotlightCat] || '#16a34a';
    const accent2 = spotlightCat === 'Smartphone' ? '#f59e0b' : spotlightCat === 'Offerte' ? '#e31b23' : spotlightCat === 'Guide' ? '#14b8a6' : spotlightCat === 'Recensioni' ? '#a855f7' : '#22c55e';
    const categoriesTint = '#6366f1';
    const IMG_FALLBACK = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=200';

    const glassCardStyle = (tint: string): React.CSSProperties => ({
      borderColor: `${tint}30`,
      boxShadow: `0 10px 40px ${tint}12, inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px ${tint}10`,
      background: `linear-gradient(145deg, rgba(255,255,255,0.82) 0%, ${tint}10 55%, rgba(255,255,255,0.45) 100%)`,
    });

    const formatSpotlightTitle = (value: string) =>
      value
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const cascadeItems =
      expandedCol === 'col1' ? col1All
      : expandedCol === 'col2' ? col2All
      : [];
    const cascadeTitle =
      expandedCol === 'col1' ? formatSpotlightTitle(col1Title)
      : expandedCol === 'col2' ? formatSpotlightTitle(col2Title)
      : '';
    const cascadeTint = expandedCol === 'col1' ? accent : accent2;

    const toggleExpand = (col: 'col1' | 'col2') => {
      setSpotlightExpandedCol((prev) => {
        const next = prev === col ? null : col;
        if (next) {
          // Soft scroll once after open — avoid fighting page scroll while browsing cascade
          requestAnimationFrame(() => {
            spotlightCascadeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        }
        return next;
      });
    };

    const SpotlightList = ({
      title,
      icon,
      items,
      allItems,
      colKey,
      tint,
      tiltClass = 'spotlight-tilt-left',
    }: {
      title: string;
      icon: SpotlightIconKind;
      items: Article[];
      allItems: Article[];
      colKey: 'col1' | 'col2';
      tint: string;
      tiltClass?: string;
    }) => {
      const isExpanded = expandedCol === colKey;
      const extraCount = Math.max(0, allItems.length - items.length);

      return (
      <div
        className={`spotlight-glass ${tiltClass} rounded-2xl p-5 h-full flex flex-col relative overflow-hidden ${isExpanded ? 'spotlight-card-expanded' : ''}`}
        style={glassCardStyle(tint)}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-80"
          style={{ background: `linear-gradient(90deg, ${tint}, ${tint}55)` }}
          aria-hidden="true"
        />
        <div className="flex items-center gap-2.5 mb-3 mt-1">
          <span
            className="spotlight-icon-box w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${tint}18`, color: tint, border: `1px solid ${tint}28` }}
            aria-hidden="true"
          >
            <SpotlightIcon kind={icon} />
          </span>
          <h4 className="spotlight-heading text-[15px] text-gray-900 leading-snug font-bold">
            {formatSpotlightTitle(title)}
          </h4>
        </div>
        <div className="flex-1 space-y-1">
          {items.length > 0 ? (
            items.map((item: Article) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleArticleClick(item)}
                className="spotlight-link group w-full text-left py-2 border-b border-white/50 last:border-0 rounded-lg hover:bg-white/40 transition-colors px-1 flex items-center gap-2.5"
              >
                <img
                  src={item.imageUrl || IMG_FALLBACK}
                  alt=""
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
                  className="w-11 h-11 rounded-lg object-cover shrink-0 bg-gray-100 ring-1 ring-black/5 group-hover:scale-105 transition-transform duration-300"
                />
                <span className="text-[13px] leading-[1.4] text-gray-700 font-semibold group-hover:text-gray-950 line-clamp-2 transition-colors min-w-0">
                  {item.title}
                </span>
              </button>
            ))
          ) : (
            <p className="text-gray-500 text-xs leading-relaxed py-2">
              Contenuti in aggiornamento.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleExpand(colKey)}
          className="spotlight-cta mt-3 group inline-flex items-center gap-1.5 font-bold transition-colors"
          style={{ color: tint }}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Mostra meno' : 'Vedi tutti'}
          <span className={`transition-transform ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} aria-hidden="true">
            {isExpanded ? '↑' : '→'}
          </span>
        </button>
        {!isExpanded && extraCount > 0 && (
          <span className="text-[10px] text-gray-400 font-medium mt-1">
            +{extraCount} altri
          </span>
        )}
      </div>
      );
    };

    return (
      <section className="spotlight-section relative overflow-x-clip overflow-y-visible border-t border-white/60 py-8 md:py-10">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${accent}12 0%, #ecfdf5 35%, #eff6ff 70%, ${accent2}14 100%)`,
          }}
          aria-hidden="true"
        />
        <div className="absolute -top-20 left-[8%] w-64 h-64 rounded-full blur-3xl opacity-60 pointer-events-none" style={{ backgroundColor: `${accent}25` }} aria-hidden="true" />
        <div className="absolute -bottom-16 right-[10%] w-72 h-72 rounded-full blur-3xl opacity-50 pointer-events-none" style={{ backgroundColor: `${accent2}22` }} aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full blur-3xl opacity-30 bg-violet-300/40 pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent" />
            <span
              className="spotlight-glass spotlight-eyebrow text-[10px] px-4 py-1.5 rounded-full"
              style={{ color: accent, ...glassCardStyle(accent) }}
            >
              Selezione {spotlightCat}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300/60 to-transparent" />
          </div>

          <div className="spotlight-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <SpotlightList title={col1Title} icon={col1Icon} items={col1Items} allItems={col1All} colKey="col1" tint={accent} tiltClass="spotlight-tilt-left" />
            <SpotlightList title={col2Title} icon={col2Icon} items={col2Items} allItems={col2All} colKey="col2" tint={accent2} tiltClass="spotlight-tilt-right" />

            <div
              className="spotlight-glass spotlight-tilt-center rounded-2xl p-5 h-full relative overflow-hidden"
              style={glassCardStyle(categoriesTint)}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-80"
                style={{ background: `linear-gradient(90deg, ${categoriesTint}, ${categoriesTint}55)` }}
                aria-hidden="true"
              />
              <div className="flex items-center gap-2.5 mb-4 mt-1">
                <span
                  className="spotlight-icon-box w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${categoriesTint}18`, color: categoriesTint, border: `1px solid ${categoriesTint}28` }}
                  aria-hidden="true"
                >
                  <SpotlightIcon kind="grid" />
                </span>
                <h4 className="spotlight-heading text-[15px] text-gray-900 leading-snug font-bold">
                  Categorie
                </h4>
              </div>
              <ul className="space-y-1">
                {categorieList.map((c, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => handleCatClick(c)}
                      className="spotlight-cat group w-full flex items-center justify-between gap-2 text-left py-2 px-2 -mx-2 rounded-lg hover:bg-white/40 transition-colors"
                    >
                      <span className="text-[14px] text-gray-700 group-hover:text-gray-950 font-semibold transition-colors tracking-tight">
                        {c}
                      </span>
                      <span className="text-xs transition-colors group-hover:translate-x-0.5" style={{ color: `${categoriesTint}99` }} aria-hidden="true">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {(() => {
              const promo = spotlightCat === 'Offerte'
                ? {
                    bg: 'from-[#e31b23] to-[#9f1239]',
                    title: 'Offerte del giorno',
                    desc: 'Le migliori occasioni tech aggiornate ogni giorno.',
                    btn: 'Scopri le offerte',
                    action: () => handleNavClick('Offerte'),
                    badge: 'Hot',
                  }
                : spotlightCat === 'Smartphone'
                ? { bg: 'from-[#1e40af] to-[#1e3a8a]', title: 'Top smartphone', desc: 'Ultime uscite, test e confronti sui migliori device Android.', btn: 'Leggi le recensioni', action: () => handleNavClick('Smartphone') }
                : spotlightCat === 'Guide'
                ? { bg: 'from-[#0f766e] to-[#115e59]', title: 'Guide essenziali', desc: 'Tutorial pratici per ottimizzare il tuo Android.', btn: 'Leggi la guida', action: () => handleNavClick('Guide') }
                : spotlightCat === 'Recensioni'
                ? { bg: 'from-[#7c3aed] to-[#5b21b6]', title: 'Recensioni pro', desc: 'Analisi dettagliate di smartphone, wearable e gadget.', btn: 'Leggi la recensione', action: () => handleNavClick('Recensioni') }
                : { bg: 'from-[#16a34a] to-[#15803d]', title: 'Google Play Pass', desc: 'Giochi e app senza pubblicità: vale la pena?', btn: 'Leggi articolo', action: handlePlayPass };

              return (
                <button
                  type="button"
                  onClick={promo.action}
                  className={`spotlight-promo spotlight-glass-promo spotlight-tilt-promo relative overflow-hidden rounded-2xl p-5 text-left text-white bg-gradient-to-br ${promo.bg} transition-all duration-300 h-full flex flex-col justify-between group`}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.28),transparent_50%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(0,0,0,0.15),transparent_45%)] pointer-events-none" />
                  <div className="absolute inset-0 backdrop-blur-[2px] pointer-events-none" aria-hidden="true" />
                  {promo.badge && (
                    <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/30 shadow-sm">
                      {promo.badge}
                    </span>
                  )}
                  <div className="relative z-10">
                    <h4 className="spotlight-heading text-xl text-white leading-tight mb-2 drop-shadow-sm font-bold">
                      {promo.title}
                    </h4>
                    <p className="text-[13px] text-white/90 leading-relaxed max-w-[28ch] font-medium">
                      {promo.desc}
                    </p>
                  </div>
                  <span className="spotlight-cta relative z-10 mt-5 inline-flex items-center gap-2 self-start bg-white/25 backdrop-blur-md border border-white/35 text-white px-4 py-2 rounded-xl font-bold group-hover:bg-white/35 transition-colors shadow-sm">
                    {promo.btn}
                    <span aria-hidden="true">→</span>
                  </span>
                </button>
              );
            })()}
          </div>

          {/* Cascata: UNA SOLA RIGA orizzontale — stili inline (non espandibili da CSS globali img) */}
          {expandedCol && cascadeItems.length > 0 && (
            <div
              ref={spotlightCascadeRef}
              className="mt-5 rounded-2xl relative"
              style={{
                border: `1px solid ${cascadeTint}28`,
                boxShadow: `0 12px 36px ${cascadeTint}12, 0 2px 10px rgba(15,23,42,0.05)`,
                background: `linear-gradient(160deg, rgba(255,255,255,0.98) 0%, ${cascadeTint}0a 100%)`,
                overflow: 'hidden',
                maxHeight: 248,
              }}
            >
              <div
                className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5"
                style={{
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  background: `linear-gradient(90deg, ${cascadeTint}14, rgba(255,255,255,0.95))`,
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.16em]"
                    style={{ color: cascadeTint }}
                  >
                    {cascadeTitle}
                  </p>
                  <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
                    {cascadeItems.length} articoli · scorri in orizzontale
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollCascadeHorizontal('left')}
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-gray-200 shadow-sm"
                    style={{ color: cascadeTint }}
                    aria-label="Scorri a sinistra"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCascadeHorizontal('right')}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: cascadeTint }}
                    aria-label="Scorri a destra"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpotlightExpandedCol(null)}
                    className="ml-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg"
                  >
                    Chiudi
                  </button>
                </div>
              </div>

              <div className="relative" style={{ height: 196 }}>
                {/* Sfumature laterali */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 28,
                    zIndex: 2,
                    pointerEvents: 'none',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.98), transparent)',
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 28,
                    zIndex: 2,
                    pointerEvents: 'none',
                    background: 'linear-gradient(270deg, rgba(255,255,255,0.98), transparent)',
                  }}
                />
                <div
                  ref={cascadeHScrollRef}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    alignItems: 'stretch',
                    gap: 10,
                    height: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    padding: '10px 16px',
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {cascadeItems.map((article) => {
                    const thumb = article.imageUrl || IMG_FALLBACK;
                    return (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => handleArticleClick(article)}
                        style={{
                          flex: '0 0 152px',
                          width: 152,
                          minWidth: 152,
                          maxWidth: 152,
                          height: 172,
                          maxHeight: 172,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          textAlign: 'left',
                          borderRadius: 12,
                          border: `1px solid ${cascadeTint}20`,
                          background: '#ffffff',
                          padding: 0,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                        }}
                      >
                        {/* Miniatura via background — immune a regole globali su img */}
                        <div
                          style={{
                            width: '100%',
                            height: 88,
                            minHeight: 88,
                            maxHeight: 88,
                            flexShrink: 0,
                            backgroundColor: '#f3f4f6',
                            backgroundImage: `url("${thumb.replace(/"/g, '')}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }}
                          role="img"
                          aria-label=""
                        />
                        <div
                          style={{
                            padding: '8px 9px',
                            overflow: 'hidden',
                            flex: 1,
                            minHeight: 0,
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              fontSize: 9,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              color: cascadeTint,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {article.category || article.tags?.[0] || 'Articolo'}
                          </span>
                          <span
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#1f2937',
                              lineHeight: 1.3,
                              marginTop: 3,
                            }}
                          >
                            {article.title}
                          </span>
                          {article.date && (
                            <span
                              style={{
                                display: 'block',
                                fontSize: 9,
                                color: '#9ca3af',
                                fontWeight: 600,
                                marginTop: 4,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {article.date}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <Layout
      activeMegaMenu={activeMegaMenu}
      setActiveMegaMenu={setActiveMegaMenu}
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      isSearchVisible={isSearchVisible}
      setIsSearchVisible={setIsSearchVisible}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeCategory={activeCategory}
      articles={articles}
      handleSearchSubmit={handleSearchSubmit}
      handleNavClick={handleNavClick}
      handleBudgetFilter={handleBudgetFilter}
      handleSeeAllOffers={handleSeeAllOffers}
      handleArticleClick={handleArticleClick}
      handleFooterLinkClick={handleFooterLinkClick}
      goToHome={goToHome}
      showStickyBanner={showStickyBanner}
      showScrollTop={showScrollTop}
      scrollToTop={scrollToTop}
      toggleSearch={toggleSearch}
      searchInputRef={searchInputRef}
      boxedLayout={layoutConfig.boxedLayout}
    >
        {/* --- STATIC PAGES --- */}
        {isAbout && <AboutPage />}
        {isCollab && <CollabPage />}
        {isPrivacy && <PrivacyPage />}
        {isGPS && <GPSCalculator />}

        {/* --- ARTICLE DETAIL VIEW --- */}
        {(isArticle && (currentArticle || location.pathname.endsWith('.html'))) && (
           <div className="bg-white">
              {currentArticle ? (
                <ArticleDetail 
                  key={currentArticle.id}
                  article={currentArticle} 
                  relatedArticle={articles.find(a => a.category === currentArticle.category && a.id !== currentArticle.id) || articles[0]}
                  moreArticles={shuffledMoreArticles} 
                  deals={deals}
                  offerNews={articles.filter(a => a.category === 'Offerte' && a.id !== currentArticle.id).slice(0, 4)}
                  onArticleClick={handleArticleClick}
                  onHomeClick={goToHome}
                  onCategoryClick={(cat) => handleNavClick(cat)}
                />
              ) : (
                <div className="min-h-screen pt-20 flex flex-col items-center">
                   <div className="loader"></div>
                </div>
              )}
              
              <div className="py-12 text-center">
                  <button onClick={goToHome} className="bg-black text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                    Torna alla Home
                  </button>
              </div>
           </div>
        )}

        {/* --- HOME / SEARCH / CATEGORY VIEW --- */}
        {(isHome || isSearch) && !isArticle && (
          <>
            {/* TopStoriesMobile was here, removed. */}

            <section className="bg-white pb-4">
              <div className="max-w-7xl mx-auto">
                {/* HERO SECTION - STATIC (Visible on Home) */}
                {isHome && activeCategory === 'Tutti' && (
                  <div className="w-full md:h-[320px] lg:h-[360px] xl:h-[380px] flex gap-4 items-stretch px-2 md:px-0 mt-3 md:mt-1">
                    {layoutConfig.fixedSidebar && (
                      <DesktopSidebar
                          articles={
                            (articles.length > 0 ? articles : MOCK_ARTICLES)
                              .filter((a) => a.id !== heroArticle?.id)
                              .slice(0, 120)
                          }
                          onArticleClick={handleArticleClick}
                          isLoading={isArticlesLoading}
                      />
                    )}
                    
                    <div className="flex-1 h-full w-full min-w-0">
                        {isArticlesLoading ? (
                           <ArticleCard isLoading type="hero" />
                        ) : heroArticle && (
                          <ArticleCard 
                            article={heroArticle} 
                            onClick={() => handleArticleClick(heroArticle)}
                            className="h-full" 
                          />
                        )}
                    </div>
                  </div>
                )}

                {/* FEATURED CAROUSEL - STATIC (Visible on Home) */}
                {isHome && activeCategory === 'Tutti' && (
                  <div className="px-4 lg:px-0 py-2 mt-1 mb-0">
                    <div className="flex items-end justify-between mb-2">
                        <h3 className="font-condensed text-[23px] lg:text-[28px] font-black uppercase text-gray-900 tracking-[-0.5px] leading-none">
                            In Evidenza
                        </h3>
                        <div className="hidden lg:flex gap-2">
                            <button onClick={() => scrollFeatured('left')} className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#e31b23] transition-colors shadow-lg active:scale-90" aria-label="Scorri a sinistra">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => scrollFeatured('right')} className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#e31b23] transition-colors shadow-lg active:scale-90" aria-label="Scorri a destra">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    <div 
                      ref={featuredScrollRef} 
                      className={`flex gap-3 lg:gap-4 overflow-x-auto no-scrollbar scroll-container snap-x snap-mandatory py-2 px-1 cursor-grab active:cursor-grabbing ${isDragging ? 'snap-none' : 'snap-x'}`}
                      onMouseDown={handleMouseDown}
                      onMouseLeave={handleMouseLeave}
                      onMouseUp={handleMouseUp}
                      onMouseMove={handleMouseMove}
                      style={{ scrollBehavior: isDragging ? 'auto' : 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {isArticlesLoading ? (
                           Array.from({ length: 5 }).map((_, i) => (
                             <div key={i} className="w-[40%] md:w-[22%] lg:w-[18%] shrink-0 snap-start select-none">
                               <ArticleCard isLoading type="horizontal" />
                             </div>
                           ))
                        ) : featuredCarouselArticles.map(item => (
                          <div key={item.id} onClick={() => handleArticleClick(item)} className="w-[40%] md:w-[22%] lg:w-[18%] shrink-0 snap-start select-none">
                            <ArticleCard article={{...item, type: 'horizontal'}} onClick={() => handleArticleClick(item)} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Banner deal rimosso dall’alto: compare compatto a metà pagina solo con filtro budget */}
                
                {/* MOVED: Social Banner placed EXTERNALLY above the News Section Content */}
                {isHome && activeCategory === 'Tutti' && !isSearch && (
                  <div ref={staticBannerRef} className="px-4 lg:px-0 mt-6 mb-2">
                    <SocialBannerMobile />
                  </div>
                )}

              </div>
            </section>

            {/* Category Spotlight - hidden on mobile (avoid ULTIME OFFERTE etc on phone home, go straight to news).
                On desktop it alternates categories daily. */}
            {isHome && activeCategory === 'Tutti' && !isSearch && (
              <div className="hidden md:block">
                {/* Call as function (not <Component />) so expand state/DOM stay stable across App re-renders */}
                {AppsGamesMenu()}
              </div>
            )}

            <section 
              ref={newsSectionRef} 
              className="pt-4 pb-12 bg-gray-50/50 min-h-[500px]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove} 
              onTouchEnd={handleTouchEnd} 
            >
              <div className="max-w-7xl mx-auto px-4">
                
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-5 border-b border-gray-100">
                  <div>
                    <h3 className="font-condensed text-3xl md:text-4xl font-black uppercase text-gray-900 tracking-tight leading-none">
                       {isSearch ? `Risultati per: "${searchQuery}"` : (activeCategory === 'Tutti' ? 'Ultime Notizie' : activeCategory)}
                    </h3>
                    {!isSearch && activeCategory === 'Offerte' && maxBudgetEuro != null && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 text-[11px] font-black uppercase tracking-wide px-3 py-1">
                          Smartphone/tech ≤ {maxBudgetEuro}€
                        </span>
                        <button
                          type="button"
                          onClick={() => setMaxBudgetEuro(null)}
                          className="text-[11px] font-bold text-gray-500 hover:text-yellow-600 underline-offset-2 hover:underline"
                        >
                          Rimuovi filtro
                        </button>
                      </div>
                    )}
                  </div>
                  {!isSearch && (
                  <div className="flex items-center gap-5 overflow-x-auto no-scrollbar mt-4 md:mt-0">
                    {ALL_CATEGORIES.filter(c => c !== 'Tutti').map(cat => {
                      const catColor = CATEGORY_COLORS[cat] || '#e31b23';
                      const isActive = activeCategory === cat;
                      return (
                        <button 
                          key={cat} 
                          onClick={() => handleNavClick(cat)}
                          className={`group relative text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap pb-1 transition-all duration-200 ease-out active:scale-[0.98] ${isActive ? 'border-b-2' : 'text-gray-400 hover:text-white/80'}`}
                          style={isActive ? { color: catColor, borderColor: catColor } : { color: undefined }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = catColor; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = ''; }}
                        >
                          {cat}
                          {/* Subtle engaging underline pop on hover for non-active */}
                          {!isActive && (
                            <span 
                              className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-current transition-all duration-200 group-hover:w-full" 
                              style={{ backgroundColor: catColor }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
                
                {isHome && activeCategory === 'Smartphone' && !isSearch && (
                  <SmartphoneShowcase />
                )}

                {/* Offerte del giorno: strip compatta a metà pagina, solo con budget (200€, 300€…) */}
                {isHome &&
                  !isSearch &&
                  activeCategory === 'Offerte' &&
                  maxBudgetEuro != null &&
                  deals.length > 0 && (
                    <div className="mb-6">
                      <DealsSection compact maxEuro={maxBudgetEuro} />
                    </div>
                  )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 min-w-0">
                    {/* ANIMATED GRID CONTAINER - Key ensures re-render and animation triggers on swipe */}
                    {isSearching && visibleNewsCount === 6 ? (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center py-12">
                                <div className="w-12 h-12 border-4 border-[#e31b23] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="font-condensed text-xl font-black uppercase text-gray-400">Ricerca in corso...</p>
                            </div>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <ArticleCard key={i} isLoading type="standard" />
                            ))}
                        </div>
                    ) : isArticlesLoading && visibleNewsCount === 6 ? (
                        <div className="space-y-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <ArticleCard key={i} isLoading type="standard" />
                            ))}
                        </div>
                    ) : displayArticles.length > 0 ? (
                      <div 
                        key={isSearch ? `search-${searchQuery}` : activeCategory} 
                        className={`flex flex-col gap-3.5 md:gap-4 mb-8 animate-in fade-in duration-500 ${slideDirection === 'right' ? 'slide-in-from-right-20' : 'slide-in-from-left-20'}`}
                      >
                          {displayArticles.slice(0, visibleNewsCount).map(item => (
                            <ArticleCard key={item.id} article={{...item, type: 'standard'}} onClick={() => handleArticleClick(item)} />
                          ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">
                          {isSearch
                            ? `Nessun risultato trovato per "${searchQuery}".`
                            : activeCategory === 'Offerte' && maxBudgetEuro != null
                              ? `Nessuna offerta smartphone/tech sotto i ${maxBudgetEuro}€ nel feed recente.`
                              : 'Nessun articolo trovato in questa categoria.'}
                        </p>
                        <p className="text-xs text-gray-300 mt-2">
                          {activeCategory === 'Offerte' && maxBudgetEuro != null
                            ? 'Prova un budget più alto o rimuovi il filtro.'
                            : 'Prova a cercare un altro termine o torna alla home.'}
                        </p>
                        {activeCategory === 'Offerte' && maxBudgetEuro != null ? (
                          <button
                            type="button"
                            onClick={() => setMaxBudgetEuro(null)}
                            className="mt-6 bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#e31b23] transition-colors"
                          >
                            Rimuovi filtro budget
                          </button>
                        ) : (
                          <button onClick={goToHome} className="mt-6 bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#e31b23] transition-colors">Torna alla Home</button>
                        )}
                      </div>
                    )}
                    
                    {!(isArticlesLoading || isSearching) && (visibleNewsCount < displayArticles.length || hasMoreToFetch) && (
                      <div className="flex justify-center mt-8">
                        <button 
                            onClick={loadMoreNews}
                            disabled={isArticlesLoading}
                            className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#e31b23] transition-colors shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isArticlesLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            {isArticlesLoading ? 'Caricamento...' : `Vedi altre ${isSearch ? 'Risultati' : (activeCategory === 'Tutti' ? 'Notizie' : activeCategory)}`}
                        </button>
                      </div>
                    )}

                    {/* Newsletter mobile (sidebar desktop è a destra) */}
                    <div className="lg:hidden mt-10 bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-[2rem] shadow-lg border border-gray-800">
                      <NewsletterForm
                        source="home_sidebar"
                        variant="dark"
                        title="Newsletter"
                        subtitle="News, guide e offerte tech. Zero spam."
                        buttonLabel="Iscriviti gratis"
                      />
                    </div>
                  </div>
                  
                  <div className="hidden lg:block w-full max-w-[320px] shrink-0">
                      <SocialSidebar articles={displayArticles.length > 0 ? displayArticles : articles} onArticleClick={handleArticleClick} />
                  </div>
                </div>
              </div>
            </section>

            {isHome && (
              <div className="lg:hidden">
                <SocialSection />
              </div>
            )}
          </>
        )}

        {/* 404 Fallback */}
        {isArticle && !currentArticle && !isArticlesLoading && !location.pathname.endsWith('.html') && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <h2 className="text-3xl font-black uppercase mb-4">Articolo non trovato</h2>
              <button onClick={goToHome} className="bg-[#e31b23] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest">
                Torna alla Home
              </button>
            </div>
        )}
    </Layout>
  );
};

export default App;
