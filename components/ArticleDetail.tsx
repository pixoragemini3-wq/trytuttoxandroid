
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
  
  // Newsletter Logic
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

  // --- HYDRATION & LINK FIXER LOGIC ---
  useEffect(() => {
    if (!contentRef.current) return;
    const container = contentRef.current;

    // 1. Fix External Links (Force new tab to prevent Sandbox "Connection Refused")
    const links = container.querySelectorAll('a');
    links.forEach(link => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.style.textDecoration = 'underline';
      link.style.color = '#e31b23';
      link.style.fontWeight = '700';
    });

    // 2. Expandable Rows
    const expandableRows = container.querySelectorAll('tr.expandable-row, div.expandable-row, .expandable-row');
    const handleRowClick = function(this: HTMLElement, e: Event) {
      e.stopPropagation(); e.preventDefault();
      this.classList.toggle('expanded');
    };
    expandableRows.forEach(row => {
      row.removeEventListener('click', handleRowClick as EventListener);
      row.addEventListener('click', handleRowClick as EventListener);
    });

    // 3. Disqus Injection (SPA Compatible)
    if (typeof window !== 'undefined' && document) {
        const shortname = 'tuttoxandroid-com'; 
        const identifier = article.id;
        const url = article.url || window.location.href;
        
        if ((window as any).DISQUS) {
            (window as any).DISQUS.reset({
                reload: true,
                config: function () {
                    this.page.identifier = identifier;
                    this.page.url = url;
                    this.page.title = article.title;
                }
            });
        } else {
            const d = document;
            const s = d.createElement('script');
            s.src = `https://${shortname}.disqus.com/embed.js`;
            s.setAttribute('data-timestamp', new Date().toString());
            
            (window as any).disqus_config = function () {
                this.page.identifier = identifier;
                this.page.url = url;
                this.page.title = article.title;
            };
            
            const disqusContainer = document.getElementById('disqus_thread');
            if (disqusContainer && !document.getElementById('disqus_script')) {
               s.id = 'disqus_script';
               (d.head || d.body).appendChild(s);
            }
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
    if (article.url) window.open(article.url, '_blank');
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
        case 'instagram':
             navigator.clipboard.writeText(url);
             alert("Link copiato! Incolla il link su Instagram.");
             shareLink = 'https://instagram.com'; 
             break;
        case 'copy': 
             navigator.clipboard.writeText(url);
             alert("Link copiato negli appunti!"); 
             setShowShareMenu(false); return;
        default: return;
    }
    window.open(shareLink, '_blank');
    setShowShareMenu(false);
  };
  
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

  // --- STRUCTURED DATA ---
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.imageUrl],
    "datePublished": article.date, 
    "dateModified": article.date,
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

  const catBgClass = 
    article.category === 'Smartphone' ? 'bg-blue-600' : 
    article.category === 'Modding' ? 'bg-orange-500' : 
    article.category === 'App & Giochi' ? 'bg-green-500' : 
    article.category === 'Recensioni' ? 'bg-purple-600' : 
    article.category === 'Guide' ? 'bg-cyan-600' : 
    article.category === 'Offerte' ? 'bg-yellow-500' : 
    'bg-[#e31b23]';

  const recommendedGrid = moreArticles.slice(0, 4);
  const mostReadArticles = [...offerNews, ...moreArticles].slice(0, 5);

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500 pb-12">
      <Helmet>
        <title>{article.title} | TuttoXAndroid</title>
        <meta name="description" content={article.excerpt} />
        {article.url && <link rel="canonical" href={article.url} />}
        
        {/* Open Graph / Social */}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.imageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={article.url || window.location.href} />
        <meta property="article:published_time" content={article.date} />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@tuttoxandroid" />
        <meta name="twitter:creator" content="@tuttoxandroid" />
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
                <h1 className="font-condensed text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-10 leading-none tracking-tighter text-justify uppercase break-words">
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
                             <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-1 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></div><span className="text-[8px] font-bold uppercase">WA</span></button>
                             <button onClick={() => handleShare('telegram')} className="flex flex-col items-center gap-1 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-full bg-[#24A1DE] text-white flex items-center justify-center"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.638z"/></svg></div><span className="text-[8px] font-bold uppercase">TG</span></button>
                             <button onClick={() => handleShare('facebook')} className="flex flex-col items-center gap-1 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div><span className="text-[8px] font-bold uppercase">FB</span></button>
                             <button onClick={() => handleShare('twitter')} className="flex flex-col items-center gap-1 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg></div><span className="text-[8px] font-bold uppercase">X</span></button>
                             <button onClick={() => handleShare('instagram')} className="flex flex-col items-center gap-1 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white flex items-center justify-center"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.163 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></div><span className="text-[8px] font-bold uppercase">IG</span></button>
                             <button onClick={() => handleShare('email')} className="flex flex-col items-center gap-1 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></div><span className="text-[8px] font-bold uppercase">Email</span></button>
                             <button onClick={() => handleShare('copy')} className="flex flex-col items-center gap-1 hover:scale-105 transition-transform"><div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg></div><span className="text-[8px] font-bold uppercase">Copy</span></button>
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
