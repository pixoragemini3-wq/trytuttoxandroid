
import React, { useState, useEffect } from 'react';
import { Article } from '../types';

interface TopStoriesMobileProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onMenuToggle: () => void;
}

const TopStoriesMobile: React.FC<TopStoriesMobileProps> = ({ articles, onArticleClick, onMenuToggle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (articles.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [articles.length]);

  return (
    <div className="lg:hidden bg-yellow-400 h-12 sticky top-0 z-[60] shadow-md border-b border-black/10 flex items-center overflow-hidden">
      {/* Menu & Brand Tag Section */}
      <div className="flex items-center h-full px-4 border-r border-black/5 gap-3 shrink-0 bg-black/5">
        <button 
          onClick={onMenuToggle}
          className="p-1 text-black hover:scale-110 active:scale-90 transition-transform"
          aria-label="Apri Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-condensed text-sm font-black uppercase italic text-black leading-none">
          TOP
        </span>
      </div>

      {/* Vertical News Ticker */}
      <div className="flex-1 h-full relative">
        {articles.map((item, idx) => (
          <div
            key={item.id}
            className={`absolute inset-0 px-4 flex items-center transition-all duration-700 ease-in-out ${
              idx === currentIndex 
                ? 'translate-y-0 opacity-100' 
                : idx < currentIndex 
                  ? '-translate-y-full opacity-0' 
                  : 'translate-y-full opacity-0'
            }`}
          >
            <button
              onClick={() => onArticleClick(item)}
              className="text-[10px] font-black uppercase tracking-tight text-black text-left line-clamp-1 w-full h-full flex items-center outline-none"
            >
              <span className="inline-block w-1.5 h-1.5 bg-black/20 rounded-full mr-2 shrink-0"></span>
              <span className="line-clamp-1">{item.title}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopStoriesMobile;
