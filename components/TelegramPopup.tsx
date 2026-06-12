import React, { useState, useEffect } from 'react';

const TelegramPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasDismissed = localStorage.getItem('telegramPopupDismissed');
    if (hasDismissed) return;

    // Show only after the user has read at least 2 articles
    const viewCount = parseInt(localStorage.getItem('articleViewCount') || '0', 10);
    if (viewCount < 2) return;

    const timer = setTimeout(() => setIsVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem('telegramPopupDismissed', 'true');
  };

  const join = () => {
    dismiss();
    window.open('https://t.me/tuttoxandroid', '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors z-10"
          aria-label="Chiudi"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-[#111] px-6 pt-6 pb-5 text-center">
          <div className="w-12 h-12 rounded-full bg-[#24A1DE] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <p className="text-white font-condensed text-[22px] font-black uppercase tracking-tight">Unisciti al canale</p>
          <p className="text-white/50 text-[12px] mt-1">Offerte tech in tempo reale</p>
        </div>

        <div className="px-6 py-5 text-center">
          <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
            Sconti esclusivi, errori di prezzo e coupon ogni giorno sulla nostra community Telegram.
          </p>
          <button
            onClick={join}
            className="w-full bg-[#24A1DE] hover:bg-[#1d8ec4] text-white py-3 rounded-xl font-bold text-[14px] tracking-wide transition-colors mb-3"
          >
            Iscriviti ora
          </button>
          <button
            onClick={dismiss}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            No grazie
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelegramPopup;
