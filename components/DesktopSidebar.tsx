
import React from 'react';
import { Article } from '../types';

interface DesktopSidebarProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ articles, onArticleClick }) => {
  // Limitiamo a 5 articoli
  const displayArticles = articles.slice(0, 5);

  return (
    <div className="hidden lg:flex flex-col w-[260px] shrink-0 bg-[#fff200] h-full py-6 px-5 rounded-[2.5rem] relative overflow-hidden z-10 justify-between">
       {/* Header */}
       <div className="mb-3">
          <h3 className="font-condensed text-5xl font-black uppercase leading-[0.85] tracking-tighter text-black mb-2">
            BEST OF<br/>THE BEST
          </h3>
          <p className="text-[10px] font-bold leading-tight text-black/70 border-l-2 border-black pl-2">
            La selezione editoriale da non perdere.
          </p>
       </div>
       
       {/* List - Compact */}
       <div className="flex flex-col gap-3 justify-center py-2 flex-1">
          {displayArticles.map((article, idx) => (
             <div key={article.id} onClick={() => onArticleClick(article)} className="group cursor-pointer border-b border-black/10 pb-2 last:border-0 hover:border-black transition-colors">
                <h4 className="font-condensed text-lg leading-[1.05] font-bold text-black group-hover:underline decoration-2 underline-offset-2 uppercase tracking-tight line-clamp-3">
                  {article.title}
                </h4>
             </div>
          ))}
       </div>

       {/* Footer decoration */}
       <div className="mt-auto pt-2 flex items-center justify-between">
         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black">
           TXA Select
         </span>
         <div className="w-2 h-2 bg-black rounded-full"></div>
       </div>
    </div>
  );
};

export default DesktopSidebar;
