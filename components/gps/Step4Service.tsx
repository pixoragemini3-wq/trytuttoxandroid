import React from 'react';
import { GPSState, ServiceEntry } from './types';
import { differenceInDays } from 'date-fns';
import { extractCdcCode, isServiceSpecific } from './utils';

interface Step4Props {
  data: GPSState['service'];
  cdc: string;
  targetGrade: string;
  onChange: (value: ServiceEntry[]) => void;
}

const Step4Service: React.FC<Step4Props> = ({ data, cdc, targetGrade, onChange }) => {
  const addService = () => {
    const newEntry: ServiceEntry = {
      id: Date.now().toString(),
      startDate: '',
      endDate: '',
      year: null,
      isSpecific: true, // This will be ignored in calculation, but kept for type compatibility
      cdc: '',
      note: '',
    };
    onChange([...data, newEntry]);
  };

  const updateService = (id: string, field: keyof ServiceEntry, value: any) => {
    const newData = data.map(entry => {
      if (entry.id === id) {
        return { ...entry, [field]: value };
      }
      return entry;
    });
    onChange(newData);
  };

  const removeService = (id: string) => {
    onChange(data.filter(e => e.id !== id));
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = differenceInDays(new Date(end), new Date(start)) + 1; // Include end date
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
        <h3 className="font-bold text-orange-900">Servizio Scolastico</h3>
        <p className="text-sm text-orange-700 mb-2">
          Inserisci i periodi di servizio. Puoi indicare l'anno scolastico intero o le date specifiche.
        </p>
        <div className="bg-white/50 p-3 rounded text-sm text-orange-800 space-y-2">
          <p><strong>Specifico (12 punti/anno):</strong> Servizio prestato sulla <u>stessa Classe di Concorso</u> per cui si sta calcolando il punteggio (o su Sostegno per lo stesso grado).</p>
          <p><strong>Aspecifico (6 punti/anno):</strong> Servizio prestato su <u>altra Classe di Concorso</u> o su Sostegno per altro grado di istruzione.</p>
          <p className="text-xs italic mt-1">Esempio: Se calcoli per A-46, il servizio su A-46 è Specifico. Il servizio su A-45 è Aspecifico.</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.length === 0 && (
          <div className="text-center p-8 bg-orange-50 rounded-2xl border-2 border-dashed border-orange-200">
            <h4 className="text-xl font-bold text-orange-800 mb-2">Nessun servizio inserito</h4>
            <p className="text-orange-600 mb-6">Aggiungi i tuoi periodi di servizio per calcolare il punteggio. Ogni anno specifico vale 12 punti!</p>
            <button 
              onClick={addService}
              className="px-8 py-4 bg-orange-600 text-white rounded-xl font-bold shadow-lg hover:bg-orange-700 hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Aggiungi il tuo primo Servizio
            </button>
          </div>
        )}

        {data.map((entry, index) => (
          <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative group hover:border-orange-300 transition-all">
            <div className="absolute top-2 right-2">
              <button 
                onClick={() => removeService(entry.id)}
                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="Rimuovi servizio"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* Type Selection */}
              <div className="col-span-1 md:col-span-2 flex gap-4 border-b pb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name={`type-${entry.id}`}
                    checked={entry.year !== null}
                    onChange={() => updateService(entry.id, 'year', new Date().getFullYear() - 1)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-bold text-gray-700">Anno Intero</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name={`type-${entry.id}`}
                    checked={entry.year === null}
                    onChange={() => updateService(entry.id, 'year', null)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="font-bold text-gray-700">Periodo Specifico</span>
                </label>
              </div>

              {/* Input Fields */}
              {entry.year !== null ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Anno Scolastico</label>
                  <select 
                    value={entry.year || ''} 
                    onChange={(e) => updateService(entry.id, 'year', parseInt(e.target.value))}
                    className="w-full p-2 border rounded text-sm font-mono"
                  >
                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}/{year + 1}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dal</label>
                    <input 
                      type="date" 
                      value={entry.startDate} 
                      onChange={(e) => updateService(entry.id, 'startDate', e.target.value)}
                      className="w-full p-2 border rounded text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Al</label>
                    <input 
                      type="date" 
                      value={entry.endDate} 
                      onChange={(e) => updateService(entry.id, 'endDate', e.target.value)}
                      className="w-full p-2 border rounded text-sm font-mono"
                    />
                  </div>
                </>
              )}

              {/* CDC and Note Fields */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Classe di Concorso (Obbligatoria)</label>
                  <div className="relative">
                    <input 
                      list={`cdc-list-${entry.id}`}
                      type="text" 
                      value={entry.cdc} 
                      onChange={(e) => updateService(entry.id, 'cdc', e.target.value.toUpperCase())}
                      placeholder="Es. A-46, ADSS..."
                      className="w-full p-2 border rounded text-sm font-mono uppercase pr-24"
                      required
                    />
                    <datalist id={`cdc-list-${entry.id}`}>
                      {cdc && <option value={extractCdcCode(cdc)}>Classe Scelta ({cdc})</option>}
                      <option value="ADAA">ADAA - Sostegno Infanzia</option>
                      <option value="ADEE">ADEE - Sostegno Primaria</option>
                      <option value="ADMM">ADMM - Sostegno Secondaria I grado</option>
                      <option value="ADSS">ADSS - Sostegno Secondaria II grado</option>
                      <option value="A-01">A-01</option>
                      <option value="A-11">A-11</option>
                      <option value="A-12">A-12</option>
                      <option value="A-18">A-18</option>
                      <option value="A-19">A-19</option>
                      <option value="A-20">A-20</option>
                      <option value="A-21">A-21</option>
                      <option value="A-22">A-22</option>
                      <option value="A-24">A-24</option>
                      <option value="A-26">A-26</option>
                      <option value="A-27">A-27</option>
                      <option value="A-28">A-28</option>
                      <option value="A-45">A-45</option>
                      <option value="A-46">A-46</option>
                      <option value="A-47">A-47</option>
                      <option value="A-48">A-48</option>
                      <option value="A-49">A-49</option>
                      <option value="A-50">A-50</option>
                      <option value="A-60">A-60</option>
                      <option value="B-02">B-02</option>
                      <option value="B-16">B-16</option>
                      <option value="B-20">B-20</option>
                    </datalist>
                    {entry.cdc && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          isServiceSpecific(entry.cdc, cdc, targetGrade)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {isServiceSpecific(entry.cdc, cdc, targetGrade) ? 'SPECIFICO' : 'ASPECIFICO'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Note (Opzionale)</label>
                  <input 
                    type="text" 
                    value={entry.note} 
                    onChange={(e) => updateService(entry.id, 'note', e.target.value)}
                    placeholder="Es. Scuola Paritaria..."
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Info Bar */}
            <div className="bg-gray-50 -mx-4 -mb-4 px-4 py-2 rounded-b-xl flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 mt-3">
              <span className="font-mono">ID: {entry.id.slice(-4)}</span>
              <span className="font-bold text-orange-600">
                {entry.year ? 'Anno Intero (12 punti se specifico)' : `${calculateDays(entry.startDate, entry.endDate)} giorni calcolati`}
              </span>
            </div>
          </div>
        ))}

        {data.length > 0 && (
          <button 
            onClick={addService}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Aggiungi Altro Periodo di Servizio
          </button>
        )}
      </div>
    </div>
  );
};

export default Step4Service;
