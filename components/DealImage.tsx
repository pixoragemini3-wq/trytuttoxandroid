import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  amazonImageCandidates,
  extractAmazonAsin,
  isResolvedAmazonImage,
  resolveAmazonProductImage,
} from '../services/bloggerService';

type Props = {
  src: string;
  link: string;
  alt: string;
  className?: string;
};

/** Amazon /images/P/ASIN → spesso GIF 1×1 (200 OK, riquadro bianco). */
const isVisuallyBlank = (img: HTMLImageElement): boolean => {
  const w = img.naturalWidth || 0;
  const h = img.naturalHeight || 0;
  if (w <= 2 || h <= 2) return true;
  if (w * h < 400) return true;
  return false;
};

const DealImage: React.FC<Props> = ({ src, link, alt, className = '' }) => {
  const baseList = useMemo(() => {
    const list = [src, ...amazonImageCandidates(link)].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [src, link]);

  const [url, setUrl] = useState(baseList[0] || '');
  const triedRef = useRef<Set<string>>(new Set());
  const resolvingRef = useRef(false);

  // Reset quando cambia offerta
  useEffect(() => {
    triedRef.current = new Set();
    resolvingRef.current = false;
    setUrl(baseList[0] || '');
  }, [baseList]);

  // Pre-risolvi ASIN → /images/I/ (microlink/jina) in background
  useEffect(() => {
    if (!extractAmazonAsin(link)) return;
    if (isResolvedAmazonImage(src)) return;
    let cancelled = false;
    (async () => {
      try {
        const resolved = await resolveAmazonProductImage(link);
        if (cancelled || !resolved) return;
        triedRef.current.add(url);
        setUrl(resolved);
      } catch { /* keep static */ }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambio link/src
  }, [link, src]);

  const tryNext = async (failedUrl: string) => {
    triedRef.current.add(failedUrl);

    // Prossimo candidato statico non ancora provato
    const nextStatic = baseList.find((u) => !triedRef.current.has(u));
    if (nextStatic) {
      setUrl(nextStatic);
      return;
    }

    // Risoluzione ASIN se non ancora fatta
    if (!resolvingRef.current && extractAmazonAsin(link)) {
      resolvingRef.current = true;
      try {
        const resolved = await resolveAmazonProductImage(link);
        if (resolved && !triedRef.current.has(resolved)) {
          setUrl(resolved);
          return;
        }
      } catch { /* */ } finally {
        resolvingRef.current = false;
      }
    }
  };

  if (!url) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${className}`}
        aria-hidden
      >
        <span className="text-2xl opacity-50">🛒</span>
      </div>
    );
  }

  return (
    <img
      key={url}
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onLoad={(e) => {
        if (isVisuallyBlank(e.currentTarget)) {
          void tryNext(url);
        }
      }}
      onError={() => {
        void tryNext(url);
      }}
    />
  );
};

export default DealImage;
