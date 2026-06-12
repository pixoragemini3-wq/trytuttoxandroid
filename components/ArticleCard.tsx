
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
  'Smartphone':   '#1e3a8a',
  'Modding':      '#9a3412',
  'App & Giochi': '#166534',
  'Recensioni':   '#581c87',
  'Guide':        '#164e63',
  'Offerte':      '#854d0e',
  'Wearable':     '#9d174d',
  'News':         '#9f1239',
};

// For arbitrary blog labels → consistent color from palette (muted, less joyful)
const TAG_PALETTE = ['#9f1239','#1e40af','#581c87','#0f766e','#166534','#854d0e','#831843','#0d5c63','#713f12','#4338ca'];
const hashColor = (str: string): string => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length];
};

const getCatColor = (cat: string) => CATEGORY_COLORS[cat] ?? hashColor(cat);

const FALLBACK = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';

const Meta: React.FC<{ author: string; date: string }> = ({ author, date }) => (
  <div className="flex items-center gap-2 mt-auto pt-3">
    <div className="w-6 h-6 rounded-full bg-[#e31b23] flex items-center justify-center text-white text-[9px] font-black uppercase shrink-0">
      {author?.[0] ?? 'T'}
    </div>
    <span className="text-[12px] font-semibold text-gray-700 truncate">{author}</span>
    <span className="text-gray-300 text-[10px]">·</span>
    <span className="text-[12px] text-gray-400 whitespace-nowrap">{date}</span>
  </div>
);

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, className = '', isLoading, type }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardType = type || article?.type || 'standard';

  if (isLoading || !article) return <ArticleSkeleton type={cardType} className={className} />;

  const color = getCatColor(article.category);

  /* ── HERO ─────────────────────────────────────────────────────── */
  if (cardType === 'hero') {
    return (
      <div
        ref={cardRef}
        onClick={onClick}
        className={`group cursor-pointer flex flex-col md:flex-row bg-white overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 h-full ${className}`}
      >
        <div className="relative w-full md:w-[58%] h-full shrink-0 overflow-hidden bg-[#f8f8f8] p-3 md:p-4">
          {!imgLoaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              onError={e => { e.currentTarget.src = FALLBACK; }}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
          <span
            className="absolute top-5 left-5 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center min-h-[24px]"
            style={{ backgroundColor: color }}
          >
            {article.category}
          </span>
        </div>
        <div className="flex flex-col justify-center p-6 md:p-8 md:w-[42%]">
          <h2 className="font-condensed text-[26px] md:text-[30px] lg:text-[34px] font-black leading-[1.05] tracking-tight text-gray-950 group-hover:text-[#e31b23] transition-colors duration-200 line-clamp-4 mb-3">
            {article.title}
          </h2>
          <p className="hidden md:block text-[14px] leading-relaxed text-gray-500 line-clamp-3 mb-4">
            {article.excerpt}
          </p>
          <Meta author={article.author} date={article.date} />
        </div>
      </div>
    );
  }

  /* ── HORIZONTAL (carousel) ────────────────────────────────────── */
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
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${imgLoaded ? 'opacity-75' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span
            className="inline-flex items-center text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2 min-h-[24px]"
            style={{ backgroundColor: color }}
          >
            {article.category}
          </span>
          <h3 className="text-[#f4f1e9] font-condensed text-[22px] md:text-[23px] font-black leading-[1.05] tracking-[-0.2px] group-hover:text-[#e8e4d9] transition-colors line-clamp-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            {article.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-white/50 text-[11px]">{article.author}</span>
            <span className="text-white/30 text-[9px]">·</span>
            <span className="text-white/40 text-[11px]">{article.date}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── STANDARD ─────────────────────────────────────────────────── */
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${className}`}
    >
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
      <div className="flex flex-col flex-1 p-4">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2 block"
          style={{ color }}
        >
          {article.category}
        </span>
        <h3 className="font-condensed text-[24px] md:text-[26px] font-black leading-[1.05] tracking-tight text-gray-950 group-hover:text-[#e31b23] transition-colors duration-200 line-clamp-3 mb-2">
          {article.title}
        </h3>
        <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-2 mb-3 hidden sm:block">
          {article.excerpt}
        </p>
        <Meta author={article.author} date={article.date} />
      </div>
    </div>
  );
};

export default ArticleCard;
