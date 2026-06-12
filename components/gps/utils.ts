import { GPSState } from './types';
import { GPS_CONFIG } from './config';
import { parseISO, differenceInDays, getYear, getMonth, eachDayOfInterval } from 'date-fns';

export const calculateAccessScore = (state: GPSState) => {
  return getDetailedAccessReport(state).total;
};

export const calculateCulturalScore = (state: GPSState) => {
  return getDetailedCulturalReport(state).total;
};

// Service Calculation Helpers
const getSchoolYearFromDate = (date: Date) => {
  const year = getYear(date);
  const month = getMonth(date) + 1; // 1-12
  // School year starts Sept 1st.
  // Sept 2023 -> 2023/2024 (return 2023)
  // Jan 2024 -> 2023/2024 (return 2023)
  if (month >= 9) return year;
  return year - 1;
};

const getPointsFromDays = (days: number) => {
  if (days >= 166) return 12;
  if (days >= 136) return 10;
  if (days >= 106) return 8;
  if (days >= 76) return 6;
  if (days >= 46) return 4;
  if (days >= 16) return 2;
  return 0;
};

export const extractCdcCode = (input: string): string => {
  if (!input) return '';
  // Take the first word (e.g., "A-45" from "A-45 SCIENZE...")
  const firstWord = input.trim().split(/\s+/)[0].toUpperCase();
  // Remove non-alphanumeric characters (e.g., "A-45" -> "A45")
  // Wait, if we remove the hyphen, A-45 becomes A45. Let's keep the hyphen if it exists, or just standardize it.
  // Actually, keeping it alphanumeric is fine, but let's make sure we compare apples to apples.
  return firstWord.replace(/[^A-Z0-9-]/g, '');
};

const getGradeFromSostegnoCdc = (cdc: string): string | null => {
  const cleanCdc = cdc.replace(/[^A-Z]/g, '');
  if (cleanCdc === 'ADAA') return 'Infanzia';
  if (cleanCdc === 'ADEE') return 'Primaria';
  if (cleanCdc === 'ADMM') return 'Secondaria I';
  if (cleanCdc === 'ADSS') return 'Secondaria II';
  return null;
};

export const isServiceSpecific = (entryCdc: string, targetCdc: string, targetGrade: string): boolean => {
  const cleanEntryCdc = extractCdcCode(entryCdc);
  const cleanTargetCdc = extractCdcCode(targetCdc);
  
  // Exact match is always specific
  if (cleanEntryCdc === cleanTargetCdc) return true;

  // "Il servizio prestato sul sostegno è valutato come specifico per la graduatoria di sostegno dello stesso grado e come specifico (quindi al 100%) per tutte le altre classi di concorso dello stesso grado."
  const entrySostegnoGrade = getGradeFromSostegnoCdc(cleanEntryCdc);
  if (entrySostegnoGrade) {
    // The service was performed on Sostegno.
    // Is it the same grade as the target ranking?
    if (entrySostegnoGrade === targetGrade) {
      return true;
    }
  }

  return false;
};

export const calculateServiceScore = (state: GPSState) => {
  return getDetailedServiceReport(state).total;
};

// Detailed Report Helpers
export const getDetailedAccessReport = (state: GPSState) => {
  const { vote, voteBase, isLode, bonusId } = state.accessTitle;
  const { fascia, cdc } = state.setup;
  const config = GPS_CONFIG.gps_config.titolo_accesso;
  
  const items: { label: string; points: number }[] = [];
  let score = 0;

  const calculateLaureaScore = () => {
      let s = 0;
      const lVote = state.setup.laureaVote || 0;
      const lBase = state.setup.laureaVoteBase || 110;
      const lLode = state.setup.laureaLode || false;
      
      if (lVote > 0) {
        const normalized = (lVote / lBase) * 110;
        let baseScore = 12 + ((normalized - 76) * 0.50);
        if (baseScore < 12) baseScore = 12;
        items.push({ label: `Voto Laurea/Diploma (${lVote}/${lBase})`, points: parseFloat(baseScore.toFixed(2)) });
        s += baseScore;
      }
      if (lLode) {
        items.push({ label: 'Lode', points: 4 });
        s += 4;
      }
      return s;
  };

  const isSostegnoFascia1 = fascia === 'I Fascia' && (cdc.startsWith('AD') || cdc.includes('SOSTEGNO'));

  if (isSostegnoFascia1) {
    let normalizedVote = 0;
    if (vote > 0) {
      const base = voteBase || 100;
      normalizedVote = Math.round((vote / base) * 100);
    }
    
    const table = config.tabella_sostegno;
    const range = table?.find(r => normalizedVote >= r.min && normalizedVote <= r.max);
    
    let basePoints = 0;
    if (range) {
      basePoints = range.punti;
    } else {
      if (vote > 0) basePoints = 8;
    }
    
    if (basePoints > 0) {
        items.push({ label: `Titolo di Specializzazione Sostegno (${vote}/${voteBase})`, points: basePoints });
        score += basePoints;
    }

    if (state.accessTitle.hasAbilitazione) {
      let abScore = 24;
      items.push({ label: 'Abilitazione su posto comune (Base)', points: 24 });
      
      const abVote = state.accessTitle.abilitazioneVote || 0;
      const abBase = state.accessTitle.abilitazioneVoteBase || 100;
      const abNormalized = Math.round((abVote / abBase) * 100);
      
      const abTable = GPS_CONFIG.gps_config.titoli_culturali_accademici.tabella_abilitazioni;
      const abRange = abTable?.find(r => abNormalized >= r.min && abNormalized <= r.max);
      
      let extraAbPoints = 0;
      if (abRange) {
        extraAbPoints = abRange.punti;
      } else {
        extraAbPoints = 4;
      }
      
      items.push({ label: `Punteggio aggiuntivo Abilitazione (${abVote}/${abBase})`, points: extraAbPoints });
      abScore += extraAbPoints;
      score += abScore;
    }

  } else {
    const isFascia1PostoComune = fascia === 'I Fascia' && !isSostegnoFascia1;
    
    if (isFascia1PostoComune) {
      let abilScore = 0;
      if (vote > 0) {
        const base = voteBase || 100; 
        const normalizedVote = Math.round((vote / base) * 100);
        const abTable = GPS_CONFIG.gps_config.titoli_culturali_accademici.tabella_abilitazioni;
        const abRange = abTable?.find(r => normalizedVote >= r.min && normalizedVote <= r.max);
        
        let p = 0;
        if (abRange) p = abRange.punti;
        else p = 4;
        
        items.push({ label: `Abilitazione (${vote}/${voteBase})`, points: p });
        abilScore += p;
      } else {
         items.push({ label: `Abilitazione (Voto non inserito o <60)`, points: 4 });
         abilScore += 4;
      }
      
      if (bonusId) {
        const bonus = GPS_CONFIG.gps_config.bonus_abilitazione_fascia_1.opzioni.find(b => b.id === bonusId);
        if (bonus) {
          items.push({ label: `Bonus: ${bonus.label}`, points: bonus.punti });
          abilScore += bonus.punti;
        }
      }
      score += abilScore;
    } else {
      score += calculateLaureaScore();
    }
  }

  if (fascia === 'I Fascia') {
    if (isSostegnoFascia1) {
      items.push({ label: 'TFA Sostegno / Percorso Selettivo', points: 12 });
      score += 12;
    }
  }

  return { total: parseFloat(score.toFixed(2)), items };
};

export const getDetailedCulturalReport = (state: GPSState) => {
  const { culturalTitles } = state;
  const langConfig = GPS_CONFIG.gps_config.certificazioni_linguistiche;
  const academicConfig = GPS_CONFIG.gps_config.titoli_culturali_accademici;

  const items: { label: string; points: number }[] = [];
  let score = 0;

  if (culturalTitles.dottorato) {
     const phdPoints = academicConfig.titoli_singoli.find(t => t.id === 'dottorato')?.punti || 12;
     items.push({ label: 'Dottorato di Ricerca', points: phdPoints });
     score += phdPoints;
  }
  if (culturalTitles.asn) {
      items.push({ label: 'Abilitazione Scientifica Nazionale', points: 12 });
      score += 12;
  }
  
  if (culturalTitles.hasAbilitazione && culturalTitles.abilitazioni_count > 0) {
    const pts = culturalTitles.abilitazioni_count * 3;
    items.push({ label: `Altre Abilitazioni (${culturalTitles.abilitazioni_count})`, points: pts });
    score += pts;
  }
  
  if (culturalTitles.hasConcorso && culturalTitles.concorsi.length > 0) {
    const pts = culturalTitles.concorsi.length * 3;
    items.push({ label: `Concorsi Ordinari (${culturalTitles.concorsi.length})`, points: pts });
    score += pts;
  }
  
  if (culturalTitles.hasL2) {
    items.push({ label: 'Titolo di Specializzazione in Italiano L2', points: 3 });
    score += 3;
  }
  
  if (culturalTitles.specializzazione_sostegno_extra.length > 0) {
    const pts = culturalTitles.specializzazione_sostegno_extra.length * 9;
    items.push({ label: `Specializzazioni Sostegno Extra (${culturalTitles.specializzazione_sostegno_extra.length})`, points: pts });
    score += pts;
  }

  let formazioneCount = 0;
  if (culturalTitles.hasMaster) formazioneCount += culturalTitles.master_count;
  if (culturalTitles.hasPerfezionamento) formazioneCount += culturalTitles.perfezionamento_count;
  
  const validFormazione = Math.min(formazioneCount, 3);
  if (validFormazione > 0) {
      items.push({ label: `Master/Perfezionamenti (${validFormazione})`, points: validFormazione });
      score += validFormazione;
  }

  culturalTitles.languages.forEach(lang => {
    const lConfig = langConfig.livelli.find(l => l.id === lang.level);
    if (lConfig) {
        items.push({ label: `Certificazione Linguistica ${lang.level}`, points: lConfig.punti });
        score += lConfig.punti;
    }
  });

  if (culturalTitles.hasClil) {
    if (culturalTitles.languages.length > 0) {
      items.push({ label: 'Corso CLIL (con Cert. Linguistica)', points: 3 });
      score += 3;
    } else {
      items.push({ label: 'Corso CLIL (senza Cert. Linguistica)', points: 1 });
      score += 1;
    }
  }

  let itScore = 0;
  const itItems: string[] = [];
  
  if (culturalTitles.hasOldItCertificationsMax) {
      itScore = 2;
      itItems.push("Vecchie Cert. (2pt)");
      
      culturalTitles.itCertifications.forEach(certId => {
          if (certId === 'digcomp_22') { itScore += 1; itItems.push("DigComp 2.2 (1pt)"); }
          else if (certId === 'digcomp_edu') { itScore += 2; itItems.push("DigComp Edu (2pt)"); }
      });
      
      if (itScore > 4) itScore = 4;
  } else {
      culturalTitles.itCertifications.forEach(certId => {
        if (certId === 'digcomp_22') { itScore += 1; itItems.push("DigComp 2.2 (1pt)"); }
        else if (certId === 'digcomp_edu') { itScore += 2; itItems.push("DigComp Edu (2pt)"); }
        else { itScore += 0.5; itItems.push("Cert. Standard (0.5pt)"); }
      });
      if (itScore > 4) itScore = 4;
  }

  if (itScore > 0) {
      items.push({ label: `Certificazioni Informatiche: ${itItems.join(', ')}`, points: itScore });
      score += itScore;
  }

  return { total: parseFloat(score.toFixed(2)), items };
};

export const getDetailedServiceReport = (state: GPSState) => {
  const { service, setup } = state;
  const targetGrade = setup.grade;
  const items: { label: string; points: number }[] = [];
  
  // Group by Year, then by CDC
  const years: Record<number, Record<string, { specific: boolean, days: number }>> = {};

  service.forEach(entry => {
    const isSpecific = isServiceSpecific(entry.cdc, setup.cdc, targetGrade);
    const cdcCode = extractCdcCode(entry.cdc);

    const addDaysToYear = (y: number, d: number) => {
      if (!years[y]) years[y] = {};
      if (!years[y][cdcCode]) years[y][cdcCode] = { specific: isSpecific, days: 0 };
      years[y][cdcCode].days += d;
      // If any service on this CDC in this year is specific, the whole CDC is specific for that year
      if (isSpecific) years[y][cdcCode].specific = true;
    };

    if (entry.year) {
      addDaysToYear(entry.year, 166);
    } else if (entry.startDate && entry.endDate) {
      const start = parseISO(entry.startDate);
      const end = parseISO(entry.endDate);
      try {
        const days = eachDayOfInterval({ start, end });
        days.forEach(day => {
          addDaysToYear(getSchoolYearFromDate(day), 1);
        });
      } catch (e) {}
    }
  });

  let totalScore = 0;
  Object.keys(years).sort((a, b) => parseInt(b) - parseInt(a)).forEach(yStr => {
    const y = parseInt(yStr);
    const cdcData = years[y];
    
    let yearScore = 0;
    let details: string[] = [];

    Object.keys(cdcData).forEach(cdc => {
      const data = cdcData[cdc];
      const pts = getPointsFromDays(data.days);
      const finalPts = data.specific ? pts : pts * 0.5;
      
      yearScore += finalPts;
      details.push(`${cdc}: ${data.days}gg ${data.specific ? 'Spec.' : 'Asp.'} (${finalPts}pt)`);
    });

    if (yearScore > 12) yearScore = 12;
    
    let label = `Anno Scolastico ${y}/${y+1}`;
    items.push({ label: `${label} (${details.join(', ')})`, points: parseFloat(yearScore.toFixed(2)) });
    totalScore += yearScore;
  });

  return { total: parseFloat(totalScore.toFixed(2)), items };
};
