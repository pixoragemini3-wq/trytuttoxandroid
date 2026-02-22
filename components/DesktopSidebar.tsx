
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
    <div className="hidden lg:flex flex-col w-[280px] shrink-0 bg-[#fff200] h-full py-5 px-5 rounded-[2rem] relative overflow-hidden z-10 shadow-xl justify-between pb-6">
       
       {/* Decorative Background Number */}
       <span className="absolute -top-6 -right-2 text-[8rem] font-black text-black/5 select-none pointer-events-none font-condensed leading-none">
         TOP
       </span>

       {/* Header - Compacted */}
       <div className="relative z-10 shrink-0">
          <div className="flex items-center gap-2 mb-1">
             <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-black/70">La Selezione</span>
          </div>
          {/* UPDATED FONT SIZE: Increased to 3.5rem as requested */}
          <h3 className="font-condensed text-[3.5rem] font-black uppercase leading-[0.8] tracking-tight text-black">
            Best of<br/>The Best
          </h3>
          <div className="w-8 h-1 bg-black mt-3 mb-4"></div>
       </div>
       
       {/* List - Spaced out evenly */}
       <div className="flex flex-col gap-4 relative z-10 flex-1 justify-center"> 
          {displayArticles.map((article, idx) => (
             <div key={article.id} onClick={() => onArticleClick(article)} className="group cursor-pointer flex gap-3 items-center shrink-0 w-full">
                {/* Numero */}
                <span className="font-condensed text-2xl font-black text-black/20 group-hover:text-black transition-colors leading-[0.8] w-6 shrink-0">
                  0{idx + 1}
                </span>
                
                {/* Testo: UPDATED to single line (truncate) and larger font (text-[15px]) */}
                <div className="pt-0.5 border-t border-black/10 w-full overflow-hidden">
                  <h4 className="font-condensed text-[15px] leading-tight font-bold text-black group-hover:underline decoration-2 underline-offset-2 transition-all truncate block w-full">
                    {article.title}
                  </h4>
                </div>
             </div>
          ))}
       </div>

       {/* Footer decoration */}
       <div className="mt-4 shrink-0 flex items-center justify-center opacity-40 border-t border-black/10 pt-2">
         <span className="text-[7px] font-medium uppercase tracking-[0.2em] text-black font-sans">TuttoXAndroid Select</span>
       </div>
    </div>
  );
};

export default DesktopSidebar;
