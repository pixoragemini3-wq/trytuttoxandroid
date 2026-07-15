
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Article, Deal } from '../types';
import AdUnit from './AdUnit';
import { AMAZON_AFFILIATE_TAG, fetchArticleById, getQuoteLeadText, truncateLeadForQuote } from '../services/bloggerService';
import SocialSidebar from './SocialSidebar';

interface ArticleDetailProps {
  article: Article;
  relatedArticle?: Article;
  moreArticles?: Article[];
  deals?: Deal[];
  offerNews?: Article[];
  onArticleClick?: (article: Article) => void;
}

// --- SUB-COMPONENTS ---
const SummaryCard: React.FC<{ title: string, points: string[] }> = ({ title, points }) => (
  <div className="not-prose my-10 bg-white border-2 border-black rounded-[2rem] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-300">
    <div className="bg-black text-white px-6 py-4 flex items-center gap-3">
      <div className="w-8 h-8 bg-[#e31b23] rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <h4 className="font-condensed text-xl font-black uppercase tracking-tight">{title || "In breve"}</h4>
    </div>
    <div className="p-6 space-y-4">
      {points.map((point, idx) => (
        <div key={idx} className="flex gap-4 items-start group">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
            <span className="text-[10px] font-black">{idx + 1}</span>
          </div>
          <p className="text-sm md:text-base font-bold text-gray-800 leading-snug">{point}</p>
        </div>
      ))}
    </div>
  </div>
);

const GPSPromo = () => (
  <div className="not-prose my-12 relative group">
    <div className="absolute inset-0 bg-gradient-to-r from-[#e31b23] to-black rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
    <div className="relative bg-white border-2 border-black rounded-[2.5rem] p-8 md:p-10 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 border-2 border-black" />
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500 shrink-0">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        </div>
        <div className="text-center md:text-left flex-1">
          <h4 className="font-condensed text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2 italic">Calcola il tuo punteggio GPS</h4>
          <p className="text-gray-600 font-bold leading-tight mb-6">Usa il nostro calcolatore gratuito e sempre aggiornato per scoprire la tua posizione nelle graduatorie.</p>
          <Link to="/calcolatore-gps" className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-[#e31b23] transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(227,27,35,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1">
            Prova il Calcolatore
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </div>
    </div>
  </div>
);

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, relatedArticle, moreArticles = [], deals = [], offerNews = [], onArticleClick }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [fullContent, setFullContent] = useState(article.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [portalNodes, setPortalNodes] = useState<{
    deals: Element | null, 
    readAlso1: Element | null, 
    readAlso2: Element | null,
    summaries: Element[],
    gpsPromos: Element[]
  }>({
    deals: null, 
    readAlso1: null, 
    readAlso2: null,
    summaries: [],
    gpsPromos: []
  });
  
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

  // SEO dinamico per articolo (senza Helmet — evita crash se manca HelmetProvider)
  useEffect(() => {
    if (!article) return;

    const pageTitle = `${article.title} | TuttoXAndroid`;
    document.title = pageTitle;

    const descContent = (article.excerpt || article.title).slice(0, 155);
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', descContent);

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property')) el.setAttribute('property', selector.split('"')[1]);
        else el.setAttribute('name', selector.split('"')[1]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[property="og:title"]', 'content', pageTitle);
    setMeta('meta[property="og:description"]', 'content', descContent);
    if (article.imageUrl) {
      setMeta('meta[property="og:image"]', 'content', article.imageUrl);
    }
    setMeta('meta[name="twitter:title"]', 'content', pageTitle);
    setMeta('meta[name="twitter:description"]', 'content', descContent);

    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical && article.url) {
      canonical.href = article.url;
    }
  }, [article]);

  // Check if article is deals related
  const isDealCategory = useMemo(() => {
    if (article.category === 'Offerte') return true;
    if (article.dealData?.link) return true;
    const tags = (article.tags || []).map((t) => t.toLowerCase().trim());
    return tags.some((t) => t === 'offerteimperdibili');
  }, [article]);

  // Check if content appears truncated
  const isTruncated = useMemo(() => {
     const hasMoreTag = fullContent?.includes('<!--more-->') || fullContent?.includes('name="more"');
     return ((!fullContent || fullContent.length < 600) || hasMoreTag) && article.url;
  }, [fullContent, article.url]);

  const catColor = 
    article.category === 'Smartphone' ? 'text-blue-600' : 
    article.category === 'Modding' ? 'text-orange-500' : 
    article.category === 'App & Giochi' ? 'text-green-500' : 
    article.category === 'Recensioni' ? 'text-purple-600' : 
    article.category === 'Guide' ? 'text-cyan-600' : 
    article.category === 'Offerte' ? 'text-yellow-500' : 
    'text-[#e31b23]';

  const isGarbledLead = (text: string): boolean => {
    if (!text) return true;
    const t = text.trim();
    if (/^indice\s*[A-ZÀ-ÿ]|^indice[a-zà-ÿ]/i.test(t)) return true;
    if (/^indice(?:potenza|domande|orbita|la |il |un )/i.test(t)) return true;
    if (/\bindice\s*(un |il |la |l'|faq|domande)/i.test(t)) return true;
    if (/faq\s*:/i.test(t) && t.length > 80) return true;
    const headingRuns = t.match(/[A-ZÀ-ÿ][a-zà-ÿ]{3,}/g) || [];
    const punct = (t.match(/[.!?]/g) || []).length;
    if (t.length > 90 && headingRuns.length >= 3 && punct < 2) return true;
    if (t.length > 160 && punct === 0) return true;
    if (t.length < 90 && punct === 0 && t.split(/\s+/).length < 8) return true;
    return false;
  };

  const stripJsonArtifacts = (html: string): string => {
    let out = html;
    out = out.replace(
      /(?:\s*"[\s\n]*")+\s*\}\s*(?=<(?:p|div)[^>]*\bclass=["'][^"']*txa-source)/gi,
      ''
    );
    out = out.replace(/<\/div>\s*"\s*(?:\n\s*")?\s*\}\s*/gi, '</div>');
    out = out.replace(/(?:^|>)\s*"\s*"\s*\}\s*(?=<|$)/g, '>');
    return out;
  };

  const sanitizeArticleHtml = (html: string): string => {
    let out = stripJsonArtifacts(html);
    out = out.replace(/<div[^>]*\bclass=["'][^"']*txa-img[^"']*["'][^>]*>\s*<\/div>/gi, '');
    const navMatch = out.match(
      /<nav[^>]*\bclass=["'][^"']*txa-toc[^"']*["'][^>]*>[\s\S]*?<\/nav>/i
    );
    if (navMatch) {
      const nav = navMatch[0];
      out = out.replace(
        /<nav[^>]*\bclass=["'][^"']*txa-toc[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi,
        ''
      );
      if (/<h2[^>]*\bid=["']txa-sec/i.test(out)) {
        out = out.replace(/(<h2[^>]*\bid=["']txa-sec)/i, `${nav}$1`);
      } else {
        out = out.replace(/<\/style>\s*/i, `</style>\n${nav}`);
      }
    }
    return out;
  };

  const stripDuplicateLeadFromBody = (html: string): string => {
    if (!html) return '';
    return html
      .replace(/<div[^>]*\bid=["']txa-lead-single["'][^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<span[^>]*data-txa-excerpt=["']1["'][^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<p[^>]*>\s*(?:<strong>\s*)?Indice\s*:?[\s\S]*?<\/p>/gi, '')
      .trim();
  };

  const normalizeLeadText = (text: string): string =>
    text.replace(/\s+/g, ' ').trim().toLowerCase();

  const textsAreSimilar = (a: string, b: string, minLen = 20): boolean => {
    const na = normalizeLeadText(a);
    const nb = normalizeLeadText(b);
    if (!na || !nb) return false;
    const shorter = na.length <= nb.length ? na : nb;
    const longer = na.length > nb.length ? na : nb;
    if (shorter.length < minLen) return false;
    if (longer.startsWith(shorter.slice(0, Math.min(shorter.length, 80)))) return true;
    if (shorter.startsWith(longer.slice(0, Math.min(longer.length, 80)))) return true;
    return false;
  };

  const stripLeadDuplicateFromBodyStart = (lead: string, html: string): string => {
    if (!lead.trim() || !html) return html;
    let result = html;
    for (let i = 0; i < 6; i++) {
      const blockMatch = result.match(
        /^\s*<(p|div|blockquote)(?:\s[^>]*)?>[\s\S]*?<\/\1>/i
      );
      if (!blockMatch) break;
      const blockPlain = plainFromHtml(blockMatch[0]);
      if (!textsAreSimilar(blockPlain, lead)) break;
      result = result.slice(blockMatch[0].length).trim();
    }
    return result;
  };

  const stripStrayIndiceAfterToc = (html: string): string =>
    html
      .replace(/<\/nav>\s*(?:<strong>\s*Indice\s*<\/strong>\s*)+/gi, '</nav>')
      .replace(/<\/nav>\s*(?:Indice\s*){2,}/gi, '</nav>')
      .replace(
        /<p[^>]*>\s*(?:<strong>\s*)?Indice(?:\s*<\/strong>)?\s*(?:Indice\s*)+<\/p>/gi,
        ''
      );

  const repairTocLayoutHtml = (html: string): string => {
    const navMatch = html.match(
      /(<nav[^>]*\bclass=["'][^"']*txa-toc[^"']*["'][^>]*>)([\s\S]*?)(<\/nav>)/i
    );
    if (!navMatch) return stripStrayIndiceAfterToc(html);
    const [, open, inner, close] = navMatch;
    const discardPatterns = [
      /<p[^>]*\bclass=["'][^"']*txa-toc-title[^"']*["'][^>]*>[\s\S]*?<\/p>/gi,
      /<strong>\s*Indice\s*<\/strong>/gi,
      /<div[^>]*\binjected-read-also\b[^>]*>[\s\S]*?<\/div>/gi,
      /<div[^>]*\binjected-deals\b[^>]*>[\s\S]*?<\/div>/gi,
    ];
    const junkPatterns = [
      /<div[^>]*\bclass=["'][^"']*separator[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      /<a[^>]*>\s*<img[^>]*>\s*<\/a>/gi,
      /<img[^>]*>/gi,
      /<p[^>]*>\s*<\/p>/gi,
    ];
    let extracted = '';
    let cleaned = inner;
    for (const pattern of discardPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    for (const pattern of junkPatterns) {
      const hits = cleaned.match(pattern) || [];
      extracted += hits.join('');
      cleaned = cleaned.replace(pattern, '');
    }
    const ulMatch = cleaned.match(/<ul[^>]*>[\s\S]*?<\/ul>/i);
    if (!ulMatch) return stripStrayIndiceAfterToc(html);
    const cleanNav =
      `${open}<p class="txa-toc-title"><strong>Indice</strong></p>${ulMatch[0]}${close}`;
    return stripStrayIndiceAfterToc(html.replace(navMatch[0], cleanNav + extracted));
  };

  const plainFromHtml = (html: string): string =>
    html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const extractSintesiText = (html: string): string => {
    const box = html.match(
      /<div[^>]*\bclass=["'][^"']*txa-highlight[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    );
    if (!box?.[1]) return '';
    return box[1]
      .replace(/<strong>\s*In sintesi\s*:?\s*<\/strong>\s*/i, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const removeFirstSintesiBox = (html: string): string =>
    html.replace(
      /<div[^>]*\bclass=["'][^"']*txa-highlight[^"']*["'][^>]*>[\s\S]*?<\/div>\s*/i,
      ''
    );

  const normalizeImgSrc = (src: string): string => {
    const s = (src || '').toLowerCase().trim();
    const bloggerToken = s.match(/googleusercontent\.com\/img\/a\/([a-z0-9_-]+)/i);
    if (bloggerToken) return bloggerToken[1];
    const wpUpload = s.match(/\/wp-content\/uploads\/[^"']+/i);
    if (wpUpload) return wpUpload[0].split('?')[0];
    return s
      .replace(/\/s\d+(-c)?\//g, '/')
      .replace(/=[swn]\d+(-c)?.*$/i, '')
      .replace(/=w\d+-h\d+(-c)?.*$/i, '')
      .split('?')[0]
      .replace(/\/+$/, '');
  };

  const collectImgSrcs = (html: string): string[] => {
    const srcs: string[] = [];
    const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const src = m[1].trim();
      if (src && !srcs.some((s) => normalizeImgSrc(s) === normalizeImgSrc(src))) {
        srcs.push(src);
      }
    }
    return srcs;
  };

  const removeImageBlocksBySrc = (html: string, srcs: string[]): string => {
    const pending = new Set(srcs.map(normalizeImgSrc));
    if (!pending.size) return html;

    let result = html.replace(
      /<(p|div|figure|a)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi,
      (block) => {
        const img = block.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (!img) return block;
        const key = normalizeImgSrc(img[1]);
        if (!pending.has(key)) return block;
        const text = block.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text.length > 40) return block;
        pending.delete(key);
        return '';
      }
    );

    result = result.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (tag, src: string) => {
      const key = normalizeImgSrc(src);
      if (pending.has(key)) {
        pending.delete(key);
        return '';
      }
      return tag;
    });

    result = result.replace(
      /<div[^>]*\bclass=["'][^"']*separator[^"']*["'][^>]*>\s*<\/div>/gi,
      ''
    );

    return result.replace(/\n{3,}/g, '\n\n').trim();
  };

  // --- CONTENT PRE-PROCESSING (Lead-in Text) ---
  const { displayLead, displayLeadHtml, displayBody } = useMemo(() => {
    let content = sanitizeArticleHtml(
      repairTocLayoutHtml(fullContent || article.content || '')
    );
    if (!content) {
      const quoteLead = getQuoteLeadText(article.content || '', article.excerpt);
      return {
        displayLead: quoteLead,
        displayLeadHtml: '',
        displayBody: stripDuplicateLeadFromBody(article.content || ''),
      };
    }

    const hiddenExcerpt = content.match(
      /<span[^>]*data-txa-excerpt=["']1["'][^>]*>([\s\S]*?)<\/span>/i
    );
    if (hiddenExcerpt) {
      const plain = plainFromHtml(hiddenExcerpt[1]);
      if (plain.length >= 20 && !isGarbledLead(plain)) {
        const bodyWithoutHidden = stripLeadDuplicateFromBodyStart(
          plain,
          stripDuplicateLeadFromBody(
            removeFirstSintesiBox(content.replace(hiddenExcerpt[0], '').trim())
          )
        );
        return {
          displayLead: truncateLeadForQuote(plain),
          displayLeadHtml: '',
          displayBody: bodyWithoutHidden,
        };
      }
    }

    const leadBox = content.match(
      /<div[^>]*\bid=["']txa-lead-single["'][^>]*>([\s\S]*?)<\/div>/i
    );
    if (leadBox) {
      const leadPlain = plainFromHtml(leadBox[1]);
      if (leadPlain.length >= 20 && !isGarbledLead(leadPlain)) {
        const bodyWithoutLead = content.replace(leadBox[0], '').trim();
        const bodyClean = stripLeadDuplicateFromBodyStart(
          leadPlain,
          stripDuplicateLeadFromBody(removeFirstSintesiBox(bodyWithoutLead))
        );
        return {
          displayLead: truncateLeadForQuote(leadPlain),
          displayLeadHtml: leadBox[1].trim(),
          displayBody: bodyClean,
        };
      }
    }

    const sintesiText = extractSintesiText(content);
    if (sintesiText.length >= 20 && !isGarbledLead(sintesiText)) {
      return {
        displayLead: truncateLeadForQuote(sintesiText),
        displayLeadHtml: '',
        displayBody: stripLeadDuplicateFromBodyStart(
          sintesiText,
          stripDuplicateLeadFromBody(removeFirstSintesiBox(content))
        ),
      };
    }

    // Find the LONGEST run of consecutive bold/strong text (user's highlighted key phrase)
    const boldRegex = /<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi;
    let bestLead = null;
    let bestLeadLength = 0;
    let bestMatchIndex = -1;
    let bestMatchFullLength = 0;

    const searchArea = content
      .replace(/<nav[^>]*\bclass=["'][^"']*txa-toc[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<table[\s\S]*?<\/table>/gi, ' ')
      .slice(0, 2000);
    let match;

    while ((match = boldRegex.exec(searchArea)) !== null) {
      const boldContent = match[2];
      const plainText = boldContent.replace(/<[^>]*>/g, '').trim();
      const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

      if (
        wordCount >= 8 &&
        plainText.length > bestLeadLength &&
        (/[.!?]/.test(plainText) || wordCount >= 12)
      ) {
        bestLeadLength = plainText.length;
        bestLead = boldContent;
        bestMatchIndex = match.index;
        bestMatchFullLength = match[0].length;
      }
    }

    if (bestLead && bestMatchIndex !== -1) {
      let start = bestMatchIndex;
      let end = bestMatchIndex + bestMatchFullLength;

      // Try to remove wrapping <p> if the bold is the only content
      const beforeMatch = content.slice(Math.max(0, start - 30), start).match(/<p[^>]*>\s*$/i);
      const afterMatch = content.slice(end, end + 30).match(/^\s*<\/p>/i);

      if (beforeMatch && afterMatch) {
        start -= beforeMatch[0].length;
        end += afterMatch[0].length;
      }

      const leadPlain = plainFromHtml(bestLead);
      if (!isGarbledLead(leadPlain)) {
        const bodyAfterBold = stripDuplicateLeadFromBody(
          (content.slice(0, start) + content.slice(end)).trim()
        );
        return {
          displayLead: truncateLeadForQuote(leadPlain),
          displayLeadHtml: '',
          displayBody: stripLeadDuplicateFromBodyStart(leadPlain, bodyAfterBold),
        };
      }
    }

    const quoteLead = getQuoteLeadText(content, article.excerpt);
    if (quoteLead.length >= 20 && !isGarbledLead(quoteLead)) {
      const bodyClean = stripLeadDuplicateFromBodyStart(
        quoteLead,
        stripDuplicateLeadFromBody(content)
      );
      return { displayLead: quoteLead, displayLeadHtml: '', displayBody: bodyClean };
    }
    return { displayLead: '', displayLeadHtml: '', displayBody: stripDuplicateLeadFromBody(content) };
  }, [fullContent, article.content, article.excerpt]);

  const { featuredImages, proseBody } = useMemo(() => {
    const hero = (article.imageUrl || '').trim();
    const bodySrcs = collectImgSrcs(displayBody);
    const picked: string[] = [];

    const pushUnique = (src: string) => {
      if (!src) return;
      if (picked.some((p) => normalizeImgSrc(p) === normalizeImgSrc(src))) return;
      picked.push(src);
    };

    // Una sola immagine in evidenza: le altre restano nel corpo dove le ha meso l'editor
    if (hero) pushUnique(hero);
    else if (bodySrcs[0]) pushUnique(bodySrcs[0]);

    let cleaned = removeImageBlocksBySrc(displayBody, picked);
    cleaned = cleaned.replace(
      /^\s*(?:<div[^>]*\bclass=["'][^"']*separator[^"']*["'][^>]*>[\s\S]*?<\/div>\s*)+/i,
      ''
    );
    cleaned = cleaned.replace(
      /<(h[23])([^>]*)>[\s\S]*?<\/\1>/gi,
      (block, tag: string, attrs: string) => {
        if (!/<img[^>]+>/i.test(block)) return block;
        const textOnly = block
          .replace(/<div[^>]*\bclass=["'][^"']*separator[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
          .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, '')
          .replace(/<img[^>]*>/gi, '')
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!textOnly) return '';
        return `<${tag}${attrs}>${textOnly}</${tag}>`;
      }
    );

    return { featuredImages: picked.slice(0, 1), proseBody: cleaned };
  }, [displayBody, article.imageUrl]);

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

  const extractTocHash = (href: string): string => {
    if (!href) return '';
    if (href.startsWith('#')) return href.slice(1).split('?')[0];
    const m = href.match(/#(txa-sec-\d+)/i);
    if (m) return m[1];
    if (/^txa-sec-\d+$/i.test(href)) return href;
    return '';
  };

  const isTocLinkEl = (link: Element): boolean => {
    if (link.getAttribute('data-txa-toc') === '1') return true;
    if (link.classList.contains('txa-toc-link')) return true;
    return !!link.closest('nav.txa-toc');
  };

  const scrollToTocHash = (hash: string, behavior: ScrollBehavior = 'smooth'): boolean => {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    if (!/^txa-sec-\d+$/i.test(id)) return false;
    const target = document.getElementById(id);
    if (!target) return false;
    target.scrollIntoView({ behavior, block: 'start' });
    history.replaceState(null, '', `#${id}`);
    return true;
  };

  const ensureHeadingAnchors = (root: HTMLElement): void => {
    const navToc = root.querySelector('nav.txa-toc');
    if (!navToc) return;
    const anchors: string[] = [];
    navToc.querySelectorAll('a').forEach((a) => {
      const h = extractTocHash(a.getAttribute('href') || '');
      if (h) anchors.push(h);
    });
    if (!anchors.length) return;
    const headings = Array.from(root.querySelectorAll('h2, h3')).filter(
      (h) => !h.closest('nav.txa-toc')
    );
    anchors.forEach((id, idx) => {
      const existing = root.querySelector(`#${CSS.escape(id)}`);
      if (existing) return;
      const heading = headings[idx];
      if (heading && !heading.id) heading.id = id;
    });
  };

  // Scroll al caricamento se URL contiene #txa-sec-XX (link copiato)
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!/^txa-sec-\d+$/i.test(hash)) return;
    const tryScroll = (attempt = 0) => {
      if (contentRef.current) ensureHeadingAnchors(contentRef.current);
      if (scrollToTocHash(hash, attempt === 0 ? 'auto' : 'smooth')) return;
      if (attempt < 12) window.setTimeout(() => tryScroll(attempt + 1), 250);
    };
    const t = window.setTimeout(() => tryScroll(0), 100);
    return () => window.clearTimeout(t);
  }, [article.id, fullContent, proseBody]);

  // --- HYDRATION & LINK FIXER LOGIC ---
  useEffect(() => {
    if (!contentRef.current || !fullContent) return;
    const container = contentRef.current;
    try {

    // Ripara indice: solo titolo + ul dentro nav; sposta il resto fuori
    const navToc = container.querySelector('nav.txa-toc');
    if (navToc) {
      Array.from(navToc.children).forEach((child) => {
        const el = child as HTMLElement;
        const isTitle = el.classList.contains('txa-toc-title');
        const isList = el.tagName === 'UL';
        if (!isTitle && !isList) navToc.after(el);
      });
      const toMove: Element[] = [];
      navToc.querySelectorAll('img').forEach(img => {
        const block = (img.closest('a') || img.closest('.separator') || img.closest('.txa-img') || img) as Element;
        if (navToc.contains(block)) toMove.push(block);
      });
      toMove.forEach(node => navToc.after(node));
    }

    ensureHeadingAnchors(container);

    const handleTocNavClick = (e: Event) => {
      const a = (e.target as Element).closest('a');
      if (!a || !container.contains(a) || !isTocLinkEl(a)) return;
      const hash = extractTocHash(a.getAttribute('href') || '');
      if (!hash) return;
      e.preventDefault();
      e.stopPropagation();
      scrollToTocHash(hash);
    };

    container.addEventListener('click', handleTocNavClick, true);

    const links = container.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const hash = extractTocHash(href);
      if (isTocLinkEl(link) && hash) {
        link.setAttribute('href', `#${hash}`);
        link.removeAttribute('target');
        link.removeAttribute('rel');
        link.removeAttribute('onclick');
        return;
      }
      if (href.startsWith('#') && hash) {
        link.removeAttribute('target');
        link.removeAttribute('rel');
        return;
      }
      if (!href.startsWith('#') && href && !href.startsWith('javascript:')) {
        if (/amazon\.(it|com|de|fr|es|co\.uk)|amzn\.(to|eu|as)/i.test(href)) {
          try {
            const url = new URL(href, 'https://www.amazon.it');
            url.searchParams.delete('tag');
            url.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
            link.setAttribute('href', url.toString());
          } catch { /* keep original */ }
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'nofollow sponsored noopener');
          return;
        }
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    const trimCropWrapHeight = (img: HTMLImageElement) => {
      const wrap = img.closest('.txa-crop-wrap') as HTMLElement | null;
      if (!wrap || img.closest('.txa-featured-dual')) return;
      const h = img.getBoundingClientRect().height;
      if (h > 0) wrap.style.height = `${h * 0.85}px`;
    };

    const applyWatermarkCrop = (img: HTMLImageElement) => {
      if (img.closest('nav.txa-toc') || img.closest('.leggi-anche') || img.closest('.amz-safe-card') || img.closest('.txa-featured-dual')) return;
      img.classList.add('txa-crop-watermark');
      const parent = img.parentElement;
      if (!parent || parent.classList.contains('txa-crop-wrap')) return;
      if (parent.tagName === 'P' || parent.tagName === 'FIGURE') {
        parent.classList.add('txa-crop-wrap');
      } else {
        const wrap = document.createElement('div');
        wrap.className = 'txa-crop-wrap';
        parent.insertBefore(wrap, img);
        wrap.appendChild(img);
      }
      const sync = () => trimCropWrapHeight(img);
      if (img.complete) sync();
      else img.addEventListener('load', sync, { once: true });
    };

    container.querySelectorAll('img').forEach((node) => applyWatermarkCrop(node as HTMLImageElement));

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

    // 3. Inject Portal Nodes — mai dentro nav.txa-toc
    const paragraphs = Array.from(container.querySelectorAll('p')).filter(
      (p) => !p.closest('nav.txa-toc')
    );
    let dealsNode = null;
    let readAlso1Node = null;
    let readAlso2Node = null;

    if (paragraphs.length >= 2) {
      dealsNode = document.createElement('div');
      dealsNode.className = 'injected-deals my-8 not-prose';
      (paragraphs[1] as HTMLElement).after(dealsNode);

      readAlso1Node = document.createElement('div');
      readAlso1Node.className = 'injected-read-also my-8 not-prose';
      (paragraphs[1] as HTMLElement).after(readAlso1Node);
    }

    if (paragraphs.length >= 6) {
      readAlso2Node = document.createElement('div');
      readAlso2Node.className = 'injected-read-also my-8 not-prose';
      (paragraphs[5] as HTMLElement).after(readAlso2Node);
    }

    // Custom Placeholders
    const summaryNodes = Array.from(container.querySelectorAll('.interactive-summary-placeholder'));
    const gpsPromoNodes = Array.from(container.querySelectorAll('.gps-promo-placeholder'));

    setPortalNodes({ 
      deals: dealsNode, 
      readAlso1: readAlso1Node, 
      readAlso2: readAlso2Node,
      summaries: summaryNodes,
      gpsPromos: gpsPromoNodes
    });

    // 4. Disqus Injection
    // ... (keep disqus logic)
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
      container.removeEventListener('click', handleTocNavClick, true);
      expandableRows.forEach(row => row.removeEventListener('click', handleRowClick as EventListener));
      if (dealsNode) dealsNode.remove();
      if (readAlso1Node) readAlso1Node.remove();
      if (readAlso2Node) readAlso2Node.remove();
    };
  } catch (e) {
      console.warn('Article content hydration non-fatal error (safe fallback active)', e);
    }
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

    // Track share event
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: 'article',
        item_id: article.id
      });
    }
  };
  
  const handleDealClick = (deal: Deal, location: string) => {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'select_promotion', {
        creative_name: deal.product,
        creative_slot: location,
        location_id: article.id,
        promotion_id: deal.id,
        promotion_name: 'daily_deals'
      });
    }
  };

  // --- SUB-COMPONENTS FOR DEALS ---
  const MobileDealsCarousel = () => (
    <div className="lg:hidden not-prose my-8 py-6 bg-[#1a1a1a] border-y-4 border-[#e31b23] -mx-4 px-4 [&_h3]:!text-white">
      <div className="flex items-center justify-between mb-4">
          <h3 className="font-condensed text-xl font-black uppercase !text-white flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-[#e31b23] animate-pulse"></span>
             Offerte Live
          </h3>
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Scorri →</span>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
           {[...deals, ...deals].slice(0, 10).map((deal, idx) => (
            <a 
              key={`${deal.id}-${idx}`} 
              href={deal.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={() => handleDealClick(deal, 'mobile_carousel')}
              className="min-w-[42%] max-w-[42%] bg-white border border-gray-200 rounded-xl p-3 snap-start shadow-md flex flex-col justify-between hover:border-[#e31b23] transition-colors"
            >
              <div className="w-full aspect-square bg-gray-50 rounded-lg mb-2 p-2 flex items-center justify-center">
                 <img src={deal.imageUrl} className="w-full h-full object-contain" loading="lazy" alt={deal.product} />
              </div>
              <div className="flex-1 flex flex-col justify-between min-h-[80px]">
                 <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-3 mb-2">{deal.product}</p>
                 <span className="block text-base font-black text-[#e31b23]">{deal.newPrice}</span>
              </div>
           </a>
         ))}
      </div>
    </div>
  );

  const DesktopDealsBanner = () => (
    <div className="hidden lg:block not-prose my-10 rounded-2xl p-6 shadow-xl relative overflow-visible border border-[#e31b23]/30 bg-[#1a1a1a] [&_h3]:!text-white [&_p]:!text-gray-200">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#e31b23]/25 via-transparent to-[#e31b23]/10 pointer-events-none" />
        <div className="flex items-center justify-between mb-6 relative z-10 gap-4">
           <div>
              <h3 className="font-condensed text-3xl font-black uppercase italic leading-none !text-white drop-shadow-md">Offerte del Giorno</h3>
              <p className="text-sm !text-gray-200 mt-2 font-medium">Selezionate in tempo reale dal nostro canale Telegram.</p>
           </div>
           <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="shrink-0 bg-[#e31b23] text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#e31b23] transition-colors shadow-lg">
              Vedi tutte su Telegram
           </a>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 relative z-10 items-stretch">
           {deals.slice(0, 4).map(deal => (
              <a key={deal.id} href={deal.link} target="_blank" rel="noopener noreferrer" onClick={() => handleDealClick(deal, 'desktop_banner')} className="bg-white rounded-xl p-4 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all group min-h-[190px] border border-gray-100">
                 <div className="w-full h-20 bg-gray-50 rounded-lg p-2 flex items-center justify-center">
                    <img src={deal.imageUrl} className="max-w-full max-h-full object-contain" alt={deal.product} />
                 </div>
                 <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-3 mb-2 group-hover:text-[#e31b23]">{deal.product}</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl font-black text-[#e31b23]">{deal.newPrice}</span>
                      {deal.oldPrice && <span className="text-sm font-bold text-gray-400 line-through">{deal.oldPrice}</span>}
                    </div>
                 </div>
              </a>
           ))}
        </div>
    </div>
  );

  const ReadAlsoBlock = ({ article: art }: { article: Article }) => (
    <div
      onClick={() => handleSuggestedClick(art)}
      className="not-prose my-6 p-4 bg-gray-50 border-l-4 border-black rounded-r-lg cursor-pointer hover:bg-gray-100 transition-colors group"
    >
      <h4 className="text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Leggi Anche</h4>
      <div className="flex gap-3 items-center">
        <div className="w-16 h-12 bg-gray-200 shrink-0 overflow-hidden rounded">
          <img src={art.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <h5 className="text-sm font-bold leading-tight group-hover:text-[#e31b23] transition-colors">
          {art.title}
        </h5>
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
    "description": article.excerpt || article.title,
    "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": article.url || `${window.location.origin}/article/${article.id}`
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
  const mostReadArticles = [...offerNews, ...moreArticles]
    .filter((a) => a.id !== article.id)
    .slice(0, 8);

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500 pb-12">
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

                {/* Title — compatto, stile tuttoandroid.net */}
                <h1 className="font-condensed text-2xl md:text-[1.75rem] lg:text-3xl font-black text-gray-900 mb-4 leading-snug tracking-tight text-left break-words">
                  {article.title}
                </h1>

                {/* Author & Share */}
                <div className="flex items-center justify-between border-t border-b border-gray-100 py-3 mb-5 relative">
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

                {/* LEAD — barra rossa verticale (primo blocco editoriale) */}
                {displayLead && (
                  <div
                    id="txa-lead-single"
                    className="mb-6 block rounded-sm bg-white text-[1.05em] md:text-[1.12em] font-semibold leading-[1.55] text-gray-900 not-italic"
                    style={{ borderLeft: '5px solid #e53935', padding: '16px 20px' }}
                  >
                    {displayLeadHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: displayLeadHtml }} />
                    ) : (
                      displayLead
                    )}
                  </div>
                )}

                {/* SPONSOR — sopra le immagini prodotto */}
                <div className="not-prose mb-5">
                  <AdUnit
                    slotId="5244362740"
                    format="rectangle"
                    className="w-full"
                    label="SPONSOR"
                  />
                </div>

                {/* Due immagini affiancate (hero + prima img corpo) */}
                {featuredImages.length > 0 && (
                  <div
                    className={`txa-featured-dual not-prose mb-6 ${
                      featuredImages.length === 1 ? 'single' : ''
                    }`}
                  >
                    {featuredImages.map((src, idx) => (
                      <div key={`${src}-${idx}`} className="txa-featured-dual-cell">
                        <img className="txa-crop-watermark" src={src} alt={article.title} loading={idx === 0 ? 'eager' : 'lazy'} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Content Body */}
                <div ref={contentRef} className="prose prose-lg md:prose-xl max-w-none text-gray-800 leading-relaxed text-justify hyphens-auto marker:text-gray-800 prose-a:text-[#e31b23] prose-a:font-bold prose-a:underline">
                    
                    {/* Full Content */}
                    <div dangerouslySetInnerHTML={{ __html: proseBody }} />

                    {/* --- INJECTED PORTALS --- */}
                    {portalNodes.summaries.map((node, idx) => {
                      const title = node.getAttribute('data-title') || '';
                      const rawPoints = node.getAttribute('data-points') || '';
                      let points: string[] = [];
                      
                      if (rawPoints.startsWith('[') && rawPoints.endsWith(']')) {
                        try {
                          points = JSON.parse(rawPoints);
                        } catch (e) {
                          points = rawPoints.split(/[|;,]/).map(s => s.trim()).filter(Boolean);
                        }
                      } else {
                        points = rawPoints.split(/[|;,]/).map(s => s.trim()).filter(Boolean);
                      }

                      if (points.length === 0 && rawPoints) points = [rawPoints];

                      return createPortal(<SummaryCard key={idx} title={title} points={points} />, node);
                    })}

                    {portalNodes.gpsPromos.map((node, idx) => (
                      createPortal(<GPSPromo key={idx} />, node)
                    ))}

                    {portalNodes.deals && isDealCategory && deals.length > 0 && createPortal(
                        <>
                           <MobileDealsCarousel />
                           <DesktopDealsBanner />
                        </>,
                        portalNodes.deals
                    )}

                    {portalNodes.readAlso1 && !isTruncated && moreArticles.length > 0 && createPortal(
                        <ReadAlsoBlock article={moreArticles[0]} />,
                        portalNodes.readAlso1
                    )}

                    {portalNodes.readAlso2 && !isTruncated && moreArticles.length > 1 && createPortal(
                        <ReadAlsoBlock article={moreArticles[1]} />,
                        portalNodes.readAlso2
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
                <AdUnit slotId="5244362740" format="auto" label="SPONSOR" />
                <a href="https://t.me/tuttoxandroid" target="_blank" rel="noopener noreferrer" className="block bg-[#24A1DE] rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-200">
                   {/* Soft glow orb */}
                   <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-[1.2] transition-transform duration-500"></div>
                   
                   {/* Icon */}
                   <div className="relative z-10 w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl ring-1 ring-white/50 group-hover:scale-105 group-hover:-rotate-3 transition-all duration-200">
                      <svg className="w-8 h-8 text-[#24A1DE]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg>
                   </div>
                   
                   <div className="relative z-10">
                     <h3 className="font-condensed text-2xl font-black uppercase italic leading-none tracking-[-0.5px] mb-1.5 text-white">Canale Offerte</h3>
                     <p className="text-[11px] font-medium text-white/90 mb-5 max-w-[18ch] mx-auto">Errori di prezzo e sconti esclusivi in tempo reale.</p>
                     
                     <span className="inline-flex items-center justify-center gap-2 bg-white text-[#24A1DE] px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg group-hover:bg-white group-hover:scale-[1.02] active:scale-[0.985] transition-all">
                       UNISCITI ORA 
                       <span className="text-base leading-none transition-transform group-hover:translate-x-0.5">→</span>
                     </span>
                   </div>
                </a>
                <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                  <h3 className="font-condensed text-2xl font-black uppercase italic mb-4 text-gray-900 border-b-2 border-[#e31b23] pb-1 w-fit">
                    I Più Letti
                  </h3>
                  <div className="flex flex-col gap-4">
                    {mostReadArticles.map((art, index) => (
                      <div
                        key={art.id}
                        onClick={() => handleSuggestedClick(art)}
                        className="flex items-start gap-4 cursor-pointer group"
                      >
                        <span className="text-3xl font-black text-gray-200 leading-none group-hover:text-[#e31b23] transition-colors font-condensed italic select-none mt-1">
                          {index + 1}
                        </span>
                        <div className="border-b border-gray-50 pb-3 w-full">
                          <span className="text-[9px] font-black uppercase text-[#e31b23] mb-1 block">
                            {art.category}
                          </span>
                          <h4 className="text-[15px] font-bold leading-tight text-gray-900 group-hover:text-[#e31b23] transition-colors line-clamp-2">
                            {art.title}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <SocialSidebar articles={moreArticles || []} onArticleClick={onArticleClick} />
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
