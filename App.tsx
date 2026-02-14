
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_ARTICLES, MOCK_DEALS } from './constants';
import ArticleCard from './components/ArticleCard';
import MegaMenu from './components/MegaMenu';
import { Article, Deal } from './types';
import { fetchBloggerPosts, fetchBloggerDeals } from './services/bloggerService';
import GeminiAssistant from './components/GeminiAssistant';
import SocialSidebar from './components/SocialSidebar';
import SocialSection from './components/SocialSection';
import TopStoriesMobile from './components/TopStoriesMobile';

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
              <img src={LOGO_URL} alt="TuttoXAndroid" className="h-40 md:h-80 w-auto object-contain transition-transform duration-300 hover:scale-105" />
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
            {/* Top Stories Mobile - "Un pezzetto giallo" compatto */}
            {currentView === 'home' && (
              <TopStoriesMobile articles={topStories} onArticleClick={handleArticleClick} />
            )}

            <section className="py-0 lg:py-12 bg-white">
              <div className="max-w-7xl mx-auto px-0 lg:px-4">
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-10">
                  {/* Sidebar Desktop - Nascosta su mobile */}
                  <div className="hidden lg:block lg:w-1/4">
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

                  <div className="w-full lg:w-3/4 flex flex-col gap-8 lg:gap-12">
                    {/* Hero Article - La notizia principale subito visibile */}
                    {currentView === 'home' && (
                      <div className="w-full h-[450px] md:h-[550px]">
                         {articles.length > 0 && <ArticleCard article={{...articles[0], type: 'hero'}} onClick={() => handleArticleClick(articles[0])} />}
                      </div>
                    )}

                    {/* Featured / In Evidenza - Scroll orizzontale (2-3 carte visibili parzialmente) */}
                    <div className="group/section relative px-4 lg:px-0">
                      <div className="flex items-end justify-between mb-6 lg:mb-8">
                         <div>
                            <h3 className="font-condensed text-3xl lg:text-4xl font-black uppercase text-gray-900 italic tracking-tight leading-none mb-3">
                              {currentView === 'search' ? `Trovati ${filteredArticles.length} articoli` : 'In Evidenza'}
                            </h3>
                            <div className="sparkle-line rounded-full w-32 lg:w-48 group-hover/section:w-full transition-all duration-700"></div>
                         </div>
                      </div>
                      
                      <div ref={featuredScrollRef} className="flex gap-4 lg:gap-8 overflow-x-auto no-scrollbar scroll-container snap-x snap-mandatory pb-4">
                        {(currentView === 'search' ? filteredArticles : articles.filter(a => a.type === 'standard' || !a.type).slice(0, 6)).map(item => (
                          <div key={item.id} onClick={() => handleArticleClick(item)} className="w-[82%] md:w-[calc(33.33%-1.35rem)] shrink-0 snap-start">
                            <ArticleCard article={{...item, type: 'horizontal'}} onClick={() => handleArticleClick(item)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Social Section "Social Hub" - Prima delle Ultime Notizie su mobile, 6 canali senza scorrere */}
            {currentView === 'home' && (
              <div className="lg:hidden">
                <SocialSection />
              </div>
            )}

            {currentView === 'home' && (
              <section className="py-12 bg-gray-50/30 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-gray-100 pb-6">
                     <h3 className="font-condensed text-4xl lg:text-5xl font-black uppercase text-gray-900 italic leading-none">Ultime Notizie</h3>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 lg:gap-y-16">
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

            {/* Social Section Desktop - Mantenuta in fondo al feed per desktop */}
            {currentView === 'home' && (
              <div className="hidden lg:block">
                <SocialSection />
              </div>
            )}
          </>
        )}

        {currentView === 'article' && selectedArticle && (
          <div className="bg-white min-h-screen">
            <div className="max-w-4xl mx-auto px-4 pt-12 md:pt-20 pb-24">
              <div className="mb-4">
                <span className="text-[#e31b23] font-black text-xs uppercase tracking-[0.2em]">{selectedArticle.category}</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                {selectedArticle.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 font-medium leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                {selectedArticle.excerpt}
              </p>

              <div className="flex items-center justify-between border-y border-gray-100 py-6 mb-12 animate-in fade-in duration-700 delay-200">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedArticle.authorImageUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(selectedArticle.author)}`} 
                    alt={selectedArticle.author} 
                    className="w-14 h-14 rounded-full object-cover shadow-sm bg-gray-100 border-2 border-white ring-1 ring-gray-100"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-lg underline decoration-2 underline-offset-4 cursor-pointer hover:text-[#e31b23] transition-colors leading-none">
                      {selectedArticle.author}
                    </span>
                    <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest mt-2">
                      {selectedArticle.date}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <button className="p-3 rounded-full hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-900 active:scale-90" title="Condividi">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  </button>
                </div>
              </div>

              <div className="mb-12 relative animate-in zoom-in-95 duration-700 delay-300">
                <img 
                  src={selectedArticle.imageUrl} 
                  className="w-full h-auto rounded-[3rem] shadow-2xl object-cover max-h-[600px]" 
                  alt={selectedArticle.title} 
                />
              </div>

              <div 
                className="prose prose-lg md:prose-xl max-w-none text-gray-800 font-medium leading-[1.8] selection:bg-[#c0ff8c] mb-20 article-content" 
                dangerouslySetInnerHTML={{ __html: selectedArticle.content || selectedArticle.excerpt }} 
              />

              <div className="mt-24 pt-16 border-t border-gray-100">
                <h3 className="font-condensed text-5xl font-black uppercase italic text-gray-900 mb-12 tracking-tight">Potrebbe interessarti</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {suggestedArticles.map(item => (
                    <div key={item.id} onClick={() => handleArticleClick(item)} className="cursor-pointer group">
                      <div className="aspect-video overflow-hidden rounded-[2rem] bg-gray-100 mb-6 shadow-sm border border-gray-50">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                      </div>
                      <span className="text-[#e31b23] text-[10px] font-black uppercase tracking-widest mb-2 block">{item.category}</span>
                      <h4 className="text-xl font-bold leading-tight group-hover:text-[#e31b23] transition-colors text-gray-900">{item.title}</h4>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-24 flex justify-center">
                <button onClick={goToHome} className="bg-black text-white px-16 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-[#e31b23] transition-all shadow-2xl active:scale-95">
                  &larr; Torna alla Home
                </button>
              </div>
            </div>
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
