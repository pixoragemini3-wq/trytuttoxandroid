
import React, { useState, useEffect, useRef } from 'react';
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
import AdUnit from './components/AdUnit'; // Import AdUnit
import DesktopSidebar from './components/DesktopSidebar'; // New Import

const App: React.FC = () => {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'article' | 'search'>('home');
  
  // New: Reading List for Infinite Stream
  const [readingList, setReadingList] = useState<Article[]>([]);
  
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
  
  // Infinite Scroll Sentinel Ref
  const loadMoreArticlesRef = useRef<HTMLDivElement>(null);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const newsSectionRef = useRef<HTMLDivElement>(null);

  const topStories = articles.slice(0, 8);
  const LOGO_URL = "https://i.imgur.com/l7YwbQe.png";

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const [bloggerPosts, bloggerDeals] = await Promise.all([
        fetchBloggerPosts(),
        fetchBloggerDeals()
      ]);
      const finalArticles = bloggerPosts.length > 0 ? bloggerPosts : MOCK_ARTICLES;
      
      // Merge mocked deals with real deals (real deals take precedence)
      const finalDeals = bloggerDeals.length > 0 ? bloggerDeals : MOCK_DEALS;
      
      setArticles(finalArticles);
      setDeals(finalDeals);
      setFilteredArticles(finalArticles); // Filter will be applied in render or helpers
    } catch (error) {
      console.error("Errore caricamento:", error);
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
      list = list.filter(a => a.category === activeCategory);
    }
    return list;
  };

  const displayArticles = getDisplayArticles();

  // Intersection Observer for Infinite Article Loading (Up to 5 articles)
  useEffect(() => {
    if (currentView !== 'article' || readingList.length >= 5) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadNextArticle();
      }
    }, { threshold: 0.1 });

    if (loadMoreArticlesRef.current) {
      observer.observe(loadMoreArticlesRef.current);
    }

    return () => observer.disconnect();
  }, [currentView, readingList]);

  // Logic to load the next article
  const loadNextArticle = () => {
    const currentIds = new Set(readingList.map(a => a.id));
    const available = articles.filter(a => !currentIds.has(a.id));
    
    if (available.length > 0) {
      const currentCategory = readingList[readingList.length - 1].category;
      let next = available.find(a => a.category === currentCategory);
      if (!next) next = available[0];
      if (next) setReadingList(prev => [...prev, next!]);
    }
  };

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

  const handleArticleClick = (article: Article) => {
    setReadingList([article]);
    setCurrentView('article');
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
    setCurrentView('search');
    setIsSearchVisible(false);
    setVisibleNewsCount(6); 
  };

  const handleNavClick = (nav: string) => {
    setCurrentView('home');
    setActiveCategory(nav);
    setVisibleNewsCount(6); 
    setFilteredArticles(articles); // Reset base filter, logic is in displayArticles
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      if (newsSectionRef.current) {
        newsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const goToHome = () => {
    setCurrentView('home');
    setReadingList([]);
    setSearchQuery('');
    setActiveCategory('Tutti');
    setVisibleNewsCount(6); 
    setFilteredArticles(articles);
    window.scrollTo(0, 0);
  };

  const loadMoreNews = () => {
    setVisibleNewsCount(prev => prev + 6);
  };

  const navCategories = ['News', 'Smartphone', 'Guide', 'Recensioni', 'Offerte', 'Tutorial', 'App & Giochi', 'Wearable', 'Modding'];

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
                <img src={deal.imageUrl} className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-1000" />
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

  return (
    <div className="min-h-screen flex flex-col bg-white font-inter">
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
           </div>
           <div className="p-8 bg-[#e31b23] text-center">
              <p className="text-white font-black uppercase text-[10px] tracking-widest mb-4">Iscriviti alla community</p>
              <a href="https://t.me/tuttoxandroid" className="inline-block bg-white text-[#e31b23] px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Telegram</a>
           </div>
        </div>
      )}

      <header className="bg-black text-white relative shadow-2xl z-50">
        {/* Header content... */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28 md:h-64 mt-0 md:mt-12 relative">
            <div className={`cursor-pointer flex items-center h-full z-10 ${isSearchVisible ? 'hidden md:flex' : 'flex'}`} onClick={goToHome}>
              <img src={LOGO_URL} alt="TuttoXAndroid" className="h-full md:h-80 w-auto object-contain py-0 scale-[1.25] origin-left ml-2 md:ml-0 md:scale-100" />
            </div>

            <nav className={`hidden lg:flex items-center gap-10 ${isSearchVisible ? 'hidden' : 'flex'}`}>
              {navCategories.slice(0, 6).map(nav => (
                <button key={nav} onMouseEnter={() => setActiveMegaMenu(nav)} onClick={() => handleNavClick(nav)} className="text-[11px] font-black uppercase tracking-[0.2em] hover:text-[#c0ff8c] transition-all relative group">
                  {nav}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c0ff8c] transition-all group-hover:w-full"></span>
                </button>
              ))}
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
        {activeMegaMenu && !isSearchVisible && <MegaMenu category={activeMegaMenu} onClose={() => setActiveMegaMenu(null)} />}
      </header>

      <main className="flex-1 lg:mt-2">
        {(currentView === 'home' || currentView === 'search') && (
          <>
            {currentView === 'home' && (
              <TopStoriesMobile 
                articles={topStories} 
                onArticleClick={handleArticleClick} 
                onMenuToggle={() => setIsMobileMenuOpen(true)}
              />
            )}

            <section className="bg-white">
              <div className="max-w-7xl mx-auto">
                {currentView === 'home' && heroArticle && (
                  <div className="w-full h-[350px] md:h-[550px] flex gap-2">
                     {/* Desktop Sidebar (Left of Hero) */}
                     <DesktopSidebar 
                        articles={topStories.slice(1, 5)} 
                        onArticleClick={handleArticleClick} 
                     />
                     
                     {/* Hero Article */}
                     <div className="flex-1 h-full w-full">
                        <ArticleCard 
                          article={heroArticle} 
                          onClick={() => handleArticleClick(heroArticle)}
                          className="" // Rimosso lg:rounded-l-none per avere bordi arrotondati e separazione
                        />
                     </div>
                  </div>
                )}

                <div className="px-4 lg:px-0 py-6">
                   <div className="flex items-end justify-between mb-8">
                       <h3 className="font-condensed text-3xl lg:text-4xl font-black uppercase text-gray-900 italic tracking-tight leading-none">
                          {currentView === 'search' ? `Trovati ${filteredArticles.length} risultati` : 'In Evidenza'}
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

                   <div ref={featuredScrollRef} className="flex gap-4 lg:gap-8 overflow-x-auto no-scrollbar scroll-container snap-x snap-mandatory pb-4">
                      {/* Show items that are not Hero */}
                      {displayArticles.slice(0, 8).map(item => (
                        <div key={item.id} onClick={() => handleArticleClick(item)} className="w-[40%] md:w-[30%] shrink-0 snap-start">
                          <ArticleCard article={{...item, type: 'horizontal'}} onClick={() => handleArticleClick(item)} />
                        </div>
                      ))}
                   </div>
                </div>

                {currentView === 'home' && (
                  <div ref={staticBannerRef}>
                    <SocialBannerMobile />
                  </div>
                )}

                {currentView === 'home' && showStickyBanner && (
                  <SocialBannerMobile isFixed={true} />
                )}

                {currentView === 'home' && deals.length > 0 && (
                  <div className="w-full">
                    <DealsSection />
                  </div>
                )}
              </div>
            </section>

            <section ref={newsSectionRef} className="py-12 bg-gray-50/50">
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

            {currentView === 'home' && (
              <div className="lg:hidden">
                <SocialSection />
              </div>
            )}
          </>
        )}

        {/* READING LIST MODE (Infinite Stream) */}
        {currentView === 'article' && (
          <div className="bg-white">
            <TopStoriesMobile 
               articles={topStories} 
               onArticleClick={handleArticleClick} 
               onMenuToggle={() => setIsMobileMenuOpen(true)}
            />

            {readingList.map((article, index) => {
               const related = articles.find(a => a.category === article.category && a.id !== article.id) || articles[0];
               const moreArticles = articles
                 .filter(a => a.id !== article.id && a.id !== related.id)
                 .slice(0, 4);
               
               // Filtra 4 notizie della categoria "Offerte" da mostrare nel widget dedicato
               const offerNews = articles
                 .filter(a => a.category === 'Offerte' && a.id !== article.id)
                 .slice(0, 4);

               return (
                  <ArticleDetail 
                    key={`${article.id}-${index}`} 
                    article={article} 
                    relatedArticle={related}
                    moreArticles={moreArticles}
                    deals={deals} // Pass deals to ArticleDetail
                    offerNews={offerNews} // Pass offerNews to ArticleDetail
                    onArticleClick={handleArticleClick}
                  />
               );
            })}
            
            {readingList.length < 5 && (
              <div ref={loadMoreArticlesRef} className="py-12 flex justify-center">
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-[#e31b23] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Caricamento prossimo articolo...</span>
                 </div>
              </div>
            )}
            
            {readingList.length >= 5 && (
              <div className="py-12 text-center">
                 <button onClick={goToHome} className="bg-black text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                   Torna alla Home
                 </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className={`bg-black text-white py-16 text-center ${showStickyBanner ? 'pb-24' : ''}`}>
         <img src={LOGO_URL} className="h-12 mx-auto mb-8" alt="TuttoXAndroid" />
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

    </div>
  );
};

export default App;
