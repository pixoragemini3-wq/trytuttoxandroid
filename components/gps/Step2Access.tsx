import React from 'react';
import { GPSState, PostType } from './types';
import { GPS_CONFIG } from './config';

interface Step2Props {
  data: GPSState['accessTitle'];
  setupData: GPSState['setup'];
  fascia: GPSState['setup']['fascia'];
  postType: PostType | '';
  cdc: string;
  onChange: (field: keyof GPSState['accessTitle'], value: any) => void;
}

const Step2Access: React.FC<Step2Props> = ({ data, setupData, fascia, postType, cdc, onChange }) => {
  const isFascia1 = fascia === 'I Fascia';
  const isSostegno = postType === 'Sostegno';
  const config = GPS_CONFIG.gps_config;

  const getTitleLabel = () => {
    if (isSostegno) {
      if (!isFascia1) return "Titolo di Accesso (Sostegno II Fascia)";
      if (cdc === 'ADSS') return "Titolo di Specializzazione su Sostegno (Secondaria II Grado)";
      if (cdc === 'ADMM') return "Titolo di Specializzazione su Sostegno (Secondaria I Grado)";
      if (cdc === 'ADEE') return "Titolo di Specializzazione su Sostegno (Primaria)";
      if (cdc === 'ADAA') return "Titolo di Specializzazione su Sostegno (Infanzia)";
      return "Titolo di Specializzazione su Sostegno";
    }
    if (isFascia1) {
      return `Abilitazione (Titolo di Accesso per ${cdc})`;
    }
    return `Titolo di Studio (Titolo di Accesso per ${cdc})`;
  };

  const handleVoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 0;
    
    // Auto-detect base
    let newBase = data.voteBase || 110;
    if (val > 0 && val <= 10) newBase = 10;
    else if (val > 10 && val <= 30) newBase = 30;
    else if (val > 30 && val <= 100) newBase = 100;
    else if (val > 100) newBase = 110;

    if (newBase !== data.voteBase) {
      onChange('voteBase', newBase);
    }

    const max = newBase;
    if (val > max) val = max;
    onChange('vote', val);

    // Reset lode if vote is not max
    if (val < max && data.isLode) {
      onChange('isLode', false);
    }
  };

  const handleBaseChange = (newBase: number) => {
    onChange('voteBase', newBase);
    if (data.vote > newBase) {
      onChange('vote', newBase);
    } else if (data.vote < newBase && data.isLode) {
      onChange('isLode', false);
    }
  };

  const canHaveLode = data.vote === (data.voteBase || 110) && data.vote > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
        <h3 className="font-bold text-green-900">{getTitleLabel()}</h3>
        <p className="text-sm text-green-700">
          {!isFascia1 
            ? "Il punteggio è calcolato sulla base del voto di laurea/diploma inserito nel passaggio precedente."
            : isSostegno
              ? "Inserisci il voto del tuo titolo di specializzazione. Se il voto è espresso in 30esimi, seleziona la base 30."
              : "Inserisci il voto della tua abilitazione."}
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Bonus Questions (Context Aware) */}
        {isFascia1 && !isSostegno && (
          <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-200 animate-in fade-in slide-in-from-top-4">
            <h4 className="text-lg font-bold text-yellow-900 mb-4">1. Dettagli del percorso</h4>
            
            {/* Posto Comune Question */}
            <div>
              <p className="mb-3 font-medium text-yellow-800">Seleziona il tipo di abilitazione conseguita:</p>
              <div className="grid grid-cols-1 gap-3">
                {config.bonus_abilitazione_fascia_1.opzioni
                  .filter(opt => opt.id !== 'tfa_sostegno') // Exclude TFA Sostegno for Posto Comune
                  .map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => onChange('bonusId', data.bonusId === opt.id ? '' : opt.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left flex justify-between items-center ${
                      data.bonusId === opt.id
                        ? 'border-yellow-600 bg-yellow-100 text-yellow-900 font-bold shadow-sm'
                        : 'border-yellow-200 bg-white text-gray-600 hover:border-yellow-400'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">+{opt.punti} pt</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-yellow-700 mt-3">
                Seleziona l'opzione corrispondente al tuo percorso di abilitazione per ottenere il punteggio aggiuntivo.
              </p>
            </div>
          </div>
        )}

        {/* 2. Voto */}
        {/* If II Fascia (Posto Comune or Sostegno), show summary. If I Fascia, show input. */}
        {!isFascia1 ? (
          <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm">
             <h4 className="text-lg font-bold text-gray-800 mb-2">Voto del Titolo di Accesso</h4>
             <div className="flex items-center gap-4">
               <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                 <span className="text-gray-500 text-sm block">Voto inserito</span>
                 <span className="font-mono font-bold text-xl text-gray-900">{setupData.laureaVote}/{setupData.laureaVoteBase || 110} {setupData.laureaLode ? 'con Lode' : ''}</span>
               </div>
             </div>
             <p className="text-sm text-gray-500 mt-4">
               Questo voto è stato inserito nel passaggio precedente e viene utilizzato per calcolare il punteggio base.
             </p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border-2 border-gray-100 shadow-sm">
          <label className="block text-lg font-bold text-gray-800 mb-4">
            {isSostegno 
              ? (isFascia1 ? "2. Con quale voto hai conseguito l'abilitazione sul sostegno?" : "1. Con quale voto hai conseguito l'abilitazione sul sostegno?")
              : (isFascia1 ? "2. Con quale voto hai conseguito l'abilitazione?" : "1. Con quale voto hai conseguito il titolo?")}
          </label>
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input 
                type="number" 
                min="0" 
                max={data.voteBase || 110} 
                value={data.vote || ''} 
                onChange={handleVoteChange}
                placeholder={`Voto (max ${data.voteBase || 110})`}
                className="w-full md:w-48 p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-2xl font-mono text-center font-bold"
              />
            </div>

            {/* Quick Fill from Laurea (I Fascia Posto Comune) */}
            {isFascia1 && !isSostegno && setupData.laureaVote && (
              <button
                onClick={() => {
                  onChange('vote', setupData.laureaVote);
                  onChange('voteBase', setupData.laureaVoteBase || 110);
                  onChange('isLode', setupData.laureaLode || false);
                }}
                className="text-sm text-green-700 underline hover:text-green-900 bg-green-50 px-3 py-2 rounded-lg border border-green-200"
              >
                Usa voto di laurea ({setupData.laureaVote}/{setupData.laureaVoteBase || 110})
              </button>
            )}

            <label className={`flex items-center gap-3 cursor-pointer select-none border-2 p-4 rounded-xl transition-all ${
              !canHaveLode ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' :
              data.isLode 
                ? 'border-green-500 bg-green-50 text-green-900' 
                : 'border-gray-200 hover:border-green-300'
            }`}>
              <input 
                type="checkbox" 
                checked={data.isLode} 
                disabled={!canHaveLode}
                onChange={(e) => onChange('isLode', e.target.checked)}
                className="w-6 h-6 text-green-600 rounded focus:ring-green-500 disabled:opacity-50"
              />
              <span className="font-bold">Con Lode</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Seleziona la base del voto:</label>
            <div className="flex flex-wrap gap-2">
              {[110, 100, 30, 10].map(b => (
                <button
                  key={b}
                  onClick={() => handleBaseChange(b)}
                  className={`px-6 py-3 rounded-xl font-bold transition-colors border-2 ${
                    data.voteBase === b 
                      ? 'bg-green-50 border-green-500 text-green-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-green-300'
                  }`}
                >
                  su {b}
                </button>
              ))}
            </div>
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

          {!canHaveLode && data.vote > 0 && (
            <p className="text-xs text-orange-600 font-bold mt-2">
              La lode è selezionabile solo con il punteggio massimo ({data.voteBase || 110}).
            </p>
          )}
        </div>
        )}

        {/* 3. Abilitazione per Sostegno I Fascia */}
        {isSostegno && isFascia1 && (
          <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-4">
            <h4 className="text-lg font-bold text-blue-900 mb-4">3. Abilitazione su altra CdC (Punto B.1 Tab. A/7)</h4>
            <p className="text-sm text-blue-700 mb-4">
              Hai un'abilitazione su una classe di concorso del medesimo grado (es. su materia)? 
              <br/>
              <span className="font-bold">Nota:</span> Se la tua laurea è stata titolo di accesso per questa abilitazione, verrà "assorbita" e non valutata separatamente.
            </p>
            
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => onChange('hasAbilitazione', true)}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                  data.hasAbilitazione
                    ? 'border-blue-600 bg-blue-100 text-blue-900 font-bold shadow-sm'
                    : 'border-blue-200 bg-white text-gray-600 hover:border-blue-400'
                }`}
              >
                SÌ
              </button>
              <button
                onClick={() => {
                  onChange('hasAbilitazione', false);
                  onChange('abilitazioneVote', undefined);
                  onChange('abilitazioneVoteBase', undefined);
                  onChange('abilitazioneCdc', undefined);
                }}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                  !data.hasAbilitazione
                    ? 'border-gray-400 bg-gray-100 text-gray-900 font-bold shadow-sm'
                    : 'border-blue-200 bg-white text-gray-600 hover:border-blue-400'
                }`}
              >
                NO
              </button>
            </div>

            {data.hasAbilitazione && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-2">Classe di Concorso dell'Abilitazione</label>
                  <input 
                    list="cdc-abilitazione-list"
                    type="text" 
                    value={data.abilitazioneCdc || ''} 
                    onChange={(e) => onChange('abilitazioneCdc', e.target.value.toUpperCase())}
                    placeholder="es. A-22, A-12..."
                    className="w-full p-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white uppercase font-mono"
                  />
                  <datalist id="cdc-abilitazione-list">
                    {['A-01', 'A-11', 'A-12', 'A-13', 'A-18', 'A-19', 'A-20', 'A-21', 'A-22', 'A-24', 'A-26', 'A-27', 'A-28', 'A-45', 'A-46', 'A-47', 'A-48', 'A-49', 'A-50', 'A-60', 'B-02', 'B-16', 'B-20'].map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-2">Voto dell'Abilitazione</label>
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <input 
                      type="number" 
                      min="0" 
                      max={data.abilitazioneVoteBase || 100} 
                      value={data.abilitazioneVote || ''} 
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val)) val = 0;
                        
                        let newBase = data.abilitazioneVoteBase || 100;
                        if (val > 0 && val <= 10) newBase = 10;
                        else if (val > 10 && val <= 30) newBase = 30;
                        else if (val > 30 && val <= 100) newBase = 100;
                        else if (val > 100) newBase = 110;
                        
                        if (newBase !== data.abilitazioneVoteBase) {
                            onChange('abilitazioneVoteBase', newBase);
                        }
                        
                        const max = newBase;
                        if (val > max) val = max;
                        onChange('abilitazioneVote', val);
                      }}
                      placeholder={`Voto (max ${data.abilitazioneVoteBase || 100})`}
                      className="w-full md:w-48 p-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-mono text-center font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">Base del voto dell'abilitazione:</label>
                  <div className="flex flex-wrap gap-2">
                    {[110, 100, 30, 10].map(b => (
                      <button
                        key={b}
                        onClick={() => {
                          onChange('abilitazioneVoteBase', b);
                          if ((data.abilitazioneVote || 0) > b) onChange('abilitazioneVote', b);
                        }}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors border-2 ${
                          (data.abilitazioneVoteBase || 100) === b 
                            ? 'bg-blue-500 border-blue-600 text-white' 
                            : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        su {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2Access;
