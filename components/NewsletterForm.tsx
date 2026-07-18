import React, { useState } from 'react';
import {
  NEWSLETTER_WEBAPP_URL,
  subscribeNewsletter,
  type NewsletterSource,
} from '../services/newsletterService';

type Variant = 'light' | 'dark';

type Props = {
  source: NewsletterSource;
  variant?: Variant;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  className?: string;
  /** Chiamato dopo iscrizione ok (es. chiudi banner articolo). */
  onSuccess?: () => void;
  compactLegal?: boolean;
};

const ERROR_MSG: Record<string, string> = {
  invalid_email: 'Inserisci un indirizzo email valido.',
  no_consent: 'Per iscriverti devi accettare il trattamento dei dati.',
  not_configured: 'Iscrizioni in configurazione. Riprova tra poco.',
  network: 'Connessione non riuscita. Riprova.',
  server: 'Errore del server. Riprova più tardi.',
  brevo: 'Servizio email non disponibile. Riprova tra poco.',
};

/**
 * Form newsletter con consenso GDPR esplicito (opt-in).
 * Sito → Apps Script → Foglio Google + Brevo (API key solo nello script).
 */
const NewsletterForm: React.FC<Props> = ({
  source,
  variant = 'light',
  title,
  subtitle,
  buttonLabel = 'Iscriviti alla Newsletter',
  className = '',
  onSuccess,
  compactLegal = false,
}) => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const isDark = variant === 'dark';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!consent) {
      setStatus('error');
      setError(ERROR_MSG.no_consent);
      return;
    }
    setStatus('loading');
    const result = await subscribeNewsletter(email, consent, source);
    if (result.ok) {
      setStatus('success');
      setEmail('');
      setConsent(false);
      try {
        localStorage.setItem('txa_newsletter_subscribed', '1');
      } catch { /* ignore */ }
      onSuccess?.();
      setTimeout(() => setStatus('idle'), 5000);
      return;
    }
    setStatus('error');
    setError(ERROR_MSG[result.error] || 'Si è verificato un errore.');
  };

  if (status === 'success') {
    return (
      <div
        className={`rounded-xl py-3 px-3 text-center text-[10px] font-black uppercase tracking-wide animate-in fade-in ${
          isDark ? 'bg-white text-black' : 'bg-green-100 text-green-800'
        } ${className}`}
        role="status"
      >
        Iscrizione registrata. Grazie! Puoi disiscriverti in qualsiasi momento scrivendo a{' '}
        <a href="mailto:privacy@tuttoxandroid.com" className="underline">
          privacy@tuttoxandroid.com
        </a>
        .
      </div>
    );
  }

  const inputClass = isDark
    ? 'w-full px-4 py-3 rounded-xl text-black text-xs font-bold focus:outline-none'
    : 'w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#e31b23] bg-white text-gray-900';

  const btnClass = isDark
    ? 'w-full bg-[#e31b23] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors shadow-lg disabled:opacity-60'
    : 'bg-black text-white w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#e31b23] transition-colors disabled:opacity-60';

  return (
    <div className={className}>
      {title && (
        <h4
          className={`font-condensed text-xl font-black uppercase italic mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
        </h4>
      )}
      {subtitle && (
        <p className={`text-[10px] mb-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-2" noValidate>
        <label className="sr-only" htmlFor={`nl-email-${source}-${variant}`}>
          Indirizzo email
        </label>
        <input
          id={`nl-email-${source}-${variant}`}
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder="La tua email"
          className={inputClass}
          required
          disabled={status === 'loading'}
        />

        <label
          className={`flex items-start gap-2 text-left cursor-pointer select-none ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(ev) => setConsent(ev.target.checked)}
            className="mt-0.5 shrink-0 accent-[#e31b23]"
            required
            disabled={status === 'loading'}
          />
          <span className="text-[9px] leading-snug font-medium">
            Acconsento al trattamento della mia email per la newsletter (art. 6.1.a GDPR).{' '}
            <a
              href="/privacy"
              className={`underline font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
            .
          </span>
        </label>

        <button type="submit" className={btnClass} disabled={status === 'loading' || !consent}>
          {status === 'loading' ? 'Invio…' : buttonLabel}
        </button>

        {status === 'error' && error && (
          <p className={`text-[9px] font-bold ${isDark ? 'text-red-300' : 'text-red-600'}`} role="alert">
            {error}
          </p>
        )}

        {!NEWSLETTER_WEBAPP_URL && (
          <p className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Endpoint non configurato (solo setup).
          </p>
        )}

        {!compactLegal && (
          <p className={`text-[8px] leading-snug ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Titolare: TuttoXAndroid · Finalità: invio newsletter · Base giuridica: consenso ·
            Conservazione: fino a revoca · Diritti: accesso, cancellazione, opposizione a{' '}
            <a href="mailto:privacy@tuttoxandroid.com" className="underline">
              privacy@tuttoxandroid.com
            </a>
          </p>
        )}
      </form>
    </div>
  );
};

export default NewsletterForm;
