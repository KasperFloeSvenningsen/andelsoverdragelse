// Seed script – bruger CommonJS da det køres direkte med node
// Testdata baseret på anonymiserede data fra AB Haraldsted (6044)
// Haraldsgade 19-51, 2200 København N

const Database = require('better-sqlite3')
const path = require('path')
const crypto = require('crypto')

const DB_PATH = path.join(__dirname, '..', 'blomfelt.db')

function seed() {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS foreninger (
      id INTEGER PRIMARY KEY, kundenr TEXT UNIQUE, navn TEXT NOT NULL,
      adresse TEXT, postnr TEXT, by TEXT,
      leverandor_vurdering TEXT DEFAULT 'Cera', leverandor_el TEXT DEFAULT 'Cera',
      leverandor_vvs TEXT DEFAULT 'Cera', cera_email TEXT DEFAULT 'bestilling@cera.dk',
      krav_el INTEGER DEFAULT 1, krav_vvs INTEGER DEFAULT 1,
      intern_dage INTEGER DEFAULT 14, ekstern_platform TEXT DEFAULT 'andelshandel.dk',
      tilbagehold_fejl INTEGER DEFAULT 30000, tilbagehold_depot INTEGER DEFAULT 10000,
      tilbagehold_vv INTEGER DEFAULT 4000, indsigelse_dage INTEGER DEFAULT 21,
      elselskab TEXT DEFAULT 'EWII', vv_aflaeser TEXT DEFAULT 'Brunata',
      min_overtagelse_uger INTEGER DEFAULT 6
    );
    CREATE TABLE IF NOT EXISTS andelshavere (
      id INTEGER PRIMARY KEY, forening_id INTEGER NOT NULL,
      lejemaal INTEGER, beliggenhed TEXT, navn TEXT, email TEXT, telefon TEXT,
      indflyttet TEXT, fraflyttet TEXT, bbr_areal INTEGER, bruttoareal INTEGER,
      FOREIGN KEY (forening_id) REFERENCES foreninger(id)
    );
    CREATE TABLE IF NOT EXISTS sager (
      id INTEGER PRIMARY KEY, token TEXT UNIQUE NOT NULL,
      forening_id INTEGER NOT NULL, andelshaver_id INTEGER,
      saelger_navn TEXT, saelger_email TEXT, saelger_telefon TEXT, saelger_adresse TEXT,
      status TEXT DEFAULT 'anmodet', oprettet TEXT NOT NULL, opdateret TEXT NOT NULL,
      token_udloeber TEXT NOT NULL, andelsbevis_mangler INTEGER DEFAULT 0,
      oensket_overtagelse TEXT, bankkonto TEXT, adgang_kontakt TEXT, adgang_note TEXT,
      FOREIGN KEY (forening_id) REFERENCES foreninger(id),
      FOREIGN KEY (andelshaver_id) REFERENCES andelshavere(id)
    );
    CREATE TABLE IF NOT EXISTS forbedringer (
      id INTEGER PRIMARY KEY, sag_id INTEGER NOT NULL,
      beskrivelse TEXT, aar INTEGER, beloeb INTEGER,
      FOREIGN KEY (sag_id) REFERENCES sager(id)
    );
    CREATE TABLE IF NOT EXISTS mangler (
      id INTEGER PRIMARY KEY, sag_id INTEGER NOT NULL,
      beskrivelse TEXT, udbedres INTEGER DEFAULT 0,
      FOREIGN KEY (sag_id) REFERENCES sager(id)
    );
    CREATE TABLE IF NOT EXISTS rapporter (
      id INTEGER PRIMARY KEY, sag_id INTEGER NOT NULL,
      type TEXT, status TEXT DEFAULT 'bestilt',
      bestilt TEXT, modtaget TEXT, leverandor TEXT,
      FOREIGN KEY (sag_id) REFERENCES sager(id)
    );
    CREATE TABLE IF NOT EXISTS mail_queue (
      id INTEGER PRIMARY KEY, sag_id INTEGER,
      til TEXT, emne TEXT, body TEXT,
      status TEXT DEFAULT 'pending', oprettet TEXT, sendt TEXT
    );
  `)

  // Ryd eksisterende testdata
  db.exec(`
    DELETE FROM mail_queue; DELETE FROM rapporter; DELETE FROM mangler;
    DELETE FROM forbedringer; DELETE FROM sager;
    DELETE FROM andelshavere; DELETE FROM foreninger;
  `)

  // --- AB Haraldsted (6044) ---
  const forening = db.prepare(`
    INSERT INTO foreninger (kundenr, navn, adresse, postnr, by,
      leverandor_vurdering, leverandor_el, leverandor_vvs, cera_email,
      krav_el, krav_vvs, intern_dage, ekstern_platform,
      tilbagehold_fejl, tilbagehold_depot, tilbagehold_vv,
      indsigelse_dage, elselskab, vv_aflaeser, min_overtagelse_uger)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    '6044', 'AB Haraldsted', 'Haraldsgade', '2200', 'København N',
    'Cera', 'Cera', 'Cera', 'bestilling@cera.dk',
    1, 1, 14, 'andelshandel.dk',
    30000, 10000, 4000,
    21, 'EWII', 'Brunata', 6
  )
  const fid = forening.lastInsertRowid

  // --- 6 andelshavere (anonymiserede data fra 6044-lejerrapport) ---
  const insertAh = db.prepare(`
    INSERT INTO andelshavere (forening_id, lejemaal, beliggenhed, navn, email, telefon, indflyttet, fraflyttet, bbr_areal, bruttoareal)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `)

  const andelshavere = [
    { lm: 1,  bel: '19, st. tv', navn: 'Anders Larsen',      email: 'anders.larsen@testmail.dk',    tlf: '26353428', ind: '2006-03-10', fra: null,         areal: 61 },
    { lm: 2,  bel: '19, st. th', navn: 'Kirsten Mikkelsen',  email: 'kirsten.mikkelsen@testmail.dk', tlf: '31600799', ind: '2020-08-02', fra: null,         areal: 61 },
    { lm: 3,  bel: '19, 1. tv',  navn: 'Søren Jensen',       email: 'soren.jensen@testmail.dk',      tlf: '41118192', ind: '2017-10-18', fra: null,         areal: 61 },
    { lm: 4,  bel: '19, 1. th',  navn: 'Christina Thomsen',  email: 'christina.thomsen@testmail.dk', tlf: '26699258', ind: '2023-12-18', fra: null,         areal: 61 },
    { lm: 5,  bel: '19, 2.',     navn: 'Birgitte Andersen',  email: 'birgitte.andersen@testmail.dk', tlf: '35838838', ind: '2019-05-15', fra: null,         areal: 61 },
    { lm: 12, bel: '21, st. tv', navn: 'Niels Hansen',       email: 'niels.hansen@testmail.dk',      tlf: '25961625', ind: '2015-09-01', fra: '2025-12-17', areal: 71 },
  ]

  const ahIds = {}
  for (const a of andelshavere) {
    const r = insertAh.run(fid, a.lm, a.bel, a.navn, a.email, a.tlf, a.ind, a.fra, a.areal, a.areal)
    ahIds[a.lm] = r.lastInsertRowid
  }

  const now = new Date().toISOString()
  const udloeber = new Date(Date.now() + 14 * 86400000).toISOString()

  // --- Sag 1: Ny anmodning (link sendt, ikke udfyldt endnu) ---
  db.prepare(`
    INSERT INTO sager (token, forening_id, andelshaver_id, saelger_navn, saelger_email, saelger_telefon, saelger_adresse, status, oprettet, opdateret, token_udloeber)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    'DEMO-TOKEN-SOEREN-2025',
    fid, ahIds[3],
    'Søren Jensen', 'soren.jensen@testmail.dk', '41118192',
    'Haraldsgade 19, 1. tv, 2200 København N',
    'anmodet', now, now, udloeber
  )

  // --- Sag 2: Data indsamlet, rapporter bestilt ---
  const sag2 = db.prepare(`
    INSERT INTO sager (token, forening_id, andelshaver_id, saelger_navn, saelger_email, saelger_telefon, saelger_adresse,
      status, oprettet, opdateret, token_udloeber,
      andelsbevis_mangler, oensket_overtagelse, bankkonto, adgang_kontakt, adgang_note)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    'DEMO-TOKEN-KIRSTEN-2025',
    fid, ahIds[2],
    'Kirsten Mikkelsen', 'kirsten.mikkelsen@testmail.dk', '31600799',
    'Haraldsgade 19, st. th, 2200 København N',
    'rapporter_bestilt',
    new Date(Date.now() - 5 * 86400000).toISOString(),
    new Date(Date.now() - 2 * 86400000).toISOString(),
    new Date(Date.now() + 9 * 86400000).toISOString(),
    0,
    new Date(Date.now() + 90 * 86400000).toISOString().slice(0,10),
    '1234 56789012',
    'Kirsten Mikkelsen', 'Nøgle hænger hos nabo i nr. 19, st. tv'
  )
  const sag2id = sag2.lastInsertRowid

  db.prepare(`INSERT INTO forbedringer (sag_id, beskrivelse, aar, beloeb) VALUES (?,?,?,?)`).run(sag2id, 'Nyt køkken inkl. hvidevarer', 2019, 85000)
  db.prepare(`INSERT INTO forbedringer (sag_id, beskrivelse, aar, beloeb) VALUES (?,?,?,?)`).run(sag2id, 'Nyt badeværelse', 2021, 62000)
  db.prepare(`INSERT INTO rapporter (sag_id, type, status, bestilt, leverandor) VALUES (?,?,?,?,?)`).run(sag2id, 'vurdering', 'bestilt', new Date(Date.now() - 2 * 86400000).toISOString(), 'Cera')
  db.prepare(`INSERT INTO rapporter (sag_id, type, status, bestilt, leverandor) VALUES (?,?,?,?,?)`).run(sag2id, 'el', 'bestilt', new Date(Date.now() - 2 * 86400000).toISOString(), 'Cera')
  db.prepare(`INSERT INTO rapporter (sag_id, type, status, bestilt, leverandor) VALUES (?,?,?,?,?)`).run(sag2id, 'vvs', 'bestilt', new Date(Date.now() - 2 * 86400000).toISOString(), 'Cera')

  // --- Sag 3: Udbudt på intern liste ---
  const sag3 = db.prepare(`
    INSERT INTO sager (token, forening_id, andelshaver_id, saelger_navn, saelger_email, saelger_telefon, saelger_adresse,
      status, oprettet, opdateret, token_udloeber,
      oensket_overtagelse, bankkonto)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    'DEMO-TOKEN-ANDERS-2024',
    fid, ahIds[1],
    'Anders Larsen', 'anders.larsen@testmail.dk', '26353428',
    'Haraldsgade 19, st. tv, 2200 København N',
    'udbudt_intern',
    new Date(Date.now() - 30 * 86400000).toISOString(),
    new Date(Date.now() - 3 * 86400000).toISOString(),
    new Date(Date.now() - 16 * 86400000).toISOString(),
    new Date(Date.now() + 60 * 86400000).toISOString().slice(0,10),
    '4321 98765432'
  )
  const sag3id = sag3.lastInsertRowid
  db.prepare(`INSERT INTO forbedringer (sag_id, beskrivelse, aar, beloeb) VALUES (?,?,?,?)`).run(sag3id, 'Nyt parketkøkken', 2014, 45000)
  db.prepare(`INSERT INTO rapporter (sag_id, type, status, bestilt, modtaget, leverandor) VALUES (?,?,?,?,?,?)`).run(sag3id, 'vurdering', 'modtaget', new Date(Date.now() - 25 * 86400000).toISOString(), new Date(Date.now() - 18 * 86400000).toISOString(), 'Cera')
  db.prepare(`INSERT INTO rapporter (sag_id, type, status, bestilt, modtaget, leverandor) VALUES (?,?,?,?,?,?)`).run(sag3id, 'el', 'modtaget', new Date(Date.now() - 25 * 86400000).toISOString(), new Date(Date.now() - 17 * 86400000).toISOString(), 'Cera')
  db.prepare(`INSERT INTO rapporter (sag_id, type, status, bestilt, modtaget, leverandor) VALUES (?,?,?,?,?,?)`).run(sag3id, 'vvs', 'modtaget', new Date(Date.now() - 25 * 86400000).toISOString(), new Date(Date.now() - 17 * 86400000).toISOString(), 'Cera')

  // Mail queue eksempel
  db.prepare(`INSERT INTO mail_queue (sag_id, til, emne, body, status, oprettet) VALUES (?,?,?,?,?,?)`).run(
    sag3id, 'bestilling@cera.dk',
    'Bestilling af vurderingsrapport – Haraldsgade 19, st. tv, 2200 KBH N',
    'Kære Cera,\n\nBlomfelt A/S bestiller hermed vurderingsrapport, el-tjek og VVS-tjek for:\n\nAdresse: Haraldsgade 19, st. tv, 2200 København N\nSagsref: DEMO-TOKEN-ANDERS-2024\nKontaktperson (adgang): Anders Larsen, tlf. 26353428\n\nMvh Blomfelt A/S\nhandel@blomfelt.dk',
    'sent', new Date(Date.now() - 25 * 86400000).toISOString()
  )

  db.close()
  console.log('✓ Database seeded med AB Haraldsted (6044) testdata')
  console.log('  Demo-token til wizard: DEMO-TOKEN-SOEREN-2025')
  console.log('  Åbn: http://localhost:3000/saelg/DEMO-TOKEN-SOEREN-2025')
}

seed()
