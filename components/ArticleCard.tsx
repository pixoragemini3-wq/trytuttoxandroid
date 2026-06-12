
import React, { useRef, useState } from 'react';
import { Article } from '../types';
import ArticleSkeleton from './ArticleSkeleton';

interface ArticleCardProps {
  article?: Article;
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
  type?: 'standard' | 'horizontal' | 'hero' | 'sidebar';
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

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, className = '', isLoading, type }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const cardType = type || article?.type || 'standard';

  if (isLoading || !article) {
    return <ArticleSkeleton type={cardType} className={className} />;
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  // Stile HERO (Immagine a sinistra, Box Rosso a destra)
  if (cardType === 'hero') {
    return (
      <div ref={cardRef} onClick={onClick} className={`relative w-full h-full lg:rounded-[1.5rem] bg-white flex flex-col md:flex-row shadow-2xl group cursor-pointer overflow-hidden ring-1 ring-black/5 ${className}`}>
        {/* Image Section */}
        <div className="w-full md:w-[55%] lg:w-[60%] aspect-video md:aspect-auto md:h-full overflow-hidden relative bg-gray-900 shrink-0">
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
              <div className="w-8 h-8 border-2 border-white/10 border-t-[#e31b23] rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={article.imageUrl}
            alt={article.title}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`h-full w-full object-cover transition-all duration-1000 group-hover:scale-[1.03] ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          {/* gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 pointer-events-none"></div>
          {/* Category badge on image */}
          <span className="absolute top-4 left-4 bg-[#e31b23] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
            {article.category}
          </span>
        </div>

        {/* Content Section */}
        <div className="w-full md:w-[45%] lg:w-[40%] p-5 md:p-6 lg:p-8 bg-[#0d0d0d] text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative noise/grain effect */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')] pointer-events-none"></div>
          {/* Accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e31b23] to-transparent opacity-60"></div>

          <div className="flex flex-col items-start w-full relative">
            <h2 className="font-condensed text-2xl md:text-3xl lg:text-[2.2rem] font-black leading-[1] uppercase tracking-tight w-full text-white group-hover:text-[#c0ff8c] transition-colors duration-300 line-clamp-4">
              {article.title}
            </h2>
            <p className="hidden md:block text-xs lg:text-sm font-normal leading-relaxed text-gray-400 group-hover:text-gray-300 transition-colors mt-4 max-w-xl line-clamp-3">
              {article.excerpt}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 w-full flex justify-between items-center relative">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
              {article.author.toUpperCase()}
            </span>
            <span className="text-[9px] font-medium text-gray-600 uppercase tracking-wide">
              {article.date.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Stile OVERLAY (In Evidenza - Carousel)
  if (cardType === 'horizontal') {
    const bgClass = getCategoryColors(article.category, 'bg');
    const isCustom = bgClass.includes('[');
    
    return (
      <div ref={cardRef} onClick={onClick} className={`relative w-full aspect-square md:aspect-[4/5] overflow-hidden rounded-xl lg:rounded-2xl group cursor-pointer shadow-lg bg-black shrink-0 ${className}`}>
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-gray-600 border-t-[#c0ff8c] rounded-full animate-spin"></div>
          </div>
        )}
        <img 
          src={article.imageUrl} 
          alt={article.title}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-110 opacity-70 ${isImageLoaded ? 'opacity-70' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3 lg:p-4 w-full flex flex-col items-start">
           <span 
             className={`${isCustom ? bgClass : `bg-${article.category === 'Smartphone' ? 'blue-600' : article.category === 'Modding' ? 'orange-500' : article.category === 'App & Giochi' ? 'green-500' : article.category === 'Recensioni' ? 'purple-600' : article.category === 'Guide' ? 'cyan-600' : article.category === 'Offerte' ? 'yellow-500' : article.category === 'Wearable' ? 'pink-500' : '[#e31b23]'}`} text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest mb-1.5 inline-flex items-center justify-center leading-none transition-colors group-hover:bg-[#c0ff8c] group-hover:text-black`}
           >
             {article.category}
           </span>
           <h3 className="text-white font-condensed text-lg lg:text-xl font-bold uppercase leading-none tracking-tight group-hover:text-[#c0ff8c] transition-colors line-clamp-3 text-justify">
             {article.title}
           </h3>
        </div>
      </div>
    );
  }

  // Stile STANDARD
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
    <div ref={cardRef} onClick={onClick} className={`flex flex-col md:flex-row gap-4 group cursor-pointer h-full transition-all duration-200 hover:bg-gray-50/80 hover:shadow-lg rounded-2xl p-3 border border-transparent hover:border-gray-100/80 ${className}`}>

      {/* IMAGE */}
      <div className="w-full md:w-[35%] aspect-video md:aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
         {!isImageLoaded && (
           <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
             <div className="w-5 h-5 border-2 border-gray-200 border-t-[#e31b23] rounded-full animate-spin"></div>
           </div>
         )}
         <img
            src={article.imageUrl}
            alt={article.title}
            onError={handleImageError}
            onLoad={handleImageLoad}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
         />
      </div>

      {/* CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col justify-center py-0.5">
        <span className={`${textColorClass} text-[9px] font-black uppercase tracking-widest mb-1.5 block`}>
          {article.category}
        </span>

        <h3 className="font-condensed text-lg md:text-xl lg:text-[1.35rem] font-black leading-tight text-gray-950 group-hover:text-[#e31b23] transition-colors mb-2 line-clamp-3 tracking-tight">
          {article.title}
        </h3>

        <p className="text-[11px] text-gray-400 font-normal leading-relaxed line-clamp-2 mb-3 hidden md:block">
           {article.excerpt}
        </p>

        <div className="mt-auto flex items-center gap-2">
           <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{article.author}</span>
           <span className="text-[8px] text-gray-200">•</span>
           <span className="text-[9px] text-gray-400 uppercase tracking-wide">{article.date}</span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
