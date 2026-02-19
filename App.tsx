
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_ARTICLES, MOCK_DEALS, NAV_CATEGORIES, LOGO_URL } from './constants';
import ArticleCard from './components/ArticleCard';
import { Article, Deal } from './types';
import { fetchBloggerPosts, fetchBloggerDeals } from './services/bloggerService';
import SocialSidebar from './components/SocialSidebar';
import SocialSection from './components/SocialSection';
import TopStoriesMobile from './components/TopStoriesMobile';
import SocialBannerMobile from './components/SocialBannerMobile';
import ArticleDetail from './components/ArticleDetail';
import AdUnit from './components/AdUnit'; 
import DesktopSidebar from './components/DesktopSidebar'; 
import { AboutPage, CollabPage } from './components/StaticPages'; 
import Layout from './components/Layout';

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
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination
  const [visibleNewsCount, setVisibleNewsCount] = useState(6);
  
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

  // Drag Scroll
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const topStories = articles.slice(0, 8);

  // --- ROUTER LOGIC ---
  const isAbout = location.pathname === '/about';
  const isCollab = location.pathname === '/collab';
  // Article detection: Ends with .html OR starts with /article/ (legacy)
  const isArticle = location.pathname.endsWith('.html') || location.pathname.startsWith('/article/');
  const isSearch = location.pathname === '/search';
  const isHome = !isAbout && !isCollab && !isArticle && !isSearch;

  // Function to extract the current article based on URL
  const getCurrentArticle = () => {
    // 1. Priority: Check if we have a Single Post injected by the XML Template
    const injectedPost = (window as any).currentSinglePost;
    if (injectedPost && location.pathname.endsWith('.html')) {
       try {
         const injectedPath = new URL(injectedPost.url).pathname;
         if (injectedPath === location.pathname) {
            return injectedPost as Article;
         }
       } catch(e) {}
       return injectedPost as Article;
    }

    // 2. Search in loaded articles array
    if (!isArticle) return undefined;
    
    // Simplification for Sandbox: Match by ID first if path is /article/:id
    if (location.pathname.startsWith('/article/')) {
       const parts = location.pathname.split('/');
       const id = parts[parts.length - 1];
       const foundById = articles.find(a => a.id === id);
       if (foundById) return foundById;
    }

    const currentPath = decodeURIComponent(location.pathname);
    
    // Match by URL Path (Legacy for real blogger urls)
    let found = articles.find(a => {
      if (!a.url) return false;
      try {
        const aPath = new URL(a.url).pathname;
        return aPath === currentPath;
      } catch(e) { return false; }
    });
    
    return found;
  };

  const currentArticle = getCurrentArticle();

  // Load Initial Content
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
      setArticles(MOCK_ARTICLES);
      setDeals(MOCK_DEALS);
      setFilteredArticles(MOCK_ARTICLES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadContent(); }, []);

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
    
    // Simple logic placeholder: could navigate categories or articles
    if (isLeftSwipe || isRightSwipe) {
      // Implement specific swipe action here if needed
    }
  };

  // Navigation Logic
  const handleArticleClick = (article: Article) => {
    if (isDragging) return;
    
    // Deal Links (External)
    if (article.category === 'Offerte' && article.dealData?.link) {
       window.open(article.dealData.link, '_blank');
       return;
    }
    
    setActiveMegaMenu(null);
    
    // FIX FOR SANDBOX: Always use internal ID-based routing
    // This bypasses issues with external URL structures in the iframe
    navigate(`/article/${article.id}`);
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
    
    // REMOVED SCROLL LOGIC to prevent "mini scroll fastidioso"
    // The view simply updates the list below.
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

  const loadMoreNews = () => {
    setVisibleNewsCount(prev => prev + 6);
  };

  // Hero Logic
  const getHeroArticle = (): Article | undefined => {
    const featured = articles.find(a => a.featured === true);
    if (featured) return { ...featured, type: 'hero' };
    return articles.length > 0 ? { ...articles[0], type: 'hero' } : undefined;
  };

  const heroArticle = getHeroArticle();
  
  const getDisplayArticles = () => {
    let list = articles;
    const target = activeCategory.toLowerCase().trim();

    // In filtered view, we might include the Hero article in the list if it matches criteria, 
    // but typically we want distinct lists.
    // If we are in "Tutti", we exclude Hero to avoid duplication if Hero is rendered separately.
    if (activeCategory === 'Tutti' && heroArticle) {
       list = list.filter(a => a.id !== heroArticle.id);
    }
    
    if (activeCategory !== 'Tutti') {
      // Broad Keyword Matching
      const categoryKeywords: Record<string, string[]> = {
        'smartphone': ['smartphone', 'cellulare', 'telefono', 'samsung', 'xiaomi', 'redmi', 'poco', 'pixel', 'oneplus', 'oppo', 'realme', 'honor', 'motorola', 'asus', 'sony', 'nothing', 'vivo', 'iphone', 'android'],
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
        
        // 1. Direct match on Category Name or Tag
        if (articleCategory === target) return true;
        if (articleTags.includes(target)) return true;
        
        // 2. Special case for "App & Giochi"
        if (target === 'app & giochi') {
             if (articleTags.some(t => t.includes('app') || t.includes('giochi') || t.includes('game'))) return true;
             if (articleCategory.includes('app') || articleCategory.includes('giochi')) return true;
        }

        // 3. Keyword Mapping Match
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
  
  const displayArticles = getDisplayArticles();

  const DealsSection = () => (
    <section className="py-6 lg:py-8 bg-gradient-to-r from-gray-900 via-gray-900 to-[#e31b23] text-white rounded-[1.5rem] mx-0 lg:mx-0 overflow-hidden shadow-2xl relative border-t-4 border-[#e31b23]">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
             <h2 className="font-condensed text-3xl lg:text-5xl font-black uppercase tracking-tight italic leading-none text-white drop-shadow-lg">Offerte del Giorno</h2>
             <span className="bg-white text-[#e31b23] px-3 py-1 rounded text-xs font-black uppercase tracking-widest shadow-md animate-pulse">HOT</span>
             
             {/* Telegram Button - Enhanced Size & Visibility */}
             <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#24A1DE] hover:bg-white pl-2 pr-6 py-2 rounded-full transition-all group shadow-xl border-2 border-white/20 ml-0 md:ml-6 hover:scale-105 hover:shadow-2xl cursor-pointer">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-0.5 shadow-md">
                    <img src="https://i.imgur.com/Ux19qMB.png" className="w-full h-full object-cover rounded-full" alt="Icon" />
                 </div>
                 <div className="flex flex-col leading-none">
                   <span className="text-[10px] font-black uppercase text-white/90 group-hover:text-[#24A1DE] mb-0.5">Canale Ufficiale</span>
                   <span className="text-sm font-black uppercase tracking-wide text-white group-hover:text-[#24A1DE]">Offerte Italy</span>
                 </div>
                 <svg className="w-5 h-5 ml-2 text-white group-hover:text-[#24A1DE] opacity-80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
             </a>
          </div>
          <div className="hidden md:flex items-center gap-2">
               <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></span>
               <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Aggiornate in tempo reale</p>
            </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Deals Cards - Now showing 4 deals */}
          {deals.slice(0, 4).map(deal => (
            <a key={deal.id} href={deal.link} target="_blank" rel="noopener noreferrer" className="bg-black/30 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-lg hover:bg-black/50 transition-all group flex items-center gap-3 p-2 hover:-translate-y-1 duration-300 hover:border-[#e31b23]/50">
              <div className="w-16 h-16 shrink-0 bg-white rounded-lg p-1.5 flex items-center justify-center">
                <img src={deal.imageUrl} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[11px] text-white mb-1 leading-tight line-clamp-2 group-hover:text-yellow-400 transition-colors">{deal.product}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-base font-black text-yellow-400 tracking-tight">{deal.newPrice}</span>
                    <span className="text-[9px] text-gray-400 line-through font-bold">{deal.oldPrice}</span>
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
               </div>
               <div className="flex flex-col items-center text-center mt-4">
                   <h3 className="font-condensed text-6xl md:text-7xl font-black uppercase italic leading-none text-white drop-shadow-lg transform -skew-x-6">ANDROID<br/>ITALY</h3>
               </div>
               <div className="flex items-center justify-between mt-auto">
                   <span className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest group-hover:bg-white group-hover:text-[#0066FF] transition-colors shadow-xl">Unisciti al Gruppo &rarr;</span>
               </div>
            </div>
         </a>
         <a href="https://www.facebook.com/tuttoxandroidcom/?ref=embed_page" target="_blank" rel="noopener noreferrer" className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#333333] to-[#000000]"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-center items-center z-10 text-center">
               <div className="w-24 h-24 bg-white p-1 rounded-full shadow-2xl mb-6 relative group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(227,27,35,0.6)] transition-all duration-500 ease-out group-hover:animate-pulse">
                  <img src={LOGO_URL} className="w-full h-full object-contain" alt="Logo" />
               </div>
               <h3 className="font-condensed text-5xl font-black uppercase text-white mb-2 leading-none">TuttoXAndroid</h3>
               <span className="w-full max-w-sm bg-[#e31b23] text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-white group-hover:text-[#e31b23] transition-colors shadow-lg shadow-red-900/50">Lascia un Like &rarr;</span>
            </div>
         </a>
      </div>
    </div>
  );

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
        {/* Loading */}
        {isLoading && articles.length === 0 && !currentArticle && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] bg-white">
            <div className="loader mb-4"></div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest animate-pulse">Caricamento...</p>
          </div>
        )}

        {/* --- STATIC PAGES --- */}
        {isAbout && <AboutPage />}
        {isCollab && <CollabPage />}

        {/* --- ARTICLE DETAIL VIEW --- */}
        {(isArticle && (currentArticle || location.pathname.endsWith('.html'))) && (
           <div className="bg-white">
              {currentArticle ? (
                <ArticleDetail 
                  article={currentArticle} 
                  relatedArticle={articles.find(a => a.category === currentArticle.category && a.id !== currentArticle.id) || articles[0]}
                  moreArticles={articles.filter(a => a.id !== currentArticle.id).slice(0, 4)}
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
            {isHome && layoutConfig.showTicker && (
              <TopStoriesMobile 
                articles={topStories} 
                onArticleClick={handleArticleClick} 
                onMenuToggle={() => setIsMobileMenuOpen(true)}
              />
            )}

            <section className="bg-white min-h-screen">
              <div className="max-w-7xl mx-auto">
                {isHome && activeCategory === 'Smartphone' && (
                  <SmartphoneShowcase />
                )}

                {/* HERO SECTION - STATIC (Visible on Home regardless of sub-category filter, unless in Search) */}
                {isHome && heroArticle && (
                  <div className="w-full h-[auto] md:h-[420px] lg:h-[420px] flex gap-2">
                    {layoutConfig.fixedSidebar && (
                      <DesktopSidebar 
                          articles={topStories.slice(1, 10)} 
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

                {/* FEATURED CAROUSEL - STATIC (Visible on Home regardless of sub-category) */}
                {isHome && (
                  <div className="px-4 lg:px-0 py-2 mt-1 mb-0">
                    <div className="flex items-end justify-between mb-2">
                        <h3 className="font-condensed text-2xl lg:text-3xl font-black uppercase text-gray-900 italic tracking-tight leading-none">
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
                        {/* Always use the full article list for Featured Carousel to keep it static */}
                        {articles.slice(0, 10).map(item => (
                          <div key={item.id} onClick={() => handleArticleClick(item)} className="w-[40%] md:w-[22%] lg:w-[18%] shrink-0 snap-start select-none">
                            <ArticleCard article={{...item, type: 'horizontal'}} onClick={() => handleArticleClick(item)} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {isHome && activeCategory === 'Tutti' && (
                  <div ref={staticBannerRef}>
                    <SocialBannerMobile />
                  </div>
                )}

                {isHome && showStickyBanner && (
                  <SocialBannerMobile isFixed={true} />
                )}

                {isHome && activeCategory === 'Tutti' && deals.length > 0 && (
                  <div className="w-full mt-2 mb-8">
                    <DealsSection />
                  </div>
                )}
              </div>
            </section>

            <section 
              ref={newsSectionRef} 
              className="py-12 bg-gray-50/50 min-h-[500px]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove} 
              onTouchEnd={handleTouchEnd} 
            >
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-gray-200 pb-4">
                  <h3 className="font-condensed text-4xl font-black uppercase text-gray-900 italic tracking-tight leading-none">
                     {activeCategory === 'Tutti' ? 'Ultime Notizie' : activeCategory}
                  </h3>
                  <div className="flex items-center gap-6 overflow-x-auto no-scrollbar mt-4 md:mt-0">
                    {['Tutti', ...NAV_CATEGORIES].map(cat => {
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
                    {displayArticles.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-12 mb-8">
                          {displayArticles.slice(0, visibleNewsCount).map(item => (
                            <ArticleCard key={item.id} article={{...item, type: 'standard'}} onClick={() => handleArticleClick(item)} />
                          ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">Nessun articolo trovato in questa categoria.</p>
                        <p className="text-xs text-gray-300 mt-2">Prova a cercare un altro termine o torna alla home.</p>
                        <button onClick={() => setActiveCategory('Tutti')} className="mt-6 bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#e31b23] transition-colors">Vedi tutti gli articoli</button>
                      </div>
                    )}
                    
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

        {/* 404 Fallback */}
        {isArticle && !currentArticle && !isLoading && !location.pathname.endsWith('.html') && (
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
