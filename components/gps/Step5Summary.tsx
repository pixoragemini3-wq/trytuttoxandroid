import React, { useState, useEffect } from 'react';
import { GPSState, SavedSimulation } from './types';
import { calculateAccessScore, calculateCulturalScore, calculateServiceScore, getDetailedAccessReport, getDetailedCulturalReport, getDetailedServiceReport } from './utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveSimulationToSupabase } from '../../services/simulationService';

interface Step5Props {
  state: GPSState;
}

const Step5Summary: React.FC<Step5Props> = ({ state }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const accessReport = getDetailedAccessReport(state);
  const culturalReport = getDetailedCulturalReport(state);
  const serviceReport = getDetailedServiceReport(state);
  const totalScore = accessReport.total + culturalReport.total + serviceReport.total;

  useEffect(() => {
    setIsSaved(false);
    setSaveError(null);
    // Auto-save on mount
    saveSimulation();
  }, []); // Empty dependency array to run only once on mount

  const saveSimulation = async () => {
    if (isSaving || isSaved) return;
    
    setIsSaving(true);
    setSaveError(null);

    const newSim: SavedSimulation = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      state,
      scores: {
        access: accessReport.total,
        cultural: culturalReport.total,
        service: serviceReport.total,
        total: totalScore
      }
    };

    try {
      await saveSimulationToSupabase(newSim);
      setIsSaved(true);
    } catch (err: any) {
      console.error('Error saving to Supabase:', err);
      // Don't show error to user for auto-save unless critical, or just log it
      // setSaveError('Errore: Verifica configurazione Supabase (.env)');
    } finally {
      setIsSaving(false);
    }
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

    // Prepare Table Data
    const tableBody: any[] = [];

    // Access Section
    tableBody.push([{ content: 'TITOLO DI ACCESSO', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
    accessReport.items.forEach(item => {
        tableBody.push([item.label, item.points.toFixed(2)]);
    });
    tableBody.push([{ content: `Totale Accesso: ${accessReport.total.toFixed(2)}`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }]);

    // Cultural Section
    tableBody.push([{ content: 'TITOLI CULTURALI', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
    if (culturalReport.items.length > 0) {
        culturalReport.items.forEach(item => {
            tableBody.push([item.label, item.points.toFixed(2)]);
        });
    } else {
        tableBody.push(['Nessun titolo culturale inserito', '0.00']);
    }
    tableBody.push([{ content: `Totale Culturali: ${culturalReport.total.toFixed(2)}`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }]);

    // Service Section
    tableBody.push([{ content: 'SERVIZIO', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
    if (serviceReport.items.length > 0) {
        serviceReport.items.forEach(item => {
            tableBody.push([item.label, item.points.toFixed(2)]);
        });
    } else {
        tableBody.push(['Nessun servizio inserito', '0.00']);
    }
    tableBody.push([{ content: `Totale Servizio: ${serviceReport.total.toFixed(2)}`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }]);

    // Final Total
    tableBody.push([{ content: `TOTALE COMPLESSIVO: ${totalScore.toFixed(2)}`, colSpan: 2, styles: { fillColor: [227, 27, 35], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 12 } }]);

    // Scores Table
    autoTable(doc, {
      startY: 55,
      head: [['Voce', 'Punti']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50] },
      styles: { cellPadding: 3, fontSize: 10, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 30, halign: 'center' } }
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
          <span className="block text-2xl font-black text-green-900">{accessReport.total.toFixed(2)}</span>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <span className="block text-xs font-bold text-purple-600 uppercase">Culturali</span>
          <span className="block text-2xl font-black text-purple-900">{culturalReport.total.toFixed(2)}</span>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
          <span className="block text-xs font-bold text-orange-600 uppercase">Servizio</span>
          <span className="block text-2xl font-black text-orange-900">{serviceReport.total.toFixed(2)}</span>
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
        
        <div 
          className={`${isSaved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'} border px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-colors`}
        >
          {isSaving ? (
             <>
               <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Salvataggio...
             </>
          ) : isSaved ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              Salvato su Cloud
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              In attesa...
            </>
          )}
        </div>
      </div>
      {saveError && (
        <div className="text-red-500 text-center text-sm font-bold mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
          {saveError}
        </div>
      )}
    </div>
  );
};

export default Step5Summary;
