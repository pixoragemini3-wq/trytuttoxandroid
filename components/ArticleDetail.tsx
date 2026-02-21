
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

  // Check if content appears truncated
  const isTruncated = useMemo(() => {
     return (!fullContent || fullContent.length < 600) && article.url;
  }, [fullContent, article.url]);

  // --- CONTENT SPLITTER LOGIC ---
  const contentParts = useMemo(() => {
    const content = fullContent || article.content;
    if (!content) return [];
    
    // Improved splitting to avoid breaking HTML tags
    const splitByParagraph = content.split('</p>');
    
    if (splitByParagraph.length < 3) return [content]; 
    
    const part1 = splitByParagraph.slice(0, 2).join('</p>') + '</p>';
    const part2 = splitByParagraph.slice(2, 6).join('</p>') + '</p>';
    const part3 = splitByParagraph.slice(6).join('</p>');
    
    return [part1, part2, part3].filter(p => p.length > 0 && p !== '</p>');
  }, [fullContent, article.content]);

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

  // --- HYDRATION LOGIC (Ripristino funzioni JS perse) ---
  useEffect(() => {
    if (!contentRef.current) return;

    const container = contentRef.current;

    // 1. GESTIONE TABELLA ESPANDIBILE (FAQ / CASCATA)
    // Updated logic to robustly handle both TR and DIV elements
    const expandableRows = container.querySelectorAll('tr.expandable-row, div.expandable-row, .expandable-row');
    
    const handleRowClick = function(this: HTMLElement, e: Event) {
      e.stopPropagation(); 
      e.preventDefault();
      
      // Toggle current
      if (this.classList.contains('expanded')) {
        this.classList.remove('expanded');
      } else {
        this.classList.add('expanded');
      }
    };

    expandableRows.forEach(row => {
      // Ensure we remove old listeners to prevent stacking
      row.removeEventListener('click', handleRowClick as EventListener);
      row.addEventListener('click', handleRowClick as EventListener);
    });

    // 2. AGGIUNTA FUNZIONE "COPIA" AI BLOCCHI DI CODICE (<pre>)
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach((pre) => {
        if (pre.querySelector('.copy-code-btn')) return;

        if (getComputedStyle(pre).position === 'static') {
            pre.style.position = 'relative';
        }

        const btn = document.createElement('button');
        btn.innerText = 'Copia';
        btn.className = 'copy-code-btn';
        
        btn.onclick = async (e) => {
            e.stopPropagation(); 
            e.preventDefault();
            try {
                const code = pre.querySelector('code')?.innerText || pre.innerText;
                const textToCopy = code.replace('Copia', '').replace('Copiato!', '').trim();
                
                await navigator.clipboard.writeText(textToCopy);
                
                btn.innerText = 'Copiato!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerText = 'Copia';
                    btn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Errore copia', err);
                btn.innerText = 'Errore';
            }
        };

        pre.appendChild(btn);
    });

    // 3. TABLE OF CONTENTS GENERATION
    const tocContainer = container.querySelector('.all-questions');
    if (tocContainer) {
       const headers = container.querySelectorAll('h3'); 
       if (headers.length > 0) {
          let tocHtml = `<nav class='table-of-contents' role='navigation'>
                           <h2>Indice della pagina:</h2>
                           <ul>`;
          
          headers.forEach((header, index) => {
             const id = header.id || `section-${index}`;
             header.id = id;
             const title = header.textContent;
             if (title) {
                tocHtml += `<li><a href="#${id}" onclick="document.getElementById('${id}').scrollIntoView({behavior: 'smooth'}); return false;">${title}</a></li>`;
             }
          });
          
          tocHtml += `</ul></nav>`;
          tocContainer.innerHTML = tocHtml;
       }
    }

    // 4. IMAGE LIGHTBOX / NEW TAB
    const images = container.querySelectorAll('.post-body img');
    images.forEach((img) => {
        const imageEl = img as HTMLImageElement;
        imageEl.style.cursor = 'zoom-in';
        imageEl.onclick = () => {
            window.open(imageEl.src, '_blank');
        };
    });

    // Cleanup
    return () => {
      expandableRows.forEach(row => {
        row.removeEventListener('click', handleRowClick as EventListener);
      });
    };
  }, [fullContent, contentParts]); 

  const handleSuggestedClick = (art: Article) => {
    if (onArticleClick) {
      onArticleClick(art);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleForceNativeLoad = () => {
    if (article.url) {
      window.location.href = article.url;
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

  // --- STRUCTURED DATA (Schema.org) ---
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.imageUrl],
    "datePublished": article.date, // In production, convert this to ISO 8601
    "author": [{
      "@type": "Person",
      "name": article.author,
      "url": "https://www.tuttoxandroid.com"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "TuttoXAndroid",
      "logo": {
        "@type": "ImageObject",
        "url": "https://i.imgur.com/l7YwbQe.png"
      }
    },
    "description": article.excerpt
  };

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500 pb-12">
      <Helmet>
        <title>{article.title} - TuttoXAndroid</title>
        <meta name="description" content={article.excerpt} />
        {/* Open Graph Tags for client-side routing (fallback) */}
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.imageUrl} />
        <meta property="og:type" content="article" />
        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      {/* Loading Indicator */}
      {isUpdating && (
         <div className="fixed top-20 right-4 z-50 bg-black text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-[#c0ff8c] rounded-full"></div>
            Ottimizzazione testo...
         </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* MAIN CONTENT COLUMN (8/12) */}
            <div className="lg:col-span-8">
                
                {/* Breadcrumbs / Category */}
                <div className="flex items-center gap-2 mb-4">
                     <span onClick={() => handleSuggestedClick({...article, id: 'home', category: 'Tutti'} as Article)} className="text-[10px] font-black uppercase text-gray-400 cursor-pointer hover:text-black">Home</span>
                     <span className="text-[10px] text-gray-300">/</span>
                     <span className={`inline-block ${catBgClass} text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest`}>
                        {article.category}
                     </span>
                </div>

                {/* TITLE - SMALLER & JUSTIFIED */}
                <h1 className="font-condensed text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight tracking-tight break-words text-justify hyphens-auto">
                {article.title}
                </h1>

                {/* Author & Date Bar */}
                <div className="flex items-center justify-between border-t border-b border-gray-100 py-3 mb-6">
                    <div className="flex items-center gap-3">
                        <img 
                        src={article.authorImageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                        alt={article.author} 
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 p-0.5"
                        />
                        <div className="flex flex-col">
                            <span className="font-condensed text-sm font-black uppercase tracking-wide text-gray-900 leading-none">
                                {article.author}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                {article.date}
                            </span>
                        </div>
                    </div>
                    <button 
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Condividi
                    </button>
                    {showShareMenu && (
                        <div className="absolute right-4 mt-8 bg-white shadow-xl rounded-xl p-3 flex items-center gap-2 border border-gray-100 z-50">
                            <button onClick={() => handleShare('whatsapp')} className="w-8 h-8 rounded-full bg-green-100 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408.002 12.04c0 2.12.554 4.189 1.602 6.06L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.635 0 12.046-5.411 12.048-12.042 0-3.217-1.253-6.241-3.529-8.517z"/></svg></button>
                            <button onClick={() => handleShare('telegram')} className="w-8 h-8 rounded-full bg-blue-100 text-[#24A1DE] flex items-center justify-center hover:bg-[#24A1DE] hover:text-white transition-all"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg></button>
                        </div>
                    )}
                </div>

                {/* Main Image */}
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 bg-gray-100">
                    <img src={article.imageUrl} className="w-full h-full object-cover" alt={article.title} />
                </div>

                {/* LEAD / SUMMARY - BOLD START */}
                <div className="text-lg md:text-xl font-bold text-gray-900 mb-6 leading-relaxed border-l-4 border-[#e31b23] pl-4">
                  {article.excerpt}
                </div>

                {/* AD UNIT - Reduced Whitespace */}
                <div className="not-prose mb-4 flex justify-center">
                    <AdUnit slotId="5244362740" format="auto" className="w-full" label="Sponsor" />
                </div>

                {/* Content Body */}
                <div ref={contentRef} className="prose prose-lg md:prose-xl max-w-none text-gray-800 leading-relaxed text-justify hyphens-auto [&_span]:!font-inherit [&_span]:!text-inherit [&_span]:!leading-inherit [&_p]:mb-6 marker:text-gray-800">
                    {/* Render Part 1 */}
                    <div dangerouslySetInnerHTML={{ __html: contentParts[0] }} />

                    {/* Insert First 'Read Also' if more content exists */}
                    {!isTruncated && contentParts.length > 1 && moreArticles.length > 0 && (
                      <ReadAlsoBlock article={moreArticles[0]} />
                    )}

                    {/* Render Part 2 */}
                    {contentParts.length > 1 && (
                      <div dangerouslySetInnerHTML={{ __html: contentParts[1] }} />
                    )}

                    {/* Insert Second 'Read Also' if content is long enough */}
                    {!isTruncated && contentParts.length > 2 && moreArticles.length > 1 && (
                       <ReadAlsoBlock article={moreArticles[1]} />
                    )}

                    {/* Render Part 3 (Rest of content) */}
                    {contentParts.length > 2 && (
                       <div dangerouslySetInnerHTML={{ __html: contentParts[2] }} />
                    )}
                    
                    {/* TRUNCATION FALLBACK BUTTON */}
                    {isTruncated && (
                        <div className="not-prose my-6 p-6 bg-gray-50 rounded-xl text-center border-2 border-dashed border-gray-200">
                        <h4 className="font-condensed text-xl font-black uppercase mb-2 text-gray-400">Continua a leggere...</h4>
                        <button 
                            onClick={handleForceNativeLoad}
                            className="bg-[#e31b23] text-white px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-black transition-colors shadow-lg"
                        >
                            Leggi Tutto
                        </button>
                        </div>
                    )}

                    {article.dealData && (
                        <div className="not-prose my-8">
                            <div className="bg-white rounded-xl overflow-hidden border border-[#e31b23] shadow-lg flex flex-col md:flex-row">
                                <div className="md:w-1/3 bg-gray-50 p-6 flex items-center justify-center">
                                    <img src={article.imageUrl} className="max-h-32 object-contain mix-blend-multiply" alt="Deal" />
                                </div>
                                <div className="md:w-2/3 p-6 flex flex-col justify-center">
                                    <span className="text-[10px] font-black uppercase text-[#e31b23] mb-1">Offerta Consigliata</span>
                                    <h3 className="font-condensed text-xl font-black uppercase mb-2 leading-none">{article.title}</h3>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-3xl font-black text-[#e31b23]">{article.dealData.newPrice}</span>
                                        <span className="text-sm font-bold text-gray-400 line-through">{article.dealData.oldPrice}</span>
                                    </div>
                                    <a 
                                    href={article.dealData.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-[#e31b23] text-white text-center py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-black transition-colors"
                                    >
                                    Vedi Offerta
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-2 mb-8">
                    {['Tech', 'Android', article.category, 'News'].map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 rounded text-[10px] font-bold uppercase text-gray-500 hover:bg-black hover:text-white transition-colors cursor-pointer">#{tag}</span>
                    ))}
                </div>

                {/* Mobile Only Related (if sidebar hidden) */}
                <div className="lg:hidden mt-8">
                    <h3 className="font-condensed text-xl font-black uppercase mb-4 text-gray-900 border-b border-gray-200 pb-2">Potrebbe Interessarti</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {moreArticles.slice(2, 5).map(art => (
                            <div key={art.id} onClick={() => handleSuggestedClick(art)} className="flex gap-4 cursor-pointer group">
                                <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    <img src={art.imageUrl} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-[#e31b23] uppercase mb-1 block">{art.category}</span>
                                    <h4 className="text-sm font-bold leading-tight group-hover:text-[#e31b23] transition-colors">{art.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* SIDEBAR COLUMN (4/12) - REDESIGNED & FILLED */}
            <div className="hidden lg:block lg:col-span-4 space-y-8 h-fit">
                
                {/* 1. AD UNIT TOP */}
                <AdUnit slotId="5244362740" format="auto" label="Sponsor" />

                {/* 2. TELEGRAM PROMO BANNER */}
                <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="block bg-[#24A1DE] rounded-[2rem] p-6 text-center text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                   <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md text-[#24A1DE]">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg>
                   </div>
                   <h3 className="font-condensed text-2xl font-black uppercase italic mb-1 leading-none text-white drop-shadow-md">Canale Offerte</h3>
                   <p className="text-xs font-bold text-yellow-300 mb-4 px-2">Errori di prezzo e sconti esclusivi in tempo reale.</p>
                   <span className="inline-block bg-white text-[#24A1DE] px-8 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors">Unisciti Ora</span>
                </a>

                {/* 3. SOCIAL WIDGET */}
                <SocialSidebar />

                {/* 4. MOST READ WIDGET (I Più Letti) */}
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
                
                {/* 5. FLASH OFFERS (Mini Deals) - UPDATED LAYOUT */}
                {deals.length > 0 && (
                  <div className="bg-black text-white p-6 rounded-[2rem] shadow-lg">
                    <h3 className="font-condensed text-xl font-black uppercase italic mb-4 text-white">Offerte Lampo</h3>
                    <div className="space-y-4">
                      {deals.slice(0, 3).map(deal => (
                        <a key={deal.id} href={deal.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                           <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 shrink-0">
                              <img src={deal.imageUrl} className="max-w-full max-h-full object-contain" />
                           </div>
                           <div className="flex flex-col justify-center">
                              {/* Product Name First - White */}
                              <div className="text-[10px] font-bold text-gray-200 leading-tight mb-1 line-clamp-2 group-hover:text-white transition-colors">{deal.product}</div>
                              {/* Prices Below - Yellow (No Green) */}
                              <div className="flex items-center gap-2">
                                 <span className="text-lg font-black text-yellow-400 leading-none">{deal.newPrice}</span>
                                 <span className="text-[10px] font-bold text-gray-500 line-through">{deal.oldPrice}</span>
                              </div>
                           </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. CONTEXTUAL (Sullo stesso tema) */}
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <h3 className="font-condensed text-xl font-black uppercase italic mb-4 text-gray-900">Correlati</h3>
                    <div className="flex flex-col gap-4">
                        {moreArticles.slice(2, 5).map(art => (
                            <div key={art.id} onClick={() => handleSuggestedClick(art)} className="bg-white p-3 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex gap-3 items-start">
                                <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                                    <img src={art.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{art.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 7. STICKY BOTTOM CONTAINER (Newsletter + Ad) */}
                <div className="sticky top-24 space-y-6">
                    {/* Newsletter Box */}
                    <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-[2rem] text-center relative overflow-hidden group border border-gray-800">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#e31b23] rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <h4 className="relative z-10 font-condensed text-xl font-black uppercase italic mb-2">Resta Aggiornato</h4>
                        <p className="relative z-10 text-[10px] text-gray-400 mb-4 font-medium px-4">Le migliori news tech, ogni mattina.</p>
                        <button className="relative z-10 w-full bg-[#e31b23] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors shadow-lg">
                            Iscriviti
                        </button>
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
