
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

const CATEGORY_COLORS: Record<string, string> = {
  'Smartphone': '#2563eb',
  'Modding': '#ea580c',
  'App & Giochi': '#16a34a',
  'Recensioni': '#7c3aed',
  'Guide': '#0891b2',
  'Offerte': '#ca8a04',
  'Wearable': '#db2777',
  'News': '#e31b23',
};

const getCatColor = (cat: string) => CATEGORY_COLORS[cat] || '#e31b23';

const FALLBACK = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, className = '', isLoading, type }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardType = type || article?.type || 'standard';

  if (isLoading || !article) return <ArticleSkeleton type={cardType} className={className} />;

  const color = getCatColor(article.category);

  /* ── HERO ─────────────────────────────────────────────────────────── */
  if (cardType === 'hero') {
    return (
      <div
        ref={cardRef}
        onClick={onClick}
        className={`group cursor-pointer flex flex-col md:flex-row bg-white overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
      >
        {/* Image */}
        <div className="relative w-full md:w-[58%] aspect-video md:aspect-auto shrink-0 overflow-hidden bg-gray-100">
          {!imgLoaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
          <img
            src={article.imageUrl}
            alt={article.title}
            onError={e => { e.currentTarget.src = FALLBACK; }}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          <span
            className="absolute top-3 left-3 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ backgroundColor: color }}
          >
            {article.category}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center p-6 md:p-8 md:w-[42%]">
          <h2 className="font-condensed text-[22px] md:text-[26px] lg:text-[30px] font-black leading-[1.08] tracking-tight text-gray-950 group-hover:text-[#e31b23] transition-colors duration-200 line-clamp-4 mb-3">
            {article.title}
          </h2>
          <p className="hidden md:block text-[13px] leading-relaxed text-gray-500 line-clamp-3 mb-5">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium mt-auto">
            <span>{article.author}</span>
            <span className="text-gray-200">·</span>
            <span>{article.date}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── HORIZONTAL (carousel overlay) ───────────────────────────────── */
  if (cardType === 'horizontal') {
    return (
      <div
        ref={cardRef}
        onClick={onClick}
        className={`group relative cursor-pointer overflow-hidden rounded-xl bg-black aspect-[3/4] shrink-0 ${className}`}
      >
        {!imgLoaded && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
        <img
          src={article.imageUrl}
          alt={article.title}
          onError={e => { e.currentTarget.src = FALLBACK; }}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] opacity-75 ${imgLoaded ? '' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span
            className="inline-block text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2"
            style={{ backgroundColor: color }}
          >
            {article.category}
          </span>
          <h3 className="text-white font-condensed text-[16px] font-black leading-[1.1] tracking-tight group-hover:text-[#e31b23] transition-colors line-clamp-3">
            {article.title}
          </h3>
        </div>
      </div>
    );
  }

  /* ── STANDARD ─────────────────────────────────────────────────────── */
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${className}`}
    >
      {/* Image top */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-100 shrink-0">
        {!imgLoaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
        <img
          src={article.imageUrl}
          alt={article.title}
          onError={e => { e.currentTarget.src = FALLBACK; }}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <span
          className="text-[10px] font-bold uppercase tracking-widest mb-2 block"
          style={{ color }}
        >
          {article.category}
        </span>
        <h3 className="font-condensed text-[17px] font-black leading-[1.1] tracking-tight text-gray-950 group-hover:text-[#e31b23] transition-colors duration-200 line-clamp-3 mb-3">
          {article.title}
        </h3>
        <p className="text-[12px] text-gray-400 leading-relaxed line-clamp-2 mb-4 hidden sm:block">
          {article.excerpt}
        </p>
        <div className="mt-auto flex items-center gap-2 text-[11px] text-gray-400 font-medium">
          <span>{article.author}</span>
          <span className="text-gray-200">·</span>
          <span>{article.date}</span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
