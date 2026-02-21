
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Article } from '../types';
import MegaMenu from './MegaMenu';
import CookieConsent from './CookieConsent';
import TopStoriesMobile from './TopStoriesMobile';
import { LOGO_URL, NAV_CATEGORIES } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeMegaMenu: string | null;
  setActiveMegaMenu: (menu: string | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isSearchVisible: boolean;
  setIsSearchVisible: (isVisible: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  articles: Article[];
  handleSearchSubmit: (e: React.FormEvent) => void;
  handleNavClick: (nav: string) => void;
  handleArticleClick: (article: Article) => void;
  handleFooterLinkClick: (path: '/about' | '/collab' | '/') => void;
  goToHome: () => void;
  showStickyBanner: boolean;
  showScrollTop: boolean;
  scrollToTop: () => void;
  toggleSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  boxedLayout?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeMegaMenu,
  setActiveMegaMenu,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isSearchVisible,
  searchQuery,
  setSearchQuery,
  activeCategory,
  articles,
  handleSearchSubmit,
  handleNavClick,
  handleArticleClick,
  handleFooterLinkClick,
  goToHome,
  showStickyBanner,
  showScrollTop,
  scrollToTop,
  toggleSearch,
  searchInputRef,
  boxedLayout = false
}) => {
  
  // Helper Styles
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

  // Filter top stories for the ticker
  const topStories = articles.slice(0, 10);

  return (
    <div className={`min-h-screen flex flex-col bg-white font-inter ${boxedLayout ? 'max-w-[1600px] mx-auto shadow-2xl border-x border-gray-100' : ''}`}>
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
              {NAV_CATEGORIES.map(cat => (
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

      {/* HEADER */}
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
            {/* Logo */}
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

            {/* Desktop Nav */}
            <nav className={`hidden lg:flex items-center gap-8 ${isSearchVisible ? 'hidden' : 'flex'}`}>
              {NAV_CATEGORIES.slice(0, 7).map(nav => {
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

            {/* Search Bar Overlay */}
            <div className={`absolute inset-0 flex items-center justify-end z-20 ${isSearchVisible ? 'flex' : 'hidden'}`}>
              <div className="w-full h-full bg-black flex items-center px-4 md:px-0">
                <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cerca nel portale..." className="w-full bg-transparent border-b-2 border-[#e31b23] text-xl md:text-2xl font-black uppercase py-2 focus:outline-none text-white" />
                  <button type="submit" className="p-2 text-[#e31b23]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
                </form>
                <button onClick={toggleSearch} className="ml-4 p-2 text-gray-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>

            {/* Mobile Search Toggle */}
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
      
      {/* MOBILE TICKER - PERSISTENT ON ALL PAGES */}
      <TopStoriesMobile 
        articles={topStories} 
        onArticleClick={handleArticleClick} 
        onMenuToggle={() => setIsMobileMenuOpen(true)}
      />

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 lg:mt-2 animate-in fade-in duration-500">
        {children}
      </main>

      {/* FOOTER */}
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
      
      {/* SCROLL TO TOP */}
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
    </div>
  );
};

export default Layout;
