import React, { useState, useEffect } from 'react';
import { GPSState, SavedSimulation } from './types';
import { calculateAccessScore, calculateCulturalScore, calculateServiceScore } from './utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Step5Props {
  state: GPSState;
}

const Step5Summary: React.FC<Step5Props> = ({ state }) => {
  const [isSaved, setIsSaved] = useState(false);
  const accessScore = calculateAccessScore(state);
  const culturalScore = calculateCulturalScore(state);
  const serviceScore = calculateServiceScore(state);
  const totalScore = accessScore + culturalScore + serviceScore;

  useEffect(() => {
    setIsSaved(false);
  }, [state]);

  const saveSimulation = () => {
    const newSim: SavedSimulation = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      state,
      scores: {
        access: accessScore,
        cultural: culturalScore,
        service: serviceScore,
        total: totalScore
      }
    };

    const existing = localStorage.getItem('gps_simulations');
    const simulations: SavedSimulation[] = existing ? JSON.parse(existing) : [];
    simulations.push(newSim);
    localStorage.setItem('gps_simulations', JSON.stringify(simulations));
    setIsSaved(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(227, 27, 35); // TuttoXAndroid Red
    doc.text('Report Punteggio GPS 2026-2028', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generato il ${new Date().toLocaleDateString()} su TuttoXAndroid.com`, 14, 28);
    
    // Profile Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Profilo: ${state.setup.grade} - ${state.setup.fascia}`, 14, 40);
    doc.text(`Classe di Concorso: ${state.setup.cdc}`, 14, 46);

    // Detailed Access Title
    let accessDetails = '';
    
    const isSostegnoFascia1 = state.setup.fascia === 'I Fascia' && (state.setup.cdc.startsWith('AD') || state.setup.cdc.includes('SOSTEGNO'));
    const isFascia1PostoComune = state.setup.fascia === 'I Fascia' && !isSostegnoFascia1;
    
    if (isSostegnoFascia1) {
       accessDetails += `Voto: ${state.accessTitle.vote > 0 ? `${state.accessTitle.vote}/${state.accessTitle.voteBase}` : 'Non numerico'}`;
    } else if (isFascia1PostoComune) {
       accessDetails += `Abilitazione: ${state.accessTitle.vote}/${state.accessTitle.voteBase}`;
       if (state.accessTitle.laureaVote !== undefined) {
           accessDetails += `\nLaurea: ${state.accessTitle.laureaVote}/${state.accessTitle.laureaVoteBase}${state.accessTitle.laureaLode ? ' + Lode' : ''}`;
       }
    } else {
       accessDetails += `Voto: ${state.accessTitle.vote}/${state.accessTitle.voteBase}${state.accessTitle.isLode ? ' + Lode' : ''}`;
    }

    if (state.accessTitle.bonusId) {
       const bonusLabel = state.accessTitle.bonusId === 'tfa_sostegno' ? 'Ammissione Selettiva (TFA)' : 'Altro Bonus';
       accessDetails += `\n- Bonus: ${bonusLabel}`;
    }
    if (state.accessTitle.hasAbilitazione) {
       accessDetails += `\n- Abilitazione Posto Comune: ${state.accessTitle.abilitazioneVote}/${state.accessTitle.abilitazioneVoteBase}`;
    }

    // Detailed Cultural Titles
    const culturalDetails = [
        state.culturalTitles.dottorato ? '- Dottorato di Ricerca (12pt)' : '',
        state.culturalTitles.asn ? '- Abilitazione Scientifica Nazionale (12pt)' : '',
        state.culturalTitles.specializzazione_sostegno_extra.length > 0 ? `- Specializzazioni Sostegno Extra: ${state.culturalTitles.specializzazione_sostegno_extra.join(', ')} (9pt cad.)` : '',
        state.culturalTitles.hasAbilitazione ? `- Altre Abilitazioni: ${state.culturalTitles.abilitazioni_count} (3pt cad.)` : '',
        state.culturalTitles.hasConcorso ? `- Concorsi Ordinari: ${state.culturalTitles.concorsi.length} (3pt cad.)` : '',
        state.culturalTitles.hasMaster ? `- Master: ${state.culturalTitles.master_count} (1pt cad.)` : '',
        state.culturalTitles.hasPerfezionamento ? `- Perfezionamento: ${state.culturalTitles.perfezionamento_count} (1pt cad.)` : '',
        state.culturalTitles.languages.length > 0 ? `- Certificazioni Linguistiche: ${state.culturalTitles.languages.map(l => l.level).join(', ')}` : '',
        state.culturalTitles.hasClil ? '- Corso CLIL' : '',
        state.culturalTitles.itCertifications.length > 0 || state.culturalTitles.hasOldItCertificationsMax ? `- Certificazioni Informatiche: ${state.culturalTitles.hasOldItCertificationsMax ? 'Max (2pt) + ' : ''}${state.culturalTitles.itCertifications.join(', ')}` : ''
    ].filter(Boolean).join('\n');

    // Detailed Service
    const serviceDetails = state.service.map(s => {
        const isSpecific = (s.cdc || '').replace(/[^A-Z0-9]/gi, '').toUpperCase() === (state.setup.cdc || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const type = isSpecific ? 'Specifico' : 'Aspecifico';
        if (s.year) return `- Anno ${s.year}/${s.year+1} (${type})`;
        return `- Periodo ${s.startDate} - ${s.endDate} (${type})`;
    }).join('\n');

    // Scores Table
    autoTable(doc, {
      startY: 55,
      head: [['Categoria', 'Dettagli', 'Punti']],
      body: [
        ['Titolo di Accesso', accessDetails || '-', accessScore.toFixed(2)],
        ['Titoli Culturali', culturalDetails || '-', culturalScore.toFixed(2)],
        ['Servizio', serviceDetails || '-', serviceScore.toFixed(2)],
        ['TOTALE', '', totalScore.toFixed(2)]
      ],
      foot: [['', 'Totale Complessivo', totalScore.toFixed(2)]],
      theme: 'grid',
      headStyles: { fillColor: [227, 27, 35] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { cellPadding: 3, fontSize: 9, overflow: 'linebreak' },
      columnStyles: { 1: { cellWidth: 100 } }
    });

    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Questo calcolo è indicativo e non ha valore legale. Fare riferimento alle tabelle ufficiali del Ministero.', 14, (doc as any).lastAutoTable.finalY + 10);

    doc.save('report-gps-tuttoxandroid.pdf');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl text-center">
        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Punteggio Totale Stimato</h3>
        <div className="text-6xl font-black text-[#c0ff8c]">{totalScore.toFixed(2)}</div>
        <p className="text-gray-500 text-xs mt-2">Aggiornato in tempo reale</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <span className="block text-xs font-bold text-green-600 uppercase">Accesso</span>
          <span className="block text-2xl font-black text-green-900">{accessScore.toFixed(2)}</span>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <span className="block text-xs font-bold text-purple-600 uppercase">Culturali</span>
          <span className="block text-2xl font-black text-purple-900">{culturalScore.toFixed(2)}</span>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
          <span className="block text-xs font-bold text-orange-600 uppercase">Servizio</span>
          <span className="block text-2xl font-black text-orange-900">{serviceScore.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button 
          onClick={generatePDF}
          className="bg-[#e31b23] text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Scarica Report PDF
        </button>
        
        <button 
          onClick={saveSimulation}
          disabled={isSaved}
          className={`${isSaved ? 'bg-green-500' : 'bg-gray-900'} text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2`}
        >
          {isSaved ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              Salvata!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              Salva Simulazione
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step5Summary;
