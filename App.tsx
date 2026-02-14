
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_ARTICLES, MOCK_DEALS } from './constants';
import ArticleCard from './components/ArticleCard';
import MegaMenu from './components/MegaMenu';
import { Article, Deal } from './types';
import { fetchBloggerPosts, fetchBloggerDeals } from './services/bloggerService';
import GeminiAssistant from './components/GeminiAssistant';
import SocialSidebar from './components/SocialSidebar';

const FlippingSubscriptionCard: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 6000);
    return () => clearInterval(interval);
  }, [isFocused]);

  return (
    <div className="perspective-1000 w-full h-[400px]">
      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'flipped' : ''}`}>
        <div className="absolute inset-0 backface-hidden bg-black text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center">
          <div className="mb-8">
            <h4 className="font-condensed text-3xl md:text-4xl font-black mb-3 leading-none uppercase tracking-tight">TUTTOXANDROID NEWS</h4>
            <p className="text-[13px] text-gray-400 font-bold leading-tight opacity-90">
              Le migliori guide e le ultime news Android via mail.
            </p>
          </div>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <input 
                type="email" 
                placeholder="Indirizzo Email" 
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-[#111827] border-[3px] border-white rounded-2xl px-6 py-5 text-base text-white placeholder:text-gray-500 focus:outline-none transition-all font-medium" 
              />
            </div>
            <button className="w-full bg-[#e31b23] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.15em] hover:bg-white hover:text-black transition-all shadow-xl active:scale-95">
              ISCRIVITI
            </button>
          </form>
        </div>
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0088cc] text-white p-10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center">
           <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-xl relative z-10">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg>
           </div>
           <h4 className="font-condensed text-3xl font-black uppercase mb-1 relative z-10 leading-none">Siamo su Telegram</h4>
           <p className="text-[10px] text-blue-100 mb-8 font-bold uppercase tracking-widest relative z-10">Offerte tech e anteprime ogni giorno.</p>
           <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="w-full bg-white text-[#0088cc] py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl text-center relative z-10">Unisciti</a>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
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

  const LOGO_URL = "https://i.imgur.com/l7YwbQe.png";

  const checkUrlRouting = (allArticles: Article[]) => {
    const path = window.location.pathname;
    if (path.endsWith('.html')) {
      const found = allArticles.find(a => {
        if (!a.url) return false;
        return a.url.includes(path) || path.includes(a.url.replace(/https?:\/\/[^\/]+/, ''));
      });
      
      if (found) {
        setSelectedArticle(found);
        setCurrentView('article');
        return true;
      }
    } else {
      setCurrentView('home');
      setSelectedArticle(null);
    }
    return false;
  };

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
      
      checkUrlRouting(finalArticles);
    } catch (error) {
      console.error("Errore caricamento contenuti:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
    const handlePopState = () => checkUrlRouting(articles);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [articles.length]);

  const handleCategoryFilter = (cat: string) => {
    setActiveCategory(cat);
    setCurrentView('home');
    if (cat === 'Tutti') {
      setFilteredArticles(articles.filter(a => a.type === 'standard' || !a.type).slice(0, 10));
    } else {
      setFilteredArticles(articles.filter(a => a.category === cat));
    }
  };

  const handleArticleClick = (article: Article) => {
    window.history.pushState({}, '', article.url || '#');
    setSelectedArticle(article);
    setCurrentView('article');
    window.scrollTo(0, 0);
  };

  const handleNavClick = (nav: string) => {
    window.history.pushState({}, '', '/');
    setCurrentView('home');
    setActiveCategory(nav);
    setFilteredArticles(articles.filter(a => a.category === nav));
    setActiveMegaMenu(null);
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
    
    const results = articles.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredArticles(results);
    setCurrentView('search');
    setIsSearchVisible(false);
  };

  const goToHome = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('home');
    setSelectedArticle(null);
    setSearchQuery('');
    setActiveCategory('Tutti');
    setFilteredArticles(articles.filter(a => a.type === 'standard' || !a.type).slice(0, 10));
    window.scrollTo(0, 0);
  };

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (featuredScrollRef.current) {
      const scrollAmount = featuredScrollRef.current.clientWidth * 0.8;
      featuredScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const navCategories = ['News', 'Smartphone', 'Guide', 'Recensioni', 'Offerte', 'Tutorial', 'App & Giochi', 'Wearable', 'Modding'];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <img src={LOGO_URL} alt="Loading..." className="h-64 mb-8 animate-pulse" />
          <div className="w-12 h-12 border-4 border-[#e31b23] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-condensed text-2xl font-black uppercase tracking-widest text-gray-900 italic">Sincronizzazione in corso...</p>
        </div>
      </div>
    );
  }

  const topStories = articles
    .filter(a => a.type === 'mini' || a.type === 'standard' || !a.type)
    .slice(0, 10);

  const suggestedArticles = articles
    .filter(a => selectedArticle && a.id !== selectedArticle.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden font-inter">
      <div className="bg-black/10 backdrop-blur-sm py-1.5 hidden md:block absolute top-0 w-full z-[60]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-white/50">
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-[#e31b23] rounded-full animate-pulse"></span>
            SAMSUNG GALAXY S25 ULTRA: SCOPRI TUTTE LE NOVITÀ
          </span>
          <span className="text-white/10">|</span>
          <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener" className="text-[#e31b23] hover:text-[#c0ff8c] transition-colors cursor-pointer">TELEGRAM OFFERTE &rarr;</a>
        </div>
      </div>

      <header className="bg-black text-white relative shadow-2xl z-50 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24 md:h-48 mt-6 md:mt-12 relative">
            <div className={`cursor-pointer flex items-center h-full relative z-10 transition-all duration-300 ${isSearchVisible ? 'opacity-20 md:opacity-100' : 'opacity-100'}`} onClick={goToHome}>
              <img src={LOGO_URL} alt="TuttoXAndroid" className="h-48 md:h-80 w-auto object-contain transition-transform duration-300 hover:scale-105" />
            </div>

            <nav className={`hidden lg:flex items-center gap-10 transition-all duration-300 ${isSearchVisible ? 'opacity-0 invisible translate-y-2' : 'opacity-100 visible translate-y-0'}`}>
              {navCategories.slice(0, 6).map(nav => (
                <button key={nav} onMouseEnter={() => setActiveMegaMenu(nav)} onClick={() => handleNavClick(nav)} className="text-[11px] font-black uppercase tracking-[0.2em] hover:text-[#c0ff8c] transition-all relative group py-1">
                  {nav}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#c0ff8c] transition-all group-hover:w-full"></span>
                </button>
              ))}
            </nav>

            <div className={`absolute inset-0 flex items-center justify-end pointer-events-none transition-all duration-300 ${isSearchVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              <div className="w-full max-w-3xl pointer-events-auto bg-black h-full flex items-center justify-end pr-4 md:pr-0">
                <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center mr-4">
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cerca nel portale..." className="w-full bg-transparent border-b-2 border-[#e31b23] text-xl md:text-2xl font-condensed font-black uppercase tracking-tight py-2 focus:outline-none placeholder:text-gray-700 text-white" />
                  <button type="submit" className="absolute right-0 p-2 text-[#e31b23] hover:text-[#c0ff8c] hover:scale-110 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
                </form>
                <button onClick={toggleSearch} className="p-2 text-gray-500 hover:text-white transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>

            {!isSearchVisible && (
              <button onClick={toggleSearch} className="p-2 hover:text-[#c0ff8c] transition-colors relative z-10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            )}
          </div>
        </div>
        {activeMegaMenu && !isSearchVisible && <MegaMenu category={activeMegaMenu} onClose={() => setActiveMegaMenu(null)} />}
      </header>

      <main className="flex-1">
        {(currentView === 'home' || currentView === 'search') && (
          <>
            <section className="py-12 bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-10">
                  <div className="lg:w-1/4">
                    <div className="bg-yellow-400 p-8 rounded-[2.5rem] shadow-sm h-full flex flex-col min-h-[600px]">
                      <h2 className="font-condensed text-4xl font-black mb-8 leading-none text-gray-900 uppercase italic">Top Stories</h2>
                      <div className="space-y-6 flex-1">
                        {topStories.map((item, idx) => (
                          <div key={idx} className="group cursor-pointer border-b border-black/10 pb-5 last:border-0" onClick={() => handleArticleClick(item)}>
                            <span className="text-[9px] font-black text-gray-700 uppercase mb-1.5 block tracking-widest group-hover:text-black transition-colors">{item.category}</span>
                            <h4 className="text-[14px] font-bold leading-tight group-hover:text-[#e31b23] text-gray-900 line-clamp-2">{item.title}</h4>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-3/4 flex flex-col gap-12">
                    {currentView === 'home' && (
                      <div className="w-full h-[550px]">
                         {articles.length > 0 && <ArticleCard article={{...articles[0], type: 'hero'}} onClick={() => handleArticleClick(articles[0])} />}
                      </div>
                    )}

                    <div className="group/section relative">
                      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                         <div>
                            <h3 className="font-condensed text-4xl font-black uppercase text-gray-900 italic tracking-tight leading-none mb-3">
                              {currentView === 'search' ? `Trovati ${filteredArticles.length} articoli` : 'In Evidenza'}
                            </h3>
                            <div className="sparkle-line rounded-full w-48 group-hover/section:w-full transition-all duration-700"></div>
                         </div>
                         
                         <div className="flex gap-2 mt-4 md:mt-0">
                            <button onClick={() => scrollFeatured('left')} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 hover:bg-[#c0ff8c] transition-all active:scale-90">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                            </button>
                            <button onClick={() => scrollFeatured('right')} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 hover:bg-[#c0ff8c] transition-all active:scale-90">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                            </button>
                         </div>
                      </div>
                      
                      <div ref={featuredScrollRef} className="flex gap-8 overflow-x-auto no-scrollbar scroll-container snap-x snap-mandatory pb-4">
                        {(currentView === 'search' ? filteredArticles : articles.filter(a => a.type === 'standard' || !a.type).slice(0, 6)).map(item => (
                          <div key={item.id} onClick={() => handleArticleClick(item)} className="w-full md:w-[calc(33.33%-1.35rem)] shrink-0 snap-start">
                            <ArticleCard article={{...item, type: 'horizontal'}} onClick={() => handleArticleClick(item)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {currentView === 'home' && (
              <section className="py-12 bg-gray-50/30 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-gray-100 pb-6">
                     <h3 className="font-condensed text-5xl font-black uppercase text-gray-900 italic leading-none">Ultime Notizie</h3>
                     <div className="flex-1 md:max-w-2xl scroll-fade-right">
                        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
                          {['Tutti', ...navCategories].map(cat => (
                            <button key={cat} onClick={() => handleCategoryFilter(cat)} className={`text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all relative pb-2 group ${activeCategory === cat ? 'text-[#e31b23]' : 'text-gray-400 hover:text-[#a6e076]'}`}>
                              {cat}
                              <span className={`absolute bottom-0 left-0 h-0.5 bg-[#e31b23] transition-all duration-300 ${activeCategory === cat ? 'w-full' : 'w-0 group-hover:w-1/2 group-hover:bg-[#a6e076]'}`}></span>
                            </button>
                          ))}
                        </div>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                        {filteredArticles.map(item => (
                          <div key={item.id} onClick={() => handleArticleClick(item)} className="cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <ArticleCard article={item} onClick={() => handleArticleClick(item)} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-12">
                      <FlippingSubscriptionCard />
                      <SocialSidebar />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {currentView === 'home' && deals.length > 0 && (
              <section className="py-24 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div><h2 className="font-condensed text-7xl font-black uppercase tracking-tight text-gray-900 italic leading-none">Offerte del Giorno</h2></div>
                    <button className="text-[11px] font-black uppercase tracking-[0.2em] bg-black text-white px-10 py-4 rounded-full hover:bg-[#c0ff8c] hover:text-black transition-all shadow-xl">Esplora Tutte &rarr;</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {deals.map(deal => (
                      <a key={deal.id} href={deal.link} target="_blank" rel="noopener noreferrer" className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col hover:-translate-y-4 duration-500">
                        <div className={`h-64 flex items-center justify-center p-12 ${deal.brandColor || 'bg-gray-50'}`}><img src={deal.imageUrl} alt={deal.product} className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-1000" /></div>
                        <div className="p-10 text-center flex-1 flex flex-col">
                          <h4 className="font-black text-xl text-gray-900 mb-6 leading-tight group-hover:text-[#a6e076] transition-colors">{deal.product}</h4>
                          <div className="mt-auto">
                            <div className="flex items-center justify-center gap-4 mb-6">
                              <span className="text-4xl font-black text-gray-900 tracking-tighter">{deal.newPrice}</span>
                              <span className="text-base text-gray-300 line-through font-bold">{deal.oldPrice}</span>
                            </div>
                            <span className="inline-block bg-red-50 text-[#e31b23] text-[11px] font-black uppercase px-8 py-3.5 rounded-full tracking-widest border border-red-100 group-hover:bg-[#c0ff8c] group-hover:text-black group-hover:border-transparent transition-all">{deal.saveAmount}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {currentView === 'article' && selectedArticle && (
          <div className="bg-white">
            <article className="max-w-4xl mx-auto px-4 py-12 md:py-16 animate-in fade-in duration-700">
               <div className="mb-6 flex items-center gap-6">
                 <span className="bg-[#e31b23] text-white px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl">{selectedArticle.category}</span>
                 <span className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em]">{selectedArticle.date}</span>
               </div>
               <h1 className="font-condensed text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-8 leading-tight text-gray-900 tracking-tight">{selectedArticle.title}</h1>
               <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100"><span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">DI {selectedArticle.author.toUpperCase()}</span></div>
               <img src={selectedArticle.imageUrl} className="w-full h-auto max-h-[500px] object-cover rounded-[3rem] mb-12 shadow-2xl" alt="" />
               <div className="prose prose-lg md:prose-xl max-w-none text-gray-800 font-medium leading-relaxed selection:bg-[#c0ff8c]" dangerouslySetInnerHTML={{ __html: selectedArticle.content || selectedArticle.excerpt }} />
               <div className="my-16 p-8 bg-blue-50 border-2 border-blue-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-sm group cursor-pointer hover:border-[#c0ff8c] transition-colors">
                  <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:bg-[#a6e076] transition-colors"><svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg></div>
                  <div className="flex-1 text-center md:text-left"><h4 className="text-2xl font-black uppercase text-blue-900 mb-2 leading-none group-hover:text-black transition-colors">Canale Telegram Offerte</h4><p className="text-sm text-blue-700 font-bold uppercase tracking-wide">Iscriviti per non perdere sconti e promozioni tech in tempo reale!</p></div>
                  <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#c0ff8c] hover:text-black transition-all shadow-xl active:scale-95 whitespace-nowrap text-center">Unisciti Ora</a>
               </div>
               <div className="mt-20 pt-12 border-t border-gray-100">
                  <h3 className="font-condensed text-4xl font-black uppercase italic text-gray-900 mb-10 tracking-tight">Articoli Suggeriti</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">{suggestedArticles.map(item => (<div key={item.id} onClick={() => handleArticleClick(item)} className="cursor-pointer group flex gap-5 items-center"><div className="w-32 h-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-sm"><img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" /></div><div><span className="text-[#e31b23] text-[8px] font-black uppercase tracking-widest mb-1 block group-hover:text-[#a6e076] transition-colors">{item.category}</span><h4 className="text-sm font-bold leading-tight group-hover:text-[#a6e076] transition-colors text-gray-900 line-clamp-2 uppercase">{item.title}</h4></div></div>))}</div>
               </div>
               <div className="mt-24 border-t border-gray-100 pt-12 flex justify-center"><button onClick={goToHome} className="bg-black text-white px-16 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-[#c0ff8c] hover:text-black transition-all shadow-2xl active:scale-95">&larr; Torna alla Home</button></div>
            </article>
          </div>
        )}
      </main>

      <footer className="bg-black text-white pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-24 mb-24">
              <div className="col-span-1">
                <img src={LOGO_URL} className="h-64 w-auto mb-10 mx-auto md:mx-0" alt="TuttoXAndroid" />
                <p className="text-gray-500 font-bold text-base leading-relaxed max-w-sm text-center md:text-left">Dal 2012, il tuo punto di riferimento quotidiano per l'universo Android, la tecnologia e le migliori offerte online.</p>
              </div>
              <div className="col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-12">
                 <div><h5 className="font-black uppercase text-[11px] tracking-[0.2em] text-[#e31b23] mb-10 underline underline-offset-[12px] decoration-2">Contenuti</h5><ul className="space-y-5 text-sm font-black text-gray-600 uppercase tracking-widest"><li onClick={() => handleNavClick('News')} className="hover:text-[#c0ff8c] cursor-pointer transition-colors">News Android</li><li onClick={() => handleNavClick('Recensioni')} className="hover:text-[#c0ff8c] cursor-pointer transition-colors">Recensioni Smartphone</li><li onClick={() => handleNavClick('Offerte')} className="hover:text-[#c0ff8c] cursor-pointer transition-colors">Offerte Tech</li></ul></div>
                 <div><h5 className="font-black uppercase text-[11px] tracking-[0.2em] text-[#e31b23] mb-10 underline underline-offset-[12px] decoration-2">Community</h5><ul className="space-y-5 text-sm font-black text-gray-600 uppercase tracking-widest"><li className="hover:text-[#c0ff8c] cursor-pointer transition-colors">Canale Telegram</li><li className="hover:text-[#c0ff8c] cursor-pointer transition-colors">Instagram</li><li className="hover:text-[#c0ff8c] cursor-pointer transition-colors">Canale YouTube</li></ul></div>
              </div>
           </div>
           <div className="border-t border-gray-900 pt-16 flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] font-black uppercase tracking-[0.35em] text-gray-800"><span>© 2025 TUTTOXANDROID.COM - Part of XMedia Tech Group Italy</span><span className="text-gray-800 hover:text-gray-400 transition-colors cursor-default">Professional Tech Editorial Portal</span></div>
        </div>
      </footer>
      
      <GeminiAssistant />
    </div>
  );
};

export default App;
