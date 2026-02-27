
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Article, Deal } from '../types';
import AdUnit from './AdUnit';
import { Helmet } from 'react-helmet-async';
import { fetchArticleById } from '../services/bloggerService';
import SocialSidebar from './SocialSidebar';

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
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Newsletter Sidebar Logic
  const [sidebarEmail, setSidebarEmail] = useState('');
  const [sidebarSubscribeStatus, setSidebarSubscribeStatus] = useState<'idle' | 'success'>('idle');

  const handleSidebarSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebarEmail.includes('@')) return;
    setSidebarSubscribeStatus('success');
    setSidebarEmail('');
    setTimeout(() => setSidebarSubscribeStatus('idle'), 3000);
  };

  // Check if article is deals related
  const isDealCategory = useMemo(() => {
    return article.category === 'Offerte' || (article.tags && article.tags.some(t => t.toLowerCase() === 'offerte' || t.toLowerCase() === 'amazon'));
  }, [article]);

  // Check if content appears truncated
  const isTruncated = useMemo(() => {
     return (!fullContent || fullContent.length < 600) && article.url;
  }, [fullContent, article.url]);

  const catColor = 
    article.category === 'Smartphone' ? 'text-blue-600' : 
    article.category === 'Modding' ? 'text-orange-500' : 
    article.category === 'App & Giochi' ? 'text-green-500' : 
    article.category === 'Recensioni' ? 'text-purple-600' : 
    article.category === 'Guide' ? 'text-cyan-600' : 
    article.category === 'Offerte' ? 'text-yellow-500' : 
    'text-[#e31b23]';

  // --- CONTENT PRE-PROCESSING (Lead-in Text) ---
  const processLeadIn = (content: string) => {
    if (!content) return "";
    return content.replace(
      /^(<p>)?\s*<(b|strong)>(.*?)<\/\2>/i, 
      `$1<span class="lead-in italic font-bold text-xl ${catColor} block mb-2 border-l-4 border-current pl-3">$3</span>`
    );
  };

  // --- CONTENT SPLITTER LOGIC ---
  const contentParts = useMemo(() => {
    let content = fullContent || article.content;
    if (!content) return [];
    
    // Apply Lead-in styling
    content = processLeadIn(content);

    const splitByParagraph = content.split('</p>');
    
    if (splitByParagraph.length < 3) return [content]; 
    
    const part1 = splitByParagraph.slice(0, 2).join('</p>') + '</p>';
    const part2 = splitByParagraph.slice(2, 6).join('</p>') + '</p>';
    const part3 = splitByParagraph.slice(6).join('</p>');
    
    return [part1, part2, part3].filter(p => p.length > 0 && p !== '</p>');
  }, [fullContent, article.content, catColor]);

  useEffect(() => {
    setFullContent(article.content);
    
    const loadFull = async () => {
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

  // --- HYDRATION LOGIC (Disqus & JS) ---
  useEffect(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;

    // Expandable Rows
    const expandableRows = container.querySelectorAll('tr.expandable-row, div.expandable-row, .expandable-row');
    const handleRowClick = function(this: HTMLElement, e: Event) {
      e.stopPropagation(); e.preventDefault();
      this.classList.toggle('expanded');
    };
    expandableRows.forEach(row => {
      row.removeEventListener('click', handleRowClick as EventListener);
      row.addEventListener('click', handleRowClick as EventListener);
    });

    // Disqus Injection
    if (window && document) {
        const disqusContainer = document.getElementById('disqus_thread');
        if (disqusContainer) {
            disqusContainer.innerHTML = '';
            const d = document, s = d.createElement('script');
            s.src = 'https://tuttoxandroid.disqus.com/embed.js'; 
            s.setAttribute('data-timestamp', new Date().toString());
            (d.head || d.body).appendChild(s);
        }
    }

    return () => {
      expandableRows.forEach(row => row.removeEventListener('click', handleRowClick as EventListener));
    };
  }, [article.id, fullContent]); 

  const handleSuggestedClick = (art: Article) => {
    if (onArticleClick) onArticleClick(art);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleForceNativeLoad = () => {
    if (article.url) window.location.href = article.url;
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
        case 'twitter': shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`; break;
        case 'linkedin': shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`; break;
        case 'email': shareLink = `mailto:?subject=${text}&body=${encodedUrl}`; break;
        case 'copy': 
             navigator.clipboard.writeText(url);
             alert("Link copiato negli appunti!"); 
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

  // Articles for the 4-grid at bottom
  const recommendedGrid = moreArticles.slice(0, 4);
  
  const mostReadArticles = [...offerNews, ...moreArticles].slice(0, 5);

  const ReadAlsoBlock = ({ article }: { article: Article }) => (
    <div onClick={() => handleSuggestedClick(article)} className="not-prose my-6 p-4 bg-gray-50 border-l-4 border-black rounded-r-lg cursor-pointer hover:bg-gray-100 transition-colors group">
      <h4 className="text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Leggi Anche</h4>
      <div className="flex gap-3 items-center">
        <div className="w-16 h-12 bg-gray-200 shrink-0 overflow-hidden rounded">
          <img src={article.imageUrl} className="w-full h-full object-cover" />
        </div>
        <h5 className="text-sm font-bold leading-tight group-hover:text-[#e31b23] transition-colors">{article.title}</h5>
      </div>
    </div>
  );

  // --- SUB-COMPONENTS FOR DEALS ---
  const MobileDealsCarousel = () => (
    <div className="lg:hidden not-prose my-8 py-6 bg-gradient-to-r from-gray-50 to-white border-y border-gray-100 -mx-4 px-4 shadow-inner">
      <div className="flex items-center justify-between mb-4">
          <h3 className="font-condensed text-xl font-black uppercase text-[#e31b23] flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-[#e31b23] animate-pulse"></span>
             Offerte Live
          </h3>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Scorri per altre →</span>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
         {[...deals, ...deals].slice(0, 10).map((deal, idx) => (
           <a 
             key={`${deal.id}-${idx}`} 
             href={deal.link} 
             target="_blank" 
             rel="noopener noreferrer" 
             className="min-w-[40%] max-w-[40%] bg-white border border-gray-200 rounded-xl p-3 snap-start shadow-sm flex flex-col justify-between hover:border-[#e31b23] transition-colors"
           >
              <div className="w-full aspect-square bg-gray-50 rounded-lg mb-2 p-2 flex items-center justify-center">
                 <img src={deal.imageUrl} className="w-full h-full object-contain mix-blend-multiply" loading="lazy" alt="Product" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-gray-900 leading-tight line-clamp-2 mb-1">{deal.product}</p>
                 <span className="block text-sm font-black text-[#e31b23]">{deal.newPrice}</span>
              </div>
           </a>
         ))}
      </div>
    </div>
  );

  const DesktopDealsBanner = () => (
    <div className="hidden lg:block not-prose my-10 bg-gradient-to-r from-gray-900 to-[#e31b23] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex items-center justify-between mb-6 relative z-10">
           <div>
              <h3 className="font-condensed text-3xl font-black uppercase italic leading-none">Offerte del Giorno</h3>
              <p className="text-xs text-white/80 mt-1">Selezionate in tempo reale dal nostro canale Telegram.</p>
           </div>
           <a href="https://t.me/tuttoxandroid" target="_blank" className="bg-white text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#24A1DE] hover:text-white transition-colors">
              Vedi tutte su Telegram
           </a>
        </div>
        <div className="grid grid-cols-4 gap-4 relative z-10">
           {deals.slice(0, 4).map(deal => (
              <a key={deal.id} href={deal.link} target="_blank" className="bg-black/40 backdrop-blur-sm rounded-xl p-3 flex gap-3 hover:bg-black/60 transition-colors group">
                 <div className="w-14 h-14 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center">
                    <img src={deal.imageUrl} className="max-w-full max-h-full object-contain" alt="Prod" />
                 </div>
                 <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white leading-tight line-clamp-2 mb-1 group-hover:text-yellow-400">{deal.product}</p>
                    <span className="text-lg font-black text-yellow-400">{deal.newPrice}</span>
                 </div>
              </a>
           ))}
        </div>
    </div>
  );

  // --- STRUCTURED DATA ---
  // Improved Schema to include specific "NewsArticle" fields
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.imageUrl],
    "datePublished": article.date, 
    "dateModified": article.date, // Assuming modified is same for now, or update if available
    "author": [{ "@type": "Person", "name": article.author, "url": "https://www.tuttoxandroid.com" }],
    "publisher": { 
        "@type": "Organization", 
        "name": "TuttoXAndroid", 
        "logo": { "@type": "ImageObject", "url": "https://i.imgur.com/l7YwbQe.png" } 
    },
    "description": article.excerpt,
    "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": article.url || `https://www.tuttoxandroid.com/article/${article.id}`
    }
  };

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500 pb-12">
      <Helmet>
        <title>{article.title} - TuttoXAndroid</title>
        <meta name="description" content={article.excerpt} />
        {/* Canonical is Critical for SEO recovery */}
        {article.url && <link rel="canonical" href={article.url} />}
        
        {/* Open Graph / Social */}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.imageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={article.url || window.location.href} />
        <meta property="article:published_time" content={article.date} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt} />
        <meta name="twitter:image" content={article.imageUrl} />

        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      {/* Loading Indicator */}
      {isUpdating && (
         <div className="fixed top-20 right-4 z-[99999] bg-black text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-[#c0ff8c] rounded-full"></div>
            Ottimizzazione...
         </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* MAIN CONTENT COLUMN (8/12) */}
            <div className="lg:col-span-8">
                
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                     <span onClick={() => handleSuggestedClick({...article, id: 'home', category: 'Tutti'} as Article)} className="text-[10px] font-black uppercase text-gray-400 cursor-pointer hover:text-black">Home</span>
                     <span className="text-[10px] text-gray-300">/</span>
                     <span className={`inline-block ${catBgClass} text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest`}>
                        {article.category}
                     </span>
                </div>

                {/* Title */}
                <h1 className="font-condensed text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-10 leading-none tracking-tighter text-center uppercase break-words">
                  {article.title}
                </h1>

                {/* Author & Share */}
                <div className="flex items-center justify-between border-t border-b border-gray-100 py-3 mb-6 relative">
                    <div className="flex items-center gap-3">
                        <img src={article.authorImageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} alt={article.author} className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 p-0.5" />
                        <div className="flex flex-col">
                            <span className="font-condensed text-sm font-black uppercase tracking-wide text-gray-900 leading-none">{article.author}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{article.date}</span>
                        </div>
                    </div>
                    <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Condividi
                    </button>
                    {showShareMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-white shadow-2xl rounded-xl p-4 grid grid-cols-4 gap-3 border border-gray-100 z-50 w-64 animate-in fade-in slide-in-from-top-2">
                             <button onClick={() => handleShare('copy')} className="flex flex-col items-center gap-1 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg></div><span className="text-[8px] font-bold uppercase">Copy</span></button>
                             {/* Other buttons hidden for brevity */}
                        </div>
                    )}
                </div>

                {/* Main Image */}
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 bg-gray-100">
                    <img src={article.imageUrl} className="w-full h-full object-cover" alt={article.title} />
                </div>

                {/* LEAD */}
                <div className="text-lg md:text-xl font-bold text-gray-900 mb-6 leading-relaxed border-l-4 border-[#e31b23] pl-4">
                  {article.excerpt}
                </div>

                {/* Ad */}
                <div className="not-prose mb-4 flex justify-center">
                    <AdUnit slotId="5244362740" format="auto" className="w-full" label="Sponsor" />
                </div>

                {/* Content Body */}
                <div ref={contentRef} className="prose prose-lg md:prose-xl max-w-none text-gray-800 leading-relaxed text-justify hyphens-auto [&_span]:!font-inherit [&_span]:!text-inherit [&_span]:!leading-inherit [&_p]:mb-6 marker:text-gray-800">
                    
                    {/* Part 1 */}
                    <div dangerouslySetInnerHTML={{ __html: contentParts[0] }} />

                    {/* --- DEALS INJECTION START --- */}
                    {isDealCategory && deals.length > 0 && (
                        <>
                           <MobileDealsCarousel />
                           <DesktopDealsBanner />
                        </>
                    )}
                    {/* --- DEALS INJECTION END --- */}

                    {/* First 'Read Also' */}
                    {!isTruncated && contentParts.length > 1 && moreArticles.length > 0 && (
                      <ReadAlsoBlock article={moreArticles[0]} />
                    )}

                    {/* Part 2 */}
                    {contentParts.length > 1 && (
                      <div dangerouslySetInnerHTML={{ __html: contentParts[1] }} />
                    )}

                    {/* Second 'Read Also' */}
                    {!isTruncated && contentParts.length > 2 && moreArticles.length > 1 && (
                       <ReadAlsoBlock article={moreArticles[1]} />
                    )}

                    {/* Part 3 */}
                    {contentParts.length > 2 && (
                       <div dangerouslySetInnerHTML={{ __html: contentParts[2] }} />
                    )}
                    
                    {/* TRUNCATION FALLBACK */}
                    {isTruncated && (
                        <div className="not-prose my-6 p-6 bg-gray-50 rounded-xl text-center border-2 border-dashed border-gray-200">
                        <h4 className="font-condensed text-xl font-black uppercase mb-2 text-gray-400">Continua a leggere...</h4>
                        <button onClick={handleForceNativeLoad} className="bg-[#e31b23] text-white px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-black transition-colors shadow-lg">Leggi Tutto</button>
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-2 mb-8">
                    {['Tech', 'Android', article.category, 'News'].map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 rounded text-[10px] font-bold uppercase text-gray-500 hover:bg-black hover:text-white transition-colors cursor-pointer">#{tag}</span>
                    ))}
                </div>

                {/* POTREBBE INTERESSARTI ANCHE (Grid of 4 Recommended) */}
                <div className="my-12 pt-8 border-t-2 border-black">
                   <h3 className="font-condensed text-2xl font-black uppercase text-gray-900 mb-6">Potrebbe interessarti anche</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recommendedGrid.map(art => (
                         <div key={art.id} onClick={() => handleSuggestedClick(art)} className="flex flex-col gap-2 cursor-pointer group">
                             <div className="w-full aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                                <img src={art.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={art.title} />
                             </div>
                             <span className="text-[10px] font-black uppercase text-[#e31b23] mt-1">{art.category}</span>
                             <h4 className="font-condensed text-xl font-bold leading-tight text-gray-900 group-hover:text-[#e31b23] transition-colors">{art.title}</h4>
                         </div>
                      ))}
                   </div>
                </div>

                {/* COMMENTS SECTION (DISQUS) */}
                <div className="mt-12 bg-gray-50 p-6 md:p-10 rounded-[2rem] border border-gray-100" id="comments">
                    <h3 className="font-condensed text-3xl font-black uppercase text-gray-900 mb-6 border-b border-gray-200 pb-2">Commenti</h3>
                    <div id="disqus_thread"></div>
                    <noscript>Please enable JavaScript to view the comments powered by Disqus.</noscript>
                </div>

            </div>

            {/* SIDEBAR (Right) */}
            <div className="hidden lg:block lg:col-span-4 space-y-8 h-fit">
                <AdUnit slotId="5244362740" format="auto" label="Sponsor" />
                <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="block bg-[#24A1DE] rounded-[2rem] p-6 text-center text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                   <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md text-[#24A1DE]">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg>
                   </div>
                   <h3 className="font-condensed text-2xl font-black uppercase italic mb-1 leading-none text-white drop-shadow-md">Canale Offerte</h3>
                   <p className="text-xs font-bold text-yellow-300 mb-4 px-2">Errori di prezzo e sconti esclusivi in tempo reale.</p>
                   <span className="inline-block bg-white text-[#24A1DE] px-8 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors">Unisciti Ora</span>
                </a>
                <SocialSidebar />
                <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                   <h3 className="font-condensed text-2xl font-black uppercase italic mb-4 text-gray-900 border-b-2 border-[#e31b23] pb-1 w-fit">I Più Letti</h3>
                   <div className="flex flex-col gap-4">
                      {mostReadArticles.map((art, index) => (
                        <div key={art.id} onClick={() => handleSuggestedClick(art)} className="flex items-start gap-4 cursor-pointer group">
                           <span className="text-3xl font-black text-gray-200 leading-none group-hover:text-[#e31b23] transition-colors font-condensed italic select-none mt-1">
                             {index + 1}
                           </span>
                           <div className="border-b border-gray-50 pb-3 w-full">
                              <span className="text-[9px] font-black uppercase text-[#e31b23] mb-1 block">{art.category}</span>
                              <h4 className="text-sm font-bold leading-tight text-gray-900 group-hover:text-[#e31b23] transition-colors line-clamp-2">
                                {art.title}
                              </h4>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="sticky top-24 space-y-6">
                    <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-[2rem] text-center relative overflow-hidden group border border-gray-800">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#e31b23] rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <h4 className="relative z-10 font-condensed text-xl font-black uppercase italic mb-2">Resta Aggiornato</h4>
                        <p className="relative z-10 text-[10px] text-gray-400 mb-4 font-medium px-4">Le migliori news tech, ogni mattina.</p>
                        
                        {sidebarSubscribeStatus === 'success' ? (
                            <div className="relative z-10 bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest">
                                Grazie per l'iscrizione!
                            </div>
                        ) : (
                          <form onSubmit={handleSidebarSubscribe} className="relative z-10 flex flex-col gap-2">
                            <input 
                              type="email" 
                              value={sidebarEmail}
                              onChange={(e) => setSidebarEmail(e.target.value)}
                              placeholder="La tua email"
                              className="w-full px-4 py-3 rounded-xl text-black text-xs font-bold focus:outline-none"
                              required
                            />
                            <button type="submit" className="w-full bg-[#e31b23] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors shadow-lg">
                              Iscriviti
                            </button>
                          </form>
                        )}
                    </div>
                    <AdUnit slotId="5244362740" format="auto" label="Sponsor" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
