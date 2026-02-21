
import React, { useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    // Skip if already filled to prevent double push on re-renders
    if (isFilled || !adRef.current) return;

    // Use IntersectionObserver to ensure the element is visible and has width before pushing
    // This prevents "No slot size for availableWidth=0" errors when ads are in hidden tabs or mobile menus
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      
      // Check if intersecting AND has width (handles display:none elements)
      if (entry.isIntersecting && entry.boundingClientRect.width > 0) {
        try {
          if (typeof window !== 'undefined') {
            // Check if the ad has already been populated by AdSense script (data-ad-status="filled")
            if (!adRef.current?.getAttribute('data-ad-status')) {
               const ads = ((window as any).adsbygoogle = (window as any).adsbygoogle || []);
               ads.push({});
               setIsFilled(true);
            }
          }
        } catch (e) {
          console.error("AdSense push error", e);
        }
        
        // Once pushed, we stop observing this specific unit
        observer.disconnect();
      }
    }, { 
       // Start loading slightly before it enters the viewport for better UX
       rootMargin: '200px' 
    });

    observer.observe(adRef.current);

    return () => {
      observer.disconnect();
    };
  }, [slotId, isFilled]);

  // ID Publisher Ufficiale dell'utente
  const AD_CLIENT = "ca-pub-8927124953064334"; 
  
  // Safe check for development environment without accessing process.env which might crash in some ESM builds
  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <div className={`ad-container flex flex-col items-center justify-center bg-transparent ${className}`}>
      {/* Updated Label Styling: Font Condensed, Smaller Size, Bold */}
      {label && <span className="font-condensed text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 self-start ml-1">{label}</span>}
      <div className="w-full overflow-hidden flex justify-center min-h-[50px] bg-gray-50 rounded-lg relative">
        {/* Placeholder for Development - Safe check */}
        <div className="absolute inset-0 flex items-center justify-center font-condensed text-[10px] font-bold text-gray-400 uppercase pointer-events-none border border-dashed border-gray-200 m-1 rounded">
           {isDev ? 'Ads Hidden' : ''}
        </div>
        
        <ins ref={adRef}
             key={slotId} // Force remount if slotId changes
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
