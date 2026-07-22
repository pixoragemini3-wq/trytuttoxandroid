import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  amazonImageCandidates,
  extractAmazonAsin,
  isAmazonPlaceholderPath,
  isLoadedImageBlank,
  isResolvedAmazonImage,
  resolveAmazonProductImage,
} from '../services/bloggerService';

type Props = {
  src: string;
  link: string;
  alt: string;
  className?: string;
};

const DealImage: React.FC<Props> = ({ src, link, alt, className = '' }) => {
  const baseList = useMemo(() => {
    const list: string[] = [];
    // Mai partire da path P/ (riquadro bianco): prima foto TG / I/ / widget
    if (src && !isAmazonPlaceholderPath(src)) list.push(src);
    for (const c of amazonImageCandidates(link)) {
      if (!isAmazonPlaceholderPath(c)) list.push(c);
    }
    // Path P/ solo come ultima spiaggia (verranno scartati se blank)
    if (src && isAmazonPlaceholderPath(src)) list.push(src);
    for (const c of amazonImageCandidates(link)) {
      if (isAmazonPlaceholderPath(c)) list.push(c);
    }
    return Array.from(new Set(list.filter(Boolean)));
  }, [src, link]);

  const [url, setUrl] = useState(baseList[0] || '');
  const triedRef = useRef<Set<string>>(new Set());
  const resolvingRef = useRef(false);

  useEffect(() => {
    triedRef.current = new Set();
    resolvingRef.current = false;
    setUrl(baseList[0] || '');
  }, [baseList]);

  // Risolvi subito ASIN → foto prodotto reale (non aspettare onError sul bianco)
  useEffect(() => {
    if (!extractAmazonAsin(link)) return;
    if (isResolvedAmazonImage(src) && !isAmazonPlaceholderPath(src)) return;
    let cancelled = false;
    (async () => {
      try {
        const resolved = await resolveAmazonProductImage(link);
        if (cancelled || !resolved || isAmazonPlaceholderPath(resolved)) return;
        triedRef.current.add(url);
        setUrl(resolved);
      } catch {
        /* keep static */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link, src]);

  const tryNext = async (failedUrl: string) => {
    triedRef.current.add(failedUrl);

    const nextStatic = baseList.find((u) => !triedRef.current.has(u) && !isAmazonPlaceholderPath(u));
    if (nextStatic) {
      setUrl(nextStatic);
      return;
    }

    if (!resolvingRef.current && extractAmazonAsin(link)) {
      resolvingRef.current = true;
      try {
        const resolved = await resolveAmazonProductImage(link);
        if (resolved && !triedRef.current.has(resolved) && !isAmazonPlaceholderPath(resolved)) {
          setUrl(resolved);
          return;
        }
      } catch {
        /* */
      } finally {
        resolvingRef.current = false;
      }
    }

    // Ultima chance: path P/ non ancora provati
    const nextP = baseList.find((u) => !triedRef.current.has(u));
    if (nextP) {
      setUrl(nextP);
      return;
    }
    // Nessuna foto usabile → icona carrello (mai riquadro bianco fisso)
    setUrl('');
  };

  // Se l'URL iniziale è un placeholder Amazon, salta subito
  useEffect(() => {
    if (url && isAmazonPlaceholderPath(url)) {
      void tryNext(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

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
      style={{ maxWidth: '100%', maxHeight: '100%' }}
      onLoad={(e) => {
        if (isLoadedImageBlank(e.currentTarget) || isAmazonPlaceholderPath(url)) {
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
