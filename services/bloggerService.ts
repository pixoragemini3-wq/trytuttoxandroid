
import { Article, Category, Deal, DealData } from '../types';
import { AUTHOR_AVATARS, DEFAULT_AUTHOR_AVATAR, MOCK_ARTICLES } from '../constants';

const BADGE_COLORS: Record<string, string> = {
  News: '#e31b23',
  Smartphone: '#2563eb',
  Guide: '#14b8a6',
  Recensioni: '#7c3aed',
  Offerte: '#f59e0b',
  'App & Giochi': '#22c55e',
  Amazon: '#ff9900',
};

/** Segnali tipici di un post-offerta (prezzo, Amazon, sconto) anche se Blogger ha solo "news". */
const OFFER_TAG_RE = /offert|amazon|sconto|deal|prime|coupon|promo|volantino|saldi?/i;
const OFFER_WORD_RE =
  /\b(?:offerta|offerte|sconto|sconti|scontat[oaie]|in\s+saldo|saldi|coupon|codice\s+sconto|promo(?:zione)?|volantino|black\s*friday|prime\s*day|cyber\s*monday|minimo\s+storico|prezzo\s+minimo|a\s+soli|solo\s+oggi|imperdibil[ei]|affarone|risparmi|in\s+offerta|su\s+amazon|acquista\s+su)\b/i;
const PRICE_SIGNAL_RE =
  /(?:€\s*\d|\d+[.,]\d{2}\s*€|\d+\s*€|\b\d{2,4}\s*(?:euro|eur)\b|\ba\s+\d+[.,]?\d*\s*€|\bsotto\s+(?:i\s+)?\d+)/i;
const AMAZON_LINK_RE = /amazon\.|amzn\.|amz-safe|\/dp\/|\/gp\/product\//i;

type OfferSignalInput = {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  dealData?: DealData | null;
};

/** Score ≥ 3 → trattalo come offerta (etichetta + badge). */
export const scoreOfferSignals = (input: OfferSignalInput): number => {
  const tags = (input.tags || []).map((t) => t.toLowerCase().trim());
  const title = (input.title || '').toLowerCase();
  const excerpt = (input.excerpt || '').toLowerCase();
  // Solo prime ~2.5k del body: abbastanza per deal box/link, meno rumore da footer
  const body = `${input.content || ''}`.toLowerCase().slice(0, 2500);
  const hay = `${title} ${excerpt} ${tags.join(' ')} ${input.category || ''} ${body}`;

  let score = 0;
  if (input.dealData?.link || input.dealData?.newPrice) score += 6;
  if ((input.category || '').toLowerCase() === 'offerte') score += 5;
  if (tags.some((t) => OFFER_TAG_RE.test(t) || t === 'offerteimperdibili')) score += 5;
  if (AMAZON_LINK_RE.test(hay)) score += 3;
  if (OFFER_WORD_RE.test(title) || OFFER_WORD_RE.test(excerpt)) score += 3;
  else if (OFFER_WORD_RE.test(body)) score += 2;
  if (PRICE_SIGNAL_RE.test(title)) score += 3;
  else if (PRICE_SIGNAL_RE.test(excerpt) || PRICE_SIGNAL_RE.test(body)) score += 2;
  // Prezzo + Amazon insieme = offerta quasi certa
  if (AMAZON_LINK_RE.test(hay) && PRICE_SIGNAL_RE.test(hay)) score += 2;
  return score;
};

export const isOfferArticle = (input: OfferSignalInput): boolean => scoreOfferSignals(input) >= 3;

/**
 * Ricalibra la categoria navigazione: se è soprattutto un'offerta
 * (anche con etichetta news/brand), vince Offerte. Non sovrascrive
 * recensioni/guide esplicite.
 */
export const refineMainCategory = (
  labelCategory: Category,
  input: OfferSignalInput
): Category => {
  const tags = (input.tags || []).map((t) => t.toLowerCase().trim());
  const hasExplicitReview = tags.some((t) => t === 'recensioni' || t === 'recensione')
    || labelCategory === 'Recensioni';
  const hasExplicitGuide = tags.some((t) => t === 'guide' || t === 'guida' || t === 'tutorial')
    || labelCategory === 'Guide'
    || labelCategory === 'Tutorial';
  const hasExplicitOffer = tags.some((t) =>
    t === 'offerte' || t === 'offerteimperdibili' || t === 'amazon' || OFFER_TAG_RE.test(t)
  );

  if (hasExplicitOffer || isOfferArticle(input)) {
    // Recensione/guida con prezzo citato restano tali; dealData o tag offerte forzano Offerte
    if (hasExplicitReview && !hasExplicitOffer && !input.dealData?.link) return 'Recensioni';
    if (hasExplicitGuide && !hasExplicitOffer && !input.dealData?.link) return 'Guide';
    return 'Offerte';
  }

  // Se Blogger ha messo "news" come prima etichetta ma ci sono tag/titolo smartphone → Smartphone
  const hay = `${input.title || ''} ${input.excerpt || ''} ${tags.join(' ')}`.toLowerCase();
  const isGenericNews =
    !labelCategory ||
    labelCategory === 'News' ||
    String(labelCategory).toLowerCase() === 'news';

  if (isGenericNews) {
    if (
      tags.some((t) =>
        /^(smartphone|samsung|xiaomi|pixel|oneplus|motorola|honor|realme|sony|nothing|oppo|huawei|apple|redmi|poco)$/i.test(t)
      ) ||
      /\b(galaxy\s*[sz]?\d*|pixel\s*\d*|iphone|xiaomi|redmi|poco\s*[xf]?\d*|oneplus|smartphone|honor|realme|motorola|nothing\s*phone)\b/i.test(
        hay
      )
    ) {
      return 'Smartphone';
    }
    if (tags.some((t) => t === 'app' || t === 'giochi' || t === 'game')) return 'App & Giochi';
    if (tags.some((t) => t === 'modding' || t === 'root')) return 'Modding';
    if (tags.some((t) => t === 'wearable' || t === 'smartwatch')) return 'Wearable';
  }

  return labelCategory;
};

export const resolveArticleBadge = (
  article: Pick<Article, 'title' | 'category' | 'tags' | 'content' | 'excerpt' | 'dealData'>
): { label: string; color: string } => {
  const hayTitle = `${article.title} ${article.excerpt || ''}`.toLowerCase();
  const hay = `${hayTitle} ${(article.tags || []).join(' ')} ${article.category} ${(article.content || '').slice(0, 2500)}`.toLowerCase();
  const hasAmazon = AMAZON_LINK_RE.test(hay);
  const isOffer = article.category === 'Offerte' || isOfferArticle(article);

  // Offerte prima di brand/smartphone: un deal su Galaxy non è "Smartphone"
  if (isOffer && hasAmazon) return { label: 'Amazon', color: BADGE_COLORS.Amazon };
  if (isOffer) return { label: 'Offerte', color: BADGE_COLORS.Offerte };
  if (article.category === 'Recensioni' || /\brecensione\b|\breview\b/i.test(hayTitle)) {
    return { label: 'Recensioni', color: BADGE_COLORS.Recensioni };
  }
  if (article.category === 'Guide' || article.category === 'Tutorial' || /\bguida\b|\btutorial\b|come fare/i.test(hayTitle)) {
    return { label: 'Guide', color: BADGE_COLORS.Guide };
  }
  if (article.category === 'Smartphone' || /\bsmartphone\b|\bgalaxy\b|\bpixel\b|\biphone\b|\bxiaomi\b|\boneplus\b/i.test(hayTitle)) {
    return { label: 'Smartphone', color: BADGE_COLORS.Smartphone };
  }
  if (article.category === 'App & Giochi' || article.category === 'App' || /\bapp\b|\bgioco\b|\bgame\b|play store/i.test(hayTitle)) {
    return { label: 'App & Giochi', color: BADGE_COLORS['App & Giochi'] };
  }
  return { label: article.category || 'News', color: BADGE_COLORS[article.category] || BADGE_COLORS.News };
};

export const resolveAuthorImageUrl = (author?: string, authorImageUrl?: string): string | undefined => {
  if (authorImageUrl) return authorImageUrl;
  if (!author) return DEFAULT_AUTHOR_AVATAR;
  return AUTHOR_AVATARS[author] || DEFAULT_AUTHOR_AVATAR;
};

// Helper per pulire HTML e decodificare entità
const stripHtml = (html: string): string => {
  if (!html) return "";
  try {
    let clean = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
                    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "");
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    return doc.body.textContent || "";
  } catch (e) {
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
  }
};

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
  // Etichette tabella / titoletti brevi (es. "Fotocamera e sensori ambientali")
  if (t.length < 90 && punct === 0 && t.split(/\s+/).length < 8) return true;
  return false;
};

const stripTocAndLeadForExcerpt = (html: string): string => {
  if (!html) return '';
  let clean = html;
  clean = clean.replace(/<nav[^>]*\bclass=["'][^"']*txa-toc[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi, ' ');
  clean = clean.replace(/<div[^>]*\bid=["']txa-lead-single["'][^>]*>[\s\S]*?<\/div>/gi, ' ');
  clean = clean.replace(/<span[^>]*data-txa-excerpt=["']1["'][^>]*>[\s\S]*?<\/span>/gi, ' ');
  clean = clean.replace(/<p[^>]*>\s*(?:<strong>\s*)?Indice\s*:?[\s\S]*?<\/p>/gi, ' ');
  return clean;
};

const extractTxaLeadExcerpt = (html: string): string => {
  if (!html) return '';
  const hidden = html.match(/<span[^>]*data-txa-excerpt=["']1["'][^>]*>([\s\S]*?)<\/span>/i);
  if (hidden?.[1]) return stripHtml(hidden[1]).trim();
  const lead = html.match(/<div[^>]*\bid=["']txa-lead-single["'][^>]*>([\s\S]*?)<\/div>/i);
  if (lead?.[1]) return stripHtml(lead[1]).trim();
  return '';
};

const extractInSintesiExcerpt = (html: string): string => {
  if (!html) return '';
  const box = html.match(/<div[^>]*\bclass=["'][^"']*txa-highlight[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (!box?.[1]) return '';
  let text = box[1].replace(/<strong>\s*In sintesi\s*:?\s*<\/strong>\s*/i, '');
  text = stripHtml(text).trim();
  return text.length >= 20 ? text : '';
};

const pickBestSentence = (html: string, contentForExcerpt: string): string => {
  const text = stripHtml(contentForExcerpt);
  if (!text) return '';

  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences = text.match(sentenceRegex) || [text];

  let bestSentence = sentences[0] || '';
  let bestScore = -Infinity;

  const titleWords = (html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || '')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  sentences.forEach((sentence, index) => {
    const s = sentence.trim();
    if (s.length < 30) return;

    let score = 0;

    if (s.length > 60 && s.length < 200) score += 25;
    else if (s.length > 40) score += 10;

    if (index === 0) score -= 5;
    else if (index < 4) score += 15;

    if (/\b(ora|nuovo|novità|beta|funzionalità|cambiamento|anteprima|risultato)\b/i.test(s)) {
      score += 12;
    }

    if (/\d/.test(s)) score += 8;

    titleWords.forEach((w) => {
      if (s.toLowerCase().includes(w)) score += 6;
    });

    if (/^(la |il |una |un |questo|questa|in |per )/i.test(s) && index === 0) score -= 8;

    if (score > bestScore) {
      bestScore = score;
      bestSentence = s;
    }
  });

  return bestSentence.trim();
};

const truncateExcerpt = (text: string, maxLen: number): string => {
  const t = text.trim();
  if (!t || t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen - 3);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}...`;
};

const QUOTE_MAX_CHARS = 280;
const QUOTE_MAX_WORDS = 52;

/** Riassunto breve per il box quote in pagina articolo (3-4 righe max). */
export const truncateLeadForQuote = (text: string): string => {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.length <= QUOTE_MAX_CHARS && t.split(/\s+/).length <= QUOTE_MAX_WORDS) return t;

  const sentences = t.match(/[^.!?]+[.!?]+/g) || [t];
  let acc = '';
  for (const sentence of sentences) {
    const next = `${acc}${sentence}`.trim();
    if (next.length > QUOTE_MAX_CHARS || next.split(/\s+/).length > QUOTE_MAX_WORDS) break;
    acc = next;
  }
  if (acc.length >= 50) return acc.trim();
  return truncateExcerpt(t, QUOTE_MAX_CHARS);
};

/** Lead per il box quote: solo riassunto, mai l'intero primo paragrafo. */
export const getQuoteLeadText = (html: string, fallbackExcerpt?: string): string => {
  if (!html) return fallbackExcerpt ? truncateLeadForQuote(fallbackExcerpt) : '';

  const leadExcerpt = extractTxaLeadExcerpt(html);
  if (leadExcerpt && leadExcerpt.length >= 20 && !isGarbledLead(leadExcerpt)) {
    return truncateLeadForQuote(leadExcerpt);
  }

  const sintesiExcerpt = extractInSintesiExcerpt(html);
  if (sintesiExcerpt && !isGarbledLead(sintesiExcerpt)) {
    return truncateLeadForQuote(sintesiExcerpt);
  }

  if (fallbackExcerpt?.trim() && !isGarbledLead(fallbackExcerpt)) {
    return truncateLeadForQuote(fallbackExcerpt);
  }

  const contentForExcerpt = stripTocAndLeadForExcerpt(html).replace(/<table[\s\S]*?<\/table>/gi, ' ');

  const bestSentence = pickBestSentence(html, contentForExcerpt);
  if (bestSentence && !isGarbledLead(bestSentence)) {
    return truncateLeadForQuote(bestSentence);
  }

  const plain = stripHtml(contentForExcerpt).trim();
  const sentences = (plain.match(/[^.!?]+[.!?]+/g) || []).map((s) => s.trim()).filter(Boolean);
  for (let i = 1; i < Math.min(sentences.length, 10); i++) {
    const s = sentences[i];
    if (s.length >= 35 && !isGarbledLead(s)) return truncateLeadForQuote(s);
  }
  if (sentences[0] && !isGarbledLead(sentences[0])) {
    return truncateLeadForQuote(sentences[0]);
  }
  return truncateLeadForQuote(plain);
};

/** Lead completa per la pagina articolo — mai troncata con "..." */
export const getFullLeadText = (html: string): string => {
  if (!html) return '';

  const leadExcerpt = extractTxaLeadExcerpt(html);
  if (leadExcerpt && leadExcerpt.length >= 20 && !isGarbledLead(leadExcerpt)) {
    return leadExcerpt;
  }

  const sintesiExcerpt = extractInSintesiExcerpt(html);
  if (sintesiExcerpt && !isGarbledLead(sintesiExcerpt)) {
    return sintesiExcerpt;
  }

  const contentForExcerpt = stripTocAndLeadForExcerpt(html);
  const withoutTables = contentForExcerpt.replace(/<table[\s\S]*?<\/table>/gi, ' ');

  const bestSentence = pickBestSentence(html, withoutTables);
  if (bestSentence && !isGarbledLead(bestSentence)) return bestSentence;

  const firstParagraph = withoutTables.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (firstParagraph?.[1]) {
    const plain = stripHtml(firstParagraph[1]).trim();
    if (plain.length >= 40 && !isGarbledLead(plain)) return plain;
  }

  const boldRegex = /<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi;
  let longestBold = '';
  let match;
  while ((match = boldRegex.exec(withoutTables)) !== null) {
    const plain = stripHtml(match[2]).trim();
    if (/^indice$/i.test(plain) || isGarbledLead(plain) || plain.length < 20) continue;
    if (!/[.!?]/.test(plain) && plain.split(/\s+/).length < 8) continue;
    if (plain.length > longestBold.length) {
      longestBold = plain;
    }
  }
  if (longestBold) return longestBold;

  const text = stripHtml(contentForExcerpt).trim();
  return text;
};

// Smart excerpt: anteprima breve per card/liste (può essere troncata)
const getSmartExcerpt = (html: string, maxLen: number = 220): string => {
  const quote = getQuoteLeadText(html);
  if (quote) return truncateExcerpt(quote, maxLen);
  return '';
};

// Helper per estrarre dati DEAL
const extractDealWidgetData = (content: string, defaultLink: string, defaultTitle: string, defaultImage: string, id: string): Deal | null => {
  const regex = /\[DEAL\s+old="([^"]+)"\s+new="([^"]+)"(?:\s+link="([^"]+)")?\]/i;
  const match = content.match(regex);

  if (match) {
    return {
      id: `generated-deal-${id}`,
      product: defaultTitle,
      oldPrice: match[1],
      newPrice: match[2],
      saveAmount: 'OFFERTA',
      link: match[3] || defaultLink,
      imageUrl: defaultImage,
      brandColor: 'bg-[#e31b23]'
    };
  }
  return null;
};

const extractAmazonLinkFromContent = (content: string): string | null => {
  const patterns = [
    /class=["'][^"']*amz-safe[^"']*["'][^>]*>[\s\S]*?href=["']([^"']+)["']/i,
    /href=["'](https?:\/\/[^"']*(?:amazon\.|amzn\.|amzn\.to|amzn\.eu)[^"']*)["']/i,
    /href=["'](https?:\/\/[^"']*\/gp\/product\/[^"']+)["']/i,
    /data-href=["'](https?:\/\/[^"']*(?:amazon\.|amzn\.)[^"']*)["']/i,
  ];
  for (const re of patterns) {
    const m = content.match(re);
    if (m?.[1] && /amazon\.|amzn\.|\/gp\/product\//i.test(m[1])) return m[1];
  }
  return null;
};

const extractAmazonOfferFromPost = (
  content: string,
  defaultLink: string,
  defaultTitle: string,
  defaultImage: string,
  id: string
): Deal | null => {
  const rawLink = extractAmazonLinkFromContent(content);
  if (!rawLink) return null;

  let link = rawLink;
  try {
    const url = new URL(link, 'https://www.amazon.it');
    url.searchParams.delete('tag');
    url.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
    link = url.toString();
  } catch { /* keep original */ }

  const priceMatch = content.match(/(\d+[.,]\d{2})\s*€|€\s*(\d+[.,]\d{2})/i);
  const price = priceMatch ? `${(priceMatch[1] || priceMatch[2]).replace('.', ',')}€` : 'Offerta';

  return {
    id: `amazon-offer-${id}`,
    product: formatDealProductTitle(defaultTitle),
    oldPrice: '',
    newPrice: price,
    saveAmount: 'AMAZON',
    link,
    imageUrl: defaultImage,
    brandColor: 'bg-[#ff9900]',
  };
};

const _TXA_STYLE_KEEP_RE = /txa-lead|txa-highlight|txa-toc|txa-details|txa-source|amz-safe|txa-lead-single|data-txa/i;

const stripNonTxaInlineStyles = (html: string): string => {
  return html.replace(/<([a-z][a-z0-9]*)([^>]*)>/gi, (full, _tag, attrs) => {
    if (_TXA_STYLE_KEEP_RE.test(attrs)) return full;
    const cleaned = attrs.replace(/\sstyle="[^"]*"/gi, '');
    return `<${_tag}${cleaned}>`;
  });
};

const stripJsonArtifactsFromHtml = (html: string): string => {
  let clean = html;
  clean = clean.replace(
    /(?:\s*"[\s\n]*")+\s*\}\s*(?=<(?:p|div)[^>]*\bclass=["'][^"']*txa-source)/gi,
    ''
  );
  clean = clean.replace(/<\/div>\s*"\s*(?:\n\s*")?\s*\}\s*/gi, '</div>');
  clean = clean.replace(/(?:^|>)\s*"\s*"\s*\}\s*(?=<|$)/g, '>');
  return clean;
};

export const AMAZON_AFFILIATE_TAG = 'instagramofferteitaly-21';

export const rewriteAmazonAffiliateLinks = (html: string): string => {
  if (!html) return html;
  return html.replace(/href=(["'])([^"']+)\1/gi, (match, quote, href) => {
    if (!/amazon\.(it|com|de|fr|es|co\.uk)|amzn\.(to|eu|as)/i.test(href)) return match;
    try {
      const url = new URL(href, 'https://www.amazon.it');
      url.searchParams.delete('tag');
      url.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      return `href=${quote}${url.toString()}${quote}`;
    } catch {
      return match;
    }
  });
};

const cleanBloggerHtml = (html: string): string => {
  if (!html) return "";
  let clean = stripJsonArtifactsFromHtml(html);

  // 1. Rimuovi style solo dagli elementi generici — preserva box txa (riga rossa, highlight, TOC)
  clean = stripNonTxaInlineStyles(clean);

  // 2. Remove common Blogger/Word junk classes
  clean = clean.replace(/\sclass="css-[^"]*"/gi, '');
  clean = clean.replace(/\sclass="Mso[^"]*"/gi, '');

  // 3. Strip alignment (left/right on images/figures often causes the left-align issue)
  clean = clean.replace(/\s+align=["']?(left|right|center)["']?/gi, '');

  // 4. Remove empty or near-empty divs/spans (the source of those light blue empty rectangles)
  // These are often Blogger "callout" or background boxes that end up with only whitespace after style stripping.
  clean = clean.replace(/<div[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s)*\s*<\/div>/gi, '');
  clean = clean.replace(/<span[^>]*>\s*(?:&nbsp;|<br\s*\/?>|\s)*\s*<\/span>/gi, '');

  // 5. Remove empty spans
  clean = clean.replace(/<span>\s*<\/span>/gi, '');

  return clean;
};

const parseArticleContent = (rawContent: string): { cleanContent: string; dealData: DealData | null } => {
  const dealRegex = /\[DEAL\s+old=["']([^"']*)["']\s+new=["']([^"']*)["']\s+link=["']([^"']*)["']\]/i;
  const summaryRegex = /\[SUMMARY\s+title=["']([^"']*)["']\s+points=["']([^"']*)["']\]/i;
  const gpsPromoRegex = /\[GPS_PROMO\]/i;

  let dealData: DealData | null = null;
  let cleanContent = rawContent;

  const dealMatch = rawContent.match(dealRegex);
  if (dealMatch) {
    dealData = { oldPrice: dealMatch[1], newPrice: dealMatch[2], link: dealMatch[3] };
    cleanContent = cleanContent.replace(dealRegex, '');
  }

  // Replace [SUMMARY] with a placeholder div
  cleanContent = cleanContent.replace(summaryRegex, (match, title, points) => {
    return `<div class="interactive-summary-placeholder" data-title="${title}" data-points="${points}"></div>`;
  });

  // Replace [GPS_PROMO] with a placeholder div
  cleanContent = cleanContent.replace(gpsPromoRegex, () => {
    return `<div class="gps-promo-placeholder"></div>`;
  });
  
  // Clean HTML from Blogger junk
  cleanContent = cleanBloggerHtml(cleanContent);
  cleanContent = rewriteAmazonAffiliateLinks(cleanContent);

  return { cleanContent, dealData };
};

// IMPROVED: Robust Image Extraction
const forceHighResImage = (url: string): string => {
  if (!url) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
  
  // Handle Blogger/Google Images
  if (url.includes('googleusercontent.com') || url.includes('bp.blogspot.com')) {
    // Replace size params like /s72-c/, /w640-h400/, /s1600/
    const newUrl = url.replace(/\/s\d+(-c)?\//, '/s1600/')
                      .replace(/\/w\d+-h\d+(-c)?\//, '/s1600/')
                      .replace(/=[sNw]\d+.*$/, '=s1600'); // Handle lh3.googleusercontent params
    return newUrl;
  }
  return url;
};

const getFirstImageFromContent = (htmlContent: string): string | null => {
    try {
        const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
        // Prioritize images inside figure or standard img tags
        const img = doc.querySelector('figure img, img');
        return img ? img.getAttribute('src') : null;
    } catch (e) {
        return null;
    }
};

// --- CORS PROXY CONFIGURATION ---
// Make this configurable so you can test locally against YOUR Blogger blog.
// Set VITE_BLOGGER_DOMAIN in .env.local (e.g. https://yourblog.blogspot.com or https://your-custom-domain.com)
// If not set, falls back to the original TuttoXAndroid domain.
//
// IMPORTANT: Always include https:// in the value!
const rawDomain = (import.meta as any).env?.VITE_BLOGGER_DOMAIN || 'https://www.tuttoxandroid.com';

// Normalize: ensure it has protocol (user often forgets https://)
let TARGET_DOMAIN = rawDomain.trim();
if (!/^https?:\/\//i.test(TARGET_DOMAIN)) {
  TARGET_DOMAIN = 'https://' + TARGET_DOMAIN.replace(/^\/+/, '');
}

// Extract hostname for direct-fetch check
const TARGET_HOSTNAME = (() => {
  try {
    return new URL(TARGET_DOMAIN).hostname;
  } catch {
    return 'www.tuttoxandroid.com';
  }
})();

// List of available proxies (used when running locally or on different domain)
// Free CORS proxies are often unreliable (rate limits, 413 for large feeds, DNS issues).
// The code tries them in order. For more reliable local testing, use a browser CORS extension.
const PROXY_LIST = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://cors.bridged.cc/${url}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://yacdn.org/proxy/${url}`
];

const getFetchUrl = (path: string) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocal) {
    // Use Vite dev proxy -> no CORS from browser
    return `/blogger${path}`;
  }

  if (window.location.hostname === TARGET_HOSTNAME) {
    return path;
  }

  return `${TARGET_DOMAIN}${path}`;
};

const fetchWithTimeout = async (url: string, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// New helper to try multiple proxies
const fetchWithProxyFallback = async (targetUrl: string, timeout = 10000): Promise<Response> => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // On localhost: targetUrl is already /blogger/... (Vite proxy handles it, same-origin for browser)
  // On real domain: direct
  if (isLocal || window.location.hostname === TARGET_HOSTNAME) {
    return fetchWithTimeout(targetUrl, timeout);
  }

  let lastError;
  
  for (const proxyFn of PROXY_LIST) {
    try {
      const proxyUrl = proxyFn(targetUrl);
      const response = await fetchWithTimeout(proxyUrl, timeout);
      if (response.ok) {
        return response;
      }
      // If 403 or 500, try next proxy
      console.warn(`Proxy failed: ${proxyUrl} - Status: ${response.status}`);
    } catch (e) {
      console.warn(`Proxy error: ${proxyFn(targetUrl)}`, e);
      lastError = e;
    }
  }
  throw lastError || new Error('All proxies failed');
};

export const fetchArticleById = async (id: string): Promise<string | null> => {
  if (id.length < 5) {
      const mock = MOCK_ARTICLES.find(a => a.id === id);
      return mock ? mock.content : null;
  }
  try {
    const targetUrl = `${TARGET_DOMAIN}/feeds/posts/default/${id}?alt=json`;
    const response = await fetchWithProxyFallback(targetUrl);
    if (!response.ok) return null;
    const data = await response.json();
    const rawContent = data.entry?.content?.$t || data.entry?.summary?.$t || "";
    const { cleanContent } = parseArticleContent(rawContent);
    return cleanContent;
  } catch (error) {
    return null;
  }
};

/** Blogger usa etichette in minuscolo (es. recensioni, non Recensione). */
const BLOGGER_FEED_LABELS: Record<string, string[]> = {
  Recensioni: ['recensioni', 'recensione'],
  'App & Giochi': ['app', 'giochi'],
  Smartphone: ['smartphone'],
  Guide: ['guide', 'guida', 'tutorial'],
  Offerte: ['offerte', 'offerteimperdibili', 'amazon', 'sconto', 'coupon', 'promo'],
  News: ['news'],
  Modding: ['modding'],
  Wearable: ['wearable'],
  Tutorial: ['tutorial', 'guide', 'guida'],
};

const SMARTPHONE_BRAND_TAGS = new Set([
  'samsung', 'xiaomi', 'pixel', 'oneplus', 'motorola', 'honor', 'realme', 'sony', 'nothing',
  'oppo', 'huawei', 'apple', 'aukey', 'blackview', 'cubot', 'ezviz', 'leagoo', 'lefant',
  'spigen', 'teclast', 'ugoos', 'ulefone',
]);

const NAV_LABEL_ALIASES: Record<string, Category> = {
  recensioni: 'Recensioni',
  recensione: 'Recensioni',
  offerte: 'Offerte',
  offerteimperdibili: 'Offerte',
  amazon: 'Offerte',
  sconto: 'Offerte',
  sconti: 'Offerte',
  coupon: 'Offerte',
  promo: 'Offerte',
  promozione: 'Offerte',
  deal: 'Offerte',
  guide: 'Guide',
  guida: 'Guide',
  // Tutorial Blogger = stessa sezione navigazione "Guide"
  tutorial: 'Guide',
  smartphone: 'Smartphone',
  app: 'App & Giochi',
  giochi: 'App & Giochi',
  news: 'News',
  modding: 'Modding',
  wearable: 'Wearable',
  ...Object.fromEntries([...SMARTPHONE_BRAND_TAGS].map((b) => [b, 'Smartphone'])),
};

const getFeedLabelsForCategory = (category: string): string[] => {
  const direct = BLOGGER_FEED_LABELS[category];
  if (direct) return direct;
  const lower = category.toLowerCase().trim();
  for (const labels of Object.values(BLOGGER_FEED_LABELS)) {
    if (labels.includes(lower)) return labels;
  }
  return [lower];
};

const normalizeMainCategory = (categories: string[]): Category => {
  const lower = categories.map((c) => c.toLowerCase().trim());
  const brandPriority = [...SMARTPHONE_BRAND_TAGS];
  // Offerte prima dei brand: un post "samsung + news" con prezzo non deve finire in Smartphone
  const priority = [
    'recensioni', 'recensione',
    'offerte', 'offerteimperdibili', 'amazon', 'sconto', 'sconti', 'coupon', 'promo', 'promozione', 'deal',
    'guide', 'guida', 'tutorial', 'smartphone', ...brandPriority,
    'app', 'giochi', 'news', 'modding', 'wearable',
  ];
  for (const key of priority) {
    const idx = lower.indexOf(key);
    if (idx !== -1) return NAV_LABEL_ALIASES[key] || (categories[idx] as Category);
  }
  const first = categories.find(
    (c) => !c.toLowerCase().endsWith('inevidenza') && c !== 'Evidenza' && c !== 'Featured'
  );
  const term = (first || 'news').toLowerCase();
  return NAV_LABEL_ALIASES[term] || ((first || 'News') as Category);
};

/**
 * Normalizza tags + category per post grezzi (bridge Blogger, native, deep link).
 * currentSinglePost spesso ha solo la prima etichetta e tags vuoti.
 */
export const hydrateArticle = <T extends Pick<Article, 'title' | 'category'> & Partial<Article>>(
  article: T
): T & { category: Category; tags: string[] } => {
  const tags = (article.tags && article.tags.length > 0
    ? article.tags
    : article.category
      ? [String(article.category)]
      : ['news']
  )
    .map((t) => String(t).trim())
    .filter(Boolean);

  const labelCategory = normalizeMainCategory(tags);
  const category = refineMainCategory(labelCategory, {
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    tags,
    category: article.category,
    dealData: article.dealData,
  });

  return { ...article, tags, category };
};

const articleMatchesNavCategory = (article: Article, category: Category): boolean => {
  if (!category || category === 'Tutti') return true;
  const target = category.toLowerCase().trim();
  const articleCategory = (article.category || '').toLowerCase().trim();
  const articleTags = (article.tags || []).map((t) => t.toLowerCase().trim());
  if (articleCategory === target) return true;
  if (articleTags.includes(target)) return true;
  // Guide e Tutorial sono la stessa sezione nel sito
  if (target === 'guide' && (articleCategory === 'tutorial' || articleTags.includes('tutorial'))) return true;
  if (target === 'tutorial' && (articleCategory === 'guide' || articleTags.includes('guide') || articleTags.includes('guida'))) return true;
  // Offerte: include post classificati via contenuto (prezzo/Amazon) anche senza etichetta Blogger
  if (target === 'offerte' && isOfferArticle(article)) return true;
  const feedLabels = getFeedLabelsForCategory(category).map((l) => l.toLowerCase());
  if (feedLabels.some((l) => articleTags.includes(l) || articleCategory === l)) return true;
  return false;
};

const mapFeedEntryToArticle = (entry: any): Article => {
  const id = entry.id.$t.split('post-')[1];
  const rawTitle = entry.title.$t;
  const rawContent = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
  const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';

  const categories = entry.category ? entry.category.map((c: any) => c.term.trim()) : [];
  const isFeatured = categories.some((c: string) => c === 'Evidenza' || c === 'Featured');
  const labelCategory = normalizeMainCategory(categories);

  let imageUrl = '';
  if (entry.media$thumbnail && entry.media$thumbnail.url) {
    imageUrl = entry.media$thumbnail.url;
  } else {
    const extracted = getFirstImageFromContent(rawContent);
    if (extracted) imageUrl = extracted;
  }
  if (!imageUrl) {
    imageUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
  }

  imageUrl = forceHighResImage(imageUrl);
  const authorImage = entry.author?.[0]?.gd$image?.src;
  const { cleanContent, dealData } = parseArticleContent(rawContent);
  const cleanExcerpt = getSmartExcerpt(cleanContent);
  const cleanTitle = stripHtml(rawTitle);
  const mainCategory = refineMainCategory(labelCategory, {
    title: cleanTitle,
    excerpt: cleanExcerpt,
    content: cleanContent,
    tags: categories,
    dealData,
  });

  return {
    id,
    title: cleanTitle,
    excerpt: cleanExcerpt,
    content: cleanContent,
    category: mainCategory,
    tags: categories,
    imageUrl,
    author: entry.author[0].name.$t,
    authorImageUrl: resolveAuthorImageUrl(entry.author[0].name.$t, authorImage),
    date: new Date(entry.published.$t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }),
    publishedAt: entry.published?.$t || undefined,
    url: postUrl,
    type: 'standard',
    featured: isFeatured,
    dealData: dealData,
  };
};

const IT_MONTH_INDEX: Record<string, number> = {
  gen: 0, gennaio: 0, jan: 0, january: 0,
  feb: 1, febbraio: 1, february: 1,
  mar: 2, marzo: 2, march: 2,
  apr: 3, aprile: 3, april: 3,
  mag: 4, maggio: 4, may: 4,
  giu: 5, giugno: 5, jun: 5, june: 5,
  lug: 6, luglio: 6, jul: 6, july: 6,
  ago: 7, agosto: 7, aug: 7, august: 7,
  set: 8, sett: 8, settembre: 8, sep: 8, september: 8,
  ott: 9, ottobre: 9, oct: 9, october: 9,
  nov: 10, novembre: 10, november: 10,
  dic: 11, dicembre: 11, dec: 11, december: 11,
};

/** Parse article date for archive grouping (publishedAt preferred). */
export const parseArticleDate = (article: Article): Date | null => {
  if (article.publishedAt) {
    const iso = new Date(article.publishedAt);
    if (!Number.isNaN(iso.getTime())) return iso;
  }
  const raw = (article.date || '').trim();
  if (!raw) return null;
  if (/^\d{10,13}$/.test(raw)) {
    const n = Number(raw);
    const d = new Date(n < 1e12 ? n * 1000 : n);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed);
  const m = raw.match(/(\d{1,2})\s+([a-zA-Zàèéìòù.]+)\s+(\d{4})/i);
  if (m) {
    const day = parseInt(m[1], 10);
    const monKey = m[2].replace(/\./g, '').toLowerCase();
    const year = parseInt(m[3], 10);
    const mon = IT_MONTH_INDEX[monKey];
    if (mon != null) {
      const d = new Date(year, mon, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const publishedRangeBounds = (year: number, month?: number): { min: string; max: string } => {
  if (month != null && month >= 1 && month <= 12) {
    const lastDay = new Date(year, month, 0).getDate();
    return {
      min: `${year}-${pad2(month)}-01T00:00:00`,
      max: `${year}-${pad2(month)}-${pad2(lastDay)}T23:59:59`,
    };
  }
  return {
    min: `${year}-01-01T00:00:00`,
    max: `${year}-12-31T23:59:59`,
  };
};

/** Totale post reali Blogger (openSearch$totalResults) — stesso dato del widget Archivio. */
const extractFeedTotalResults = (data: any): number => {
  const feed = data?.feed;
  if (!feed) return 0;
  const raw =
    feed['openSearch$totalResults']?.$t ??
    feed['openSearch$totalResults'] ??
    feed.openSearch$totalResults?.$t ??
    feed.openSearch$totalResults ??
    0;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Conteggio ufficiale Blogger per anno o mese (1–12).
 * Usa il feed summary leggero e openSearch$totalResults (non il campione locale).
 */
export const fetchBloggerPostCount = async (
  year: number,
  month?: number
): Promise<number> => {
  try {
    const { min, max } = publishedRangeBounds(year, month);
    const feedPath =
      `/feeds/posts/summary?alt=json&max-results=1` +
      `&published-min=${encodeURIComponent(min)}&published-max=${encodeURIComponent(max)}`;
    const response = await fetchWithProxyFallback(`${TARGET_DOMAIN}${feedPath}`, 10000);
    if (!response.ok) return 0;
    const data = await response.json();
    return extractFeedTotalResults(data);
  } catch {
    return 0;
  }
};

/** Conteggi anno da Blogger (batch parallelo limitato). */
export const fetchArchiveYearCounts = async (
  years: number[]
): Promise<Record<number, number>> => {
  const out: Record<number, number> = {};
  const batchSize = 4;
  for (let i = 0; i < years.length; i += batchSize) {
    const batch = years.slice(i, i + batchSize);
    const counts = await Promise.all(batch.map((y) => fetchBloggerPostCount(y)));
    batch.forEach((y, idx) => {
      out[y] = counts[idx];
    });
  }
  return out;
};

/** Conteggi per i 12 mesi di un anno (solo mesi con post > 0). */
export const fetchArchiveMonthCounts = async (
  year: number
): Promise<Record<number, number>> => {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const counts = await Promise.all(months.map((m) => fetchBloggerPostCount(year, m)));
  const out: Record<number, number> = {};
  months.forEach((m, idx) => {
    if (counts[idx] > 0) out[m] = counts[idx];
  });
  return out;
};

/** Fetch posts in a year or year+month (1–12) via Blogger published-min/max. */
export const fetchPostsByDateRange = async (
  year: number,
  month?: number
): Promise<Article[]> => {
  try {
    const { min, max } = publishedRangeBounds(year, month);
    // Paginazione: Blogger limita max-results; recuperiamo tutti i pezzi del range
    const all: Article[] = [];
    const seen = new Set<string>();
    let startIndex = 1;
    const pageSize = 150;
    for (let page = 0; page < 20; page++) {
      const feedPath =
        `/feeds/posts/default?alt=json&max-results=${pageSize}&start-index=${startIndex}&orderby=published` +
        `&published-min=${encodeURIComponent(min)}&published-max=${encodeURIComponent(max)}`;
      const response = await fetchWithProxyFallback(`${TARGET_DOMAIN}${feedPath}`, 12000);
      if (!response.ok) break;
      const data = await response.json();
      const entries = data.feed?.entry || [];
      if (entries.length === 0) break;
      for (const entry of entries) {
        const art = mapFeedEntryToArticle(entry);
        if (seen.has(art.id)) continue;
        seen.add(art.id);
        all.push(art);
      }
      const total = extractFeedTotalResults(data);
      if (all.length >= total || entries.length < pageSize) break;
      startIndex += pageSize;
    }
    return all;
  } catch {
    return [];
  }
};

export const fetchBloggerPosts = async (category?: Category, searchQuery?: string, startIndex: number = 1): Promise<Article[]> => {
  try {
    const nativePosts = (window as any).bloggerNativePosts;
    const shouldUseNative = nativePosts && nativePosts.length > 20 && !searchQuery && startIndex === 1;

    if (shouldUseNative) {
      // ... existing native logic ...
      let filtered = nativePosts.map((p: any) => {
          const isFeatured = p.category === 'Evidenza' || p.title.includes('⭐') || (p.tags && p.tags.includes('Evidenza'));
          const { cleanContent, dealData } = parseArticleContent(p.content || '');
          const cleanExcerpt = getSmartExcerpt(cleanContent);
          const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => t.trim()) : (p.category ? [p.category] : []);
          const cleanTitle = stripHtml(p.title);
          const publishedAt =
            p.publishedAt ||
            (p.date && (/^\d{10,13}$/.test(String(p.date)) || String(p.date).includes('T'))
              ? String(p.date)
              : undefined);

          const hydrated = hydrateArticle({
            ...p,
            title: cleanTitle,
            excerpt: cleanExcerpt,
            content: cleanContent,
            tags,
            dealData,
            category: p.category || (tags[0] as Category) || 'News',
          });

          return {
            ...p,
            ...hydrated,
            title: cleanTitle,
            imageUrl: forceHighResImage(p.imageUrl),
            authorImageUrl: resolveAuthorImageUrl(p.author, p.authorImageUrl),
            featured: isFeatured,
            excerpt: cleanExcerpt,
            content: cleanContent,
            dealData: dealData,
            publishedAt,
          };
      });

      if (category && category !== 'Tutti') {
        filtered = filtered.filter((p: Article) => articleMatchesNavCategory(p, category));
      }
      if (searchQuery) {
        filtered = filtered.filter((p: Article) => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return filtered;
    }

    if (searchQuery) {
      const feedPath = `/feeds/posts/default?alt=json&q=${encodeURIComponent(searchQuery)}&max-results=50&start-index=${startIndex}`;
      const response = await fetchWithProxyFallback(`${TARGET_DOMAIN}${feedPath}`, 10000);
      if (!response.ok) {
        (window as any).__usingMockData = true;
        return [];
      }
      const data = await response.json();
      return (data.feed.entry || []).map(mapFeedEntryToArticle);
    }

    if (category && category !== 'Tutti') {
      const labels = getFeedLabelsForCategory(category);
      const merged: any[] = [];
      const seenIds = new Set<string>();

      for (const label of labels) {
        const feedPath = `/feeds/posts/default/-/${encodeURIComponent(label)}?alt=json&max-results=100&start-index=${startIndex}`;
        const response = await fetchWithProxyFallback(`${TARGET_DOMAIN}${feedPath}`, 10000);
        if (!response.ok) continue;
        const data = await response.json();
        for (const entry of data.feed.entry || []) {
          const entryId = entry.id.$t;
          if (seenIds.has(entryId)) continue;
          seenIds.add(entryId);
          merged.push(entry);
        }
      }

      return merged.map(mapFeedEntryToArticle);
    }

    const feedPath = `/feeds/posts/default?alt=json&max-results=150&start-index=${startIndex}`;
    const response = await fetchWithProxyFallback(`${TARGET_DOMAIN}${feedPath}`, 10000);

    if (!response.ok) {
      (window as any).__usingMockData = true;
      return [];
    }

    const data = await response.json();
    return (data.feed.entry || []).map(mapFeedEntryToArticle);
  } catch (error) {
    return [];
  }
};

export const fetchArticleByUrl = async (url: string): Promise<Article | null> => {
  try {
    const slugMatch = url.match(/\/([^/]+)\.html$/);
    if (!slugMatch) return null;

    const slug = slugMatch[1];
    const normalizedPath = decodeURIComponent(url.replace(/\/$/, ''));

    const results = await fetchBloggerPosts(undefined, slug.replace(/-/g, ' '));
    const exact = results.find((p) => {
      if (!p.url) return false;
      try {
        return new URL(p.url).pathname.replace(/\/$/, '') === normalizedPath;
      } catch {
        return p.url.includes(slug);
      }
    });
    if (exact) return exact;

    const slugMatchLoose = results.find((p) => p.url?.includes(slug));
    return slugMatchLoose || null;
  } catch (e) {
    console.error("Error fetching by URL", e);
    return null;
  }
};

const formatDealProductTitle = (raw: string): string => {
  let product = (raw || 'Offerta Tech').replace(/^[\p{Emoji}\s]+/gu, '').trim();
  product = product.replace(/\s+/g, ' ');
  if (product.length > 110) product = `${product.slice(0, 107).trim()}…`;
  return product;
};

export const fetchBloggerDeals = async (): Promise<Deal[]> => {
  try {
    const bloggerPromise = (async () => {
        try {
            const labels = ['offerte', 'offerteimperdibili'];
            let entries: any[] = [];
            const seen = new Set<string>();
            for (const label of labels) {
              const targetUrl = `${TARGET_DOMAIN}/feeds/posts/default/-/${encodeURIComponent(label)}?alt=json&max-results=20`;
              const response = await fetchWithProxyFallback(targetUrl, 5000);
              if (!response.ok) continue;
              const data = await response.json();
              for (const entry of data.feed.entry || []) {
                const entryId = entry.id?.$t;
                if (entryId && !seen.has(entryId)) {
                  seen.add(entryId);
                  entries.push(entry);
                }
              }
            }
            if (!entries.length) {
              const fallbackUrl = `${TARGET_DOMAIN}/feeds/posts/default?alt=json&max-results=40`;
              const fallbackRes = await fetchWithProxyFallback(fallbackUrl, 5000);
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                entries = (fallbackData.feed.entry || []).filter((entry: any) => {
                  const content = entry.content?.$t || entry.summary?.$t || '';
                  const title = stripHtml(entry.title?.$t || '');
                  return /amazon\.|amzn\.|amz-safe|offerta|offerte|sconto/i.test(`${content} ${title}`);
                });
              }
            }
            if (!entries.length) return [];
            const generatedDeals: Deal[] = [];
            
            entries.forEach((entry: any, index: number) => {
                const content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
                const title = stripHtml(entry.title.$t); 
                const postUrl = entry.link.find((l: any) => l.rel === 'alternate')?.href || '';
                const id = entry.id.$t;
                
                let imageUrl = '';
                if (entry.media$thumbnail) imageUrl = entry.media$thumbnail.url;
                else {
                    const extracted = getFirstImageFromContent(content);
                    if(extracted) imageUrl = extracted;
                }
                if(!imageUrl) imageUrl = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400';

                let deal = extractDealWidgetData(content, postUrl, title, imageUrl, id);
                if (!deal) deal = extractAmazonOfferFromPost(content, postUrl, title, imageUrl, id);
                if (deal) generatedDeals.push(deal);
            });
            return generatedDeals;
        } catch(e) { return []; }
    })();

    const telegramPromise = fetchTelegramDeals();
    const [bloggerDeals, telegramDeals] = await Promise.all([bloggerPromise, telegramPromise]);

    // Modello classico: se Telegram risponde, usiamo SOLO quelle offerte (canale live).
    // Blogger Amazon solo come fallback se il canale non è raggiungibile.
    const sourceDeals = telegramDeals.length > 0 ? telegramDeals : bloggerDeals;

    const seen = new Set<string>();
    const allDeals: Deal[] = [];
    for (const deal of sourceDeals) {
      const key = (deal.link || deal.product || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      allDeals.push(deal);
      if (allDeals.length >= 12) break;
    }

    const dealColors = ['bg-[#e31b23]', 'bg-blue-600', 'bg-neutral-900', 'bg-purple-600'];
    return allDeals.map((deal, idx) => ({
        ...deal,
        brandColor: dealColors[idx % dealColors.length]
    }));
    
  } catch (error) {
    return [];
  }
};

const rewriteDealAffiliateLink = (rawLink: string): string => {
  try {
    const url = new URL(rawLink, 'https://www.amazon.it');
    if (!/amazon\.|amzn\./i.test(url.hostname + url.pathname)) return rawLink;
    url.searchParams.delete('tag');
    url.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
    return url.toString();
  } catch {
    return rawLink;
  }
};

const DEAL_IMG_FALLBACK =
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=300';

/** Estrae ASIN da link Amazon (dp, gp, amzn.eu/d, query, ecc.). */
export const extractAmazonAsin = (link: string): string | null => {
  if (!link) return null;
  const patterns = [
    /\/(?:dp|gp\/product|gp\/aw\/d|gp\/offer-listing|d|product)\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /[?&]asin=([A-Z0-9]{10})(?:&|$)/i,
    /amzn\.eu\/d\/([A-Z0-9]{10})/i,
    /amazon\.[a-z.]+\/([A-Z0-9]{10})(?:[/?]|$)/i,
  ];
  for (const re of patterns) {
    const m = link.match(re);
    if (m?.[1] && /^[A-Z0-9]{10}$/i.test(m[1])) return m[1].toUpperCase();
  }
  return null;
};

/**
 * Candidati immagine prodotto Amazon (in ordine).
 * Il vecchio images.amazon.com/P/ASIN spesso restituisce riquadro bianco vuoto.
 */
export const amazonImageCandidates = (link: string): string[] => {
  const asin = extractAmazonAsin(link);
  if (!asin) return [DEAL_IMG_FALLBACK];
  return [
    // Widget ufficiale (EU) — più affidabile per anteprime
    `https://ws-eu.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=IT&ASIN=${asin}&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL300_`,
    `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX300_.jpg`,
    `https://images-eu.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`,
    DEAL_IMG_FALLBACK,
  ];
};

const amazonImageFromLink = (link: string): string => amazonImageCandidates(link)[0];

/** Immagini da markdown jina / testo Telegram (telesco.pe, cdn). */
const extractMediaUrlsFromText = (raw: string): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (u: string) => {
    const clean = u.replace(/[),.;]+$/, '').replace(/\\/g, '');
    if (!clean || seen.has(clean)) return;
    if (/telesco\.pe\/file\/Q2dx/i.test(clean)) return; // logo / placeholder TG
    if (!/^https?:\/\//i.test(clean)) return;
    if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(clean) && !/telesco\.pe|cdn4\.|cdn\d+\./i.test(clean)) return;
    seen.add(clean);
    out.push(clean);
  };
  const md = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = md.exec(raw)) !== null) push(m[1]);
  const bare = /https?:\/\/(?:cdn\d*\.telesco\.pe|cdn\d*\.telegram-cdn\.org)\/[^\s)"'<>]+/gi;
  while ((m = bare.exec(raw)) !== null) push(m[0]);
  return out;
};

const extractPricesFromText = (text: string): { newPrice: string; oldPrice: string } => {
  const pricesFound: number[] = [];
  const priceRegex = /(\d+[.,]\d{0,2})\s*€/g;
  let match: RegExpExecArray | null;
  while ((match = priceRegex.exec(text)) !== null) {
    const val = parseFloat(match[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) pricesFound.push(val);
  }
  if (pricesFound.length === 0) {
    if (/gratis|free/i.test(text)) return { newPrice: 'GRATIS', oldPrice: '' };
    return { newPrice: 'OFFERTA', oldPrice: '' };
  }
  const minP = Math.min(...pricesFound);
  const maxP = Math.max(...pricesFound);
  const newPrice = `${minP.toFixed(2).replace('.', ',')}€`;
  const oldPrice = pricesFound.length > 1 && maxP > minP ? `${maxP.toFixed(2).replace('.', ',')}€` : '';
  return { newPrice, oldPrice };
};

/** Parse multi-product Telegram posts (tris, mega, single) from plain/markdown text. */
const parseDealsFromTelegramText = (rawText: string): Deal[] => {
  const text = (rawText || '')
    .replace(/\\_/g, '_')
    .replace(/\*\*/g, '')
    .replace(/_+/g, '');

  const mediaPool = extractMediaUrlsFromText(rawText || text);
  let mediaIdx = 0;
  const nextMedia = (): string | null => {
    if (mediaIdx >= mediaPool.length) return null;
    return mediaPool[mediaIdx++];
  };

  const deals: Deal[] = [];
  const seenLinks = new Set<string>();

  const pushDeal = (product: string, link: string, priceText: string) => {
    if (seenLinks.has(link) || /tuttoxandroid\.com/i.test(link)) return false;
    seenLinks.add(link);
    const { newPrice, oldPrice } = extractPricesFromText(priceText);
    // Preferisci copertina Telegram se presente, altrimenti ASIN Amazon (più robusto)
    const tgImg = nextMedia();
    const imageUrl = tgImg || amazonImageFromLink(link);
    deals.push({
      id: `tg-${deals.length}-${(extractAmazonAsin(link) || link).slice(-12)}`,
      product,
      oldPrice,
      newPrice,
      saveAmount: 'Telegram',
      link,
      imageUrl,
      brandColor: 'bg-[#24A1DE]',
    });
    return true;
  };

  // Prefer numbered product blocks: "1. Product ... 21,15 € ... amazon.it/dp/..."
  const numberedRe =
    /(?:^|\n)\s*(?:\d+\.\s+)([^\n]{8,140})\n[\s\S]{0,280}?(https?:\/\/(?:www\.)?(?:amazon\.[^\s\)"'<>]+|amzn\.[^\s\)"'<>]+))/gi;
  let m: RegExpExecArray | null;
  while ((m = numberedRe.exec(text)) !== null) {
    const product = formatDealProductTitle(m[1].replace(/[*_#]/g, '').trim());
    const link = rewriteDealAffiliateLink(m[2].replace(/[),.;]+$/, ''));
    pushDeal(product, link, m[0]);
    if (deals.length >= 12) return deals;
  }

  // Fallback: every amazon link with ~350 chars of preceding context
  const linkRe = /https?:\/\/(?:www\.)?(?:amazon\.[^\s\)"'<>]+|amzn\.[^\s\)"'<>]+)/gi;
  while ((m = linkRe.exec(text)) !== null) {
    const link = rewriteDealAffiliateLink(m[0].replace(/[),.;]+$/, ''));
    if (seenLinks.has(link)) continue;
    const start = Math.max(0, m.index - 350);
    const context = text.slice(start, m.index + m[0].length);
    const lines = context
      .split('\n')
      .map((l) => l.replace(/[*_#]/g, '').trim())
      .filter((l) => l.length > 6 && !/^https?:\/\//i.test(l) && !/acquista su amazon|applica coupon|di sconto/i.test(l));
    let product = lines[lines.length - 1] || 'Offerta Tech';
    product = product.replace(/^\d+\.\s*/, '').replace(/^a soli\s+/i, '');
    product = formatDealProductTitle(product);
    pushDeal(product, link, context);
    if (deals.length >= 12) break;
  }

  return deals;
};

const parseDealsFromHtml = (htmlText: string): Deal[] => {
  try {
    // If proxy returned markdown/text (jina etc.), parse as text
    if (!htmlText.includes('tgme_widget_message') && /amazon\.|amzn\./i.test(htmlText)) {
      return parseDealsFromTelegramText(htmlText);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const messages = doc.querySelectorAll('.tgme_widget_message');
    const deals: Deal[] = [];
    const seenLinks = new Set<string>();

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const textEl = msg.querySelector('.tgme_widget_message_text');
      const textContent = textEl?.textContent || '';
      const htmlInner = textEl?.innerHTML || '';

      // Foto post Telegram (singola o multi)
      const photoUrls: string[] = [];
      msg.querySelectorAll('.tgme_widget_message_photo_wrap').forEach((photoWrap) => {
        const style = photoWrap.getAttribute('style') || '';
        const bgMatch = style.match(/background-image:url\(['"]?([^'")\s]+)/);
        if (bgMatch?.[1] && !/telesco\.pe\/file\/Q2dx/i.test(bgMatch[1])) {
          photoUrls.push(bgMatch[1]);
        }
      });
      // video thumb
      const videoThumb = msg.querySelector('.tgme_widget_message_video_thumb') as HTMLElement | null;
      if (videoThumb) {
        const style = videoThumb.getAttribute('style') || '';
        const bgMatch = style.match(/background-image:url\(['"]?([^'")\s]+)/);
        if (bgMatch?.[1]) photoUrls.push(bgMatch[1]);
      }

      const fromText = parseDealsFromTelegramText(`${textContent}\n${htmlInner}`);
      let photoIdx = 0;
      for (const deal of fromText) {
        if (seenLinks.has(deal.link)) continue;
        seenLinks.add(deal.link);

        // 1 prodotto = 1 foto se disponibili; altrimenti mantieni ASIN Amazon
        if (photoUrls.length > 0) {
          deal.imageUrl = photoUrls[Math.min(photoIdx, photoUrls.length - 1)];
          photoIdx++;
        } else if (!deal.imageUrl || /unsplash\.com/i.test(deal.imageUrl)) {
          deal.imageUrl = amazonImageFromLink(deal.link);
        }

        deals.push({ ...deal, id: `tg-h-${i}-${deals.length}` });
        if (deals.length >= 12) return deals;
      }
    }
    return deals;
  } catch (e) {
    console.error('Telegram HTML parse error', e);
    return [];
  }
};

export const fetchTelegramDeals = async (): Promise<Deal[]> => {
  // v2: immagini ASIN più robuste (invalida cache vecchia con riquadri bianchi)
  const CACHE_KEY = 'txa_telegram_deals_v2';
  const CACHE_TIME_KEY = 'txa_telegram_deals_v2_time';
  const CACHE_EXPIRY = 1000 * 60 * 10; // 10 minutes

  let cachedData: string | null = null;
  let cachedTime: string | null = null;
  try {
    cachedData = sessionStorage.getItem(CACHE_KEY);
    cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
  } catch { /* blocked */ }

  if (cachedData && cachedTime && Date.now() - parseInt(cachedTime, 10) < CACHE_EXPIRY) {
    try {
      const cached = JSON.parse(cachedData) as Deal[];
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch { /* ignore */ }
  }

  const telegramUrl = 'https://t.me/s/tuttoxandroid';

  // jina.ai first (works from browser, returns markdown with amazon links)
  // then classic CORS proxies for raw HTML
  const fetchTargets = [
    `https://r.jina.ai/${telegramUrl}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(telegramUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(telegramUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(telegramUrl)}`,
  ];

  for (const proxyUrl of fetchTargets) {
    try {
      const response = await fetchWithTimeout(proxyUrl, 12000);
      if (!response.ok) continue;
      const body = await response.text();
      if (!body || body.length < 200) continue;
      const deals = parseDealsFromHtml(body);
      if (deals.length > 0) {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(deals));
          sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch { /* ignore */ }
        return deals;
      }
    } catch (e) {
      console.warn('Telegram proxy failed', proxyUrl, e);
    }
  }

  if (cachedData) {
    try {
      const stale = JSON.parse(cachedData) as Deal[];
      if (Array.isArray(stale) && stale.length > 0) return stale;
    } catch { /* ignore */ }
  }

  return [];
};
