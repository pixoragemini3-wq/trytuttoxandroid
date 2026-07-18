import React, { useMemo, useState } from 'react';
import { amazonImageCandidates } from '../services/bloggerService';

type Props = {
  src: string;
  link: string;
  alt: string;
  className?: string;
};

/**
 * Anteprima offerta con fallback multipli (ASIN Amazon / placeholder)
 * se l'URL primario restituisce riquadro bianco o 404.
 */
const DealImage: React.FC<Props> = ({ src, link, alt, className = '' }) => {
  const candidates = useMemo(() => {
    const list = [src, ...amazonImageCandidates(link)].filter(Boolean);
    // dedupe
    return Array.from(new Set(list));
  }, [src, link]);

  const [idx, setIdx] = useState(0);
  const current = candidates[Math.min(idx, candidates.length - 1)];

  return (
    <img
      src={current}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
      }}
    />
  );
};

export default DealImage;
