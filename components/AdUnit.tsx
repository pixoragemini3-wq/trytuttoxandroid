
import React, { useEffect } from 'react';

interface AdUnitProps {
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'link';
  layoutKey?: string; // Per annunci In-Feed
  className?: string;
  label?: string; // Etichetta es. "Sponsor"
}

const AdUnit: React.FC<AdUnitProps> = ({ slotId, format = 'auto', layoutKey, className = '', label = 'Sponsor' }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  // ID Publisher Ufficiale dell'utente
  const AD_CLIENT = "ca-pub-8927124953064334"; 

  return (
    <div className={`ad-container flex flex-col items-center justify-center bg-transparent ${className}`}>
      {label && <span className="text-[9px] text-gray-300 uppercase tracking-widest mb-1 self-start ml-2">{label}</span>}
      <div className="w-full overflow-hidden flex justify-center min-h-[50px] bg-gray-50 rounded-lg">
        <ins className="adsbygoogle"
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
