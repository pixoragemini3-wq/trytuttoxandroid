
import React from 'react';
import { Article } from '../types';

interface DesktopSidebarProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ articles, onArticleClick }) => {
  // Limitiamo a 4 articoli (ridotto da 5) per adattarsi all'altezza compatta (420px)
  const displayArticles = articles.slice(0, 4);

  return (
    <div className="hidden lg:flex flex-col w-[260px] shrink-0 bg-[#fff200] h-full py-6 px-6 rounded-[2.5rem] relative overflow-hidden z-10 justify-between shadow-lg">
       {/* Header */}
       <div className="mb-4">
          <h3 className="font-condensed text-[3.5rem] font-black uppercase leading-[0.8] tracking-[-0.05em] text-black mb-2">
            BEST OF<br/>THE BEST
          </h3>
          <p className="text-[10px] font-bold leading-tight text-black/70 border-l-4 border-black pl-3 py-1">
            La selezione editoriale.
          </p>
       </div>
       
       {/* List - Compact */}
       <div className="flex flex-col gap-3 justify-center py-1 flex-1">
          {displayArticles.map((article, idx) => (
             <div key={article.id} onClick={() => onArticleClick(article)} className="group cursor-pointer border-b border-black/10 pb-2 last:border-0 hover:border-black transition-colors">
                <h4 className="font-condensed text-lg leading-[1] font-bold text-black group-hover:underline decoration-2 underline-offset-2 uppercase tracking-tight line-clamp-2">
                  {article.title}
                </h4>
             </div>
          ))}
       </div>

       {/* Footer decoration */}
       <div className="mt-auto pt-2 flex items-center justify-between border-t border-black/10">
         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black pt-2">
           TXA Select
         </span>
         <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
       </div>
    </div>
  );
};

export default DesktopSidebar;
