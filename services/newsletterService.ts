/**
 * Iscrizione newsletter (GDPR opt-in sul form).
 *
 * Flusso sicuro (API key Brevo MAI nel browser):
 *   Form sito → Google Apps Script → Foglio Google + Brevo
 *
 * Guida completa: scripts/newsletter-apps-script.gs (commenti in testa)
 * Brevo free: https://www.brevo.com
 *
 * 1. Setup Foglio + Apps Script (incolla lo .gs)
 * 2. Proprietà script: BREVO_API_KEY + BREVO_LIST_ID
 * 3. Distribuisci App web → incolla URL /exec qui sotto
 */

/** URL dell'app web Apps Script (termina con /exec). Vuoto = form non ancora collegato. */
export const NEWSLETTER_WEBAPP_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_NEWSLETTER_WEBAPP_URL) ||
  'https://script.google.com/macros/s/AKfycbyrnVEEiIa1jCntfRodCLe02vwdtRGzlVYwwxbQ-oHw0hxLfsg4UQ5qY7O2Csqo8Fu8hQ/exec';

export type NewsletterSource =
  | 'home_sidebar'
  | 'article_sidebar'
  | 'article_prompt'
  | 'mobile_menu'
  | 'other';

export type NewsletterPayload = {
  email: string;
  consent: true;
  source: NewsletterSource;
  pageUrl?: string;
};

export type NewsletterResult =
  | { ok: true }
  | {
      ok: false;
      error: 'invalid_email' | 'no_consent' | 'not_configured' | 'network' | 'server' | 'brevo';
    };

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());

export async function subscribeNewsletter(
  email: string,
  consent: boolean,
  source: NewsletterSource = 'other'
): Promise<NewsletterResult> {
  const clean = email.trim().toLowerCase();
  if (!isValidEmail(clean)) return { ok: false, error: 'invalid_email' };
  if (!consent) return { ok: false, error: 'no_consent' };

  const endpoint = NEWSLETTER_WEBAPP_URL.trim();
  if (!endpoint) {
    console.warn(
      '[newsletter] NEWSLETTER_WEBAPP_URL non configurato. Vedi scripts/newsletter-apps-script.gs'
    );
    return { ok: false, error: 'not_configured' };
  }

  const payload: NewsletterPayload & { ts: string; userAgent?: string } = {
    email: clean,
    consent: true,
    source,
    pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    ts: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 180) : undefined,
  };

  try {
    // text/plain evita preflight CORS aggressivi verso script.google.com
    const res = await fetch(endpoint, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    // Con redirect Google a volte la risposta finale non è JSON leggibile:
    // se la richiesta è partita senza errore di rete, consideriamo ok se status ok o opaque.
    if (res.type === 'opaque' || res.ok) return { ok: true };

    try {
      const data = await res.json();
      if (data?.ok) return { ok: true };
      if (data?.error === 'brevo') return { ok: false, error: 'brevo' };
    } catch {
      /* ignore */
    }
    return { ok: false, error: 'server' };
  } catch (e) {
    console.warn('[newsletter] fetch failed', e);
    return { ok: false, error: 'network' };
  }
}
