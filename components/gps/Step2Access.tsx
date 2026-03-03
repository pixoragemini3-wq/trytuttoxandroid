import React from 'react';
import { GPSState, PostType } from './types';
import { GPS_CONFIG } from './config';

interface Step2Props {
  data: GPSState['accessTitle'];
  fascia: GPSState['setup']['fascia'];
  postType: PostType | '';
  cdc: string;
  onChange: (field: keyof GPSState['accessTitle'], value: any) => void;
}

const Step2Access: React.FC<Step2Props> = ({ data, fascia, postType, cdc, onChange }) => {
  const isFascia1 = fascia === 'I Fascia';
  const isSostegno = postType === 'Sostegno' && isFascia1;
  const config = GPS_CONFIG.gps_config;

  const getTitleLabel = () => {
    if (isSostegno) {
      if (cdc === 'ADSS') return "Titolo di Specializzazione su Sostegno (Secondaria II Grado)";
      if (cdc === 'ADMM') return "Titolo di Specializzazione su Sostegno (Secondaria I Grado)";
      if (cdc === 'ADEE') return "Titolo di Specializzazione su Sostegno (Primaria)";
      if (cdc === 'ADAA') return "Titolo di Specializzazione su Sostegno (Infanzia)";
      return "Titolo di Specializzazione su Sostegno";
    }
    return `Titolo di Accesso (${cdc})`;
  };

  const handleVoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 0;
    const max = data.voteBase || 110;
    if (val > max) val = max;
    onChange('vote', val);
  };

  const handleBaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBase = parseInt(e.target.value);
    onChange('voteBase', newBase);
    if (data.vote > newBase) onChange('vote', newBase);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
        <h3 className="font-bold text-green-900">{getTitleLabel()}</h3>
        <p className="text-sm text-green-700">
          {isSostegno 
            ? "Inserisci il voto del tuo titolo di specializzazione. Se il voto è espresso in 30esimi, seleziona la base 30." 
            : "Inserisci il voto del tuo titolo di abilitazione o accesso."}
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Voto */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm">
          <label className="block text-lg font-bold text-gray-800 mb-4">
            1. Con quale voto hai conseguito il titolo?
          </label>
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input 
                type="number" 
                min="0" 
                max={data.voteBase || 110} 
                value={data.vote || ''} 
                onChange={handleVoteChange}
                placeholder="Voto"
                className="w-32 p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-2xl font-mono text-center font-bold"
              />
              <span className="text-gray-400 font-black text-xl">/</span>
              <select 
                  value={data.voteBase || 110} 
                  onChange={handleBaseChange}
                  className="p-4 border-2 border-gray-300 rounded-xl bg-gray-50 font-bold text-gray-700 focus:ring-2 focus:ring-green-500 text-lg"
              >
                  <option value="110">110</option>
                  <option value="100">100</option>
                  {isSostegno && <option value="30">30</option>}
              </select>
            </div>

            {/* Lode */}
            {!isSostegno && (
              <label className={`flex items-center gap-3 cursor-pointer select-none border-2 p-4 rounded-xl transition-all ${
                data.isLode 
                  ? 'border-green-500 bg-green-50 text-green-900' 
                  : 'border-gray-200 hover:border-green-300'
              }`}>
                <input 
                  type="checkbox" 
                  checked={data.isLode} 
                  onChange={(e) => onChange('isLode', e.target.checked)}
                  className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
                />
                <span className="font-bold">Con Lode</span>
              </label>
            )}
          </div>

          {/* No Vote Checkbox for Sostegno */}
          {isSostegno && (
            <div className="mt-4">
              <label className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <input 
                    type="checkbox"
                    checked={data.vote === 0}
                    onChange={(e) => {
                        if (e.target.checked) {
                            onChange('vote', 0);
                            onChange('isLode', false);
                        } else {
                            onChange('vote', 60); // Default back to min positive
                        }
                    }}
                    className="w-5 h-5 rounded text-green-600 focus:ring-green-500"
                />
                <span>Il titolo non riporta un voto numerico o giudizio quantificabile (Punteggio base: 8 pt)</span>
              </label>
            </div>
          )}
        </div>

        {/* 2. Bonus Questions (Context Aware) */}
        {isFascia1 && (
          <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200 animate-in fade-in slide-in-from-top-4">
            <h4 className="text-lg font-bold text-yellow-900 mb-4">2. Dettagli del percorso</h4>
            
            {isSostegno ? (
              // Sostegno Question
              <div>
                <p className="mb-3 font-medium text-yellow-800">Hai conseguito la specializzazione tramite un percorso selettivo (es. TFA Sostegno)?</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => onChange('bonusId', 'tfa_sostegno')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                      data.bonusId === 'tfa_sostegno'
                        ? 'border-yellow-600 bg-yellow-100 text-yellow-900 font-bold shadow-sm'
                        : 'border-yellow-200 bg-white text-gray-600 hover:border-yellow-400'
                    }`}
                  >
                    SÌ (+12 Punti)
                  </button>
                  <button
                    onClick={() => onChange('bonusId', '')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                      data.bonusId === ''
                        ? 'border-gray-400 bg-gray-100 text-gray-900 font-bold shadow-sm'
                        : 'border-yellow-200 bg-white text-gray-600 hover:border-yellow-400'
                    }`}
                  >
                    NO
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-3">
                  Seleziona SÌ se l'accesso al corso di specializzazione è avvenuto tramite prove selettive.
                </p>
              </div>
            ) : (
              // Posto Comune Question
              <div>
                <label className="block font-medium text-yellow-800 mb-2">Il tuo titolo di abilitazione rientra in una di queste casistiche?</label>
                <select 
                  value={data.bonusId} 
                  onChange={(e) => onChange('bonusId', e.target.value)}
                  className="w-full p-4 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 bg-white text-lg"
                >
                  <option value="">Nessun percorso specifico / Vecchio ordinamento</option>
                  {config.bonus_abilitazione_fascia_1.opzioni
                    .filter(opt => opt.id !== 'tfa_sostegno')
                    .map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} (+{opt.punti} pt)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2Access;
