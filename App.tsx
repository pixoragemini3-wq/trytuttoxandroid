
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_ARTICLES, MOCK_DEALS, NAV_CATEGORIES, LOGO_URL, CATEGORY_COLORS } from './constants';
import ArticleCard from './components/ArticleCard';
import { Article, Deal } from './types';
import { fetchBloggerPosts, fetchBloggerDeals, fetchArticleByUrl, resolveAuthorImageUrl } from './services/bloggerService';
import { isInAppBrowser } from './utils/browser';
import SocialSidebar from './components/SocialSidebar';
import SocialSection from './components/SocialSection';
// TopStoriesMobile removed here, moved to Layout
import SocialBannerMobile from './components/SocialBannerMobile';
import ArticleDetail from './components/ArticleDetail';

import DesktopSidebar from './components/DesktopSidebar'; 
import { AboutPage, CollabPage } from './components/StaticPages'; 
import GPSCalculator from './components/gps/GPSCalculator';
import Layout from './components/Layout';

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
  const isGPS = location.pathname === '/calcolatore-gps';
  const isArticle = location.pathname.endsWith('.html') || location.pathname.startsWith('/article/');
  const isSearch = location.pathname === '/search';
  const isHome = !isAbout && !isCollab && !isArticle && !isSearch && !isGPS;

  const enrichArticle = (article: Article): Article => ({
    ...article,
    authorImageUrl: resolveAuthorImageUrl(article.author, article.authorImageUrl),
  });

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

  // Genera articoli correlati mescolati per evitare ripetizioni
  const getShuffledRelatedArticles = (current: Article | undefined) => {
    if (!current || articles.length === 0) return [];
    const candidates = articles.filter(a => a.id !== current.id);
    const sameCategory = candidates.filter(a => a.category === current.category);
    const otherCategories = candidates.filter(a => a.category !== current.category);
    const pool = [...shuffleArray(sameCategory), ...shuffleArray(otherCategories)];
    return pool.slice(0, 12);
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
      // Only use real deals from Telegram/Blogger. Never fall back to standard mock products.
      // If no real offers (or slow load), the section simply won't render.
      try {
         const dealsData = await fetchBloggerDeals();
         setDeals(dealsData.length > 0 ? dealsData : []);
      } catch (e) {
         setDeals([]);
      }
    };

    init();
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

  // Scroll handlers
  useEffect(() => {
    const handleScroll = () => {
      if (staticBannerRef.current) {
        const rect = staticBannerRef.current.getBoundingClientRect();
        setShowStickyBanner(rect.bottom < 0);
      }
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
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
    const currentIndex = ALL_CATEGORIES.indexOf(activeCategory);
    const newIndex = ALL_CATEGORIES.indexOf(nav);
    
    if (newIndex > currentIndex) {
      setSlideDirection('right'); 
    } else {
      setSlideDirection('left'); 
    }

    setActiveCategory(nav);
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

  const handleFooterLinkClick = (path: '/about' | '/collab' | '/') => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  const goToHome = () => {
    navigate('/');
    setSearchQuery('');
    setActiveCategory('Tutti');
    setVisibleNewsCount(6); 
    setFilteredArticles(articles);
    window.scrollTo(0, 0);
  };

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
        'recensioni': ['recensioni', 'recensione', 'review', 'prova', 'test', 'analisi', 'opinioni'],
        'guide': ['guide', 'guida', 'tutorial', 'come fare', 'how to', 'soluzione', 'problemi', 'trucchi', 'tips', 'impostare', 'nascondere'],
        'offerte': ['offerte', 'offerta', 'sconto', 'promo', 'prezzo', 'amazon', 'ebay', 'coupon', 'black friday', 'prime day', 'volantino'],
        'app & giochi': ['app', 'applicazione', 'giochi', 'game', 'play store', 'apk', 'whatsapp', 'instagram', 'telegram', 'facebook', 'tiktok'],
        'modding': ['modding', 'root', 'rom', 'custom rom', 'bootloader', 'recovery', 'magisk', 'adb', 'fastboot', 'kernel'],
        'wearable': ['wearable', 'smartwatch', 'smartband', 'cuffie', 'auricolari', 'tws', 'watch', 'fitbit', 'garmin', 'amazfit', 'galaxy watch', 'pixel watch', 'apple watch']
      };

      list = list.filter(a => {
        const articleTags = (a.tags || []).map(t => t.toLowerCase().trim());
        const articleCategory = (a.category || '').toLowerCase().trim();
        
        if (articleCategory === target) return true;
        if (articleTags.includes(target)) return true;

        const labelAliases: Record<string, string[]> = {
          'recensioni': ['recensioni', 'recensione'],
          'guide': ['guide', 'guida'],
          'offerte': ['offerte', 'offerteimperdibili'],
          'app & giochi': ['app', 'giochi'],
        };
        const aliases = labelAliases[target];
        if (aliases?.some((a) => articleTags.includes(a) || articleCategory === a)) return true;
        
        if (target === 'app & giochi') {
             if (articleTags.some(t => t.includes('app') || t.includes('giochi') || t.includes('game'))) return true;
             if (articleCategory.includes('app') || articleCategory.includes('giochi')) return true;
        }

        const keywords = categoryKeywords[target];
        if (keywords) {
           const hasKeywordMatch = keywords.some(k => 
             articleTags.some(t => t.includes(k)) || articleCategory.includes(k)
           );
           if (hasKeywordMatch) return true;
        }

        return false;
      });
    }
    return list;
  };
  
  const displayArticles = isSearch ? filteredArticles : getDisplayArticles();

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

  const dealsToShow = activeCategory === 'Offerte' ? 8 : 4;

  const DealsSection = () => (
    <section className="py-6 lg:py-8 rounded-[1.5rem] mx-0 lg:mx-0 overflow-visible shadow-2xl relative border border-[#e31b23]/30 bg-[#1a1a1a] mb-4 animate-in slide-in-from-right duration-500">
      <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-[#e31b23]/30 via-transparent to-[#e31b23]/15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
             <div className="flex items-center gap-3 flex-wrap mb-2">
               <h2 className="font-condensed text-3xl lg:text-5xl font-black uppercase tracking-tight italic leading-none text-white drop-shadow-md">Offerte del Giorno</h2>
               <span className="bg-[#e31b23] text-white px-3 py-1 rounded text-xs font-black uppercase tracking-widest shadow-md">HOT</span>
             </div>
             <p className="text-sm text-gray-200 font-medium">Selezionate in tempo reale dal nostro canale Telegram.</p>
          </div>

          <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#24A1DE] hover:bg-white pl-2 pr-6 py-2 rounded-full transition-all group shadow-xl shrink-0 hover:scale-105 cursor-pointer">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-0.5 shadow-md">
                 <img src="https://i.imgur.com/Ux19qMB.png" className="w-full h-full object-cover rounded-full" alt="Icon" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-black uppercase text-white group-hover:text-[#24A1DE] mb-0.5">Canale Ufficiale</span>
                <span className="text-sm font-black uppercase tracking-wide text-white group-hover:text-[#24A1DE]">Offerte Italy</span>
              </div>
              <svg className="w-5 h-5 ml-2 text-white group-hover:text-[#24A1DE] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>
        </div>

        <div className={`grid gap-4 ${dealsToShow > 4 ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'} items-stretch`}>
          {deals.slice(0, dealsToShow).map(deal => (
            <a key={deal.id} href={deal.link} target="_blank" rel="noopener noreferrer" onClick={() => handleDealClick(deal, 'home_deals')} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all group flex flex-col gap-3 p-4 hover:-translate-y-0.5 duration-300 min-h-[180px] border border-gray-100 relative">
              {(deal.saveAmount === 'AMAZON' || /amazon\.|amzn\./i.test(deal.link)) && (
                <span className="absolute top-2 right-2 bg-[#ff9900] text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">Amazon</span>
              )}
              <div className="w-full h-20 shrink-0 bg-gray-50 rounded-lg p-2 flex items-center justify-center">
                <img src={deal.imageUrl} alt={deal.product} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <h4 className="font-bold text-sm text-gray-900 mb-2 leading-snug line-clamp-3 group-hover:text-[#e31b23] transition-colors">{deal.product}</h4>
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-lg font-black text-[#e31b23] tracking-tight">{deal.newPrice}</span>
                    {deal.oldPrice && <span className="text-sm font-bold text-gray-400 line-through">{deal.oldPrice}</span>}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );

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
    // Alterna random tra categorie (seed giornaliero per stabilità, piace il layout delle app → lo generalizziamo)
    const spotlightCats = ['App & Giochi', 'Smartphone', 'Offerte', 'Guide', 'Recensioni'];
    const spotlightCat = spotlightCats[(new Date().getDate()) % spotlightCats.length];

    let pool = (articles.length > 0 ? articles : MOCK_ARTICLES).filter((a: Article) => a.category === spotlightCat);

    // Per la categoria Offerte, allarga il filtro per includere articoli a tema (offerte, sconti, amazon, prezzi...)
    // così non resta mai vuoto con il messaggio "non disponibili"
    if (spotlightCat === 'Offerte') {
      pool = (articles.length > 0 ? articles : MOCK_ARTICLES).filter((a: Article) => {
        const hay = `${a.title} ${(a.tags || []).join(' ')} ${a.category}`.toLowerCase();
        return a.category === 'Offerte' || 
               /offerta|offerte|sconto|prezzo|amazon|deal|black friday|prime|risparmio/i.test(hay);
      });
    }

    let col1Title = `ULTIMI ${spotlightCat.toUpperCase()}`;
    let col2Title = `IN EVIDENZA ${spotlightCat.toUpperCase()}`;
    let col1Icon = '📰';
    let col2Icon = '⭐';
    let col1Items: Article[] = pool.slice(0, 3);
    let col2Items: Article[] = pool.slice(3, 6);
    let viewAllCat = spotlightCat;

    // Caso speciale che ti è piaciuto: split App vs Giochi con keyword
    if (spotlightCat === 'App & Giochi') {
      col1Title = 'ULTIME APP';
      col2Title = 'ULTIMI GIOCHI';
      col1Icon = '📱';
      col2Icon = '🎮';

      const isGameLike = (a: Article) => {
        const hay = `${a.title} ${(a.tags || []).join(' ')}`.toLowerCase();
        return /gioco|game|play|arcade|indie/i.test(hay);
      };

      const appItems = pool.filter((a: Article) => !isGameLike(a));
      const gameItems = pool.filter(isGameLike);

      col1Items = appItems.length > 0 ? appItems.slice(0, 3) : pool.slice(0, 3);
      col2Items = gameItems.length > 0 ? gameItems.slice(0, 3) : pool.slice(3, 6);
    } else if (spotlightCat === 'Offerte') {
      col1Title = 'ULTIME OFFERTE';
      col2Title = 'LE MIGLIORI OFFERTE';
      col1Icon = '🏷️';
      col2Icon = '💰';
    } else if (spotlightCat === 'Smartphone') {
      col1Title = 'ULTIMI SMARTPHONE';
      col2Title = 'TOP DEVICE';
      col1Icon = '📱';
      col2Icon = '🔥';
    } else if (spotlightCat === 'Guide') {
      col1Title = 'ULTIME GUIDE';
      col2Title = 'TUTORIAL UTILI';
      col1Icon = '📖';
      col2Icon = '💡';
    } else if (spotlightCat === 'Recensioni') {
      col1Title = 'ULTIME RECENSIONI';
      col2Title = 'TEST & PROVE';
      col1Icon = '⭐';
      col2Icon = '📝';
    }

    const categorieList = [
      'Giochi Android Gratis',
      'Migliori App Produttività',
      'App Foto & Video',
      'Personalizzazione',
      'Emulatori'
    ];

    const handleViewAll = () => {
      handleNavClick(viewAllCat);
    };

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

    const SpotlightList = ({
      title,
      icon,
      items,
      onViewAll,
      tint,
      tiltClass = 'spotlight-tilt-left',
    }: {
      title: string;
      icon: string;
      items: Article[];
      onViewAll: () => void;
      tint: string;
      tiltClass?: string;
    }) => (
      <div
        className={`spotlight-glass ${tiltClass} rounded-2xl p-5 h-full flex flex-col relative overflow-hidden`}
        style={glassCardStyle(tint)}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-80"
          style={{ background: `linear-gradient(90deg, ${tint}, ${tint}55)` }}
          aria-hidden="true"
        />
        <div className="flex items-center gap-2.5 mb-4 mt-1">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm border border-white/60"
            style={{ backgroundColor: `${tint}20`, color: tint }}
            aria-hidden="true"
          >
            {icon}
          </span>
          <h4 className="spotlight-heading text-[15px] text-gray-800 leading-snug">
            {formatSpotlightTitle(title)}
          </h4>
        </div>
        <div className="flex-1 space-y-0.5">
          {items.length > 0 ? (
            items.map((item: Article) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleArticleClick(item)}
                className="spotlight-link group w-full text-left py-2.5 border-b border-white/50 last:border-0 rounded-lg hover:bg-white/35 transition-colors px-1"
              >
                <span className="text-[14px] leading-[1.45] text-gray-600 group-hover:text-gray-900 line-clamp-2 transition-colors">
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
          onClick={onViewAll}
          className="spotlight-cta mt-4 group inline-flex items-center gap-1.5 transition-colors"
          style={{ color: tint }}
        >
          Vedi tutti
          <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
        </button>
      </div>
    );

    return (
      <section className="spotlight-section relative overflow-hidden border-t border-white/60 py-8 md:py-10">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${accent}12 0%, #ecfdf5 35%, #eff6ff 70%, ${accent2}14 100%)`,
          }}
          aria-hidden="true"
        />
        <div className="absolute -top-20 left-[8%] w-64 h-64 rounded-full blur-3xl opacity-60" style={{ backgroundColor: `${accent}25` }} aria-hidden="true" />
        <div className="absolute -bottom-16 right-[10%] w-72 h-72 rounded-full blur-3xl opacity-50" style={{ backgroundColor: `${accent2}22` }} aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full blur-3xl opacity-30 bg-violet-300/40" aria-hidden="true" />

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
            <SpotlightList title={col1Title} icon={col1Icon} items={col1Items} onViewAll={handleViewAll} tint={accent} tiltClass="spotlight-tilt-left" />
            <SpotlightList title={col2Title} icon={col2Icon} items={col2Items} onViewAll={handleViewAll} tint={accent2} tiltClass="spotlight-tilt-right" />

            <div
              className="spotlight-glass spotlight-tilt-center rounded-2xl p-5 h-full relative overflow-hidden"
              style={glassCardStyle(categoriesTint)}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-80"
                style={{ background: `linear-gradient(90deg, ${categoriesTint}, ${categoriesTint}55)` }}
                aria-hidden="true"
              />
              <h4 className="spotlight-heading text-[15px] text-gray-800 mb-4 mt-1">
                Categorie
              </h4>
              <ul className="space-y-1">
                {categorieList.map((c, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => handleCatClick(c)}
                      className="spotlight-cat group w-full flex items-center justify-between gap-2 text-left py-2 px-2 -mx-2 rounded-lg hover:bg-white/40 transition-colors"
                    >
                      <span className="text-[14px] text-gray-600 group-hover:text-gray-900 font-medium transition-colors tracking-tight">
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
                    <h4 className="spotlight-heading text-xl text-white leading-tight mb-2 drop-shadow-sm">
                      {promo.title}
                    </h4>
                    <p className="text-[13px] text-white/90 leading-relaxed max-w-[28ch] font-normal">
                      {promo.desc}
                    </p>
                  </div>
                  <span className="spotlight-cta relative z-10 mt-5 inline-flex items-center gap-2 self-start bg-white/25 backdrop-blur-md border border-white/35 text-white px-4 py-2 rounded-xl group-hover:bg-white/35 transition-colors shadow-sm">
                    {promo.btn}
                    <span aria-hidden="true">→</span>
                  </span>
                </button>
              );
            })()}
          </div>
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
                  <div className="w-full md:h-[460px] flex gap-3 items-stretch px-2 md:px-0 mt-4 md:mt-1.5">
                    {layoutConfig.fixedSidebar && (
                      <DesktopSidebar 
                          articles={topStories.length > 1 ? topStories.slice(1, 10) : MOCK_ARTICLES.slice(1,5)} 
                          onArticleClick={handleArticleClick} 
                          isLoading={isArticlesLoading}
                      />
                    )}
                    
                    <div className="flex-1 h-full w-full">
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
                
                {isHome && !isSearch && deals.length > 0 && (activeCategory === 'Tutti' || activeCategory === 'Offerte') && (
                   <div className={`px-4 lg:px-0 ${activeCategory === 'Offerte' ? 'mt-6' : 'mt-4'}`}>
                      <DealsSection />
                   </div>
                )}
                
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
                <AppsGamesMenu />
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
                  <h3 className="font-condensed text-3xl md:text-4xl font-black uppercase text-gray-900 tracking-tight leading-none">
                     {isSearch ? `Risultati per: "${searchQuery}"` : (activeCategory === 'Tutti' ? 'Ultime Notizie' : activeCategory)}
                  </h3>
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
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 overflow-hidden">
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
                        className={`flex flex-col gap-6 mb-8 animate-in fade-in duration-500 ${slideDirection === 'right' ? 'slide-in-from-right-20' : 'slide-in-from-left-20'}`}
                      >
                          {displayArticles.slice(0, visibleNewsCount).map(item => (
                            <ArticleCard key={item.id} article={{...item, type: 'standard'}} onClick={() => handleArticleClick(item)} />
                          ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">
                          {isSearch ? `Nessun risultato trovato per "${searchQuery}".` : 'Nessun articolo trovato in questa categoria.'}
                        </p>
                        <p className="text-xs text-gray-300 mt-2">Prova a cercare un altro termine o torna alla home.</p>
                        <button onClick={goToHome} className="mt-6 bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#e31b23] transition-colors">Torna alla Home</button>
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
                  </div>
                  
                  <div className="hidden lg:block">
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
