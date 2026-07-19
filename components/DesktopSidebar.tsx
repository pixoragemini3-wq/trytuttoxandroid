import React, { useEffect, useMemo, useState } from 'react';
import { Article } from '../types';
import ArticleSkeleton from './ArticleSkeleton';

interface DesktopSidebarProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
  isLoading?: boolean;
}

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

  // Reset se cambia il pool
  useEffect(() => {
    setPage(0);
    setAnimKey((k) => k + 1);
  }, [pool.length, pool[0]?.id]);

  // Rotazione automatica ogni 5s tra blocchi da 4
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
    <div className="hidden lg:flex flex-col w-[280px] shrink-0 bg-[#fff200] h-full min-h-0 py-4 px-4 rounded-[2rem] relative z-10 shadow-xl justify-between overflow-hidden">
      {/* Watermark leggero, non deve uscire dal box */}
      <span
        className="absolute top-1 right-1 text-[4.5rem] font-black text-black/[0.06] select-none pointer-events-none font-condensed leading-none max-w-[55%] overflow-hidden"
        aria-hidden
      >
        TOP
      </span>

      {/* Header compatto — niente testo che sborda sul hero */}
      <div className="relative z-10 shrink-0 pr-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 bg-black rounded-full shrink-0" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-black/70">
            La Selezione
          </span>
        </div>
        <h3
          className="font-condensed text-[2.15rem] xl:text-[2.35rem] font-black uppercase leading-[0.9] tracking-tight text-black break-words"
          style={{
            fontFamily:
              "'Saira Extra Condensed', 'Impact', 'Arial Narrow', 'Arial Black', system-ui, sans-serif",
            fontWeight: 900,
          }}
        >
          Best of
          <br />
          The Best
        </h3>
        <div className="w-8 h-1 bg-black mt-2 mb-3" />
      </div>

      {/* Lista a blocchi da 4, scorrimento verticale */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">
        <div
          key={animKey}
          className="flex flex-col gap-3 justify-center flex-1 min-h-0 animate-in slide-in-from-bottom-3 fade-in duration-500"
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
                className="group cursor-pointer flex gap-2.5 items-start shrink-0 w-full text-left bg-transparent border-0 p-0"
              >
                <span className="font-condensed text-xl font-black text-black/25 group-hover:text-black transition-colors leading-none w-7 shrink-0 pt-0.5 tabular-nums">
                  {formatNum(startNum + idx + 1)}
                </span>
                <div className="pt-0.5 border-t border-black/10 w-full min-w-0">
                  <h4 className="font-condensed text-[13px] leading-snug font-bold text-black group-hover:underline decoration-2 underline-offset-2 transition-all line-clamp-2 break-words">
                    {article.title}
                  </h4>
                </div>
              </button>
            ))
          ) : (
            <p className="text-[11px] text-black/50 font-medium">Contenuti in aggiornamento…</p>
          )}
        </div>

        {/* Indicatori pagina (solo se più blocchi) */}
        {!isLoading && pageCount > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 shrink-0">
            {Array.from({ length: Math.min(pageCount, 12) }).map((_, i) => {
              // se >12 pagine, mappa su 12 dots proporzionali
              const activeDot =
                pageCount <= 12
                  ? i === page
                  : Math.floor((page / pageCount) * 12) === i;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Blocco ${i + 1}`}
                  onClick={() => {
                    if (pageCount <= 12) {
                      setPage(i);
                      setAnimKey((k) => k + 1);
                    }
                  }}
                  className={`h-1 rounded-full transition-all ${
                    activeDot ? 'w-4 bg-black' : 'w-1.5 bg-black/25'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-2 shrink-0 flex items-center justify-between opacity-50 border-t border-black/10 pt-2 relative z-10">
        <span className="text-[7px] font-medium uppercase tracking-[0.15em] text-black font-sans">
          TuttoXAndroid Select
        </span>
        {!isLoading && pool.length > 0 && (
          <span className="text-[7px] font-black uppercase tracking-wider text-black/70 tabular-nums">
            {page + 1}/{pageCount}
          </span>
        )}
      </div>
    </div>
  );
};

export default DesktopSidebar;
