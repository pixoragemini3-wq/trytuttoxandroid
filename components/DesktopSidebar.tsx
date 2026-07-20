import React, { useEffect, useMemo, useState } from 'react';
import { Article } from '../types';
import ArticleSkeleton from './ArticleSkeleton';

interface DesktopSidebarProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  isLoading?: boolean;
}

/** 4 notizie per blocco: riempie l’altezza della colonna gialla */
const PAGE_SIZE = 4;
const MAX_ITEMS = 120;
const ROTATE_MS = 5000;

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  articles,
  onArticleClick,
  isLoading = false,
}) => {
  const pool = useMemo(() => {
    const seen = new Set<string>();
    const out: Article[] = [];
    for (const a of articles) {
      if (!a?.id || seen.has(a.id)) continue;
      seen.add(a.id);
      out.push(a);
      if (out.length >= MAX_ITEMS) break;
    }
    return out;
  }, [articles]);

  const pageCount = Math.max(1, Math.ceil(pool.length / PAGE_SIZE) || 1);
  const [page, setPage] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setPage(0);
    setAnimKey((k) => k + 1);
  }, [pool.length, pool[0]?.id]);

  useEffect(() => {
    if (isLoading || pool.length <= PAGE_SIZE) return;
    const t = window.setInterval(() => {
      setPage((p) => {
        const next = (p + 1) % Math.max(1, Math.ceil(pool.length / PAGE_SIZE));
        setAnimKey((k) => k + 1);
        return next;
      });
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [isLoading, pool.length]);

  const pageItems = pool.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const startNum = page * PAGE_SIZE;
  const formatNum = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="hidden lg:flex flex-col w-[300px] xl:w-[320px] shrink-0 bg-[#fff200] h-full min-h-0 py-5 px-5 rounded-[1.75rem] relative z-20 shadow-xl isolate overflow-hidden">
      {/* Watermark TOP: solo sfondo, sotto i pezzi (z-0) */}
      <span
        className="absolute -right-1 top-0 z-0 text-[5.5rem] xl:text-[6.25rem] font-black text-black/[0.07] select-none pointer-events-none font-condensed leading-none tracking-tighter"
        style={{
          fontFamily:
            "'Saira Extra Condensed', 'Impact', 'Arial Narrow', system-ui, sans-serif",
          fontWeight: 900,
        }}
        aria-hidden
      >
        TOP
      </span>

      {/* Header */}
      <div className="relative z-10 shrink-0 mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 bg-black rounded-full shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-black/65">
            La Selezione
          </span>
        </div>
        <h3
          className="font-condensed text-[1.85rem] xl:text-[2rem] font-black uppercase leading-[0.95] tracking-tight text-black"
          style={{
            fontFamily:
              "'Saira Extra Condensed', 'Impact', 'Arial Narrow', system-ui, sans-serif",
            fontWeight: 900,
          }}
        >
          Best of the Best
        </h3>
        <div className="w-10 h-[3px] bg-black mt-2.5 rounded-full" />
      </div>

      {/* Lista: 4 pezzi per occupare lo spazio sotto il titolo */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        <div
          key={animKey}
          className="flex flex-col gap-3 flex-1 min-h-0 justify-start animate-in fade-in slide-in-from-bottom-2 duration-400"
        >
          {isLoading ? (
            <>
              <ArticleSkeleton type="sidebar" />
              <ArticleSkeleton type="sidebar" />
              <ArticleSkeleton type="sidebar" />
              <ArticleSkeleton type="sidebar" />
            </>
          ) : pageItems.length > 0 ? (
            pageItems.map((article, idx) => (
              <button
                key={`${article.id}-${page}`}
                type="button"
                onClick={() => onArticleClick(article)}
                className="group cursor-pointer flex gap-3 items-start w-full text-left bg-transparent border-0 p-0 shrink-0"
              >
                <span className="font-condensed text-[1.3rem] font-black text-black/30 group-hover:text-black transition-colors leading-none w-8 shrink-0 pt-0.5 tabular-nums">
                  {formatNum(startNum + idx + 1)}
                </span>
                <div className="min-w-0 flex-1 border-t border-black/15 pt-1.5">
                  <h4 className="font-condensed text-[13.5px] xl:text-[14.5px] leading-[1.25] font-bold text-black group-hover:underline decoration-2 underline-offset-2 transition-all line-clamp-2 break-words">
                    {article.title}
                  </h4>
                </div>
              </button>
            ))
          ) : (
            <p className="text-[12px] text-black/50 font-medium">Contenuti in aggiornamento…</p>
          )}
        </div>

        {!isLoading && pageCount > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-auto pt-3 shrink-0">
            {Array.from({ length: Math.min(pageCount, 10) }).map((_, i) => {
              const active =
                pageCount <= 10
                  ? i === page
                  : Math.floor((page / pageCount) * 10) === i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Blocco ${i + 1}`}
                  onClick={() => {
                    if (pageCount <= 10) {
                      setPage(i);
                      setAnimKey((k) => k + 1);
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    active ? 'w-5 bg-black' : 'w-1.5 bg-black/30 hover:bg-black/50'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 shrink-0 flex items-center justify-between border-t border-black/10 pt-2.5 relative z-10">
        <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-black/55">
          TuttoXAndroid
        </span>
        {!isLoading && pool.length > 0 && (
          <span className="text-[8px] font-black uppercase tracking-wider text-black/60 tabular-nums">
            {page + 1}/{pageCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default DesktopSidebar;
