
import React from 'react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
  className?: string; // Added to support custom styling overrides
}

const getCategoryColors = (category: string, type: 'text' | 'bg') => {
  const map: Record<string, string> = {
    'Smartphone': 'blue-600',
    'Modding': 'orange-500',
    'App & Giochi': 'green-500',
    'Recensioni': 'purple-600',
    'Guide': 'cyan-600',
    'Offerte': 'yellow-500',
    'Wearable': 'pink-500',
    'News': '[#e31b23]',
  };
  
  const color = map[category] || '[#e31b23]';
  
  if (type === 'text') return `text-${color}`;
  return `bg-${color.startsWith('[') ? color : `${color}`}`;
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, className = '' }) => {
  // Stile HERO (Immagine a sinistra, Box Rosso a destra)
  // Refined for 420px height and "Impact" font style
  if (article.type === 'hero') {
    return (
      <div onClick={onClick} className={`relative w-full h-full lg:rounded-[2.5rem] bg-white flex flex-col md:flex-row shadow-2xl group cursor-pointer overflow-hidden ${className}`}>
        {/* Image Section - 35% Width */}
        <div className="w-full md:w-[35%] h-64 md:h-full overflow-hidden relative bg-gray-50 shrink-0">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
        </div>
        
        {/* Content Section - 65% Width */}
        <div className="w-full md:w-[65%] p-5 md:p-6 lg:p-8 bg-[#e31b23] text-white flex flex-col justify-between transition-all duration-500 group-hover:bg-[#c0ff8c] relative">
          
          <div className="flex flex-col items-start w-full">
             {/* Optional Category Tag */}
             <span className="hidden md:inline-block bg-black/20 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest mb-3 group-hover:bg-black group-hover:text-white transition-colors">
                {article.category}
             </span>

             {/* Typography: Saira Extra Condensed, Black Weight, Tight Tracking to match Image */}
             <h2 className="font-condensed text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-black leading-[0.85] uppercase tracking-[-0.04em] w-full group-hover:text-black transition-colors line-clamp-3 text-left">
              {article.title}
            </h2>
            
            {/* Excerpt - Hidden on smaller standard laptops to prioritize title impact, shown on huge screens */}
            <p className="hidden xl:block text-sm font-bold leading-tight opacity-90 group-hover:text-black transition-colors mt-3 max-w-xl line-clamp-2">
              {article.excerpt.substring(0, 150)}...
            </p>
          </div>
          
          {/* Bottom Info */}
          <div className="mt-4 pt-4 border-t border-white/20 w-full group-hover:border-black/10 flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-black transition-colors">
                DI {article.author.toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 group-hover:text-black transition-colors">
               {article.date.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Stile OVERLAY (In Evidenza - Carousel)
  if (article.type === 'horizontal') {
    const bgClass = getCategoryColors(article.category, 'bg');
    const isCustom = bgClass.includes('[');
    
    return (
      <div onClick={onClick} className={`relative w-full aspect-square md:aspect-[4/5] overflow-hidden rounded-[1.5rem] lg:rounded-[2rem] group cursor-pointer shadow-xl bg-black shrink-0 ${className}`}>
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 lg:p-6 w-full flex flex-col items-start">
           <span 
             className={`${isCustom ? bgClass : `bg-${article.category === 'Smartphone' ? 'blue-600' : article.category === 'Modding' ? 'orange-500' : article.category === 'App & Giochi' ? 'green-500' : article.category === 'Recensioni' ? 'purple-600' : article.category === 'Guide' ? 'cyan-600' : article.category === 'Offerte' ? 'yellow-500' : article.category === 'Wearable' ? 'pink-500' : '[#e31b23]'}`} text-white px-2 py-1 lg:px-3 lg:py-1.5 rounded text-[8px] lg:text-[10px] font-black uppercase tracking-widest mb-2 lg:mb-3 inline-flex items-center justify-center leading-none transition-colors group-hover:bg-[#c0ff8c] group-hover:text-black`}
           >
             {article.category}
           </span>
           <h3 className="text-white font-condensed text-xl lg:text-3xl font-black uppercase leading-[0.9] tracking-tighter group-hover:text-[#c0ff8c] transition-colors line-clamp-3">
             {article.title}
           </h3>
        </div>
      </div>
    );
  }

  // Stile STANDARD (Feed - Grid 2 columns on mobile)
  const textClass = getCategoryColors(article.category, 'text');
  const textColorClass = 
    article.category === 'Smartphone' ? 'text-blue-600' : 
    article.category === 'Modding' ? 'text-orange-500' : 
    article.category === 'App & Giochi' ? 'text-green-500' : 
    article.category === 'Recensioni' ? 'text-purple-600' : 
    article.category === 'Guide' ? 'text-cyan-600' : 
    article.category === 'Offerte' ? 'text-yellow-500' : 
    article.category === 'Wearable' ? 'text-pink-500' : 
    'text-[#e31b23]';

  return (
    <div onClick={onClick} className={`flex flex-col group cursor-pointer h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:bg-white lg:rounded-[2rem] lg:p-4 lg:-m-4 ${className}`}>
      <div className="aspect-video overflow-hidden rounded-[1rem] lg:rounded-[1.5rem] bg-gray-100 mb-3 lg:mb-5 shadow-sm border border-gray-100">
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="flex flex-col flex-1">
        <span className={`${textColorClass} text-[8px] lg:text-[10px] font-black uppercase tracking-[0.15em] mb-2 lg:mb-3 block transition-colors group-hover:text-[#a6e076]`}>
          {article.category}
        </span>
        <h3 className="font-bold text-base sm:text-xl lg:text-2xl leading-tight text-gray-900 group-hover:text-[#a6e076] transition-colors mb-3 lg:mb-4 line-clamp-3 lg:line-clamp-2 tracking-tight">
          {article.title}
        </h3>
        <div className="mt-auto text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-[#a6e076]"></span>
          {article.date}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
