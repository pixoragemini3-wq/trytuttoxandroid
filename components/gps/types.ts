export type Grade = 'Infanzia' | 'Primaria' | 'Secondaria I' | 'Secondaria II';
export type PostType = 'Comune' | 'Sostegno' | 'ITP';
export type Fascia = 'I Fascia' | 'II Fascia';

export interface ServiceEntry {
  id: string;
  startDate: string;
  endDate: string;
  year: number | null; // For "Anno Intero"
  isSpecific: boolean; // Specifico vs Aspecifico
  cdc: string; // Optional if year is set, but good for reference
  note: string;
}

export interface CulturalTitlesState {
  dottorato: boolean;
  asn: boolean;
  specializzazione_sostegno_extra: string[]; // List of grades: 'ADAA', 'ADEE', 'ADMM', 'ADSS'
  
  hasMaster: boolean;
  master_count: number;
  
  hasPerfezionamento: boolean;
  perfezionamento_count: number;
  
  hasAbilitazione: boolean;
  abilitazioni_count: number;
  abilitazioni: { cdc: string; vote: number; voteBase: number }[];
  
  hasConcorso: boolean;
  concorsi: { description: string }[];
  
  hasL2: boolean;
  
  languages: { level: 'B2' | 'C1' | 'C2' }[];
  hasClil: boolean;
  
  itCertifications: string[]; // List of IDs
  hasOldItCertificationsMax: boolean; // User declares they already have 2 points from old certs
}

export interface GPSState {
  setup: {
    grade: Grade | '';
    postType: PostType | '';
    fascia: Fascia | '';
    cdc: string;
    laureaVote?: number;
    laureaVoteBase?: number;
    laureaLode?: boolean;
  };
  accessTitle: {
    vote: number;
    voteBase: number; // 110, 100, or 30
    isLode: boolean;
    bonusId: string; // for I Fascia
    hasAbilitazione?: boolean;
    abilitazioneCdc?: string;
    abilitazioneVote?: number;
    abilitazioneVoteBase?: number;
  };
  culturalTitles: CulturalTitlesState;
  service: ServiceEntry[];
}

export const INITIAL_STATE: GPSState = {
  setup: {
    grade: '',
    postType: '',
    fascia: '',
    cdc: '',
  },
  accessTitle: {
    vote: 0,
    voteBase: 110,
    isLode: false,
    bonusId: '',
  },
  culturalTitles: {
    dottorato: false,
    asn: false,
    specializzazione_sostegno_extra: [],
    hasMaster: false,
    master_count: 0,
    hasPerfezionamento: false,
    perfezionamento_count: 0,
    hasAbilitazione: false,
    abilitazioni_count: 0,
    abilitazioni: [],
    hasConcorso: false,
    concorsi: [],
    hasL2: false,
    languages: [],
    hasClil: false,
    itCertifications: [],
    hasOldItCertificationsMax: false,
  },
  service: [],
};

export interface SavedSimulation {
  id: string;
  date: string;
  state: GPSState;
  scores: {
    access: number;
    cultural: number;
    service: number;
    total: number;
  };
}
