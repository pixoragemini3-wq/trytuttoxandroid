
import React, { useState, useMemo, useEffect } from 'react';
import { Article, Deal } from '../types';
import AdUnit from './AdUnit';
import { Helmet } from 'react-helmet-async';
import { fetchArticleById } from '../services/bloggerService';

interface ArticleDetailProps {
  article: Article;
  relatedArticle?: Article;
  moreArticles?: Article[];
  deals?: Deal[];
  offerNews?: Article[];
  onArticleClick?: (article: Article) => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, relatedArticle, moreArticles = [], deals = [], offerNews = [], onArticleClick }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [fullContent, setFullContent] = useState(article.content);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch full content on mount to ensure we have everything (fixes truncation)
  useEffect(() => {
    // Set initial content
    setFullContent(article.content);
    
    const loadFull = async () => {
      // If we are in local dev, skip
      if (window.location.hostname.includes('localhost')) return;
      
      // If content seems short or generic, definitely fetch full
      setIsUpdating(true);
      try {
        const freshContent = await fetchArticleById(article.id);
        if (freshContent && freshContent.length > (article.content?.length || 0)) {
          setFullContent(freshContent);
        }
      } catch(e) {
        console.error("Failed to load full article", e);
      } finally {
        setIsUpdating(false);
      }
    };
    loadFull();
  }, [article.id]);

  const handleSuggestedClick = (art: Article) => {
    if (onArticleClick) {
      onArticleClick(art);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = encodeURIComponent(article.title);
    const encodedUrl = encodeURIComponent(url);
    let shareLink = '';

    switch(platform) {
        case 'whatsapp': shareLink = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`; break;
        case 'telegram': shareLink = `https://t.me/share/url?url=${encodedUrl}&text=${text}`; break;
        case 'facebook': shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`; break;
        case 'instagram': 
             navigator.clipboard.writeText(url);
             alert("Link copiato!"); 
             setShowShareMenu(false); return;
        default: return;
    }
    window.open(shareLink, '_blank');
    setShowShareMenu(false);
  };
  
  const catBgClass = 
    article.category === 'Smartphone' ? 'bg-blue-600' : 
    article.category === 'Modding' ? 'bg-orange-500' : 
    article.category === 'App & Giochi' ? 'bg-green-500' : 
    article.category === 'Recensioni' ? 'bg-purple-600' : 
    article.category === 'Guide' ? 'bg-cyan-600' : 
    article.category === 'Offerte' ? 'bg-yellow-500' : 
    'bg-[#e31b23]';

  return (
    <div className="bg-white border-b-8 border-gray-100 last:border-0 pb-12 mb-0 relative animate-in fade-in duration-500 min-h-screen">
      <Helmet>
        <title>{article.title} - TuttoXAndroid</title>
        <meta name="description" content={article.excerpt} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.imageUrl} />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Loading Indicator for Full Content */}
      {isUpdating && (
         <div className="fixed top-20 right-4 z-50 bg-black text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-[#c0ff8c] rounded-full"></div>
            Caricamento testo completo...
         </div>
      )}

      <div className="max-w-3xl mx-auto px-4 pt-6 md:pt-16">
        <span className={`inline-block ${catBgClass} text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6`}>
          {article.category}
        </span>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 md:mb-8 leading-tight md:leading-[0.95] tracking-tight break-words hyphens-auto">
          {article.title}
        </h1>

        <div className="flex flex-row items-center justify-between border-t border-b border-gray-100 py-3 mb-8 relative">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img 
                src={article.authorImageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                alt={article.author} 
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover ring-2 ring-gray-100 p-0.5"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-condensed text-sm md:text-base font-black uppercase tracking-wide text-gray-900 leading-none">
                {article.author}
              </span>
              <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {article.date}
              </span>
            </div>
          </div>
          
          <div className="relative">
             <button 
               onClick={() => setShowShareMenu(!showShareMenu)}
               className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-50 transition-colors"
               aria-label="Condividi"
             >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
             </button>
             {showShareMenu && (
               <div className="absolute right-0 top-full mt-2 bg-white shadow-xl rounded-xl p-3 flex items-center gap-2 border border-gray-100 z-50">
                  <button onClick={() => handleShare('whatsapp')} className="w-8 h-8 rounded-full bg-green-100 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408.002 12.04c0 2.12.554 4.189 1.602 6.06L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.635 0 12.046-5.411 12.048-12.042 0-3.217-1.253-6.241-3.529-8.517z"/></svg></button>
                  <button onClick={() => handleShare('telegram')} className="w-8 h-8 rounded-full bg-blue-100 text-[#24A1DE] flex items-center justify-center hover:bg-[#24A1DE] hover:text-white transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg></button>
               </div>
             )}
          </div>
        </div>

        <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl md:rounded-[2rem] overflow-hidden mb-6 shadow-xl bg-gray-100">
           <img src={article.imageUrl} className="w-full h-full object-cover" alt={article.title} />
        </div>

        <div className="not-prose mb-8 flex justify-center">
           <AdUnit slotId="top-article" format="auto" className="w-full max-w-[320px] md:max-w-full" label="Sponsor" />
        </div>

        {/* Content Body - Simplified to ensure full rendering */}
        <div className="prose prose-base md:prose-xl max-w-none font-medium leading-relaxed text-gray-800 space-y-4">
          <div dangerouslySetInnerHTML={{ __html: fullContent || article.content }} />

          {/* Social Box Injection (After content) */}
          <div className="not-prose my-10 bg-black text-white p-8 rounded-3xl relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#e31b23] rounded-full blur-[60px] opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative z-10 text-center md:text-left">
                 <h4 className="font-condensed text-3xl font-black uppercase italic mb-2">Non perderti le news!</h4>
                 <p className="text-gray-400 mb-6 text-sm font-medium">Unisciti alla nostra community per ricevere offerte e news in tempo reale.</p>
                 <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                   <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener" className="flex items-center gap-2 bg-[#24A1DE] hover:bg-[#1d8acb] px-6 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-lg active:scale-95">Telegram</a>
                   <a href="https://whatsapp.com/channel/tuttoxandroid" target="_blank" rel="noopener" className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebc59] px-6 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest text-black shadow-lg active:scale-95">WhatsApp</a>
                 </div>
              </div>
          </div>

          {article.dealData && (
             <div className="not-prose my-12 animate-in slide-in-from-bottom-5">
                <div className="bg-white rounded-3xl overflow-hidden border-2 border-[#e31b23] shadow-2xl relative">
                   <div className="absolute top-0 right-0 bg-[#e31b23] text-white px-6 py-2 rounded-bl-3xl font-black uppercase text-xs tracking-widest z-10">
                     Offerta Selezionata
                   </div>
                   <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 bg-gray-50 p-8 flex items-center justify-center">
                         <img src={article.imageUrl} className="max-h-48 object-contain mix-blend-multiply" alt="Deal" />
                      </div>
                      <div className="md:w-2/3 p-8 flex flex-col justify-center">
                         <h3 className="font-condensed text-3xl font-black uppercase mb-2 leading-none">{article.title}</h3>
                         <div className="flex items-center gap-4 mb-6">
                            <span className="text-5xl font-black text-[#e31b23] tracking-tighter">{article.dealData.newPrice}</span>
                            <span className="text-xl font-bold text-gray-400 line-through">{article.dealData.oldPrice}</span>
                         </div>
                         <a 
                           href={article.dealData.link} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="bg-[#e31b23] text-white text-center py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2"
                         >
                           Acquista Subito
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                         </a>
                         <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">Link affiliato. Il prezzo potrebbe variare.</p>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {article.category === 'Offerte' && deals && deals.length > 0 && !article.dealData && (
             <div className="not-prose my-12 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-lg shadow-gray-100/50">
                <div className="bg-[#e31b23] px-5 py-3 flex justify-between items-center relative overflow-hidden">
                   <span className="text-white text-xs font-black uppercase tracking-widest relative z-10 flex items-center gap-2">
                     <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                     Offerte Correlate
                   </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {deals.slice(0, 3).map(deal => (
                    <a key={deal.id} href={deal.link} target="_blank" className="flex items-center gap-4 p-4 hover:bg-red-50/30 transition-colors group">
                      <div className="w-16 h-16 shrink-0 bg-white rounded-xl border border-gray-100 p-2 flex items-center justify-center">
                        <img src={deal.imageUrl} className="max-w-full max-h-full object-contain mix-blend-multiply" alt={deal.product} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1 truncate group-hover:text-[#e31b23] transition-colors">{deal.product}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-[#e31b23]">{deal.newPrice}</span>
                          <span className="text-[10px] text-gray-400 line-through font-bold">{deal.oldPrice}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
             </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-2 mb-8">
           {['Tech', 'Android', article.category, 'News'].map(tag => (
             <span key={tag} className="px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold uppercase text-gray-500 hover:bg-black hover:text-white transition-colors cursor-pointer">#{tag}</span>
           ))}
        </div>
        
        <div className="mb-12">
            <AdUnit slotId="bottom-article" format="auto" label="Sponsor" />
        </div>

        {moreArticles.length > 0 && (
          <div className="not-prose mb-8">
            <h3 className="font-condensed text-2xl font-black uppercase mb-6 flex items-center gap-3">
              <span className="w-8 h-1 bg-black"></span>
              Continua a leggere
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {moreArticles.map(art => (
                <div key={art.id} onClick={() => handleSuggestedClick(art)} className="group cursor-pointer">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3 relative">
                     <img src={art.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={art.title} />
                     <span className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 text-[8px] font-black uppercase rounded backdrop-blur-sm">
                       {art.category}
                     </span>
                  </div>
                  <h4 className="text-sm font-bold leading-tight group-hover:text-[#e31b23] transition-colors line-clamp-3">
                    {art.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ArticleDetail;
