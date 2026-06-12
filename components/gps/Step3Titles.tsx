import React from 'react';
import { CulturalTitlesState, GPSState } from './types';
import { GPS_CONFIG } from './config';

interface Step3Props {
  data: CulturalTitlesState;
  fullState: GPSState;
  onChange: (field: keyof CulturalTitlesState, value: any) => void;
}

const Step3Titles: React.FC<Step3Props> = ({ data, fullState, onChange }) => {
  const langConfig = GPS_CONFIG.gps_config.certificazioni_linguistiche;
  const accessCdc = fullState.setup.cdc;

  const handleSostegnoExtraChange = (grade: string, checked: boolean) => {
    let current = [...data.specializzazione_sostegno_extra];
    if (checked) {
      if (!current.includes(grade)) current.push(grade);
    } else {
      current = current.filter(g => g !== grade);
    }
    onChange('specializzazione_sostegno_extra', current);
  };

  const handleItCertChange = (certId: string, checked: boolean) => {
    let current = [...data.itCertifications];
    if (checked) {
      // Allow adding if under 4 OR if adding DigComp/DigCompEdu which might allow exceeding normal logic (but we keep 4 as UI limit for now, logic handled in utils)
      if (current.length < 4 && !current.includes(certId)) {
        current.push(certId);
      }
    } else {
      current = current.filter(c => c !== certId);
    }
    onChange('itCertifications', current);
  };

  const addAbilitazione = () => {
    onChange('abilitazioni', [...data.abilitazioni, { cdc: '', vote: 0, voteBase: 100 }]);
  };

  const updateAbilitazione = (index: number, field: string, val: any) => {
    const newAbs = [...data.abilitazioni];
    // @ts-ignore
    newAbs[index][field] = field === 'cdc' ? val.toUpperCase() : val;
    onChange('abilitazioni', newAbs);
  };

  const removeAbilitazione = (index: number) => {
    onChange('abilitazioni', data.abilitazioni.filter((_, i) => i !== index));
  };

  const addConcorso = () => {
    onChange('concorsi', [...data.concorsi, { description: '' }]);
  };

  const updateConcorso = (index: number, val: string) => {
    const newCons = [...data.concorsi];
    newCons[index].description = val;
    onChange('concorsi', newCons);
  };

  const removeConcorso = (index: number) => {
    onChange('concorsi', data.concorsi.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    onChange('languages', [...data.languages, { level: 'B2' }]);
  };

  const removeLanguage = (index: number) => {
    const newLangs = [...data.languages];
    newLangs.splice(index, 1);
    onChange('languages', newLangs);
  };

  const updateLanguage = (index: number, level: 'B2' | 'C1' | 'C2') => {
    const newLangs = [...data.languages];
    newLangs[index].level = level;
    onChange('languages', newLangs);
  };

  // Sostegno grades to show
  const sostegnoGrades = ['ADAA (Infanzia)', 'ADEE (Primaria)', 'ADMM (Secondaria I)', 'ADSS (Secondaria II)'].filter(label => {
      const id = label.split(' ')[0];
      return id !== accessCdc; // Exclude the one used for access
  });

  const COMMON_CDC = [
    'A-01', 'A-11', 'A-12', 'A-13', 'A-18', 'A-19', 'A-20', 'A-21', 'A-22', 'A-24', 'A-26', 'A-27', 'A-28', 
    'A-45', 'A-46', 'A-47', 'A-48', 'A-49', 'A-50', 'A-60', 'B-02', 'B-16', 'B-20', 'ADAA', 'ADEE', 'ADMM', 'ADSS'
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
        <h3 className="font-bold text-purple-900">Titoli Culturali</h3>
        <p className="text-sm text-purple-700">Inserisci i titoli valutabili posseduti oltre al titolo di accesso.</p>
      </div>

      {/* 1. Titoli Accademici */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="font-bold text-lg text-gray-800 border-b pb-2">Titoli Accademici Superiori</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-4 border rounded-xl hover:bg-purple-50 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={data.dottorato} 
              onChange={(e) => onChange('dottorato', e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="font-medium">Dottorato di Ricerca (+14)</span>
          </label>
          <label className="flex items-center gap-3 p-4 border rounded-xl hover:bg-purple-50 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={data.asn} 
              onChange={(e) => onChange('asn', e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="font-medium">Abilitazione Scientifica Nazionale (+12)</span>
          </label>
        </div>
      </div>

      {/* 2. Specializzazioni Sostegno */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="font-bold text-lg text-gray-800 border-b pb-2">Specializzazioni su Sostegno</h4>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
          <h5 className="font-bold text-blue-900 mb-2">Hai conseguito altre specializzazioni sul sostegno per altri gradi?</h5>
          <p className="text-sm text-blue-800 mb-4">
            Seleziona le specializzazioni possedute diverse da quella di accesso ({accessCdc}).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sostegnoGrades.length > 0 ? sostegnoGrades.map((label) => {
              const id = label.split(' ')[0];
              return (
                <label key={id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={data.specializzazione_sostegno_extra.includes(id)}
                    onChange={(e) => handleSostegnoExtraChange(id, e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-medium text-blue-900">{label} (+9 pt)</span>
                </label>
              );
            }) : (
                <p className="text-sm text-gray-500 italic">Nessuna altra specializzazione disponibile per la selezione.</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Altre Abilitazioni e Concorsi */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <h4 className="font-bold text-lg text-gray-800 border-b pb-2">Altre Abilitazioni e Concorsi</h4>
        
        {/* Abilitazioni */}
        {fullState.setup.postType !== 'Sostegno' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-700">Hai conseguito altre abilitazioni su altra Classe di Concorso?</label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    onChange('hasAbilitazione', !data.hasAbilitazione);
                    if (!data.hasAbilitazione && data.abilitazioni_count === 0) {
                      onChange('abilitazioni_count', 1);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${data.hasAbilitazione ? 'bg-purple-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.hasAbilitazione ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-gray-600">{data.hasAbilitazione ? 'Si' : 'No'}</span>
              </div>
            </div>
            
            {data.hasAbilitazione && (
              <div className="mt-3 space-y-4 pl-4 border-l-2 border-purple-100">
                <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800">
                  <strong>Nota Punteggio:</strong> Ogni abilitazione su altra classe di concorso conferisce <strong>3 punti</strong>.
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Numero di altre abilitazioni:</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => onChange('abilitazioni_count', Math.max(1, data.abilitazioni_count - 1))}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                    >
                      -
                    </button>
                    <div className="px-4 py-1 font-semibold text-center min-w-[3rem]">
                      {data.abilitazioni_count || 1}
                    </div>
                    <button 
                      onClick={() => onChange('abilitazioni_count', (data.abilitazioni_count || 1) + 1)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Concorsi */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-gray-700">Risulti idoneo a concorsi ordinari (es. PNRR)?</label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const newValue = !data.hasConcorso;
                  onChange('hasConcorso', newValue);
                  if (newValue && data.concorsi.length === 0) {
                    onChange('concorsi', [{ description: '' }]);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${data.hasConcorso ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.hasConcorso ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-600">{data.hasConcorso ? 'Si' : 'No'}</span>
            </div>
          </div>
          
          {data.hasConcorso && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-purple-100">
              {data.concorsi.map((conc, idx) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    type="text" 
                    value={conc.description} 
                    onChange={(e) => updateConcorso(idx, e.target.value)}
                    placeholder="Descrizione concorso (es. Concorso Ordinario 2020)"
                    className="flex-1 p-2 border rounded-lg"
                  />
                  <button onClick={() => removeConcorso(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              <button onClick={addConcorso} className="text-sm text-purple-600 font-medium hover:underline">+ Aggiungi altro concorso</button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Formazione Continua */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <h4 className="font-bold text-lg text-gray-800 border-b pb-2">Formazione Continua (Max 3 titoli tot.)</h4>
        
        {/* Master */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="font-medium text-gray-700 block">Hai conseguito Master universitari di I o II livello?</label>
            <p className="text-xs text-gray-500">Annuali, 1500 ore, 60 CFU (1 punto per titolo)</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
              <button 
                onClick={() => onChange('hasMaster', !data.hasMaster)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${data.hasMaster ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.hasMaster ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-600 w-6">{data.hasMaster ? 'Si' : 'No'}</span>
            </div>
            {data.hasMaster && (
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button 
                  onClick={() => onChange('master_count', Math.max(1, (data.master_count || 1) - 1))}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border-r text-gray-600 font-bold"
                >
                  -
                </button>
                <div className="w-12 text-center font-medium bg-white py-2">
                  {data.master_count || 1}
                </div>
                <button 
                  onClick={() => onChange('master_count', Math.min(3, (data.master_count || 1) + 1))}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border-l text-gray-600 font-bold"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Perfezionamento */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="font-medium text-gray-700 block">Hai frequentato Corsi di Perfezionamento?</label>
            <p className="text-xs text-gray-500">Universitari, annuali, 1500 ore, 60 CFU, con esame finale (1 punto per titolo)</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
              <button 
                onClick={() => onChange('hasPerfezionamento', !data.hasPerfezionamento)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${data.hasPerfezionamento ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.hasPerfezionamento ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-600 w-6">{data.hasPerfezionamento ? 'Si' : 'No'}</span>
            </div>
            {data.hasPerfezionamento && (
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button 
                  onClick={() => onChange('perfezionamento_count', Math.max(1, (data.perfezionamento_count || 1) - 1))}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border-r text-gray-600 font-bold"
                >
                  -
                </button>
                <div className="w-12 text-center font-medium bg-white py-2">
                  {data.perfezionamento_count || 1}
                </div>
                <button 
                  onClick={() => onChange('perfezionamento_count', Math.min(3, (data.perfezionamento_count || 1) + 1))}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border-l text-gray-600 font-bold"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Italiano L2 */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="font-medium text-gray-700 block">Titolo di Specializzazione in Italiano L2</label>
            <p className="text-xs text-gray-500">Riconosciuto per l'insegnamento dell'italiano agli stranieri (3 punti)</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
              <button 
                onClick={() => onChange('hasL2', !data.hasL2)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${data.hasL2 ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.hasL2 ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium text-gray-600 w-6">{data.hasL2 ? 'Si' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Competenze Linguistiche */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="font-bold text-lg text-gray-800 border-b pb-2">Competenze Linguistiche</h4>
        <div className="space-y-4">
          {data.languages.map((lang, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-500">Lingua {idx + 1}</span>
              <select 
                value={lang.level} 
                onChange={(e) => updateLanguage(idx, e.target.value as any)}
                className="p-2 border rounded flex-1 bg-white"
              >
                {langConfig.livelli.map(l => (
                  <option key={l.id} value={l.id}>{l.label} (+{l.punti})</option>
                ))}
              </select>
              <button onClick={() => removeLanguage(idx)} className="text-red-500 hover:text-red-700 font-bold px-3 py-1 bg-red-50 rounded hover:bg-red-100">×</button>
            </div>
          ))}
          <button 
            onClick={addLanguage} 
            className="w-full py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-black hover:bg-blue-50 hover:border-blue-500 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Aggiungi Certificazione Linguistica
          </button>
          
          <label className="flex items-center gap-3 mt-4 p-4 border border-blue-200 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
            <input 
              type="checkbox" 
              checked={data.hasClil} 
              onChange={(e) => onChange('hasClil', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-bold block text-blue-900">
                Corso CLIL (+{data.languages.length > 0 ? '3' : '1'})
              </span>
              <span className="text-xs text-blue-700">
                {data.languages.length > 0 
                  ? "Valutato 3 punti perché abbinato a una certificazione linguistica." 
                  : "Valutato 1 punto (non abbinato a certificazione linguistica)."}
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* 6. Certificazioni Informatiche */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h4 className="font-bold text-lg text-gray-800 border-b pb-2">Certificazioni Informatiche</h4>
        
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 mb-2">
          <strong>Nota Punteggio:</strong> Le certificazioni informatiche standard (LIM, Tablet, Coding, ecc.) non sono più inseribili ex novo (OM 88/2024). Se già dichiarate in precedenza, rimangono valide (max 2 punti totali).
          <br/>
          <strong>DigComp 2.2:</strong> 1 punto | <strong>DigComp Edu:</strong> 2 punti (Max 4 punti totali se sommate a vecchie certificazioni).
        </div>

        <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-4">
          <input 
            type="checkbox" 
            checked={data.hasOldItCertificationsMax}
            onChange={(e) => {
              onChange('hasOldItCertificationsMax', e.target.checked);
            }}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="font-bold text-gray-800">Ho già conseguito 2 punti con certificazioni precedenti (LIM, Tablet, Coding, ICT)</span>
        </label>

        <p className="text-sm text-gray-600 mb-2">Seleziona le certificazioni Accredia (DigComp):</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'lim', label: 'LIM (0.5 pt)', isStandard: true },
            { id: 'tablet', label: 'Tablet (0.5 pt)', isStandard: true },
            { id: 'coding', label: 'Coding (0.5 pt)', isStandard: true },
            { id: 'itc', label: 'EIPASS / ECDL / ICDL (0.5 pt)', isStandard: true },
            { id: 'pekit', label: 'PEKIT (0.5 pt)', isStandard: true },
            { id: 'other', label: 'Altra Certificazione (0.5 pt)', isStandard: true },
            { id: 'digcomp_edu', label: 'DigComp Edu (Accredia) - 2 pt', isStandard: false },
            { id: 'digcomp_22', label: 'DigComp 2.2 (Accredia) - 1 pt', isStandard: false },
          ].filter(cert => !cert.isStandard || data.itCertifications.includes(cert.id)).map((cert) => {
            const isHidden = data.hasOldItCertificationsMax && cert.isStandard;
            if (isHidden) return null;

            return (
              <label key={cert.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${data.itCertifications.includes(cert.id) ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'}`}>
                <input 
                  type="checkbox" 
                  checked={data.itCertifications.includes(cert.id)}
                  onChange={(e) => handleItCertChange(cert.id, e.target.checked)}
                  disabled={!data.itCertifications.includes(cert.id) && data.itCertifications.length >= 4 && !data.hasOldItCertificationsMax}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-50"
                />
                <span className="text-sm font-medium">{cert.label}</span>
              </label>
            );
          })}
        </div>
        {!data.hasOldItCertificationsMax && (
          <p className="text-xs text-gray-500 mt-2 text-right">
            Selezionati: {data.itCertifications.length} / 4
          </p>
        )}
      </div>

    </div>
  );
};

export default Step3Titles;
