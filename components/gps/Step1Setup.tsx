import React, { useEffect } from 'react';
import { GPSState, Grade, Fascia, PostType } from './types';

interface Step1Props {
  data: GPSState['setup'];
  onChange: (field: keyof GPSState['setup'], value: any) => void;
}

const GRADES: Grade[] = ['Infanzia', 'Primaria', 'Secondaria I', 'Secondaria II'];
const FASCE: Fascia[] = ['I Fascia', 'II Fascia'];

const COMMON_CDC = [
  'A-01', 'A-11', 'A-12', 'A-13', 'A-18', 'A-19', 'A-20', 'A-21', 'A-22', 'A-24', 'A-26', 'A-27', 'A-28', 
  'A-45', 'A-46', 'A-47', 'A-48', 'A-49', 'A-50', 'A-60', 'B-02', 'B-16', 'B-20'
];

const Step1Setup: React.FC<Step1Props> = ({ data, onChange }) => {
  
  // Reset dependent fields when grade changes
  const handleGradeChange = (grade: Grade) => {
    onChange('grade', grade);
    onChange('postType', '');
    onChange('cdc', '');
  };

  // Reset CDC when post type changes
  const handlePostTypeChange = (type: PostType) => {
    onChange('postType', type);
    
    // Auto-set CDC for Sostegno based on Grade
    if (type === 'Sostegno') {
      if (data.grade === 'Infanzia') onChange('cdc', 'ADAA');
      else if (data.grade === 'Primaria') onChange('cdc', 'ADEE');
      else if (data.grade === 'Secondaria I') onChange('cdc', 'ADMM');
      else if (data.grade === 'Secondaria II') onChange('cdc', 'ADSS');
    } else {
      onChange('cdc', '');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <h3 className="font-bold text-blue-900">Configurazione Guidata</h3>
        <p className="text-sm text-blue-700">Rispondi alle domande per configurare il calcolo corretto.</p>
      </div>

      <div className="space-y-6">
        {/* 1. Grado */}
        <div>
          <label className="block text-lg font-bold text-gray-800 mb-3">1. Per quale ordine di scuola ti inserisci?</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GRADES.map(g => (
              <button
                key={g}
                onClick={() => handleGradeChange(g)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  data.grade === g 
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold block">{g}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Tipo di Posto (Only if Grade selected) */}
        {data.grade && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-lg font-bold text-gray-800 mb-3">2. Per quale tipologia di posto?</label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handlePostTypeChange('Comune')}
                className={`flex-1 min-w-[140px] p-4 rounded-xl border-2 transition-all ${
                  data.postType === 'Comune'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className="font-bold block">Posto Comune</span>
                <span className="text-xs text-gray-500">Materia</span>
              </button>

              <button
                onClick={() => handlePostTypeChange('Sostegno')}
                className={`flex-1 min-w-[140px] p-4 rounded-xl border-2 transition-all ${
                  data.postType === 'Sostegno'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-md'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <span className="font-bold block">Sostegno</span>
                <span className="text-xs text-gray-500">ADSS, ADMM, ecc.</span>
              </button>

              {data.grade === 'Secondaria II' && (
                <button
                  onClick={() => handlePostTypeChange('ITP')}
                  className={`flex-1 min-w-[140px] p-4 rounded-xl border-2 transition-all ${
                    data.postType === 'ITP'
                      ? 'border-orange-600 bg-orange-50 text-orange-900 shadow-md'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <span className="font-bold block">ITP</span>
                  <span className="text-xs text-gray-500">Insegnante Tecnico Pratico</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. Fascia (Only if Post Type selected) */}
        {data.postType && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-lg font-bold text-gray-800 mb-3">3. In quale fascia ti inserisci?</label>
            <div className="flex gap-4 mb-4">
              {FASCE.map(f => (
                <label key={f} className={`flex-1 cursor-pointer border-2 rounded-xl p-4 flex items-center justify-center gap-3 transition-all ${
                  data.fascia === f 
                    ? 'border-green-600 bg-green-50 text-green-900 shadow-md' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input 
                    type="radio" 
                    name="fascia" 
                    value={f} 
                    checked={data.fascia === f} 
                    onChange={(e) => onChange('fascia', e.target.value)}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="font-bold text-lg">{f}</span>
                </label>
              ))}
            </div>
            
            {/* Explanatory Note */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-2">
              <p><strong className="text-gray-900">I Fascia:</strong> Per docenti in possesso di <strong>abilitazione</strong> (su materia) o <strong>specializzazione</strong> (su sostegno).</p>
              <p><strong className="text-gray-900">II Fascia:</strong> Per docenti <strong>non abilitati</strong> ma in possesso del titolo di studio valido per l'accesso (Laurea + CFU, Diploma ITP, ecc.).</p>
            </div>
          </div>
        )}

        {/* 4. CDC (Only if Fascia selected) */}
        {data.fascia && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-lg font-bold text-gray-800 mb-3">4. Classe di Concorso</label>
            
            {data.postType === 'Sostegno' ? (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-purple-900 font-medium">Classe di Concorso assegnata automaticamente:</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">{data.cdc}</p>
              </div>
            ) : (
              <div>
                <input 
                  list="cdc-list"
                  type="text" 
                  value={data.cdc} 
                  onChange={(e) => onChange('cdc', e.target.value.toUpperCase())}
                  placeholder={data.postType === 'ITP' ? "Es. B-02, B-16..." : "Es. A-18, A-46..."}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase font-mono text-lg"
                />
                <datalist id="cdc-list">
                  {COMMON_CDC.map(c => <option key={c} value={c} />)}
                </datalist>
                <p className="text-sm text-gray-500 mt-2">
                  Digita il codice della tua classe di concorso.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step1Setup;
