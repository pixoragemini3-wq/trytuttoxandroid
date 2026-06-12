export const GPS_CONFIG = {
  "gps_config": {
    "versione_ordinanza": "2026-2028",
    "titolo_accesso": {
      "descrizione": "Calcolo del punteggio di laurea/abilitazione di base",
      "formula": "12 + ((voto_convertito - 76) * 0.50)",
      "bonus_lode": 0.50,
      "punteggio_minimo": 12,
      "punteggio_massimo_base": 29,
      "tabella_sostegno": [
        { "min": 60, "max": 65, "punti": 8 },
        { "min": 66, "max": 70, "punti": 10 },
        { "min": 71, "max": 75, "punti": 12 },
        { "min": 76, "max": 80, "punti": 14 },
        { "min": 81, "max": 85, "punti": 16 },
        { "min": 86, "max": 90, "punti": 18 },
        { "min": 91, "max": 95, "punti": 22 },
        { "min": 96, "max": 100, "punti": 24 }
      ]
    },
    "bonus_abilitazione_fascia_1": {
      "descrizione": "Punteggi forfettari aggiuntivi per chi si inserisce in prima fascia in base al percorso",
      "opzioni": [
        { "id": "concorso_ordinario", "label": "Superamento Concorso Ordinario", "punti": 24 },
        { "id": "percorsi_60cfu", "label": "Percorsi abilitanti 60 CFU", "punti": 24 },
        { "id": "percorsi_30cfu", "label": "Percorsi abilitanti 30/36 CFU", "punti": 24 },
        { "id": "tfa_sostegno", "label": "TFA Sostegno / Percorso Selettivo", "punti": 12 }
      ]
    },
    "titoli_culturali_accademici": {
      "titoli_singoli": [
        { "id": "dottorato", "label": "Dottorato di Ricerca", "punti": 14, "max_inserimenti": 1 },
        { "id": "asn", "label": "Abilitazione Scientifica Nazionale", "punti": 12, "max_inserimenti": 1 },
        { "id": "specializzazione_sostegno_extra", "label": "Specializzazione Sostegno (se NON titolo accesso)", "punti": 9, "max_inserimenti": null }
      ],
      "formazione_continua": {
        "limite_globale_titoli": 3,
        "opzioni": [
          { "id": "master", "label": "Master I o II livello (60 CFU)", "punti": 1 },
          { "id": "perfezionamento", "label": "Corso di Perfezionamento (1500 ore / 60 CFU)", "punti": 1 }
        ]
      },
      "abilitazioni_idoneita_extra": [
        { "id": "abilitazione_altra_cdc", "label": "Abilitazione su altra Classe di Concorso", "punti": 3, "max_inserimenti": null },
        { "id": "idoneita_concorso", "label": "Idoneità in concorso pubblico", "punti": 3, "max_inserimenti": null }
      ],
      "tabella_abilitazioni": [
        { "min": 60, "max": 65, "punti": 4 },
        { "min": 66, "max": 70, "punti": 5 },
        { "min": 71, "max": 75, "punti": 6 },
        { "min": 76, "max": 80, "punti": 7 },
        { "min": 81, "max": 85, "punti": 8 },
        { "min": 86, "max": 90, "punti": 9 },
        { "min": 91, "max": 95, "punti": 11 },
        { "min": 96, "max": 100, "punti": 12 }
      ]
    },
    "certificazioni_linguistiche": {
      "livelli": [
        { "id": "B2", "label": "Livello B2", "punti": 3 },
        { "id": "C1", "label": "Livello C1", "punti": 4 },
        { "id": "C2", "label": "Livello C2", "punti": 6 }
      ],
      "regole": {
        "max_inserimenti_per_lingua": 1
      },
      "clil": {
        "label": "Corso CLIL",
        "punti": 3,
        "vincolo": "richiede_certificazione_linguistica_associata"
      }
    },
    "certificazioni_informatiche": {
      "limite_punti_sezione": 2,
      "opzioni": [
        { "id": "info_base", "label": "Certificazioni Informatiche (EIPASS, PEKIT, DigComp, ecc.)", "punti": 0.5, "max_inserimenti": 4 }
      ]
    },
    "servizio": {
      "massimali": {
        "punti_max_anno": 12,
        "giorni_max_valutabili_anno": 180,
        "giorni_per_punteggio_pieno": 166
      },
      "scaglioni_giorni": [
        { "min": 16, "max": 45, "punti": 2 },
        { "min": 46, "max": 75, "punti": 4 },
        { "min": 76, "max": 105, "punti": 6 },
        { "min": 106, "max": 135, "punti": 8 },
        { "min": 136, "max": 165, "punti": 10 },
        { "min": 166, "max": 365, "punti": 12 }
      ],
      "moltiplicatori": {
        "specifico": 1.0,
        "aspecifico": 0.5
      },
      "regole_speciali": [
        { "id": "servizio_ininterrotto", "descrizione": "Servizio dal 1 febbraio fino agli scrutini vale 12 punti a prescindere dal conteggio giorni totali", "forza_punti": 12 },
        { "id": "sostegno_incrociato", "descrizione": "Il servizio su sostegno si valuta come specifico sulla classe di concorso da cui si è stati convocati", "moltiplicatore_forzato": 1.0 }
      ]
    }
  }
};
