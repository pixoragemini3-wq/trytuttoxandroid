
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

const App: React.FC = () => {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'article' | 'search'>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Tutti');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);

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
      const finalDeals = bloggerDeals.length > 0 ? bloggerDeals : MOCK_DEALS;
      setArticles(finalArticles);
      setDeals(finalDeals);
      setFilteredArticles(finalArticles.filter(a => a.type === 'standard' || !a.type).slice(0, 10));
    } catch (error) {
      console.error("Errore caricamento:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadContent(); }, []);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
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
  };

  const handleNavClick = (nav: string) => {
    setCurrentView('home');
    setActiveCategory(nav);
    if (nav === 'Tutti') {
       setFilteredArticles(articles.filter(a => a.type === 'standard' || !a.type));
    } else {
       setFilteredArticles(articles.filter(a => a.category === nav));
    }
    setIsMobileMenuOpen(false);
    // window.scrollTo(0, 0); // Removed scroll to top to keep context when filtering in-page
  };

  const goToHome = () => {
    setCurrentView('home');
    setSelectedArticle(null);
    setSearchQuery('');
    setActiveCategory('Tutti');
    setFilteredArticles(articles.slice(0, 10));
    window.scrollTo(0, 0);
  };

  const navCategories = ['News', 'Smartphone', 'Guide', 'Recensioni', 'Offerte', 'Tutorial', 'App & Giochi', 'Wearable', 'Modding'];

  // Helper component for Deals Section with Telegram CTA
  const DealsSection = () => (
    <section className="py-12 lg:py-24 bg-white border-t border-gray-100">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-10">
          {deals.map(deal => (
            <a key={deal.id} href={deal.link} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col hover:-translate-y-2 lg:hover:-translate-y-4 duration-500">
              <div className={`h-32 lg:h-64 flex items-center justify-center p-4 lg:p-12 ${deal.brandColor || 'bg-gray-50'}`}><img src={deal.imageUrl} className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-1000" /></div>
              <div className="p-4 lg:p-10 text-center flex-1 flex flex-col">
                <h4 className="font-black text-xs lg:text-xl text-gray-900 mb-2 leading-tight line-clamp-2">{deal.product}</h4>
                <div className="mt-auto">
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-4 mb-2 lg:mb-6">
                    <span className="text-lg lg:text-4xl font-black text-gray-900 tracking-tighter">{deal.newPrice}</span>
                    <span className="text-[10px] lg:text-base text-gray-300 line-through font-bold">{deal.oldPrice}</span>
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
              <img src={LOGO_URL} className="h-10 w-auto" alt="Logo" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-48 mt-0 md:mt-12 relative">
            <div className={`cursor-pointer flex items-center h-full z-10 ${isSearchVisible ? 'hidden md:flex' : 'flex'}`} onClick={goToHome}>
              <img src={LOGO_URL} alt="TuttoXAndroid" className="h-24 md:h-80 w-auto object-contain" />
            </div>

            <nav className={`hidden lg:flex items-center gap-10 ${isSearchVisible ? 'hidden' : 'flex'}`}>
              {navCategories.slice(0, 6).map(nav => (
                <button key={nav} onMouseEnter={() => setActiveMegaMenu(nav)} onClick={() => handleNavClick(nav)} className="text-[11px] font-black uppercase tracking-[0.2em] hover:text-[#c0ff8c] transition-all relative group">
                  {nav}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c0ff8c] transition-all group-hover:w-full"></span>
                </button>
              ))}
            </nav>

            {/* Search Overlay - SOLID bg-black to fix transparency */}
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

      <main className="flex-1">
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
                {currentView === 'home' && (
                  <div className="w-full h-[350px] md:h-[550px]">
                     {articles.length > 0 && <ArticleCard article={{...articles[0], type: 'hero'}} onClick={() => handleArticleClick(articles[0])} />}
                  </div>
                )}

                <div className="px-4 lg:px-0 py-6">
                   <h3 className="font-condensed text-3xl lg:text-4xl font-black uppercase text-gray-900 italic tracking-tight mb-8">
                      {currentView === 'search' ? `Trovati ${filteredArticles.length} risultati` : 'In Evidenza'}
                   </h3>
                   <div ref={featuredScrollRef} className="flex gap-4 lg:gap-8 overflow-x-auto no-scrollbar scroll-container snap-x snap-mandatory pb-4">
                      {filteredArticles.slice(0, 6).map(item => (
                        <div key={item.id} onClick={() => handleArticleClick(item)} className="w-[85%] md:w-[30%] shrink-0 snap-start">
                          <ArticleCard article={{...item, type: 'horizontal'}} onClick={() => handleArticleClick(item)} />
                        </div>
                      ))}
                   </div>
                </div>

                {/* Animated Social Banner after In Evidenza - Mobile Only */}
                {currentView === 'home' && <SocialBannerMobile />}

                {/* Offerte - Visible on Mobile AND Desktop now */}
                {currentView === 'home' && deals.length > 0 && (
                  <div className="w-full">
                    <DealsSection />
                  </div>
                )}
              </div>
            </section>

            <section className="py-12 bg-gray-50/50">
              <div className="max-w-7xl mx-auto px-4">
                
                {/* ULTIME NOTIZIE HEADER CON FILTRI */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-gray-200 pb-4">
                  <h3 className="font-condensed text-4xl font-black uppercase text-gray-900 italic tracking-tight leading-none">Ultime Notizie</h3>
                  <div className="flex items-center gap-6 overflow-x-auto no-scrollbar mt-4 md:mt-0">
                    {['Tutti', ...navCategories].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => handleNavClick(cat)}
                        className={`text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors pb-1 ${activeCategory === cat ? 'text-[#e31b23] border-b-2 border-[#e31b23]' : 'text-gray-400 hover:text-gray-900'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                   <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12">
                      {filteredArticles.map(item => (
                        /* Force type='standard' here to prevent Hero card from breaking the grid layout when filtering categories like News */
                        <ArticleCard key={item.id} article={{...item, type: 'standard'}} onClick={() => handleArticleClick(item)} />
                      ))}
                   </div>
                   <div className="hidden lg:block space-y-12">
                      <SocialSidebar />
                   </div>
                </div>
              </div>
            </section>

            {/* Social Hub - Mobile Placement */}
            {currentView === 'home' && (
              <div className="lg:hidden">
                <SocialSection />
              </div>
            )}
          </>
        )}

        {currentView === 'article' && selectedArticle && (
          <div className="bg-white px-4 py-12 max-w-4xl mx-auto">
             <span className="text-[#e31b23] font-black text-xs uppercase tracking-widest">{selectedArticle.category}</span>
             <h1 className="text-4xl md:text-6xl font-black text-gray-900 mt-4 mb-8 leading-tight">{selectedArticle.title}</h1>
             <img src={selectedArticle.imageUrl} className="w-full rounded-3xl mb-12 shadow-xl" alt={selectedArticle.title} />
             <div className="prose prose-lg max-w-none font-medium leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: selectedArticle.content || selectedArticle.excerpt }} />
             <button onClick={goToHome} className="mt-20 bg-black text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest block mx-auto">TUTTI GLI ARTICOLI</button>
          </div>
        )}
      </main>

      <footer className="bg-black text-white py-16 text-center">
         <img src={LOGO_URL} className="h-12 mx-auto mb-8" alt="TuttoXAndroid" />
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">© 2025 TUTTOXANDROID.COM - DIGITAL EDITORIAL GROUP</p>
      </footer>
      
    </div>
  );
};

export default App;
