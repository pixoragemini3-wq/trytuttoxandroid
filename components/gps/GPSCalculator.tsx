import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { GPSState, INITIAL_STATE } from './types';
import Step1Setup from './Step1Setup';
import Step2Access from './Step2Access';
import Step3Titles from './Step3Titles';
import Step4Service from './Step4Service';
import Step5Summary from './Step5Summary';
import { calculateAccessScore, calculateCulturalScore, calculateServiceScore } from './utils';
import AdUnit from '../AdUnit';

const GPSCalculator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<GPSState>(INITIAL_STATE);
  const [scores, setScores] = useState({ access: 0, cultural: 0, service: 0, total: 0 });
  const [isTelegramJoined, setIsTelegramJoined] = useState(() => {
    try {
      return localStorage.getItem('gps_telegram_joined') === 'true';
    } catch {
      return false;
    }
  });
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount? Maybe later.

  useEffect(() => {
    const access = calculateAccessScore(state);
    const cultural = calculateCulturalScore(state);
    const service = calculateServiceScore(state);
    setScores({
      access,
      cultural,
      service,
      total: access + cultural + service
    });
  }, [state]);

  const scrollToTop = () => {
    setTimeout(() => {
      if (calculatorRef.current) {
        const yOffset = -100; // Offset for fixed header
        const y = calculatorRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const updateSetup = (field: keyof GPSState['setup'], value: any) => {
    setState(prev => ({ ...prev, setup: { ...prev.setup, [field]: value } }));
  };

  const updateAccess = (field: keyof GPSState['accessTitle'], value: any) => {
    setState(prev => ({ ...prev, accessTitle: { ...prev.accessTitle, [field]: value } }));
  };

  const updateCultural = (field: keyof GPSState['culturalTitles'], value: any) => {
    setState(prev => ({ ...prev, culturalTitles: { ...prev.culturalTitles, [field]: value } }));
  };

  const updateService = (value: any) => {
    setState(prev => ({ ...prev, service: value }));
  };

  const nextStep = () => {
    if (step === 3 && !isTelegramJoined) {
      setShowTelegramModal(true);
      return;
    }

    if (step === 4) {
      // Keep the final reminder or remove it? User asked for it at 2nd step.
      // I'll keep it as a final nudge or just proceed.
      setStep(5);
      scrollToTop();
    } else if (step < 5) {
      setStep(step + 1);
      scrollToTop();
    }
  };

  const handleSkipAd = () => {
    setShowAdModal(false);
    setStep(3);
    scrollToTop();
  };

  const handleTelegramAction = () => {
    window.open('https://t.me/tuttoxandroid', '_blank');
    // We don't close the modal yet, we want them to click "I joined"
  };

  const handleConfirmJoined = () => {
    try {
      localStorage.setItem('gps_telegram_joined', 'true');
    } catch (e) {}
    setIsTelegramJoined(true);
    setShowTelegramModal(false);
    if (step === 3) {
      setStep(4);
      scrollToTop();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      scrollToTop();
    }
  };

  const isStepValid = () => {
    if (step === 1) return state.setup.grade && state.setup.fascia && state.setup.cdc;
    if (step === 2) {
      // For II Fascia (Posto Comune or ITP), the vote was already entered in Step 1
      if (state.setup.fascia === 'II Fascia' && state.setup.postType !== 'Sostegno') {
        return (state.setup.laureaVote || 0) > 0;
      }
      // For Sostegno or I Fascia, the vote is entered in Step 2
      return state.accessTitle.vote > 0;
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      return state.service.every(entry => {
        const hasCdc = entry.cdc && entry.cdc.trim() !== '';
        const hasValidDates = entry.year !== null || (entry.startDate && entry.endDate);
        return hasCdc && hasValidDates;
      });
    }
    return true;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-32 md:pb-8" ref={calculatorRef}>
      <Helmet>
        <title>Calcolatore GPS 2026 | Simula il tuo punteggio</title>
        <meta property="og:title" content="Calcolatore GPS 2026 | Simula il tuo punteggio" />
        <meta property="og:description" content="Calcolatore GPS 2026 gratuito: scopri il tuo punteggio in pochi click. Uno strumento semplice e utile per avere tutto sotto controllo. Provalo ora!" />
        <meta property="og:image" content="https://i.imgur.com/sTIlIOc.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://i.imgur.com/sTIlIOc.png" />
        <meta name="twitter:description" content="Calcolatore GPS 2026 gratuito: scopri il tuo punteggio in pochi click. Uno strumento semplice e utile per avere tutto sotto controllo. Provalo ora!" />
      </Helmet>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-condensed text-4xl md:text-5xl font-black uppercase text-gray-900 mb-2">
          Calcolatore <span className="text-[#e31b23]">GPS 2026</span>
        </h1>
        <p className="text-gray-500 font-medium">Simula il tuo punteggio per le Graduatorie Provinciali Supplenze</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative">
        {/* Main Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8 relative" ref={stepsRef}>
            <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
            <div className={`absolute left-0 top-1/2 h-1 bg-[#e31b23] -z-10 rounded-full transition-all duration-500`} style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
            {[1, 2, 3, 4, 5].map(s => (
              <button 
                key={s} 
                onClick={() => {
                  if (s < step) {
                    setStep(s);
                    scrollToTop();
                  }
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                  step >= s ? 'bg-[#e31b23] text-white shadow-lg' : 'bg-gray-200 text-gray-400'
                } ${s < step ? 'cursor-pointer hover:scale-110' : step === s ? 'scale-110' : 'cursor-default'}`}
                title={s < step ? `Torna al passaggio ${s}` : undefined}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Steps */}
          <div className="min-h-[400px]">
            {step === 1 && <Step1Setup data={state.setup} onChange={updateSetup} />}
            {step === 2 && <Step2Access data={state.accessTitle} setupData={state.setup} fascia={state.setup.fascia} postType={state.setup.postType} cdc={state.setup.cdc} onChange={updateAccess} />}
            {step === 3 && <Step3Titles data={state.culturalTitles} fullState={state} onChange={updateCultural} />}
            {step === 4 && <Step4Service data={state.service} cdc={state.setup.cdc} targetGrade={state.setup.grade} onChange={updateService} />}
            {step === 5 && <Step5Summary state={state} />}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button 
              onClick={prevStep} 
              disabled={step === 1}
              className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Indietro
            </button>
            
            {step < 5 ? (
              <button 
                onClick={nextStep} 
                disabled={!isStepValid()}
                className="bg-[#e31b23] text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avanti
              </button>
            ) : (
              <button 
                onClick={() => window.location.reload()} 
                className="bg-black text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg"
              >
                Nuovo Calcolo
              </button>
            )}
          </div>
        </div>

        {/* Sticky Summary (Desktop) */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-24 bg-gray-900 text-white p-6 rounded-2xl shadow-xl border border-gray-800">
            <h4 className="font-condensed text-xl font-black uppercase italic mb-6 border-b border-gray-700 pb-2">Riepilogo Punti</h4>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Accesso</span>
                <span className="font-mono font-bold text-[#c0ff8c]">{scores.access.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Culturali</span>
                <span className="font-mono font-bold text-[#c0ff8c]">{scores.cultural.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Servizio</span>
                <span className="font-mono font-bold text-[#c0ff8c]">{scores.service.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex justify-between items-end">
                <span className="text-sm font-black uppercase text-white">Totale</span>
                <span className="text-4xl font-black text-[#e31b23] leading-none">{scores.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <h3 className="font-condensed text-2xl font-black uppercase text-gray-900 mb-6 border-b pb-4">Struttura del Sistema GPS</h3>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-bold">ATTENZIONE:</span> Questo programma è sperimentale e potrebbe essere suscettibile di errori. I risultati sono indicativi e non hanno valore legale.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 space-y-4 text-gray-600">
            <p className="font-medium text-gray-800">Il sistema GPS è strutturato in modo tale che:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Si valuta un solo titolo di abilitazione come titolo principale per quello specifico grado.</li>
              <li>Non è prevista una “moltiplicazione” del punteggio per più abilitazioni dello stesso grado, salvo previsione esplicita della tabella.</li>
            </ul>
            
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#e31b23] mt-6">
              <p className="font-bold text-gray-800 mb-2">Diverso sarebbe il caso di:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Abilitazione su grado diverso</li>
                <li>Abilitazione su altro ordine di scuola se contemplato dalla tabella</li>
                <li>Titoli aggiuntivi espressamente previsti</li>
              </ul>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <img 
              src="https://i.imgur.com/sTIlIOc.png" 
              alt="Tabella Valutazione Titoli GPS" 
              className="rounded-xl shadow-lg border border-gray-200 w-full hover:scale-105 transition-transform duration-300" 
            />
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center mt-8 text-xs text-gray-400">
        v1.0.3 - Updated 10:37
      </div>

      {/* Sticky Summary (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 lg:hidden z-50 border-t border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex justify-between items-center">
        <div className="pl-16 sm:pl-20">
          <span className="block text-[10px] font-bold text-gray-400 uppercase">Totale Punti</span>
          <span className="block text-2xl font-black text-[#e31b23] leading-none">{scores.total.toFixed(2)}</span>
        </div>
        <div className="flex gap-4 text-right">
           <div className="hidden sm:block">
              <span className="block text-[8px] font-bold text-gray-500 uppercase">Accesso</span>
              <span className="block text-sm font-mono font-bold text-[#c0ff8c]">{scores.access.toFixed(2)}</span>
           </div>
           <div className="hidden sm:block">
              <span className="block text-[8px] font-bold text-gray-500 uppercase">Culturali</span>
              <span className="block text-sm font-mono font-bold text-[#c0ff8c]">{scores.cultural.toFixed(2)}</span>
           </div>
           <div className="hidden sm:block">
              <span className="block text-[8px] font-bold text-gray-500 uppercase">Servizio</span>
              <span className="block text-sm font-mono font-bold text-[#c0ff8c]">{scores.service.toFixed(2)}</span>
           </div>
           
           {step < 5 && (
             <button 
               onClick={nextStep}
               disabled={!isStepValid()}
               className="bg-white text-black px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest"
             >
               Avanti
             </button>
           )}
        </div>
      </div>

      {/* Telegram Modal */}
      {showTelegramModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all scale-100 animate-in zoom-in-95 duration-300 border border-gray-100 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-50 rounded-full blur-3xl opacity-50"></div>

            <div className="relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ring-4 ring-blue-50">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              
              <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">Rimani Connesso</h3>
              
              <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
                <p className="text-blue-800 text-sm font-medium leading-relaxed">
                  Questo calcolatore è offerto gratuitamente dal canale Telegram <span className="font-black">@tuttoxandroid</span>.
                </p>
              </div>

              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Unisciti al nostro canale per rimanere sempre aggiornato sul mondo della scuola e supportare il nostro lavoro.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={handleTelegramAction}
                  className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white font-black py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-blue-200 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  1. Unisciti al Canale
                </button>
                
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Poi</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <button 
                  onClick={handleConfirmJoined}
                  className="w-full bg-black hover:bg-gray-800 text-white font-black py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] shadow-xl text-sm uppercase tracking-widest"
                >
                  2. Continua
                </button>
              </div>
              
              <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                Grazie per il supporto! Il tuo contributo ci permette di mantenere gratuiti questi strumenti.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPSCalculator;
