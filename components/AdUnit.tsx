
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface AdUnitProps {
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'link';
  layoutKey?: string; // Per annunci In-Feed
  className?: string;
  label?: string; // Etichetta es. "Sponsor"
}

const AdUnit: React.FC<AdUnitProps> = ({ slotId, format = 'auto', layoutKey, className = '', label = 'Sponsor' }) => {
  const adRef = useRef<HTMLModElement>(null);
  const [isFilled, setIsFilled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Skip if already filled to prevent double push on re-renders
    if (isFilled || !adRef.current) return;

    // Use IntersectionObserver to ensure the element is visible and has width before pushing
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      
      if (entry.isIntersecting && entry.boundingClientRect.width > 0) {
        try {
          if (typeof window !== 'undefined') {
            const ads = ((window as any).adsbygoogle = (window as any).adsbygoogle || []);
            ads.push({});
            // Optimistically mark as filled; real status will be verified below
            setIsFilled(true);
          }
        } catch (e) {
          console.error("AdSense push error", e);
        }
        
        observer.disconnect();
      }
    }, { 
       rootMargin: '200px' 
    });

    observer.observe(adRef.current);

    return () => {
      observer.disconnect();
    };
  }, [slotId, isFilled]);

  // After push, verify if AdSense actually filled the slot (data-ad-status="filled" or real height).
  // If not (adblock, no inventory, error), we completely hide the unit and label.
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
        // Ad did not load or was hidden → do not propose it
        setIsFilled(false);
      }
    };

    // Give AdSense a bit of time to load the creative
    const t1 = setTimeout(verifyFill, 2200);
    const t2 = setTimeout(verifyFill, 4500); // second chance

    // Also react to AdSense mutating the element
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
  }, [slotId]);

  // ID Publisher Ufficiale dell'utente
  const AD_CLIENT = "ca-pub-8927124953064334"; 
  
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // If we know the ad did not fill (or in dev we decide not to show empty slots), render nothing at all.
  // This avoids "ADS HIDDEN" or empty sponsor boxes.
  if (isDev) {
    // In local dev we never show real ad UI (prevents noise). Real ads only in production build.
    // The <ins> is still in the tree in case you want to test the slot manually, but we hide chrome.
    return (
      <ins ref={adRef}
           key={slotId}
           className="adsbygoogle"
           style={{ display: 'block', width: '100%', minHeight: 0 }}
           data-ad-client={AD_CLIENT}
           data-ad-slot={slotId}
           data-ad-format={format}
           data-full-width-responsive="true"
           {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
      ></ins>
    );
  }

  // In production: only render the sponsor label + ad container if we detected a successful fill.
  // Otherwise return null → the ad unit is not proposed at all.
  if (!isFilled) {
    // Still need to keep the ins in DOM so AdSense can attempt to fill it (for the observers above).
    // But with zero visual footprint.
    return (
      <ins ref={adRef}
           key={slotId}
           className="adsbygoogle"
           style={{ display: 'block', width: '100%', minHeight: 0, height: 0, overflow: 'hidden' }}
           data-ad-client={AD_CLIENT}
           data-ad-slot={slotId}
           data-ad-format={format}
           data-full-width-responsive="true"
           {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
      ></ins>
    );
  }

  return (
    <div className={`ad-container flex flex-col items-center justify-center bg-transparent ${className}`}>
      {label && (
        <span className="font-condensed text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 self-start ml-1">{label}</span>
      )}
      <div className="w-full overflow-hidden flex justify-center">
        <ins ref={adRef}
             key={slotId}
             className="adsbygoogle"
             style={{ display: 'block', width: '100%' }}
             data-ad-client={AD_CLIENT}
             data-ad-slot={slotId}
             data-ad-format={format}
             data-full-width-responsive="true"
             {...(layoutKey && { 'data-ad-layout-key': layoutKey })}
        ></ins>
      </div>
    </div>
  );
};

export default AdUnit;
