
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
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
  };

  // Stile HERO (Immagine a sinistra, Box Rosso a destra)
  // UPDATED: Font sizes reduced for a more professional blog look
  if (article.type === 'hero') {
    return (
      <div onClick={onClick} className={`relative w-full h-full lg:rounded-[2rem] bg-white flex flex-col md:flex-row shadow-xl group cursor-pointer overflow-hidden ${className}`}>
        {/* Image Section */}
        <div className="w-full md:w-[35%] aspect-[4/3] md:aspect-auto md:h-full overflow-hidden relative bg-gray-50 shrink-0">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            onError={handleImageError}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/5"></div>
        </div>
        
        {/* Content Section - 65% Width */}
        <div className="w-full md:w-[65%] p-5 md:p-6 lg:p-8 bg-[#e31b23] text-white flex flex-col justify-between transition-all duration-500 group-hover:bg-[#c0ff8c] relative">
          
          <div className="flex flex-col items-start w-full">
             {/* Category Tag */}
             <span className="hidden md:inline-block bg-black/20 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-3 group-hover:bg-black group-hover:text-white transition-colors">
                {article.category}
             </span>

             {/* Typography: Reduced size from 6xl to 4xl/5xl range */}
             <h2 className="font-condensed text-3xl md:text-4xl lg:text-5xl font-black leading-[0.95] uppercase tracking-tight w-full group-hover:text-black transition-colors line-clamp-3 text-left">
              {article.title}
            </h2>
            
            {/* Excerpt */}
            <p className="hidden xl:block text-sm font-medium leading-normal opacity-90 group-hover:text-black transition-colors mt-3 max-w-xl line-clamp-2">
              {article.excerpt.substring(0, 150)}...
            </p>
          </div>
          
          {/* Bottom Info */}
          <div className="mt-4 pt-4 border-t border-white/20 w-full group-hover:border-black/10 flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-black transition-colors">
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
  // UPDATED: Font sizes reduced
  if (article.type === 'horizontal') {
    const bgClass = getCategoryColors(article.category, 'bg');
    const isCustom = bgClass.includes('[');
    
    return (
      <div onClick={onClick} className={`relative w-full aspect-square md:aspect-[4/5] overflow-hidden rounded-xl lg:rounded-2xl group cursor-pointer shadow-lg bg-black shrink-0 ${className}`}>
        <img 
          src={article.imageUrl} 
          alt={article.title}
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3 lg:p-4 w-full flex flex-col items-start">
           <span 
             className={`${isCustom ? bgClass : `bg-${article.category === 'Smartphone' ? 'blue-600' : article.category === 'Modding' ? 'orange-500' : article.category === 'App & Giochi' ? 'green-500' : article.category === 'Recensioni' ? 'purple-600' : article.category === 'Guide' ? 'cyan-600' : article.category === 'Offerte' ? 'yellow-500' : article.category === 'Wearable' ? 'pink-500' : '[#e31b23]'}`} text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest mb-1.5 inline-flex items-center justify-center leading-none transition-colors group-hover:bg-[#c0ff8c] group-hover:text-black`}
           >
             {article.category}
           </span>
           <h3 className="text-white font-condensed text-lg lg:text-xl font-bold uppercase leading-none tracking-tight group-hover:text-[#c0ff8c] transition-colors line-clamp-3">
             {article.title}
           </h3>
        </div>
      </div>
    );
  }

  // Stile STANDARD UPDATED: Normal List
  // UPDATED: Font sizes drastically reduced to be standard blog size
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
    <div onClick={onClick} className={`flex flex-col md:flex-row gap-4 group cursor-pointer h-full transition-all duration-300 hover:bg-white hover:scale-[1.02] hover:shadow-2xl rounded-2xl p-3 border border-transparent hover:border-gray-100 ${className}`}>
      
      {/* IMAGE - Directly styled with img selector as requested (35% width, proportional height/aspect) */}
      <img 
        src={article.imageUrl} 
        alt={article.title}
        onError={handleImageError}
        className="w-full md:w-[35%] aspect-video md:aspect-[4/3] rounded-xl object-cover bg-gray-100 shadow-sm border border-gray-100 shrink-0 transition-transform duration-500 group-hover:brightness-95"
      />

      {/* CONTENT CONTAINER: 65% Width */}
      <div className="flex-1 flex flex-col justify-center py-0.5">
        <span className={`${textColorClass} text-[9px] font-bold uppercase tracking-[0.1em] mb-1.5 block transition-colors`}>
          {article.category}
        </span>
        
        {/* Title: Reduced from 3xl/Black to xl/Bold */}
        <h3 className="font-condensed text-lg md:text-xl lg:text-2xl font-bold leading-tight text-gray-900 group-hover:text-[#e31b23] transition-colors mb-2 line-clamp-3 tracking-tight">
          {article.title}
        </h3>
        
        {/* Excerpt: Slightly simpler font */}
        <p className="text-xs text-gray-500 font-normal leading-relaxed line-clamp-2 mb-3 hidden md:block">
           {article.excerpt}
        </p>

        <div className="mt-auto flex items-center gap-2">
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden">
                <img src={article.authorImageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} className="w-full h-full object-cover" />
             </div>
             <span className="text-[9px] font-bold text-gray-900 uppercase">{article.author}</span>
           </div>
           <span className="text-[8px] text-gray-300">●</span>
           <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wide">
             {article.date}
           </span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
