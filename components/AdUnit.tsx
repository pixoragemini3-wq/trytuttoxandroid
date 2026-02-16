
import React, { useEffect } from 'react';

interface AdUnitProps {
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string; // Per annunci In-Feed
  className?: string;
  label?: string; // Etichetta es. "Sponsor"
}

const AdUnit: React.FC<AdUnitProps> = ({ slotId, format = 'auto', layoutKey, className = '', label = 'Advertisement' }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  // NOTA: Sostituire data-ad-client con il tuo ID Publisher reale (es. ca-pub-XXXXXXXXXXXXXXXX)
  // Per ora usiamo un placeholder o ca-pub-0000000000000000 per evitare errori
  const AD_CLIENT = "ca-pub-0000000000000000"; 

  return (
    <div className={`ad-container my-6 flex flex-col items-center justify-center bg-gray-50/50 p-2 rounded-lg ${className}`}>
      <span className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">{label}</span>
      <div className="w-full overflow-hidden flex justify-center min-h-[100px] bg-gray-100 rounded">
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
