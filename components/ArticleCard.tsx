
import React from 'react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  // Stile HERO (Immagine a sinistra, Box Rosso a destra)
  if (article.type === 'hero') {
    return (
      <div onClick={onClick} className="relative w-full overflow-hidden rounded-[2.5rem] bg-white flex flex-col md:flex-row shadow-2xl group cursor-pointer h-full min-h-[500px] md:h-[550px]">
        <div className="w-full md:w-[60%] h-64 md:h-full overflow-hidden relative bg-gray-50">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/5"></div>
        </div>
        
        <div className="w-full md:w-[40%] p-6 md:p-8 lg:p-10 bg-[#e31b23] text-white flex flex-col justify-center overflow-hidden transition-all duration-500 group-hover:bg-[#c0ff8c]">
          <div className="space-y-4">
             <h2 className="font-condensed text-3xl sm:text-4xl md:text-3xl lg:text-5xl xl:text-6xl font-black leading-[0.9] uppercase tracking-tighter break-words group-hover:text-black transition-colors">
              {article.title}
            </h2>
            <p className="text-sm md:text-base opacity-95 font-semibold leading-snug line-clamp-3 md:line-clamp-4 lg:line-clamp-6 group-hover:text-black transition-colors">
              {article.excerpt}
            </p>
          </div>
          
          <div className="mt-8 flex items-center gap-3 border-t border-white/20 pt-6 group-hover:border-black/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-white group-hover:border-black group-hover:text-black inline-block w-fit mb-1 transition-colors">
                DI {article.author.toUpperCase()}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70 group-hover:text-black group-hover:opacity-40 transition-colors">
                {article.date.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stile OVERLAY (In Evidenza - Carousel)
  if (article.type === 'horizontal') {
    return (
      <div onClick={onClick} className="relative w-full aspect-[4/5] overflow-hidden rounded-[2.5rem] group cursor-pointer shadow-xl bg-black shrink-0">
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8 w-full">
           <span className="bg-[#e31b23] text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-4 inline-block transition-colors group-hover:bg-[#c0ff8c] group-hover:text-black">
             {article.category}
           </span>
           <h3 className="text-white font-condensed text-3xl md:text-4xl font-black uppercase leading-[0.9] tracking-tight group-hover:text-[#c0ff8c] transition-colors line-clamp-3">
             {article.title}
           </h3>
        </div>
      </div>
    );
  }

  // Stile STANDARD (Feed)
  return (
    <div onClick={onClick} className="flex flex-col group cursor-pointer h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:bg-white rounded-[2rem] p-4 -m-4">
      <div className="aspect-video overflow-hidden rounded-[1.5rem] bg-gray-100 mb-5 shadow-sm border border-gray-100">
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[#e31b23] text-[9px] font-black uppercase tracking-[0.15em] mb-2 block transition-colors group-hover:text-[#a6e076]">
          {article.category}
        </span>
        <h3 className="font-bold text-lg sm:text-xl lg:text-2xl leading-tight text-gray-900 group-hover:text-[#a6e076] transition-colors mb-4 line-clamp-2">
          {article.title}
        </h3>
        <div className="mt-auto text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-[#a6e076]"></span>
          {article.date}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
