
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
    <div className="hidden lg:flex flex-col w-[280px] shrink-0 bg-[#fff200] h-full pt-8 pb-14 px-6 rounded-[2rem] relative overflow-hidden z-10 shadow-xl justify-between">
       
       {/* Decorative Background Number */}
       <span className="absolute -top-10 -right-4 text-[9rem] font-black text-black/5 select-none pointer-events-none font-condensed leading-none">
         TOP
       </span>

       {/* Header */}
       <div className="mb-6 relative z-10">
          <div className="flex items-center gap-2 mb-1">
             <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/70">La Selezione</span>
          </div>
          <h3 className="font-condensed text-[2.5rem] font-black uppercase leading-[0.9] tracking-tight text-black">
            Best of<br/>The Best
          </h3>
          <div className="w-12 h-1 bg-black mt-3"></div>
       </div>
       
       {/* List */}
       <div className="flex flex-col gap-5 relative z-10 mb-6">
          {displayArticles.map((article, idx) => (
             <div key={article.id} onClick={() => onArticleClick(article)} className="group cursor-pointer flex gap-3 items-start">
                {/* Numero */}
                <span className="font-condensed text-2xl font-black text-black/20 group-hover:text-black transition-colors leading-[0.8] mt-0.5">
                  0{idx + 1}
                </span>
                
                {/* Testo */}
                <div className="pt-0.5 border-t border-black/5 w-full">
                  <h4 className="font-condensed text-sm leading-tight font-bold text-black group-hover:underline decoration-2 underline-offset-2 transition-all line-clamp-3">
                    {article.title}
                  </h4>
                </div>
             </div>
          ))}
       </div>

       {/* Footer decoration - Changed Font & Position & Spacing */}
       <div className="mt-auto flex items-center justify-center opacity-50 border-t border-black/10 pt-4">
         <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-black font-sans">TuttoXAndroid Select</span>
       </div>
    </div>
  );
};

export default DesktopSidebar;
