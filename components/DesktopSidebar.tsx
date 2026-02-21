
import React from 'react';
import { Article } from '../types';

interface DesktopSidebarProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ articles, onArticleClick }) => {
  // Limitiamo a 4 articoli
  const displayArticles = articles.slice(0, 4);

  return (
    <div className="hidden lg:flex flex-col w-[280px] shrink-0 bg-[#fff200] h-full py-6 px-5 rounded-[2rem] relative overflow-hidden z-10 shadow-xl">
       
       {/* Decorative Background Number - moved slightly */}
       <span className="absolute -top-6 -right-2 text-[8rem] font-black text-black/5 select-none pointer-events-none font-condensed leading-none">
         TOP
       </span>

       {/* Header - Reduced margins */}
       <div className="mb-4 relative z-10 shrink-0">
          <div className="flex items-center gap-2 mb-1">
             <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-black/70">La Selezione</span>
          </div>
          <h3 className="font-condensed text-[2rem] font-black uppercase leading-[0.9] tracking-tight text-black">
            Best of<br/>The Best
          </h3>
          <div className="w-10 h-1 bg-black mt-2"></div>
       </div>
       
       {/* List - Compact gaps and line clamping */}
       <div className="flex flex-col gap-3 relative z-10 flex-1 pb-2"> 
          {displayArticles.map((article, idx) => (
             <div key={article.id} onClick={() => onArticleClick(article)} className="group cursor-pointer flex gap-3 items-start shrink-0">
                {/* Numero */}
                <span className="font-condensed text-xl font-black text-black/20 group-hover:text-black transition-colors leading-[0.8] mt-0.5 w-6 shrink-0">
                  0{idx + 1}
                </span>
                
                {/* Testo */}
                <div className="pt-0.5 border-t border-black/10 w-full">
                  <h4 className="font-condensed text-xs leading-snug font-bold text-black group-hover:underline decoration-2 underline-offset-2 transition-all line-clamp-2">
                    {article.title}
                  </h4>
                </div>
             </div>
          ))}
       </div>

       {/* Footer decoration - shrink-0 to prevent squash */}
       <div className="mt-auto shrink-0 flex items-center justify-center opacity-50 border-t border-black/10 pt-3">
         <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-black font-sans">TuttoXAndroid Select</span>
       </div>
    </div>
  );
};

export default DesktopSidebar;
