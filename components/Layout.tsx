
import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Article } from '../types';
import MegaMenu from './MegaMenu';
import CookieConsent from './CookieConsent';
import TelegramPopup from './TelegramPopup';
import TopStoriesMobile from './TopStoriesMobile';
import { LOGO_URL, NAV_CATEGORIES, CATEGORY_COLORS } from '../constants';

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
  handleFooterLinkClick: (path: '/about' | '/collab' | '/privacy' | '/') => void;
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

  const topStories = articles.slice(0, 10);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  return (
    <div className={`min-h-screen flex flex-col bg-[#f4f4f4] ${boxedLayout ? 'max-w-[1440px] mx-auto shadow-xl' : ''}`}>

      {/* ───── HEADER + TOP NEWS (mobile: blocco sticky unico) ───── */}
      <div className="sticky top-0 z-50">
      {/* CSS esplicito: su Blogger Tailwind h-[200px] da esm non è affidabile */}
      <style>{`
        @media (min-width: 768px) {
          .txa-header-band {
            height: 180px !important;
            max-height: 180px !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            box-sizing: border-box !important;
          }
          .txa-header-band .txa-header-main {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .txa-header-band .txa-header-row {
            height: 100% !important;
            min-height: 0 !important;
          }
          .txa-header-logo {
            height: 132px !important;
            max-height: 132px !important;
            width: auto !important;
            object-fit: contain !important;
          }
        }
      `}</style>
      <header className="bg-[#111111] text-white overflow-visible">
        {/* Desktop: banda nera ESATTAMENTE 180px */}
        <div className="txa-header-band">
        {/* Top utility bar */}
        <div className="hidden md:block border-b border-white/[0.06] shrink-0">
          <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center h-8">
            <div className="flex gap-5 text-[10px] font-medium tracking-widest text-white/30 uppercase">
              <button onClick={() => handleFooterLinkClick('/about')} className="hover:text-white/70 transition-colors">Chi Siamo</button>
              <button onClick={() => handleFooterLinkClick('/collab')} className="hover:text-white/70 transition-colors">Lavora con noi</button>
              <span className="cursor-pointer hover:text-white/70 transition-colors">Pubblicità</span>
            </div>
            <div className="text-[10px] text-white/20 font-medium tracking-widest uppercase">
              {todayLabel}
            </div>
          </div>
        </div>

        {/* Main header row — su md+ riempie lo spazio tra utility e riga rossa */}
        <div className="txa-header-main max-w-[1200px] mx-auto px-4 md:px-6 w-full md:flex-1 md:min-h-0">
          <div className="txa-header-row flex items-center justify-between h-28 md:h-full overflow-hidden">

            {/* Logo — 148px desktop (stessa misura), non si ridimensiona con la banda */}
            <div
              className={`cursor-pointer shrink-0 ${isSearchVisible ? 'hidden md:flex' : 'flex'} items-center h-full`}
              onClick={goToHome}
            >
              <img
                src={LOGO_URL}
                alt="TuttoXAndroid"
                className="txa-header-logo h-[124px] w-auto object-contain"
              />
            </div>

            {/* Desktop nav */}
            <nav className={`hidden lg:flex items-center gap-1.5 ${isSearchVisible ? 'invisible' : ''}`}>
              {NAV_CATEGORIES.map(nav => {
                const isActive = activeCategory === nav;
                const catColor = CATEGORY_COLORS[nav] || '#e31b23';
                return (
                  <button
                    key={nav}
                    onMouseEnter={() => setActiveMegaMenu(nav)}
                    onClick={() => handleNavClick(nav)}
                    className={`group relative px-4 py-1.5 text-[12px] font-semibold tracking-[0.75px] uppercase rounded-full transition-all duration-200 ease-out active:scale-[0.985] ${
                      isActive 
                        ? 'text-white shadow-sm' 
                        : 'text-white/50 hover:text-white'
                    }`}
                    style={isActive ? { backgroundColor: catColor } : {}}
                  >
                    {nav}
                    {/* Engaging hover animation: colored underline draws in the category's own color */}
                    {!isActive && (
                      <span 
                        className="absolute -bottom-[1px] left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full transition-all duration-200 ease-out group-hover:left-0 group-hover:w-full group-hover:-translate-x-0" 
                        style={{ backgroundColor: catColor }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right controls */}
            <div className={`flex items-center gap-1 ${isSearchVisible ? 'hidden md:flex' : 'flex'}`}>
              <button
                onClick={toggleSearch}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.07] transition-colors"
                aria-label="Cerca"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.07] transition-colors"
                aria-label="Menu"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Search overlay */}
            {isSearchVisible && (
              <div className="absolute inset-0 bg-[#111111] flex items-center px-4 md:px-6 z-30">
                <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3 max-w-[600px] mx-auto">
                  <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cerca su TuttoXAndroid…"
                    className="flex-1 bg-transparent text-white placeholder:text-white/25 text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={toggleSearch}
                    className="text-[11px] text-white/30 hover:text-white/70 uppercase tracking-widest font-medium transition-colors ml-4"
                  >
                    ESC
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Red accent bottom line */}
        <div className="h-[2px] bg-[#e31b23] shrink-0" />
        </div>{/* /.txa-header-band 180px */}

        {/* MegaMenu */}
        {activeMegaMenu && !isSearchVisible && (
          <MegaMenu
            category={activeMegaMenu}
            onClose={() => setActiveMegaMenu(null)}
            articles={articles}
            onArticleClick={handleArticleClick}
          />
        )}
      </header>

      {/* Mobile ticker — scorre insieme al logo, non sopra */}
      <TopStoriesMobile
        articles={topStories}
        onArticleClick={handleArticleClick}
        onMenuToggle={() => setIsMobileMenuOpen(true)}
      />
      </div>

      {/* Main */}
      <main className="flex-1">
        {children}
      </main>

      {/* ───── FOOTER ───── */}
      <footer className={`bg-[#111111] text-white ${showStickyBanner ? 'pb-20' : ''}`}>
        <div className="h-[2px] bg-[#e31b23]" />
        <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col items-center text-center">
          <img
            src={LOGO_URL}
            className="h-20 w-auto object-contain mb-8 opacity-60 hover:opacity-90 cursor-pointer transition-opacity"
            alt="TuttoXAndroid"
            onClick={goToHome}
          />
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-8">
            {([
              { label: 'Chi Siamo', path: '/about' as const },
              { label: 'Collabora', path: '/collab' as const },
              { label: 'Privacy Policy', path: '/privacy' as const },
            ]).map(({ label, path }) => (
              <button
                key={label}
                onClick={() => handleFooterLinkClick(path)}
                className="text-[11px] font-medium tracking-widest uppercase text-white/30 hover:text-white/70 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/15 tracking-[2px] uppercase font-medium">
            © 2026 TuttoXAndroid.com · Tutti i diritti riservati
          </p>
        </div>
      </footer>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-[#111] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#e31b23] transition-colors border border-white/10"
          aria-label="Torna su"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#111111] z-[9999] flex flex-col">
          <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.07]">
            <img src={LOGO_URL} className="h-7 w-auto object-contain opacity-80" alt="Logo" />
            <button onClick={() => setIsMobileMenuOpen(false)} className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {NAV_CATEGORIES.map(cat => {
              const catColor = CATEGORY_COLORS[cat] || '#e31b23';
              return (
                <button
                  key={cat}
                  onClick={() => { handleNavClick(cat); setIsMobileMenuOpen(false); }}
                  className="group w-full flex items-center text-left py-3 text-[15px] font-semibold tracking-wide uppercase text-white/60 hover:text-white border-b border-white/[0.05] transition-all duration-150 active:scale-[0.985]"
                  onMouseEnter={e => { e.currentTarget.style.color = catColor; }}
                  onMouseLeave={e => { e.currentTarget.style.color = ''; }}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-3 opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: catColor }} />
                  {cat}
                </button>
              );
            })}
            <div className="pt-6 flex flex-col gap-3">
              <button onClick={() => { handleFooterLinkClick('/about'); setIsMobileMenuOpen(false); }} className="text-left text-xs text-white/30 uppercase tracking-widest hover:text-white/60">Chi Siamo</button>
              <button onClick={() => { handleFooterLinkClick('/collab'); setIsMobileMenuOpen(false); }} className="text-left text-xs text-white/30 uppercase tracking-widest hover:text-white/60">Collabora</button>
            </div>
          </div>
          <div className="px-5 py-5 border-t border-white/[0.07]">
            <a
              href="https://t.me/tuttoxandroid"
              className="flex items-center justify-center gap-2 w-full bg-[#e31b23] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest"
            >
              Unisciti su Telegram
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
