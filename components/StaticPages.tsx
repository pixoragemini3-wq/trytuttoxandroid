
import React from 'react';

// Pagina Chi Siamo
export const AboutPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      {/* Header Hero */}
      <div className="bg-black text-white py-20 px-4 text-center border-b-8 border-[#e31b23]">
        <h1 className="font-condensed text-6xl md:text-8xl font-black uppercase italic tracking-tighter mb-4">La Nostra Storia</h1>
        <p className="text-gray-400 text-sm md:text-xl font-medium max-w-2xl mx-auto uppercase tracking-widest">
          Dal 2013, il punto di riferimento per l'ecosistema Android in Italia.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 prose prose-lg">
        <h2 className="font-condensed text-4xl font-black uppercase text-gray-900 mb-6">Chi è TuttoXAndroid</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          TuttoXAndroid nasce dalla passione sfrenata per il robottino verde. Quello che è iniziato come un piccolo blog personale è cresciuto fino a diventare una vera e propria redazione digitale. Non siamo solo un sito di news: siamo una community di appassionati, modder e professionisti che vivono la tecnologia ogni giorno.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12 not-prose">
           <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
              <span className="block text-4xl font-black text-[#e31b23] mb-2">10+</span>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Anni di Attività</span>
           </div>
           <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
              <span className="block text-4xl font-black text-[#e31b23] mb-2">5M+</span>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Lettori annuali</span>
           </div>
           <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
              <span className="block text-4xl font-black text-[#e31b23] mb-2">24/7</span>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Copertura News</span>
           </div>
        </div>

        <h3 className="font-condensed text-3xl font-black uppercase text-gray-900 mb-4">La nostra Mission</h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Il nostro obiettivo è rendere la tecnologia accessibile a tutti. Che tu sia un utente esperto alla ricerca dell'ultima Custom ROM o un neofita che vuole scegliere il suo primo smartphone, su TuttoXAndroid troverai sempre contenuti chiari, onesti e approfonditi. Rifiutiamo il clickbait e puntiamo sulla qualità.
        </p>
        
        <div className="bg-black text-white p-8 rounded-3xl text-center not-prose shadow-2xl">
           <h4 className="font-condensed text-2xl font-black uppercase italic mb-2">Vuoi parlarci?</h4>
           <p className="text-gray-400 text-sm mb-6">Per contatti commerciali o segnalazioni</p>
           <a href="mailto:info@tuttoxandroid.com" className="bg-[#e31b23] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors inline-block">Contattaci</a>
        </div>
      </div>
    </div>
  );
};

// Pagina Collabora
export const CollabPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      <div className="bg-[#e31b23] text-white py-20 px-4 text-center">
        <h1 className="font-condensed text-6xl md:text-8xl font-black uppercase italic tracking-tighter mb-4">Join The Team</h1>
        <p className="text-white/80 text-sm md:text-xl font-medium max-w-2xl mx-auto uppercase tracking-widest">
          Trasforma la tua passione per la tecnologia in un lavoro.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
           <div>
              <h2 className="font-condensed text-4xl font-black uppercase text-gray-900 mb-4">Chi cerchiamo</h2>
              <ul className="space-y-4">
                 <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">Appassionati veri di Android e Tech</span>
                 </li>
                 <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">Ottima capacità di scrittura in italiano</span>
                 </li>
                 <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">Conoscenza base di WordPress/Blogger e SEO</span>
                 </li>
                 <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">✓</span>
                    <span className="text-gray-700 font-medium">Puntualità e serietà professionale</span>
                 </li>
              </ul>
           </div>
           <div className="bg-gray-100 rounded-3xl p-8 border border-gray-200">
              <h3 className="font-condensed text-2xl font-black uppercase text-gray-900 mb-4">Cosa Offriamo</h3>
              <div className="space-y-4 text-sm text-gray-600 font-bold uppercase tracking-wide">
                 <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Ambiente</span>
                    <span className="text-black">Giovane e Dinamico</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Lavoro</span>
                    <span className="text-black">100% Remoto</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span>Retribuzione</span>
                    <span className="text-black">Paid to Write</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Gadget</span>
                    <span className="text-black">Prodotti in prova</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-black text-white p-10 rounded-3xl shadow-2xl text-center">
           <h3 className="font-condensed text-3xl font-black uppercase italic mb-4">Inviaci la tua candidatura</h3>
           <p className="text-gray-400 mb-8 max-w-lg mx-auto">
             Manda una mail con oggetto "Candidatura [Tuo Nome]" allegando un breve articolo di prova (max 300 parole) su una notizia tech recente.
           </p>
           <a
             href="mailto:vincenzo@tuttoxandroid.com"
             className="inline-flex items-center gap-2 bg-[#e31b23] text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all hover:scale-105"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
             Invia Email
           </a>
        </div>
      </div>
    </div>
  );
};

/** Informativa privacy (newsletter + sito) — art. 13/14 GDPR */
export const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      <div className="bg-black text-white py-16 px-4 text-center border-b-8 border-[#e31b23]">
        <h1 className="font-condensed text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-3">
          Privacy Policy
        </h1>
        <p className="text-gray-400 text-xs md:text-sm font-medium uppercase tracking-widest">
          Informativa sul trattamento dei dati personali · Aggiornata al 18 luglio 2026
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-sm prose-gray">
        <h2 className="font-condensed text-2xl font-black uppercase text-gray-900 not-prose mb-4">
          1. Titolare del trattamento
        </h2>
        <p>
          Il titolare del trattamento è <strong>TuttoXAndroid</strong> (sito{' '}
          <a href="https://www.tuttoxandroid.com">www.tuttoxandroid.com</a>).
          Per questioni privacy: <a href="mailto:privacy@tuttoxandroid.com">privacy@tuttoxandroid.com</a>.
        </p>

        <h2 className="font-condensed text-2xl font-black uppercase text-gray-900 not-prose mb-4 mt-10">
          2. Newsletter — dati raccolti e finalità
        </h2>
        <p>
          Se ti iscrivi alla newsletter raccogliamo solo l&apos;<strong>indirizzo email</strong> che ci
          fornisci e i metadati tecnici minimi dell&apos;iscrizione (data/ora, pagina di provenienza,
          eventuale user-agent del browser) per:
        </p>
        <ul>
          <li>inviarti la newsletter con news, guide e offerte tech;</li>
          <li>gestire iscrizione, re-iscrizione e disiscrizione;</li>
          <li>dimostrare il consenso espresso (obbligo di accountability GDPR).</li>
        </ul>
        <p>
          <strong>Non</strong> usiamo l&apos;email per profilazione commerciale di terzi, né la
          vendiamo. Eventuali link di affiliazione nelle email non modificano questa finalità
          principale informativa.
        </p>

        <h2 className="font-condensed text-2xl font-black uppercase text-gray-900 not-prose mb-4 mt-10">
          3. Base giuridica
        </h2>
        <p>
          Il trattamento per la newsletter si basa sul tuo <strong>consenso libero, specifico,
          informato e inequivocabile</strong> (art. 6, par. 1, lett. a) GDPR), espresso spuntando
          la casella di accettazione prima dell&apos;invio del form. Senza consenso non iscriviamo
          l&apos;email.
        </p>

        <h2 className="font-condensed text-2xl font-black uppercase text-gray-900 not-prose mb-4 mt-10">
          4. Modalità e luogo di conservazione
        </h2>
        <p>
          Le iscrizioni sono registrate tramite Google Apps Script su un <strong>Foglio Google</strong>
          (audit del consenso) e, se attivo, inviate alla piattaforma di email marketing{' '}
          <strong>Brevo</strong> (Sendinblue) per la gestione della lista e l&apos;invio delle
          newsletter. I dati possono essere trattati su infrastrutture di Google e/o Brevo
          (UE / garanzie contrattuali applicabili). Accesso limitato al titolare e a collaboratori
          autorizzati. Non vendiamo le email a terzi.
        </p>

        <h2 className="font-condensed text-2xl font-black uppercase text-gray-900 not-prose mb-4 mt-10">
          5. Periodo di conservazione
        </h2>
        <p>
          Conserviamo l&apos;email <strong>fino alla revoca del consenso</strong> (disiscrizione) o
          fino a richiesta di cancellazione. Dopo la revoca, l&apos;email viene rimossa o anonimizzata
          entro tempi ragionevoli, salvo obblighi di legge.
        </p>

        <h2 className="font-condensed text-2xl font-black uppercase text-gray-900 not-prose mb-4 mt-10">
          6. I tuoi diritti
        </h2>
        <p>Hai diritto di:</p>
        <ul>
          <li>accedere ai dati che ti riguardano;</li>
          <li>ottenerne rettifica o cancellazione («diritto all&apos;oblio»);</li>
          <li>limitare o opporti al trattamento;</li>
          <li>revocare il consenso in qualsiasi momento (senza pregiudicare la liceità del
            trattamento basato sul consenso prima della revoca);</li>
          <li>proporre reclamo al Garante per la protezione dei dati personali
            (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer"> garanteprivacy.it</a>).
          </li>
        </ul>
        <p>
          Per esercitare i diritti scrivi a{' '}
          <a href="mailto:privacy@tuttoxandroid.com">privacy@tuttoxandroid.com</a> dall&apos;indirizzo
          da cancellare o indicando chiaramente l&apos;email iscritta. Oggetto consigliato:
          «Cancellazione newsletter».
        </p>

        <h2 className="font-condensed text-2xl font-black uppercase text-gray-900 not-prose mb-4 mt-10">
          7. Natura del conferimento
        </h2>
        <p>
          L&apos;iscrizione è facoltativa. Il mancato conferimento dell&apos;email o del consenso
          impedisce solo l&apos;invio della newsletter, non la navigazione del sito.
        </p>

        <h2 className="font-condensed text-2xl font-black uppercase text-gray-900 not-prose mb-4 mt-10">
          8. Cookie e navigazione
        </h2>
        <p>
          Il sito può usare cookie tecnici e, previo consenso del banner, cookie di profilazione /
          pubblicità (es. Google AdSense). Per i dettagli vedi la Cookie Policy e il banner cookie.
        </p>

        <h2 className="font-condensed text-2xl font-black uppercase text-gray-900 not-prose mb-4 mt-10">
          9. Aggiornamenti
        </h2>
        <p>
          Questa informativa può essere aggiornata. La data in testa alla pagina indica l&apos;ultima
          revisione. Continuando a usare i servizi dopo modifiche sostanziali, ti invitiamo a
          rileggerla.
        </p>

        <div className="not-prose mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
          <p className="text-sm text-gray-600 mb-3">Domande sulla privacy o disiscrizione?</p>
          <a
            href="mailto:privacy@tuttoxandroid.com"
            className="inline-block bg-[#e31b23] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors"
          >
            Contatta privacy@tuttoxandroid.com
          </a>
        </div>
      </div>
    </div>
  );
};

