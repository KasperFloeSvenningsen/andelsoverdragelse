import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'blomfelt.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS foreninger (
      id          INTEGER PRIMARY KEY,
      kundenr     TEXT UNIQUE,
      navn        TEXT NOT NULL,
      adresse     TEXT,
      postnr      TEXT,
      by          TEXT,
      leverandor_vurdering  TEXT DEFAULT 'Cera',
      leverandor_el         TEXT DEFAULT 'Cera',
      leverandor_vvs        TEXT DEFAULT 'Cera',
      cera_email            TEXT DEFAULT 'bestilling@cera.dk',
      krav_el               INTEGER DEFAULT 1,
      krav_vvs              INTEGER DEFAULT 1,
      intern_dage           INTEGER DEFAULT 14,
      ekstern_platform      TEXT DEFAULT 'andelshandel.dk',
      tilbagehold_fejl      INTEGER DEFAULT 30000,
      tilbagehold_depot     INTEGER DEFAULT 10000,
      tilbagehold_vv        INTEGER DEFAULT 4000,
      indsigelse_dage       INTEGER DEFAULT 21,
      elselskab             TEXT DEFAULT 'EWII',
      vv_aflaeser           TEXT DEFAULT 'Brunata',
      min_overtagelse_uger  INTEGER DEFAULT 6
    );

    CREATE TABLE IF NOT EXISTS andelshavere (
      id          INTEGER PRIMARY KEY,
      forening_id INTEGER NOT NULL,
      lejemaal    INTEGER,
      beliggenhed TEXT,
      navn        TEXT,
      email       TEXT,
      telefon     TEXT,
      indflyttet  TEXT,
      fraflyttet  TEXT,
      bbr_areal   INTEGER,
      bruttoareal INTEGER,
      FOREIGN KEY (forening_id) REFERENCES foreninger(id)
    );

    CREATE TABLE IF NOT EXISTS sager (
      id              INTEGER PRIMARY KEY,
      token           TEXT UNIQUE NOT NULL,
      forening_id     INTEGER NOT NULL,
      andelshaver_id  INTEGER,
      sælger_navn     TEXT,
      sælger_email    TEXT,
      sælger_telefon  TEXT,
      sælger_adresse  TEXT,
      status          TEXT DEFAULT 'anmodet',
      oprettet        TEXT NOT NULL,
      opdateret       TEXT NOT NULL,
      token_udloeber  TEXT NOT NULL,
      andelsbevis_mangler INTEGER DEFAULT 0,
      ønsket_overtagelse  TEXT,
      bankkonto           TEXT,
      adgang_kontakt      TEXT,
      adgang_note         TEXT,
      FOREIGN KEY (forening_id) REFERENCES foreninger(id),
      FOREIGN KEY (andelshaver_id) REFERENCES andelshavere(id)
    );

    CREATE TABLE IF NOT EXISTS forbedringer (
      id        INTEGER PRIMARY KEY,
      sag_id    INTEGER NOT NULL,
      beskrivelse TEXT,
      aar       INTEGER,
      beloeb    INTEGER,
      FOREIGN KEY (sag_id) REFERENCES sager(id)
    );

    CREATE TABLE IF NOT EXISTS mangler (
      id        INTEGER PRIMARY KEY,
      sag_id    INTEGER NOT NULL,
      beskrivelse TEXT,
      udbedres  INTEGER DEFAULT 0,
      FOREIGN KEY (sag_id) REFERENCES sager(id)
    );

    CREATE TABLE IF NOT EXISTS rapporter (
      id          INTEGER PRIMARY KEY,
      sag_id      INTEGER NOT NULL,
      type        TEXT,
      status      TEXT DEFAULT 'bestilt',
      bestilt     TEXT,
      modtaget    TEXT,
      leverandor  TEXT,
      FOREIGN KEY (sag_id) REFERENCES sager(id)
    );

    CREATE TABLE IF NOT EXISTS mail_queue (
      id        INTEGER PRIMARY KEY,
      sag_id    INTEGER,
      til       TEXT,
      emne      TEXT,
      body      TEXT,
      status    TEXT DEFAULT 'pending',
      oprettet  TEXT,
      sendt     TEXT
    );
  `)
}

export type Forening = {
  id: number
  kundenr: string
  navn: string
  adresse: string
  postnr: string
  by: string
  leverandor_vurdering: string
  krav_el: number
  krav_vvs: number
  intern_dage: number
  ekstern_platform: string
  tilbagehold_fejl: number
  tilbagehold_depot: number
  tilbagehold_vv: number
  indsigelse_dage: number
  elselskab: string
  vv_aflaeser: string
  min_overtagelse_uger: number
}

export type Andelshaver = {
  id: number
  forening_id: number
  lejemaal: number
  beliggenhed: string
  navn: string
  email: string
  telefon: string
  indflyttet: string
  fraflyttet: string | null
  bbr_areal: number
  bruttoareal: number
}

export type Sag = {
  id: number
  token: string
  forening_id: number
  andelshaver_id: number | null
  sælger_navn: string
  sælger_email: string
  sælger_telefon: string
  sælger_adresse: string
  status: string
  oprettet: string
  opdateret: string
  token_udloeber: string
}

export const STATUS_LABELS: Record<string, string> = {
  anmodet:            'Link sendt',
  data_indsamlet:     'Data modtaget',
  rapporter_bestilt:  'Rapporter bestilt',
  rapport_modtaget:   'Rapport modtaget',
  opstilling_klar:    'Salgsopstilling klar',
  udbudt_intern:      'Udbudt – intern liste',
  udbudt_ekstern:     'Udbudt – ekstern liste',
  koeber_fundet:      'Køber fundet',
  overdragelse_klar:  'Overdragelsesaftale klar',
  underskrevet:       'Underskrevet',
  fortrydelse:        'Fortrydelsesret løber',
  betalt:             'Betaling modtaget',
  afsluttet:          'Afsluttet',
}

export const STATUS_COLORS: Record<string, string> = {
  anmodet:            'bg-gray-100 text-gray-700',
  data_indsamlet:     'bg-blue-100 text-blue-700',
  rapporter_bestilt:  'bg-yellow-100 text-yellow-700',
  rapport_modtaget:   'bg-yellow-200 text-yellow-800',
  opstilling_klar:    'bg-orange-100 text-orange-700',
  udbudt_intern:      'bg-purple-100 text-purple-700',
  udbudt_ekstern:     'bg-purple-200 text-purple-800',
  koeber_fundet:      'bg-indigo-100 text-indigo-700',
  overdragelse_klar:  'bg-cyan-100 text-cyan-700',
  underskrevet:       'bg-teal-100 text-teal-700',
  fortrydelse:        'bg-orange-200 text-orange-800',
  betalt:             'bg-green-100 text-green-700',
  afsluttet:          'bg-green-200 text-green-800',
}
