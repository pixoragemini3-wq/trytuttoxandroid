
import React from 'react';

interface MegaMenuProps {
  category: string;
  onClose: () => void;
}

const MegaMenu: React.FC<MegaMenuProps> = ({ category, onClose }) => {
  return (
    <div 
      className="absolute top-full left-0 w-full bg-[#f8fff2] border-b-4 border-editorial-red z-50 shadow-2xl overflow-hidden animate-in slide-in-from-top duration-300"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar Info */}
        <div className="w-1/4 p-12 border-r border-gray-100 bg-white">
          <h2 className="font-condensed text-5xl font-black uppercase mb-6 text-gray-900 leading-none">{category}</h2>
          <p className="text-sm text-gray-600 mb-8 font-bold leading-relaxed">
            Approfondimenti esclusivi, test rigorosi e le migliori guide su {category.toLowerCase()} per dominare il tuo ecosistema Android.
          </p>
          <button className="px-8 py-3 border-2 border-editorial-red rounded-xl text-editorial-red font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95">
            Esplora Tutto &rarr;
          </button>
        </div>

        {/* Dynamic Links Grid */}
        <div className="flex-1 grid grid-cols-4 gap-12 p-12">
          <div>
            <h3 className="font-condensed text-2xl font-black uppercase mb-6 text-gray-900">SMARTPHONE</h3>
            <ul className="space-y-5">
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Migliori Smartphone 2024</li>
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Samsung vs Google</li>
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Sconti Smartphone</li>
            </ul>
          </div>
          <div>
            <h3 className="font-condensed text-2xl font-black uppercase mb-6 text-gray-900">GUIDE & MODDING</h3>
            <ul className="space-y-5">
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Come fare il Root</li>
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Custom ROM News</li>
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Ottimizzazione Batteria</li>
            </ul>
          </div>
          <div>
            <h3 className="font-condensed text-2xl font-black uppercase mb-6 text-gray-900">APP E GIOCHI</h3>
            <ul className="space-y-5">
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Migliori App Gratuite</li>
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Giochi Android Top</li>
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">APK Download Sicuri</li>
            </ul>
          </div>
          <div>
            <h3 className="font-condensed text-2xl font-black uppercase mb-6 text-gray-900">OFFERTE TOP</h3>
            <ul className="space-y-5">
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Canale Telegram Offerte</li>
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Sconti Amazon</li>
              <li className="text-sm font-black text-gray-600 hover:text-editorial-red cursor-pointer transition-colors">Tech sotto i 100€</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Sub-nav indicator bar */}
      <div className="bg-[#c0ff8c] h-14 flex items-center px-4 max-w-7xl mx-auto gap-16 overflow-x-auto no-scrollbar">
          {['Samsung', 'Xiaomi', 'Pixel', 'OnePlus', 'Motorola', 'Realme', 'Sony', 'Nothing'].map(item => (
            <span key={item} className={`text-xs font-black uppercase tracking-widest cursor-pointer whitespace-nowrap text-gray-900 opacity-60 hover:opacity-100 hover:text-black hover:scale-110 transition-all`}>
              {item}
            </span>
          ))}
      </div>
    </div>
  );
};

export default MegaMenu;
