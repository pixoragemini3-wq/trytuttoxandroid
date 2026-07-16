
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface AdUnitProps {
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'link';
  layoutKey?: string;
  className?: string;
  label?: string;
  variant?: 'default' | 'inline';
}

const AdUnit: React.FC<AdUnitProps> = ({
  slotId,
  format = 'auto',
  layoutKey,
  className = '',
  label = 'Sponsor',
  variant = 'default',
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const [isFilled, setIsFilled] = useState(false);
  const location = useLocation();
  const isInline = variant === 'inline';
  const displayLabel = isInline ? (label || 'Annuncio') : label;

  useEffect(() => {
    if (isFilled || !adRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (entry.isIntersecting && entry.boundingClientRect.width > 0) {
        try {
          if (typeof window !== 'undefined') {
            const ads = ((window as any).adsbygoogle = (window as any).adsbygoogle || []);
            ads.push({});
            setIsFilled(true);
          }
        } catch (e) {
          console.error('AdSense push error', e);
        }

        observer.disconnect();
      }
    }, {
      rootMargin: '200px',
    });

    observer.observe(adRef.current);

    return () => {
      observer.disconnect();
    };
  }, [slotId, isFilled, location.pathname]);

  useEffect(() => {
    if (!adRef.current) return;

    const verifyFill = () => {
      const el = adRef.current;
      if (!el) return;

      const status = el.getAttribute('data-ad-status');
      const hasHeight = (el.offsetHeight || 0) > 20;

      if (status === 'filled' || hasHeight) {
        setIsFilled(true);
      } else {
        setIsFilled(false);
      }
    };

    const t1 = setTimeout(verifyFill, 2200);
    const t2 = setTimeout(verifyFill, 4500);

    const mo = new MutationObserver(() => {
      const status = adRef.current?.getAttribute('data-ad-status');
      if (status === 'filled' || (adRef.current && (adRef.current.offsetHeight || 0) > 20)) {
        setIsFilled(true);
        mo.disconnect();
      }
    });
    mo.observe(adRef.current, { attributes: true, childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      mo.disconnect();
    };
  }, [slotId, location.pathname]);

  const AD_CLIENT = 'ca-pub-8927124953064334';
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const adFormat = isInline ? 'fluid' : format;

  if (isDev) {
    return (
      <ins
        ref={adRef}
        key={`${slotId}-${variant}`}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: 0 }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
      />
    );
  }

  if (!isFilled) {
    return (
      <ins
        ref={adRef}
        key={`${slotId}-${variant}`}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: 0, height: 0, overflow: 'hidden' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
        {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
      />
    );
  }

  const containerClass = isInline
    ? `ad-container ad-inline ${className}`
    : `ad-container flex flex-col items-center justify-center bg-transparent ${className}`;

  return (
    <div className={containerClass}>
      {displayLabel && (
        <span className={`ad-label font-condensed font-bold text-gray-400 uppercase tracking-widest ${isInline ? 'text-[8px] mb-1 opacity-60' : 'text-[8px] mb-1 self-start ml-1'}`}>
          {displayLabel}
        </span>
      )}
      <div className={isInline ? 'w-full' : 'w-full overflow-hidden flex justify-center'}>
        <ins
          ref={adRef}
          key={`${slotId}-${variant}-filled`}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slotId}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
          {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
        />
      </div>
    </div>
  );
};

export default AdUnit;