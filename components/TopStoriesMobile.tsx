
import React from 'react';
import { Article } from '../types';

interface TopStoriesMobileProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const TopStoriesMobile: React.FC<TopStoriesMobileProps> = ({ articles, onArticleClick }) => {
  return (
    <div className="lg:hidden bg-yellow-400 py-2 px-4 sticky top-0 z-[40] shadow-md border-b border-black/5">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
        <span className="shrink-0 font-condensed text-sm font-black uppercase italic text-black bg-black/10 px-2 py-0.5 rounded leading-none">
          TOP
        </span>
        <div className="flex gap-5 items-center">
          {articles.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onArticleClick(item)}
              className="shrink-0 text-[10px] font-black uppercase tracking-tight text-black hover:text-[#e31b23] transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <span className="w-1 h-1 bg-black rounded-full opacity-30"></span>
              {item.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopStoriesMobile;
