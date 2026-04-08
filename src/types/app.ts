// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Rechnungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    rechnungsnummer?: string;
    rechnungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    faelligkeitsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    kunde_vorname?: string;
    kunde_nachname?: string;
    kunde_firma?: string;
    kunde_email?: string;
    kunde_telefon?: string;
    kunde_strasse?: string;
    kunde_hausnummer?: string;
    kunde_plz?: string;
    kunde_ort?: string;
    zahlungsbedingungen?: LookupValue;
    bankverbindung?: string;
    bemerkungen?: string;
  };
}

export interface Rechnungspositionen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    rechnung_zuordnung?: string; // applookup -> URL zu 'Rechnungen' Record
    positionsnummer?: number;
    artikel_auswahl?: string; // applookup -> URL zu 'Artikelkatalog' Record
    menge?: number;
    einheit_position?: LookupValue;
    einzelpreis_netto_pos?: number;
    mwst_satz_pos?: LookupValue;
    gesamtbetrag_netto?: number;
    positionsnotiz?: string;
  };
}

export interface Artikelkatalog {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    artikelnummer?: string;
    bezeichnung?: string;
    beschreibung?: string;
    einheit?: LookupValue;
    einzelpreis_netto?: number;
    mwst_satz?: LookupValue;
  };
}

export const APP_IDS = {
  RECHNUNGEN: '69b89166574efe552fa528fa',
  RECHNUNGSPOSITIONEN: '69b8916778e07ae8842ea5b9',
  ARTIKELKATALOG: '69b8916378e0e1c2eef5283c',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'rechnungen': {
    zahlungsbedingungen: [{ key: "sofort", label: "Sofort fällig" }, { key: "tage_7", label: "7 Tage netto" }, { key: "tage_14", label: "14 Tage netto" }, { key: "tage_30", label: "30 Tage netto" }, { key: "tage_60", label: "60 Tage netto" }],
  },
  'rechnungspositionen': {
    einheit_position: [{ key: "stueck", label: "Stück" }, { key: "stunde", label: "Stunde" }, { key: "tag", label: "Tag" }, { key: "monat", label: "Monat" }, { key: "pauschal", label: "Pauschal" }, { key: "kilometer", label: "Kilometer" }, { key: "liter", label: "Liter" }, { key: "kilogramm", label: "Kilogramm" }],
    mwst_satz_pos: [{ key: "mwst_0", label: "0 %" }, { key: "mwst_7", label: "7 %" }, { key: "mwst_19", label: "19 %" }],
  },
  'artikelkatalog': {
    einheit: [{ key: "stueck", label: "Stück" }, { key: "stunde", label: "Stunde" }, { key: "tag", label: "Tag" }, { key: "monat", label: "Monat" }, { key: "pauschal", label: "Pauschal" }, { key: "kilometer", label: "Kilometer" }, { key: "liter", label: "Liter" }, { key: "kilogramm", label: "Kilogramm" }],
    mwst_satz: [{ key: "mwst_0", label: "0 %" }, { key: "mwst_7", label: "7 %" }, { key: "mwst_19", label: "19 %" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'rechnungen': {
    'rechnungsnummer': 'string/text',
    'rechnungsdatum': 'date/date',
    'faelligkeitsdatum': 'date/date',
    'kunde_vorname': 'string/text',
    'kunde_nachname': 'string/text',
    'kunde_firma': 'string/text',
    'kunde_email': 'string/email',
    'kunde_telefon': 'string/tel',
    'kunde_strasse': 'string/text',
    'kunde_hausnummer': 'string/text',
    'kunde_plz': 'string/text',
    'kunde_ort': 'string/text',
    'zahlungsbedingungen': 'lookup/select',
    'bankverbindung': 'string/text',
    'bemerkungen': 'string/textarea',
  },
  'rechnungspositionen': {
    'rechnung_zuordnung': 'applookup/select',
    'positionsnummer': 'number',
    'artikel_auswahl': 'applookup/select',
    'menge': 'number',
    'einheit_position': 'lookup/select',
    'einzelpreis_netto_pos': 'number',
    'mwst_satz_pos': 'lookup/select',
    'gesamtbetrag_netto': 'number',
    'positionsnotiz': 'string/textarea',
  },
  'artikelkatalog': {
    'artikelnummer': 'string/text',
    'bezeichnung': 'string/text',
    'beschreibung': 'string/textarea',
    'einheit': 'lookup/select',
    'einzelpreis_netto': 'number',
    'mwst_satz': 'lookup/select',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateRechnungen = StripLookup<Rechnungen['fields']>;
export type CreateRechnungspositionen = StripLookup<Rechnungspositionen['fields']>;
export type CreateArtikelkatalog = StripLookup<Artikelkatalog['fields']>;