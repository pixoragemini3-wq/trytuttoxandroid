
import React from 'react';
import { Article } from '../types';

interface DesktopSidebarProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ articles, onArticleClick }) => {
  return (
    <div className="hidden lg:flex flex-col w-[280px] shrink-0 bg-[#fff200] h-full py-10 px-6 rounded-[2.5rem] relative overflow-hidden z-10">
       {/* Header */}
       <div className="mb-6">
          <h3 className="font-condensed text-4xl font-black uppercase leading-[0.85] tracking-tight text-black mb-3">
            Best of<br/>the BEST
          </h3>
          <p className="text-xs font-bold leading-tight text-black/80">
            La selezione editoriale delle notizie e guide da non perdere oggi.
          </p>
          <div className="w-full h-0.5 bg-black/10 mt-6"></div>
       </div>
       
       {/* List */}
       <div className="flex-1 flex flex-col gap-5 overflow-y-auto no-scrollbar pr-2">
          {articles.map((article) => (
             <div key={article.id} onClick={() => onArticleClick(article)} className="group cursor-pointer border-b border-black/10 pb-4 last:border-0 hover:border-black transition-colors">
                <h4 className="font-bold text-sm leading-[1.3] text-black group-hover:underline decoration-2 underline-offset-2">
                  {article.title}
                </h4>
             </div>
          ))}
       </div>

       {/* Footer decoration */}
       <div className="mt-auto pt-4 text-[10px] font-black uppercase tracking-widest text-black/40">
         TuttoXAndroid Select
       </div>
    </div>
  );
};

export default DesktopSidebar;
