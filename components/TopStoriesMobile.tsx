
import React from 'react';
import { Article } from '../types';

interface TopStoriesMobileProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onMenuToggle: () => void;
  hideMenuButton?: boolean;
}

const TopStoriesMobile: React.FC<TopStoriesMobileProps> = ({ articles, onArticleClick, onMenuToggle, hideMenuButton = false }) => {
  // Mostra sempre il primo articolo senza rotazione/animazione
  const featuredItem = articles[0];

  if (!featuredItem) return null;

  return (
    <div className="lg:hidden bg-yellow-400 h-12 sticky top-0 z-[60] shadow-md border-b border-black/10 flex items-center overflow-hidden">
      {/* Menu Trigger & Brand Tag */}
      <div className="flex items-center h-full px-4 border-r border-black/5 gap-3 shrink-0 bg-black/5">
        {!hideMenuButton && (
          <button 
            onClick={onMenuToggle}
            className="p-1 text-black hover:scale-110 active:scale-90 transition-transform"
            aria-label="Apri Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <span className="font-condensed text-sm font-black uppercase italic text-black leading-none">
          TOP
        </span>
      </div>

      {/* Static Headline Wrapper */}
      <div className="flex-1 h-full relative px-4 flex items-center">
        <button
          onClick={() => onArticleClick(featuredItem)}
          className="text-[10px] font-black uppercase tracking-tight text-black text-left line-clamp-1 w-full"
        >
          <span className="inline-block w-1.5 h-1.5 bg-black/20 rounded-full mr-2"></span>
          {featuredItem.title}
        </button>
      </div>
    </div>
  );
};

export default TopStoriesMobile;
