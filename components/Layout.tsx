
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Article } from '../types';
import MegaMenu from './MegaMenu';
import CookieConsent from './CookieConsent';
import TelegramPopup from './TelegramPopup';
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
      
      {/* HEADER */}
      <header className="bg-black text-white relative shadow-2xl z-50">
        {/* Top accent bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#e31b23] via-[#c0ff8c] to-[#e31b23] opacity-90"></div>
        <div className="hidden md:flex justify-start items-center px-4 lg:px-8 py-2 absolute top-[3px] left-0 w-full z-20">
           <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <button onClick={() => handleFooterLinkClick('/about')} className="hover:text-[#c0ff8c] transition-colors">Chi Siamo</button>
              <button onClick={() => handleFooterLinkClick('/collab')} className="hover:text-[#c0ff8c] transition-colors">Lavora con noi</button>
              <span className="cursor-pointer hover:text-[#c0ff8c] transition-colors">Pubblicità</span>
              <span className="cursor-pointer hover:text-[#c0ff8c] transition-colors">Privacy Policy</span>
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
      <footer className={`bg-[#0a0a0a] text-white pt-16 pb-10 text-center border-t border-white/5 ${showStickyBanner ? 'pb-24' : ''}`}>
         {/* Top accent */}
         <div className="h-[2px] w-24 bg-gradient-to-r from-[#e31b23] to-[#c0ff8c] mx-auto mb-10 rounded-full"></div>

         <img
            src={LOGO_URL}
            className="h-24 md:h-32 mx-auto mb-8 hover:scale-105 transition-transform duration-500 cursor-pointer opacity-90 hover:opacity-100"
            alt="TuttoXAndroid"
            onClick={goToHome}
         />

         <div className="flex flex-wrap justify-center gap-8 mb-8 text-[10px] font-bold uppercase tracking-widest">
           <button onClick={() => handleFooterLinkClick('/about')} className="text-gray-500 hover:text-[#c0ff8c] transition-colors">Chi Siamo</button>
           <button onClick={() => handleFooterLinkClick('/collab')} className="text-gray-500 hover:text-[#c0ff8c] transition-colors">Collabora con noi</button>
           <a href="#" className="text-gray-500 hover:text-[#c0ff8c] transition-colors">Privacy Policy</a>
           <a href="#" className="text-gray-500 hover:text-[#c0ff8c] transition-colors">Cookie Policy</a>
         </div>

         <div className="flex justify-center gap-4 mb-8">
           <a href="https://t.me/tuttoxandroid" className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#e31b23] border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-transparent hover:scale-110">
             <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
           </a>
           <a href="#" className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-600 border border-white/10 flex items-center justify-center transition-all duration-300 hover:border-transparent hover:scale-110">
             <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
           </a>
         </div>

         <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-700">© 2026 TUTTOXANDROID.COM — DIGITAL EDITORIAL GROUP</p>
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

      {/* Mobile Menu Overlay - MOVED TO BOTTOM TO FIX Z-INDEX STACKING & INCREASED LOGO SIZE */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#080808] z-[2147483647] flex flex-col animate-in fade-in duration-200">
           <div className="h-[3px] w-full bg-gradient-to-r from-[#e31b23] via-[#c0ff8c] to-[#e31b23]"></div>
           <div className="p-6 flex justify-between items-center border-b border-white/5">
              <img src={LOGO_URL} className="h-16 w-auto object-contain" alt="Logo" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-2 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           <div className="flex-1 overflow-y-auto px-8 py-6 space-y-1">
              {NAV_CATEGORIES.map((cat, i) => (
                <button key={cat} onClick={() => handleNavClick(cat)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="block w-full text-left font-condensed text-3xl font-black uppercase text-white/80 hover:text-[#c0ff8c] transition-colors py-2 border-b border-white/5 last:border-0">
                  {cat}
                </button>
              ))}
              <div className="pt-6 mt-2 space-y-3">
                 <button onClick={() => { handleFooterLinkClick('/about'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-xs font-bold uppercase text-gray-600 hover:text-white transition-colors tracking-widest">Chi Siamo</button>
                 <button onClick={() => { handleFooterLinkClick('/collab'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-xs font-bold uppercase text-gray-600 hover:text-white transition-colors tracking-widest">Collabora</button>
              </div>
           </div>
           <div className="p-6 border-t border-white/5">
              <p className="text-gray-600 font-bold uppercase text-[9px] tracking-widest mb-3 text-center">Iscriviti alla community</p>
              <a href="https://t.me/tuttoxandroid" className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#e31b23] to-[#c0146b] text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-opacity">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                Telegram
              </a>
           </div>
        </div>
      )}

      <CookieConsent />
      <TelegramPopup />
    </div>
  );
};

export default Layout;
