import React, { useState, useEffect } from 'react';

const TelegramPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after 5 seconds if not already dismissed
    const hasDismissed = localStorage.getItem('telegramPopupDismissed');
    if (!hasDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('telegramPopupDismissed', 'true');
  };

  const handleJoin = () => {
    setIsVisible(false);
    localStorage.setItem('telegramPopupDismissed', 'true');
    window.open('https://t.me/tuttoxandroid', '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-black/10 rounded-full flex items-center justify-center text-gray-500 hover:bg-black/20 hover:text-black transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="bg-[#24A1DE] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl p-1 relative z-10">
            <img src="https://i.imgur.com/Ux19qMB.png" alt="Telegram" className="w-full h-full object-cover rounded-full" />
          </div>
          <h3 className="text-3xl font-condensed font-black uppercase italic text-white leading-none mb-2 relative z-10">
            Unisciti al Canale
          </h3>
          <p className="text-white/90 font-bold text-sm relative z-10">
            Non perderti le migliori offerte tech!
          </p>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-gray-600 text-sm mb-6 font-medium">
            Entra nella nostra community Telegram per ricevere sconti esclusivi, errori di prezzo e coupon in tempo reale.
          </p>
          
          <button 
            onClick={handleJoin}
            className="w-full bg-[#24A1DE] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#1d8ec4] transition-colors shadow-lg shadow-[#24A1DE]/30 mb-3"
          >
            Iscriviti Ora
          </button>
          
          <button 
            onClick={handleClose}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider"
          >
            No grazie, forse più tardi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelegramPopup;
