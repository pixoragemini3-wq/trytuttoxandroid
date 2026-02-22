
import React, { useState, useEffect } from 'react';
import { Article } from '../types';

interface TopStoriesMobileProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  onMenuToggle: () => void;
  hideMenuButton?: boolean;
}

const TopStoriesMobile: React.FC<TopStoriesMobileProps> = ({ articles, onArticleClick, onMenuToggle, hideMenuButton = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Prendi solo le ultime 10 notizie per il ticker
  const displayArticles = articles.slice(0, 10);

  useEffect(() => {
    if (displayArticles.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
    }, 4000); // Cambio ogni 4 secondi

    return () => clearInterval(interval);
  }, [displayArticles.length]);

  if (displayArticles.length === 0) return null;

  // Calcola l'indice precedente per gestire l'animazione di uscita
  const prevIndex = (currentIndex - 1 + displayArticles.length) % displayArticles.length;

  return (
    // UPDATED: z-[100001] to ensure it stays ABOVE standard Adsense Anchor Ads which usually sit at 1000-2000 range.
    <div className="lg:hidden bg-yellow-400 h-12 sticky top-0 z-[100001] shadow-md border-b border-black/10 flex items-center overflow-hidden">
      {/* Menu Trigger & Brand Tag */}
      <div className="flex items-center h-full px-4 border-r border-black/5 gap-3 shrink-0 bg-black/5 relative z-50">
        {!hideMenuButton && (
          <button 
            onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
            className="p-1 text-black hover:scale-110 active:scale-90 transition-transform relative z-50 pointer-events-auto"
            aria-label="Apri Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <span className="font-condensed text-sm font-black uppercase italic text-black leading-none whitespace-nowrap">
          TOP NEWS
        </span>
      </div>

      {/* Vertical Ticker Wrapper */}
      <div className="flex-1 h-full relative bg-yellow-400 z-10">
        {displayArticles.map((item, idx) => {
          // Logica per animazione circolare
          let positionClass = 'translate-y-full opacity-0 pointer-events-none'; 
          
          if (idx === currentIndex) {
             positionClass = 'translate-y-0 opacity-100 z-20 pointer-events-auto'; 
          } else if (idx === prevIndex) {
             positionClass = '-translate-y-full opacity-0 z-0 pointer-events-none'; 
          }

          return (
            <div
              key={item.id}
              className={`absolute inset-0 px-4 flex items-center transition-all duration-500 ease-in-out ${positionClass}`}
            >
              <button
                onClick={() => onArticleClick(item)}
                className="text-[10px] font-black uppercase tracking-tight text-black text-left line-clamp-1 w-full truncate relative z-30"
              >
                <span className="inline-block w-1.5 h-1.5 bg-black/20 rounded-full mr-2 align-middle"></span>
                {item.title}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopStoriesMobile;
