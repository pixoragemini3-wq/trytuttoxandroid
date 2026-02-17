
import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('txa_cookie_consent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1000); // Ritardo leggero per non disturbare subito
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('txa_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('txa_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/95 text-white z-[100] border-t-4 border-[#e31b23] p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
           <h4 className="font-condensed text-xl font-black uppercase text-white mb-2">Rispetto della tua privacy</h4>
           <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
             Noi e i nostri partner terzi utilizziamo cookie e tecnologie simili per migliorare la tua esperienza, analizzare il traffico e mostrare annunci personalizzati. 
             Cliccando su "Accetta tutto", acconsenti all'uso di tutti i cookie. Puoi rifiutare o gestire le tue preferenze in qualsiasi momento.
             <a href="#" className="underline text-gray-300 hover:text-white ml-1">Leggi la Privacy Policy</a>.
           </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
           <button 
             onClick={handleDecline}
             className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
           >
             Rifiuta
           </button>
           <button 
             onClick={handleAccept}
             className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-[#e31b23] text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-white hover:text-[#e31b23] transition-colors"
           >
             Accetta Tutto
           </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
