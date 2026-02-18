
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MOCK_ARTICLES, MOCK_DEALS } from './constants';
import ArticleCard from './components/ArticleCard';
import MegaMenu from './components/MegaMenu';
import { Article, Deal } from './types';
import { fetchBloggerPosts, fetchBloggerDeals } from './services/bloggerService';
import SocialSidebar from './components/SocialSidebar';
import SocialSection from './components/SocialSection';
import TopStoriesMobile from './components/TopStoriesMobile';
import SocialBannerMobile from './components/SocialBannerMobile';
import ArticleDetail from './components/ArticleDetail';
import AdUnit from './components/AdUnit'; 
import DesktopSidebar from './components/DesktopSidebar'; 
import CookieConsent from './components/CookieConsent'; // GDPR
import { AboutPage, CollabPage } from './components/StaticPages'; // Nuove Pagine
import GeminiAssistant from './components/GeminiAssistant';

const App: React.FC = () => {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Routing Hooks
  const location = useLocation();
  const navigate = useNavigate();

  // Layout Customization State (Simula le impostazioni di layout di Blogger)
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
  const [isLoading, setIsLoading] = useState(true);
  
  // News Pagination Logic
  const [visibleNewsCount, setVisibleNewsCount] = useState(6);
  
  // Sticky Banner Logic
  const [showStickyBanner, setShowStickyBanner] = useState(false);
  const staticBannerRef = useRef<HTMLDivElement>(null);

  // Scroll To Top Logic
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const newsSectionRef = useRef<HTMLDivElement>(null);

  // Swipe Logic State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Drag Scroll Logic for Featured Carousel
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const topStories = articles.slice(0, 8);
  const LOGO_URL = "https://i.imgur.com/l7YwbQe.png";
  // Removed 'Modding' as requested
  const navCategories = ['News', 'Smartphone', 'Guide', 'Recensioni', 'Offerte', 'App & Giochi'];

  // --- ROUTER & VIEW LOGIC ---
  // Determine view based on URL path
  const isAbout = location.pathname === '/about';
  const isCollab = location.pathname === '/collab';
  // Check for native Blogger permalink structure (.html) OR old router structure (/article/)
  const isArticle = location.pathname.endsWith('.html') || location.pathname.startsWith('/article/');
  const isSearch = location.pathname === '/search';
  
  const isHome = !isAbout && !isCollab && !isArticle && !isSearch;
  
  // Extract Article based on URL matching
  const getCurrentArticle = () => {
    if (!isArticle) return undefined;
    
    // Normalize current path for comparison
    const currentPath = decodeURIComponent(location.pathname);

    // 1. Try matching by exact pathname (Native URL)
    let found = articles.find(a => {
      try {
        if (!a.url) return false;
        const articleUrl = new URL(a.url);
        const articlePath = decodeURIComponent(articleUrl.pathname);
        return articlePath === currentPath || 
               articlePath === currentPath + '/' || 
               articlePath.replace(/\/$/, '') === currentPath;
      } catch (e) {
        return false;
      }
    });

    // 2. Fallback: Try matching by ID (Legacy Router)
    if (!found && location.pathname.startsWith('/article/')) {
       const parts = location.pathname.split('/');
       const id = parts[parts.length - 1];
       found = articles.find(a => a.id === id);
    }
    
    // 3. Fallback: If we are on a single post page loaded by Blogger directly, 
    // the articles array might only contain that one post (injected via bloggerNativePosts).
    if (!found && articles.length === 1 && isArticle) {
       return articles[0];
    }

    return found;
  };

  const currentArticle = getCurrentArticle();

  // Effect to handle Category via Query Params if needed, or just reset on home
  useEffect(() => {
    if (isHome) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, isHome]);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const [bloggerPosts, bloggerDeals] = await Promise.all([
        fetchBloggerPosts(),
        fetchBloggerDeals()
      ]);
      const finalArticles = bloggerPosts.length > 0 ? bloggerPosts : MOCK_ARTICLES;
      const finalDeals = bloggerDeals.length > 0 ? bloggerDeals : MOCK_DEALS;
      
      setArticles(finalArticles);
      setDeals(finalDeals);
      setFilteredArticles(finalArticles); 
    } catch (error) {
      console.error("Errore caricamento:", error);
      // Fallback in case of hard error
      setArticles(MOCK_ARTICLES);
      setDeals(MOCK_DEALS);
      setFilteredArticles(MOCK_ARTICLES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadContent(); }, []);

  // Logic to find the Hero Article (Must be 'Evidenza' or 'Featured', fallback to latest)
  const getHeroArticle = (): Article | undefined => {
    const featured = articles.find(a => a.featured === true);
    if (featured) return { ...featured, type: 'hero' };
    return articles.length > 0 ? { ...articles[0], type: 'hero' } : undefined;
  };

  const heroArticle = getHeroArticle();
  
  // Filter out the hero article from other lists to avoid duplication
  const getDisplayArticles = () => {
    let list = articles;
    if (heroArticle) {
      list = list.filter(a => a.id !== heroArticle.id);
    }
    if (activeCategory !== 'Tutti') {
      // FIX: Check tags array for inclusion, not just strict equality on main category
      list = list.filter(a => a.category === activeCategory || (a.tags && a.tags.includes(activeCategory)));
    }
    return list;
  };

  const displayArticles = getDisplayArticles();

  // Scroll Listener for Sticky Banner & Back To Top
  useEffect(() => {
    const handleScroll = () => {
      if (staticBannerRef.current) {
        const rect = staticBannerRef.current.getBoundingClientRect();
        if (rect.bottom < 0) {
          setShowStickyBanner(true);
        } else {
          setShowStickyBanner(false);
        }
      }
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
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

  // --- NAVIGATION HANDLERS (UPDATED FOR ROUTER) ---
  const handleArticleClick = (article: Article) => {
    if (isDragging) return;

    // Direct Link Logic
    if (article.category === 'Offerte' && article.dealData?.link) {
       window.open(article.dealData.link, '_blank');
       return;
    }
    
    // Router Navigation using Native URL if available
    setActiveMegaMenu(null);
    if (article.url) {
       try {
         const urlObj = new URL(article.url);
         // Use the path from the article URL directly (supports custom domains/Blogger permalinks)
         navigate(urlObj.pathname);
       } catch(e) {
         // Fallback if URL parsing fails
         navigate(`/article/${article.id}`);
       }
    } else {
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredArticles(results);
    navigate('/search');
    setIsSearchVisible(false);
    setVisibleNewsCount(6); 
  };

  const handleNavClick = (nav: string) => {
    setActiveCategory(nav);
    setVisibleNewsCount(6); 
    setFilteredArticles(articles);
    setIsMobileMenuOpen(false);
    
    // If not home, go home then scroll
    if (!isHome) {
        navigate('/');
        // Small delay to allow render then scroll
        setTimeout(() => {
           if (newsSectionRef.current) {
             newsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
           }
        }, 100);
    } else {
       if (newsSectionRef.current) {
         newsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
       }
    }
  };

  const handleFooterLinkClick = (path: '/about' | '/collab' | '/') => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  // Helper per i colori della Navigazione
  const getNavColor = (cat: string) => {
    switch(cat) {
      case 'Smartphone': return 'text-blue-500 bg-blue-500';
      case 'Modding': return 'text-orange-500 bg-orange-500';
      case 'App & Giochi': return 'text-green-500 bg-green-500';
      case 'Recensioni': return 'text-purple-500 bg-purple-500';
      case 'Guide': return 'text-cyan-500 bg-cyan-500';
      case 'Offerte': return 'text-yellow-500 bg-yellow-500';
      case 'Wearable': return 'text-pink-500 bg-pink-500';
      case 'News': return 'text-[#e31b23] bg-[#e31b23]';
      default: return 'text-[#c0ff8c] bg-[#c0ff8c]';
    }
  };

  // Helper per il colore della linea divisoria dinamica
  const getDividerColor = () => {
    const target = activeMegaMenu || activeCategory;
    switch(target) {
      case 'Smartphone': return 'bg-blue-500';
      case 'Modding': return 'bg-orange-500';
      case 'App & Giochi': return 'bg-green-500';
      case 'Recensioni': return 'bg-purple-500';
      case 'Guide': return 'bg-cyan-500';
      case 'Offerte': return 'bg-yellow-500';
      case 'Wearable': return 'bg-pink-500';
      case 'News': return 'bg-[#e31b23]';
      default: return 'bg-[#e31b23]';
    }
  };

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe || isRightSwipe) {
       const allCats = ['Tutti', ...navCategories];
       const currentIndex = allCats.indexOf(activeCategory);
       
       if (isLeftSwipe) {
          // Next Category
          const nextIndex = Math.min(currentIndex + 1, allCats.length - 1);
          handleNavClick(allCats[nextIndex]);
       } else {
          // Prev Category
          const prevIndex = Math.max(currentIndex - 1, 0);
          handleNavClick(allCats[prevIndex]);
       }
    }
  };

  // DRAG SCROLL HANDLERS (Featured Carousel)
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
    const walk = (x - startX) * 1.5; // Scroll-fast
    featuredScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const goToHome = () => {
    navigate('/');
    setSearchQuery('');
    setActiveCategory('Tutti');
    setVisibleNewsCount(6); 
    setFilteredArticles(articles);
    window.scrollTo(0, 0);
  };

  const loadMoreNews = () => {
    setVisibleNewsCount(prev => prev + 6);
  };

  // ... (Rest of the components: DealsSection, SmartphoneShowcase stay the same) ...

  const DealsSection = () => (
    <section className="py-8 lg:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 lg:mb-16 gap-4">
          <div>
            <h2 className="font-condensed text-3xl lg:text-7xl font-black uppercase tracking-tight text-gray-900 italic leading-none">Offerte del Giorno</h2>
            <div className="mt-2 flex items-center gap-2">
               <span className="w-2 h-2 bg-[#e31b23] rounded-full animate-pulse"></span>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sconti esclusivi solo su <a href="https://t.me/tuttoxandroid" className="text-[#0088cc] underline font-black">Telegram</a></p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-10">
          {deals.map(deal => (
            <a key={deal.id} href={deal.link} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col hover:-translate-y-2 lg:hover:-translate-y-4 duration-500">
              <div className={`h-24 lg:h-64 flex items-center justify-center p-2 lg:p-12 ${deal.brandColor || 'bg-gray-50'}`}>
                {/* REMOVED mix-blend-multiply to avoid "dark watermark" effect on colored backgrounds */}
                <img src={deal.imageUrl} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-1000" />
              </div>
              <div className="p-2 lg:p-10 text-center flex-1 flex flex-col">
                <h4 className="font-black text-[10px] lg:text-xl text-gray-900 mb-1 lg:mb-2 leading-tight line-clamp-2">{deal.product}</h4>
                <div className="mt-auto">
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-4 mb-1 lg:mb-6">
                    <span className="text-sm lg:text-4xl font-black text-gray-900 tracking-tighter">{deal.newPrice}</span>
                    <span className="text-[9px] lg:text-base text-gray-300 line-through font-bold">{deal.oldPrice}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );

  const SmartphoneShowcase = () => (
    <div className="w-full mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-[#c0ff8c] border-y-2 border-black/5 py-4 mb-8 overflow-x-auto no-scrollbar shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center min-w-max gap-12 md:gap-0">
            {['SAMSUNG', 'XIAOMI', 'PIXEL', 'ONEPLUS', 'MOTOROLA', 'REALME', 'SONY', 'NOTHING', 'HONOR'].map(brand => (
              <button 
                key={brand} 
                onClick={() => { setSearchQuery(brand); handleSearchSubmit({ preventDefault: () => {} } as any); }}
                className="text-black font-black text-sm md:text-xl uppercase tracking-widest cursor-pointer hover:underline decoration-4 underline-offset-4 decoration-black/20 hover:scale-110 transition-all"
              >
                {brand}
              </button>
            ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
         <a href="https://www.facebook.com/groups/Android.Italy/" target="_blank" rel="noopener noreferrer" className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all hover:scale-[1.02]">
            <img src="https://i.imgur.com/5czWQot.png" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" alt="Background" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0066FF]/90 to-[#0040DD]/90"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
               <div className="flex justify-between items-start">
                  <span className="bg-white text-[#0066FF] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Community Ufficiale</span>
                  <div className="text-right">
                     <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">Il gruppo di supporto</p>
                     <p className="text-xs font-black text-white uppercase tracking-wider">Android più grande d'Italia</p>
                  </div>
               </div>
               <div className="flex flex-col items-center text-center mt-4">
                   <h3 className="font-condensed text-6xl md:text-7xl font-black uppercase italic leading-none text-white drop-shadow-lg transform -skew-x-6">
                      ANDROID<br/>ITALY
                   </h3>
               </div>
               <div className="flex items-center justify-between mt-auto">
                   <div className="flex items-center gap-2">
                       <span className="w-3 h-3 bg-[#c0ff8c] rounded-full animate-pulse shadow-[0_0_10px_#c0ff8c]"></span>
                       <span className="text-xl font-black text-white tracking-tight">36.000+ <span className="text-sm font-bold opacity-80">Iscritti</span></span>
                   </div>
                   <span className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest group-hover:bg-white group-hover:text-[#0066FF] transition-colors shadow-xl">
                     Unisciti al Gruppo &rarr;
                   </span>
               </div>
            </div>
         </a>

         <a href="https://www.facebook.com/tuttoxandroidcom/?ref=embed_page" target="_blank" rel="noopener noreferrer" className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#333333] to-[#000000]"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-center items-center z-10 text-center">
               <div className="w-24 h-24 bg-white p-1 rounded-full shadow-2xl mb-6 relative group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(227,27,35,0.6)] transition-all duration-500 ease-out group-hover:animate-pulse">
                  <img src={LOGO_URL} className="w-full h-full object-contain" alt="Logo" />
                  <div className="absolute bottom-0 right-0 bg-[#1877F2] text-white p-1.5 rounded-full border-2 border-white">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333.915-1.333h3.101v-5.029l-4.128-.022c-4.181 0-5.888 2.067-5.888 5.728v2.323z"/></svg>
                  </div>
               </div>
               <h3 className="font-condensed text-5xl font-black uppercase text-white mb-2 leading-none">TuttoXAndroid</h3>
               <p className="text-gray-400 font-medium text-sm mb-8 tracking-wide">Follower: 12.475 • Seguiti: 1</p>
               <span className="w-full max-w-sm bg-[#e31b23] text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-white group-hover:text-[#e31b23] transition-colors shadow-lg shadow-red-900/50">
                 Lascia un Like &rarr;
               </span>
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
         </a>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col bg-white font-inter ${layoutConfig.boxedLayout ? 'max-w-[1600px] mx-auto shadow-2xl border-x border-gray-100' : ''}`}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in fade-in duration-300">
           <div className="p-6 flex justify-between items-center border-b border-white/10">
              <img src={LOGO_URL} className="h-12 w-auto" alt="Logo" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {navCategories.map(cat => (
                <button key={cat} onClick={() => handleNavClick(cat)} className="block w-full text-left font-condensed text-4xl font-black uppercase text-white hover:text-red-500 transition-colors">
                  {cat}
                </button>
              ))}
              <div className="border-t border-white/10 pt-6 mt-6">
                 <button onClick={() => { handleFooterLinkClick('/about'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm font-bold uppercase text-gray-400 mb-4 hover:text-white">Chi Siamo</button>
                 <button onClick={() => { handleFooterLinkClick('/collab'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-sm font-bold uppercase text-gray-400 hover:text-white">Collabora</button>
              </div>
           </div>
           <div className="p-8 bg-[#e31b23] text-center">
              <p className="text-white font-black uppercase text-[10px] tracking-widest mb-4">Iscriviti alla community</p>
              <a href="https://t.me/tuttoxandroid" className="inline-block bg-white text-[#e31b23] px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Telegram</a>
           </div>
        </div>
      )}

      <header className="bg-black text-white relative shadow-2xl z-50">
        <div className="hidden md:flex justify-start items-center px-4 lg:px-8 py-2 absolute top-0 left-0 w-full z-20">
           <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <button onClick={() => handleFooterLinkClick('/about')} className="hover:text-white transition-colors">Chi Siamo</button>
              <button onClick={() => handleFooterLinkClick('/collab')} className="hover:text-white transition-colors">Lavora con noi</button>
              <span className="cursor-pointer hover:text-white transition-colors">Pubblicità</span>
              <span className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
           </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24 md:h-64 mt-0 relative">
            <div className={`cursor-pointer flex items-center h-full z-10 ${isSearchVisible ? 'hidden md:flex' : 'flex'}`} onClick={goToHome}>
              <div className="relative group transition-all duration-300">
                 <img 
                    src={LOGO_URL} 
                    alt="TuttoXAndroid" 
                    className="h-full md:h-[240px] w-auto object-contain origin-left ml-2 md:ml-0 transition-transform duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(227,27,35,0.3)]" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite] w-full h-full skew-x-12 pointer-events-none"></div>
              </div>
            </div>

            <nav className={`hidden lg:flex items-center gap-8 ${isSearchVisible ? 'hidden' : 'flex'}`}>
              {navCategories.slice(0, 7).map(nav => {
                const colorClasses = getNavColor(nav);
                const underlineBgClass = colorClasses.split(' ')[1];

                return (
                  <button key={nav} onMouseEnter={() => setActiveMegaMenu(nav)} onClick={() => handleNavClick(nav)} className={`text-lg font-condensed font-black uppercase tracking-wide transition-all relative group hover:opacity-100 opacity-90`}>
                    {nav}
                    <span className={`absolute bottom-0 left-0 h-0.5 ${underlineBgClass} transition-all ${activeCategory === nav ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </button>
                );
              })}
            </nav>

            <div className={`absolute inset-0 flex items-center justify-end z-20 ${isSearchVisible ? 'flex' : 'hidden'}`}>
              <div className="w-full h-full bg-black flex items-center px-4 md:px-0">
                <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cerca nel portale..." className="w-full bg-transparent border-b-2 border-[#e31b23] text-xl md:text-2xl font-black uppercase py-2 focus:outline-none text-white" />
                  <button type="submit" className="p-2 text-[#e31b23]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
                </form>
                <button onClick={toggleSearch} className="ml-4 p-2 text-gray-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>

            <button onClick={toggleSearch} className={`p-2 hover:text-[#c0ff8c] transition-colors ${isSearchVisible ? 'hidden' : 'block'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </div>

        <div className={`h-[4px] w-full ${getDividerColor()} shadow-md transition-colors duration-300`}></div>

        {activeMegaMenu && !isSearchVisible && (
          <MegaMenu 
            category={activeMegaMenu} 
            onClose={() => setActiveMegaMenu(null)} 
            articles={articles}
            onArticleClick={handleArticleClick}
          />
        )}
      </header>

      {/* LOADING STATE - Full screen loader if data is not ready */}
      {isLoading && articles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] bg-white">
          <div className="loader mb-4"></div>
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest animate-pulse">Caricamento notizie...</p>
        </div>
      ) : (
        <main className="flex-1 lg:mt-2 animate-in fade-in duration-500">
          {isAbout && <AboutPage />}
          {isCollab && <CollabPage />}

          {(isHome || isSearch) && (
            <>
              {isHome && layoutConfig.showTicker && (
                <TopStoriesMobile 
                  articles={topStories} 
                  onArticleClick={handleArticleClick} 
                  onMenuToggle={() => setIsMobileMenuOpen(true)}
                />
              )}

              <section className="bg-white">
                <div className="max-w-7xl mx-auto">
                  {isHome && activeCategory === 'Smartphone' && (
                    <SmartphoneShowcase />
                  )}

                  {isHome && heroArticle && (
                    <div className="w-full h-[auto] md:h-[550px] flex gap-2">
                      {layoutConfig.fixedSidebar && (
                        <DesktopSidebar 
                            articles={topStories.slice(1, 5)} 
                            onArticleClick={handleArticleClick} 
                        />
                      )}
                      
                      <div className="flex-1 h-full w-full">
                          <ArticleCard 
                            article={heroArticle} 
                            onClick={() => handleArticleClick(heroArticle)}
                            className="" 
                          />
                      </div>
                    </div>
                  )}

                  <div className="px-4 lg:px-0 py-4 lg:py-6 mt-2 lg:mt-0">
                    <div className="flex items-end justify-between mb-4 lg:mb-8">
                        <h3 className="font-condensed text-3xl lg:text-4xl font-black uppercase text-gray-900 italic tracking-tight leading-none">
                            {isSearch ? `Trovati ${filteredArticles.length} risultati` : 'In Evidenza'}
                        </h3>
                        <div className="hidden lg:flex gap-2">
                            <button onClick={() => scrollFeatured('left')} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#e31b23] transition-colors shadow-lg active:scale-90" aria-label="Scorri a sinistra">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => scrollFeatured('right')} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#e31b23] transition-colors shadow-lg active:scale-90" aria-label="Scorri a destra">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    <div 
                      ref={featuredScrollRef} 
                      className={`flex gap-4 lg:gap-8 overflow-x-auto no-scrollbar scroll-container snap-x snap-mandatory py-8 px-2 cursor-grab active:cursor-grabbing ${isDragging ? 'snap-none' : 'snap-x'}`}
                      onMouseDown={handleMouseDown}
                      onMouseLeave={handleMouseLeave}
                      onMouseUp={handleMouseUp}
                      onMouseMove={handleMouseMove}
                      style={{ scrollBehavior: isDragging ? 'auto' : 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {displayArticles.slice(0, 8).map(item => (
                          <div key={item.id} onClick={() => handleArticleClick(item)} className="w-[40%] md:w-[25%] lg:w-[22%] shrink-0 snap-start select-none">
                            <ArticleCard article={{...item, type: 'horizontal'}} onClick={() => handleArticleClick(item)} />
                          </div>
                        ))}
                    </div>
                  </div>

                  {isHome && (
                    <div ref={staticBannerRef}>
                      <SocialBannerMobile />
                    </div>
                  )}

                  {isHome && showStickyBanner && (
                    <SocialBannerMobile isFixed={true} />
                  )}

                  {isHome && deals.length > 0 && (
                    <div className="w-full">
                      <DealsSection />
                    </div>
                  )}
                </div>
              </section>

              <section 
                ref={newsSectionRef} 
                className="py-12 bg-gray-50/50"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="max-w-7xl mx-auto px-4">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-gray-200 pb-4">
                    <h3 className="font-condensed text-4xl font-black uppercase text-gray-900 italic tracking-tight leading-none">Ultime Notizie</h3>
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar mt-4 md:mt-0">
                      {['Tutti', ...navCategories].map(cat => {
                        const activeColorClass = 
                          cat === 'Smartphone' ? 'text-blue-600 border-blue-600' : 
                          cat === 'Modding' ? 'text-orange-500 border-orange-500' : 
                          cat === 'App & Giochi' ? 'text-green-500 border-green-500' : 
                          cat === 'Recensioni' ? 'text-purple-600 border-purple-600' : 
                          cat === 'Guide' ? 'text-cyan-600 border-cyan-600' : 
                          cat === 'Offerte' ? 'text-yellow-500 border-yellow-500' : 
                          cat === 'Wearable' ? 'text-pink-500 border-pink-500' : 
                          'text-[#e31b23] border-[#e31b23]';
                          
                        const hoverColorClass = 
                          cat === 'Smartphone' ? 'hover:text-blue-600' : 
                          cat === 'Modding' ? 'hover:text-orange-500' : 
                          cat === 'App & Giochi' ? 'hover:text-green-500' : 
                          cat === 'Recensioni' ? 'hover:text-purple-600' : 
                          cat === 'Guide' ? 'hover:text-cyan-600' : 
                          cat === 'Offerte' ? 'hover:text-yellow-500' : 
                          cat === 'Wearable' ? 'hover:text-pink-500' : 
                          'hover:text-[#e31b23]';

                        return (
                          <button 
                            key={cat} 
                            onClick={() => handleNavClick(cat)}
                            className={`text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors pb-1 ${activeCategory === cat ? `${activeColorClass} border-b-2` : `text-gray-400 ${hoverColorClass}`}`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-12 mb-8">
                          {displayArticles.slice(0, visibleNewsCount).map(item => (
                            <ArticleCard key={item.id} article={{...item, type: 'standard'}} onClick={() => handleArticleClick(item)} />
                          ))}
                      </div>
                      
                      {visibleNewsCount < displayArticles.length && (
                        <div className="flex justify-center mt-8">
                          <button 
                              onClick={loadMoreNews}
                              className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#e31b23] transition-colors shadow-lg active:scale-95"
                          >
                              Vedi altre {activeCategory === 'Tutti' ? 'Notizie' : activeCategory}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="hidden lg:block space-y-12">
                        <AdUnit slotId="sidebar-ad-1" format="rectangle" label="Sponsor" />
                        <SocialSidebar />
                        <AdUnit slotId="sidebar-ad-2" format="rectangle" label="Sponsor" />
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

          {isArticle && currentArticle && (
            <div className="bg-white">
              <TopStoriesMobile 
                articles={topStories} 
                onArticleClick={handleArticleClick} 
                onMenuToggle={() => setIsMobileMenuOpen(true)}
              />

              <ArticleDetail 
                article={currentArticle} 
                relatedArticle={articles.find(a => a.category === currentArticle.category && a.id !== currentArticle.id) || articles[0]}
                moreArticles={articles.filter(a => a.id !== currentArticle.id).slice(0, 4)}
                deals={deals}
                offerNews={articles.filter(a => a.category === 'Offerte' && a.id !== currentArticle.id).slice(0, 4)}
                onArticleClick={handleArticleClick}
              />
              
              <div className="py-12 text-center">
                  <button onClick={goToHome} className="bg-black text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                    Torna alla Home
                  </button>
              </div>
            </div>
          )}
          
          {isArticle && !currentArticle && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <h2 className="text-3xl font-black uppercase mb-4">Articolo non trovato</h2>
              <button onClick={goToHome} className="bg-[#e31b23] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest">
                Torna alla Home
              </button>
            </div>
          )}
        </main>
      )}

      <footer className={`bg-black text-white py-16 text-center ${showStickyBanner ? 'pb-24' : ''}`}>
         <img 
            src={LOGO_URL} 
            className="h-24 md:h-32 mx-auto mb-8 hover:scale-105 transition-transform duration-500 cursor-pointer" 
            alt="TuttoXAndroid"
            onClick={goToHome} 
         />
         
         <div className="flex flex-wrap justify-center gap-6 mb-8 text-[10px] font-bold uppercase tracking-widest text-gray-400">
           <button onClick={() => handleFooterLinkClick('/about')} className="hover:text-white hover:underline transition-all">Chi Siamo</button>
           <button onClick={() => handleFooterLinkClick('/collab')} className="hover:text-white hover:underline transition-all">Collabora con noi</button>
           <a href="#" className="hover:text-white hover:underline transition-all">Privacy Policy</a>
           <a href="#" className="hover:text-white hover:underline transition-all">Cookie Policy</a>
         </div>

         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">© 2025 TUTTOXANDROID.COM - DIGITAL EDITORIAL GROUP</p>
      </footer>
      
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-50 bg-black text-white p-3 rounded-full shadow-2xl hover:bg-[#e31b23] transition-colors border-2 border-white/10 animate-in slide-in-from-bottom-5"
          aria-label="Torna su"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
        </button>
      )}

      <CookieConsent />
      <GeminiAssistant />
    </div>
  );
};

export default App;
