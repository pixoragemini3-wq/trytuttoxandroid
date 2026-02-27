
import React, { useMemo, useState } from 'react';
import { Article } from '../types';
import ArticleCard from './ArticleCard';

interface MegaMenuProps {
  category: string;
  onClose: () => void;
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

const MegaMenu: React.FC<MegaMenuProps> = ({ category, onClose, articles, onArticleClick }) => {
  const [showAllYears, setShowAllYears] = useState(false);
  const [priceRange, setPriceRange] = useState(1); // 0: <100, 1: <200, 2: <300, 3: <400, 4: <500
  
  // Newsletter Logic
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success'>('idle');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    
    // TODO: Qui dovresti integrare la chiamata API a Mailchimp, Brevo o Google Forms.
    // Esempio: fetch('https://api.newsletter.com/subscribe', { method: 'POST', body: JSON.stringify({ email }) })
    
    setSubscribeStatus('success');
    setEmail('');
    setTimeout(() => setSubscribeStatus('idle'), 3000);
  };

  // 1. Get the latest article for this category (Highlight)
  // LOGIC UPDATE: Prioritize 'featured' articles within the specific category.
  const featuredArticle = useMemo(() => {
    // First try to find a featured article in this category (matches tags like 'newsinevidenza' via bloggerService)
    const specificFeatured = articles.find(a => a.category === category && a.featured === true);
    if (specificFeatured) return specificFeatured;
    
    // Fallback to the latest article in this category
    return articles.find(a => a.category === category) || articles[0];
  }, [articles, category]);

  // Secondary articles for News column to fill space
  const secondaryNews = useMemo(() => {
    if (category !== 'News') return [];
    return articles.filter(a => a.id !== featuredArticle.id).slice(0, 2);
  }, [articles, category, featuredArticle]);

  // Offerte Articles (Latest 6)
  const offerArticles = useMemo(() => {
     if (category !== 'Offerte') return [];
     return articles.filter(a => a.category === 'Offerte').slice(0, 6);
  }, [articles, category]);

  // --- LOGICA AGGIORNATA PER APP & GIOCHI ---
  
  // Lista specifica per le APP (Esclude titoli con 'gioc', 'game', 'play' se generici)
  const appList = useMemo(() => {
    if (category !== 'App & Giochi') return [];
    return articles.filter(a => 
      (a.category === 'App & Giochi' || a.category === 'App') && 
      !a.title.toLowerCase().includes('gioc') && 
      !a.title.toLowerCase().includes('game') &&
      !a.title.toLowerCase().includes('offline')
    ).slice(0, 4);
  }, [articles, category]);

  // Lista specifica per i GIOCHI (Include titoli con 'gioc', 'game', 'play' ecc)
  const gamesList = useMemo(() => {
    if (category !== 'App & Giochi') return [];
    return articles.filter(a => 
      (a.category === 'App & Giochi' || a.category === 'App') && 
      (a.title.toLowerCase().includes('gioc') || a.title.toLowerCase().includes('game') || a.title.toLowerCase().includes('offline'))
    ).slice(0, 4);
  }, [articles, category]);

  // 2. Dynamic Brands (Smartphone)
  const activeBrands = useMemo(() => {
    if (category !== 'Smartphone') return [];
    return [
      { name: 'Samsung' },
      { name: 'Xiaomi' },
      { name: 'Pixel' },
      { name: 'OnePlus' },
      { name: 'Motorola' },
      { name: 'Honor' },
      { name: 'Realme' },
      { name: 'Sony' },
      { name: 'Nothing' }
    ];
  }, [category]);

  // Helper to get color theme for menu
  const getCategoryTheme = (cat: string) => {
    switch(cat) {
      case 'Smartphone': return { bg: 'bg-slate-50', border: 'border-blue-600', text: 'text-blue-600', hover: 'hover:text-blue-600' };
      case 'Modding': return { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-500', hover: 'hover:text-orange-500' };
      case 'App & Giochi': return { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-500', hover: 'hover:text-green-500' };
      case 'Recensioni': return { bg: 'bg-purple-50', border: 'border-purple-600', text: 'text-purple-600', hover: 'hover:text-purple-600' };
      case 'Guide': return { bg: 'bg-cyan-50', border: 'border-cyan-600', text: 'text-cyan-600', hover: 'hover:text-cyan-600' };
      case 'Offerte': return { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-500', hover: 'hover:text-yellow-500' };
      case 'Wearable': return { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-500', hover: 'hover:text-pink-500' };
      default: return { bg: 'bg-white', border: 'border-[#e31b23]', text: 'text-[#e31b23]', hover: 'hover:text-[#e31b23]' };
    }
  };

  const theme = getCategoryTheme(category);

  // Helper function for Price Slider
  const getPriceLabel = (val: number) => {
    switch(val) {
      case 0: return '100€';
      case 1: return '200€';
      case 2: return '300€';
      case 3: return '400€';
      case 4: return '500€';
      default: return '200€';
    }
  };

  // 3. Helper to render columns based on category
  const renderColumns = () => {
    switch(category) {
      case 'Smartphone':
        return (
          <>
            {/* Col 1: Brands (Styled as Pills/Cards) */}
            <div className="col-span-1 border-r border-gray-200 pr-4">
              <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">Top Brand</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {activeBrands.map(brand => (
                  <button 
                    key={brand.name} 
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-[10px] uppercase tracking-wider hover:border-blue-600 hover:text-blue-600 hover:shadow-md transition-all group"
                  >
                     {brand.name}
                     <svg className="w-3 h-3 text-gray-300 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                     </svg>
                  </button>
                ))}
              </div>
              <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">Guide Acquisto</h3>
              <ul className="space-y-3">
                 <li className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Migliori Smartphone 2026
                 </li>
                 <li className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> Top sotto i 100€
                 </li>
                 <li className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> Top sotto i 200€
                 </li>
                 <li className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> Top sotto i 300€
                 </li>
                 <li className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> Top sotto i 400€
                 </li>
                 <li className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-blue-600 cursor-pointer flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> Fino a 500€
                 </li>
              </ul>
            </div>

            {/* Col 2: Featured Article (Mini) */}
            <div className="col-span-1 border-r border-gray-200 pr-4">
               <div className="flex items-center gap-2 mb-4 text-blue-600">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  <span className="text-xs font-black uppercase tracking-widest">In Evidenza</span>
               </div>
               <ArticleCard 
                  article={{...featuredArticle, type: 'standard'}} 
                  onClick={() => onArticleClick(featuredArticle)}
                  className="!p-0 !m-0 !bg-transparent !shadow-none hover:!scale-100" 
               />
            </div>

            {/* Col 3 & 4: SOCIAL CARDS (Images Updated) */}
            <div className="col-span-2 flex flex-col gap-4">
               {/* Android Italy Card with Background */}
               <a href="https://www.facebook.com/groups/Android.Italy/" target="_blank" rel="noopener noreferrer" className="relative h-32 w-full rounded-2xl overflow-hidden group shadow-lg hover:shadow-xl transition-all border border-blue-100">
                  {/* Updated Background: More visible image */}
                  <img src="https://i.imgur.com/5czWQot.png" className="absolute inset-0 w-full h-full object-cover" alt="Background" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/60 to-transparent"></div>
                  
                  <div className="absolute inset-0 p-5 flex items-center justify-between z-10">
                     <div>
                        <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">Community Ufficiale</span>
                        <h3 className="font-condensed text-3xl font-black uppercase italic text-white leading-none mt-1 shadow-black drop-shadow-md">Android Italy</h3>
                        <p className="text-[10px] text-blue-100 font-medium">Il gruppo di supporto #1 in Italia</p>
                     </div>
                     <div className="text-right">
                        <span className="block text-2xl font-black text-white">36k+</span>
                        <span className="text-[9px] uppercase font-bold text-white/80 bg-black/20 px-2 py-1 rounded-lg">Iscritti</span>
                     </div>
                  </div>
               </a>

               {/* TuttoXAndroid Card - SPECIFIC IMAGE USED */}
               <a href="https://www.facebook.com/tuttoxandroidcom/?ref=embed_page" target="_blank" rel="noopener noreferrer" className="relative h-32 w-full rounded-2xl overflow-hidden group shadow-lg hover:shadow-xl transition-all border border-gray-200">
                  <img src="https://i.imgur.com/GHOv30o.png" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="TuttoXAndroid Cover" />
                  {/* Dark Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

                  <div className="absolute inset-0 p-5 flex items-center justify-between z-10">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full p-1 shadow-lg shrink-0 overflow-hidden">
                           <img src="https://i.imgur.com/HcqNQcO.png" className="w-full h-full object-contain" alt="Logo" />
                        </div>
                        <div>
                           <h3 className="font-condensed text-2xl font-black uppercase text-white leading-none drop-shadow-md">TuttoXAndroid</h3>
                           <span className="text-[9px] text-gray-200 font-black uppercase tracking-widest drop-shadow-sm">Pagina Ufficiale</span>
                        </div>
                     </div>
                     <button className="bg-[#1877F2] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-[#1877F2] transition-colors shadow-lg">
                        Segui
                     </button>
                  </div>
               </a>
            </div>
          </>
        );

      case 'Guide':
        return (
          <>
            <div className="col-span-1">
              <h3 className="font-condensed text-lg font-black uppercase mb-3 text-cyan-700 border-b border-cyan-200 pb-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Troubleshooting
              </h3>
              <p className="text-[10px] text-gray-400 mb-2 leading-tight">Risolvi i problemi comuni</p>
              <ul className="space-y-2">
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Come aumentare durata batteria</li>
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Liberare spazio memoria</li>
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Velocizzare telefono lento</li>
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Problemi Wi-Fi e Dati</li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="font-condensed text-lg font-black uppercase mb-3 text-cyan-700 border-b border-cyan-200 pb-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                Personalizzazione
              </h3>
               <p className="text-[10px] text-gray-400 mb-2 leading-tight">Rendi unico il tuo Android</p>
              <ul className="space-y-2">
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Migliori Launcher 2024</li>
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Installare Icon Pack</li>
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Automazione con Tasker</li>
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Sfondi Animati</li>
              </ul>
            </div>

            <div className="col-span-1">
               <h3 className="font-condensed text-lg font-black uppercase mb-3 text-cyan-700 border-b border-cyan-200 pb-1 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                 Primi Passi
               </h3>
               <p className="text-[10px] text-gray-400 mb-2 leading-tight">Per i nuovi utenti</p>
               <ul className="space-y-2">
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Da iPhone ad Android</li>
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Configurazione nuovo telefono</li>
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Backup WhatsApp e Foto</li>
                <li className="text-xs font-bold text-gray-600 hover:text-cyan-600 cursor-pointer transition-colors">Trova il mio dispositivo</li>
              </ul>
            </div>

            <div className="col-span-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
               <h3 className="font-condensed text-lg font-black uppercase mb-3 text-gray-900 flex items-center gap-2">
                 <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                 Expert & Modding
               </h3>
               <ul className="space-y-3">
                 <li className="text-xs font-bold text-gray-600 hover:text-orange-500 cursor-pointer transition-colors flex items-center gap-2">
                   <span className="w-1 h-1 bg-orange-500 rounded-full"></span> Sblocco Bootloader
                 </li>
                 <li className="text-xs font-bold text-gray-600 hover:text-orange-500 cursor-pointer transition-colors flex items-center gap-2">
                   <span className="w-1 h-1 bg-orange-500 rounded-full"></span> Root con Magisk
                 </li>
                 <li className="text-xs font-bold text-gray-600 hover:text-orange-500 cursor-pointer transition-colors flex items-center gap-2">
                   <span className="w-1 h-1 bg-orange-500 rounded-full"></span> Custom ROM
                 </li>
               </ul>
            </div>
          </>
        );

      case 'Recensioni':
        const collabBrands = ['Aukey', 'Blackview', 'Cubot', 'Ezviz', 'Leagoo', 'Lefant', 'Spigen', 'Teclast', 'Ugoos', 'Ulefone', 'Xiaomi'].sort();
        
        return (
          <>
            {/* Col 1: In Evidenza (Replaces Price Range) */}
            <div className="col-span-1 border-r border-gray-200 pr-4">
               <div className="flex items-center gap-2 mb-4 text-purple-600">
                  <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
                  <span className="text-xs font-black uppercase tracking-widest">In Evidenza</span>
               </div>
               <ArticleCard 
                  article={{...featuredArticle, type: 'standard'}} 
                  onClick={() => onArticleClick(featuredArticle)}
                  className="!p-0 !m-0 !bg-transparent !shadow-none hover:!scale-100" 
               />
            </div>

            {/* Col 2: Top Brands */}
            <div className="col-span-1 border-r border-gray-200 pr-4 pl-2">
               <div className="mb-6">
                 <h3 className="font-condensed text-xl font-black uppercase mb-3 text-purple-900 border-b-2 border-gray-200 pb-1">Top Brands</h3>
                 <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                   {collabBrands.map(brand => (
                     <span key={brand} className="text-sm font-black text-gray-700 hover:text-purple-600 cursor-pointer transition-colors flex items-center gap-2 group">
                       <span className="w-1.5 h-1.5 bg-purple-300 rounded-full group-hover:bg-purple-600 transition-colors"></span> {brand}
                     </span>
                   ))}
                 </div>
               </div>
            </div>

            {/* Col 3: Dispositivi */}
            <div className="col-span-1 pl-2 border-r border-gray-200 pr-4">
               <div>
                 <h3 className="font-condensed text-xl font-black uppercase mb-3 text-purple-900 border-b-2 border-gray-200 pb-1">Dispositivi</h3>
                 <ul className="space-y-3">
                   <li className="text-sm font-bold text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">Wearables & Smartwatch</li>
                   <li className="text-sm font-bold text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">Audio & Cuffie TWS</li>
                   <li className="text-sm font-bold text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">Tablet Android</li>
                   <li className="text-sm font-bold text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">Smart Home</li>
                   <li className="text-sm font-bold text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">Gadget Tech</li>
                   <li className="text-sm font-bold text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">TV Box & Stick</li>
                 </ul>
               </div>
            </div>

            {/* Col 4: EZVIZ Promo Card (Updated with new Logo) */}
            <div className="col-span-1 pl-2">
                <a href="#" className="block h-full bg-white rounded-2xl relative overflow-hidden group shadow-xl border border-gray-100 hover:border-cyan-500 transition-all flex flex-col">
                   {/* Background Decor */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                   
                   {/* Image Container */}
                   <div className="h-40 w-full p-6 flex items-center justify-center relative z-10 bg-white">
                      <img src="https://www.ledleditalia.it/wp-content/uploads/2025/04/ezviz-brand.jpg" className="w-full h-full object-contain" alt="EZVIZ" />
                   </div>
                   
                   {/* Content */}
                   <div className="p-5 mt-auto relative z-10 bg-gray-50 border-t border-gray-100 group-hover:bg-cyan-50 transition-colors">
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-600 mb-2 block">Partner Ufficiale</span>
                      <h4 className="font-condensed text-xl font-black uppercase leading-none mb-2 text-gray-900">Sicurezza Smart</h4>
                      <p className="text-[10px] font-bold text-gray-500 mb-4 leading-tight">Scopri le videocamere di sicurezza numero 1 al mondo.</p>
                      <span className="flex items-center justify-between bg-black text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg group-hover:bg-cyan-600 transition-colors">
                        Vedi Recensioni <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7" /></svg>
                      </span>
                   </div>
                </a>
            </div>
          </>
        );

      case 'Offerte':
         return (
          <>
            {/* Col 1 & 2: Ultime Notizie Offerte (Grid of 6) */}
            <div className="col-span-2 border-r border-gray-100 pr-4">
              <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-yellow-400 pb-2">Ultime Offerte</h3>
              <div className="grid grid-cols-2 gap-3">
                 {offerArticles.length > 0 ? (
                   offerArticles.map(art => (
                     <div key={art.id} onClick={() => onArticleClick(art)} className="group cursor-pointer flex gap-3 items-center p-2 rounded-lg hover:bg-yellow-50 transition-colors">
                        <div className="w-12 h-12 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                           <img src={art.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={art.title} />
                        </div>
                        <div className="min-w-0">
                           <h4 className="text-[10px] font-bold leading-tight text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-2">{art.title}</h4>
                        </div>
                     </div>
                   ))
                 ) : (
                   <p className="text-xs text-gray-400">Nessuna offerta recente.</p>
                 )}
              </div>
              <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-black hover:text-yellow-500 transition-colors w-full text-center py-2 bg-gray-50 rounded-lg">
                Vedi tutte le offerte &rarr;
              </button>
            </div>

            {/* Col 3: Price Slider (Moved from Recensioni) */}
            <div className="col-span-1 border-r border-gray-200 px-4">
              <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-yellow-400 pb-2">
                Budget
              </h3>
              
              <div className="bg-yellow-50 p-6 rounded-2xl text-center border border-yellow-100 h-[calc(100%-3rem)] flex flex-col justify-center">
                 <div className="relative mb-8 pt-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="4" 
                      step="1" 
                      value={priceRange} 
                      onChange={(e) => setPriceRange(parseInt(e.target.value))}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-black uppercase text-gray-400 w-full px-1">
                      <span>100€</span>
                      <span></span>
                      <span>300€</span>
                      <span></span>
                      <span>500€</span>
                    </div>
                 </div>
                 
                 <div className="text-center">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Trova offerte sotto i:</p>
                    <button className="bg-black text-white px-4 py-3 rounded-xl font-black text-sm uppercase tracking-tight shadow-lg hover:bg-yellow-500 transition-colors w-full">
                      {getPriceLabel(priceRange)}
                    </button>
                 </div>
              </div>
            </div>

            {/* Col 4: Telegram Promo Channel (Resized) */}
            <div className="col-span-1 bg-[#24A1DE] p-4 rounded-2xl text-center relative overflow-hidden group shadow-lg flex flex-col justify-center items-center h-full">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
               
               {/* Telegram Icon */}
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#24A1DE]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg>
               </div>

               <h4 className="font-condensed text-2xl font-black uppercase text-white mb-1 relative z-10 italic">Canale<br/>Offerte</h4>
               <p className="text-[10px] text-white/90 mb-4 font-medium relative z-10 max-w-xs">Errori di prezzo e coupon esclusivi.</p>
               
               <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-[#24A1DE] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl relative z-10 w-full">
                 Unisciti
               </a>
            </div>
          </>
         );

      case 'App & Giochi':
         return (
           <>
             {/* Col 1: ULTIME APP */}
             <div className="col-span-1 border-r border-gray-100 pr-4">
               <h3 className="font-condensed text-xl font-black uppercase mb-4 text-green-700 border-b-2 border-green-200 pb-2 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                 Ultime App
               </h3>
               <div className="space-y-3">
                 {appList.length > 0 ? (
                    appList.map((art) => (
                      <div key={art.id} onClick={() => onArticleClick(art)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-green-50 transition-colors cursor-pointer group">
                         <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 shadow-sm border border-gray-200">
                            <img src={art.imageUrl} className="w-full h-full object-cover" alt={art.title} />
                         </div>
                         <div>
                            <h4 className="text-xs font-bold text-gray-900 group-hover:text-green-700 leading-tight line-clamp-2">{art.title}</h4>
                            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Applicazione</span>
                         </div>
                      </div>
                    ))
                 ) : (
                    <p className="text-xs text-gray-400">Nessuna app recente.</p>
                 )}
               </div>
               <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-black hover:text-green-600 transition-colors w-full text-center py-2 bg-gray-50 rounded-lg">
                  Vedi Tutte &rarr;
               </button>
             </div>

             {/* Col 2: ULTIMI GIOCHI */}
             <div className="col-span-1 border-r border-gray-100 pr-4 pl-2">
               <h3 className="font-condensed text-xl font-black uppercase mb-4 text-green-700 border-b-2 border-green-200 pb-2 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                 Ultimi Giochi
               </h3>
               <div className="space-y-3">
                 {gamesList.length > 0 ? (
                    gamesList.map((art) => (
                      <div key={art.id} onClick={() => onArticleClick(art)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-green-50 transition-colors cursor-pointer group">
                         <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 shadow-sm border border-gray-200">
                            <img src={art.imageUrl} className="w-full h-full object-cover" alt={art.title} />
                         </div>
                         <div>
                            <h4 className="text-xs font-bold text-gray-900 group-hover:text-green-700 leading-tight line-clamp-2">{art.title}</h4>
                            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Gioco</span>
                         </div>
                      </div>
                    ))
                 ) : (
                    <p className="text-xs text-gray-400">Nessun gioco recente.</p>
                 )}
               </div>
               <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-black hover:text-green-600 transition-colors w-full text-center py-2 bg-gray-50 rounded-lg">
                  Vedi Tutti &rarr;
               </button>
             </div>

             {/* Col 3: Categories (Kept as requested) */}
             <div className="col-span-1 border-r border-gray-100 pr-4 pl-2">
                <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">Categorie</h3>
                <ul className="space-y-2">
                  <li className="text-sm font-bold text-gray-500 hover:text-green-600 cursor-pointer transition-colors">Giochi Android Gratis</li>
                  <li className="text-sm font-bold text-gray-500 hover:text-green-600 cursor-pointer transition-colors">Migliori App Produttività</li>
                  <li className="text-sm font-bold text-gray-500 hover:text-green-600 cursor-pointer transition-colors">App Foto & Video</li>
                  <li className="text-sm font-bold text-gray-500 hover:text-green-600 cursor-pointer transition-colors">Personalizzazione</li>
                  <li className="text-sm font-bold text-gray-500 hover:text-green-600 cursor-pointer transition-colors">Emulatori</li>
                </ul>
             </div>

             {/* Col 4: Editor's Choice (Kept as requested) */}
             <div className="col-span-1 pl-2">
                <div className="bg-green-600 rounded-2xl p-6 text-white h-full flex flex-col justify-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                   <h4 className="font-condensed text-2xl font-black uppercase italic mb-2 relative z-10">Google Play Pass</h4>
                   <p className="text-xs font-medium text-green-100 mb-6 relative z-10 leading-relaxed">
                     Centinaia di giochi e app senza pubblicità. Scopri se ne vale la pena nella nostra analisi completa.
                   </p>
                   <button className="bg-white text-green-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-green-50 transition-colors w-fit relative z-10">
                     Leggi articolo
                   </button>
                </div>
             </div>
           </>
         );

      case 'News':
        // Generate years from 2024 down to 2013
        const currentYear = new Date().getFullYear();
        const allYears = Array.from({length: currentYear - 2013 + 1}, (_, i) => currentYear - i);
        const displayedYears = showAllYears ? allYears : allYears.slice(0, 9);
        const topViewed = articles.slice(0, 5);
        
        const hotTopics = [
          'Android 15', 'AI', 'Samsung', 'Sicurezza', 'WhatsApp', 'Google', 'Pixel 9', 'Offerte'
        ];

        return (
          <>
            {/* Col 1: In Evidenza + Filler News */}
            <div className="col-span-1 border-r border-gray-100 pr-4 flex flex-col justify-between">
               <div>
                 <div className="flex items-center gap-2 mb-4 text-[#e31b23]">
                    <span className="w-2 h-2 bg-[#e31b23] rounded-full animate-pulse"></span>
                    <span className="text-xs font-black uppercase tracking-widest">In Evidenza</span>
                 </div>
                 <ArticleCard 
                    article={{...featuredArticle, type: 'standard'}} 
                    onClick={() => onArticleClick(featuredArticle)}
                    className="!p-0 !m-0 !bg-transparent !shadow-none hover:!scale-100 mb-4" 
                 />
               </div>
               <div className="space-y-2 border-t border-gray-100 pt-3">
                  {secondaryNews.map(art => (
                    <div key={art.id} onClick={() => onArticleClick(art)} className="group cursor-pointer">
                       <h4 className="text-[10px] font-bold text-gray-700 leading-tight group-hover:text-[#e31b23] transition-colors line-clamp-2">
                         {art.title}
                       </h4>
                    </div>
                  ))}
               </div>
            </div>

            {/* Col 2: I Più Letti */}
            <div className="col-span-1 border-r border-gray-100 pr-4 pl-2">
               <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-[#e31b23] pb-1 w-fit">
                 I Più Letti
               </h3>
               <ul className="space-y-4">
                 {topViewed.map((art, idx) => (
                   <li key={art.id} className="flex gap-3 group cursor-pointer items-start" onClick={() => onArticleClick(art)}>
                      <span className="text-3xl font-black text-gray-200 leading-none group-hover:text-[#e31b23] transition-colors font-condensed italic select-none">
                        {idx + 1}
                      </span>
                      <div className="pt-0.5 border-b border-gray-50 pb-2 w-full">
                         <h4 className="text-xs font-bold leading-tight text-gray-900 group-hover:text-[#e31b23] transition-colors line-clamp-2">
                           {art.title}
                         </h4>
                         <span className="text-[9px] text-gray-400 mt-1 block uppercase tracking-wider">{art.category}</span>
                      </div>
                   </li>
                 ))}
               </ul>
            </div>

            {/* Col 3: Archivio (Bold Red Design) */}
            <div className="col-span-1 pl-2 border-r border-gray-100 pr-4">
              <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-gray-200 pb-1 flex items-center gap-2">
                Archivio Storico
              </h3>
              <div className="flex flex-wrap gap-2 content-start">
                 {displayedYears.map(year => (
                   <button key={year} className="px-4 py-2 bg-[#e31b23] text-white rounded-lg text-[10px] font-black hover:bg-black transition-colors shadow-sm">
                     {year}
                   </button>
                 ))}
                 {!showAllYears && (
                    <button onClick={() => setShowAllYears(true)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black hover:bg-black hover:text-white transition-colors">
                      +
                    </button>
                 )}
              </div>
            </div>

            {/* Col 4: Tendenze (Clean Pills, No Emojis) */}
            <div className="col-span-1 pl-2">
               <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 flex items-center gap-2">
                 Tendenze Ora
               </h3>
               <div className="flex flex-wrap gap-2">
                 {hotTopics.map(topic => (
                   <span key={topic} className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-[10px] font-black uppercase tracking-wide cursor-pointer hover:bg-black hover:text-white transition-all">
                     {topic}
                   </span>
                 ))}
               </div>
               
               <div className="mt-8 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                  <p className="text-[10px] font-bold text-gray-500 mb-3">Non perdere nessuna notizia</p>
                  
                  {subscribeStatus === 'success' ? (
                     <div className="bg-green-100 text-green-700 py-3 rounded-lg text-[10px] font-black uppercase animate-in fade-in">
                        Iscritto con successo!
                     </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                       <input 
                         type="email" 
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         placeholder="La tua email" 
                         className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#e31b23]"
                         required
                       />
                       <button type="submit" className="bg-black text-white w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#e31b23] transition-colors">
                         Iscriviti alla Newsletter
                       </button>
                    </form>
                  )}
               </div>
            </div>
          </>
        );

      default:
        // Fallback for default categories
        return (
          <>
             <div className="col-span-1">
              <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">Sezioni</h3>
              <ul className="space-y-3">
                <li className="text-sm font-bold text-gray-500 hover:text-black cursor-pointer transition-colors">Ultime Notizie</li>
                <li className="text-sm font-bold text-gray-500 hover:text-black cursor-pointer transition-colors">Editoriali</li>
                <li className="text-sm font-bold text-gray-500 hover:text-black cursor-pointer transition-colors">Anteprime</li>
              </ul>
            </div>
             <div className="col-span-3">
              {/* Featured article generic */}
               <div className="flex items-center gap-2 mb-4 text-gray-900">
                  <span className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></span>
                  <span className="text-xs font-black uppercase tracking-widest">In Evidenza</span>
               </div>
               <div className="max-w-sm">
                 <ArticleCard 
                    article={{...featuredArticle, type: 'standard'}} 
                    onClick={() => onArticleClick(featuredArticle)}
                    className="!p-0 !m-0 !bg-transparent !shadow-none hover:!scale-100" 
                 />
               </div>
            </div>
          </>
        );
    }
  };

  return (
    <div 
      className={`absolute left-0 top-full w-full ${theme.bg} shadow-2xl border-t-4 ${theme.border} z-40 animate-in fade-in slide-in-from-top-2 duration-200`}
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-8">
          {renderColumns()}
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
