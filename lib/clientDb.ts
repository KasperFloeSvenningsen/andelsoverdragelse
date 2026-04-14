/**
 * clientDb.ts – browser-side fake database (localStorage)
 *
 * Used as a fallback when the real SQLite API is unavailable
 * (e.g. on GitHub Pages static hosting).
 *
 * Data is seeded from AB Haraldsted (6044) demo data and persisted
 * in localStorage so changes survive page reloads.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Sag = {
  id: number
  token: string
  saelger_navn: string
  saelger_adresse: string
  saelger_email: string
  saelger_telefon: string
  status: string
  oprettet: string
  opdateret: string
  token_udloeber: string
  forening_id: number
  andelsbevis_mangler?: number
  oensket_overtagelse?: string
  adgang_kontakt?: string
  adgang_note?: string
  bankkonto?: string
}

export type SagMedForening = Sag & {
  forening_navn: string
  forening_adresse: string
  forening_postnr: string
  forening_by: string
  krav_el: number
  krav_vvs: number
  intern_dage: number
}

export type SagListItem = {
  id: number
  token: string
  saelger_navn: string
  saelger_adresse: string
  saelger_email: string
  status: string
  oprettet: string
  opdateret: string
  forening_navn: string
  forening_kundenr: string
  rapport_vurdering: string | null
  rapport_el: string | null
  rapport_vvs: string | null
}

type Rapport = {
  sag_id: number
  type: 'vurdering' | 'el' | 'vvs'
  status: string
}

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEY_SAGER     = 'blomfelt_sager'
const KEY_RAPPORTER = 'blomfelt_rapporter'
const KEY_SEEDED    = 'blomfelt_seeded_v1'

// ─── Seed data (AB Haraldsted 6044, anonymiseret) ─────────────────────────────

const now      = new Date().toISOString()
const fiveDays = new Date(Date.now() - 5 * 86400000).toISOString()
const tenDays  = new Date(Date.now() - 10 * 86400000).toISOString()
const udloeber = new Date(Date.now() + 30 * 86400000).toISOString()

const SEED_SAGER: Sag[] = [
  {
    id: 1,
    token: 'DEMO-TOKEN-SOEREN-2025',
    saelger_navn: 'Søren Jensen',
    saelger_adresse: 'Haraldsgade 19, 1. tv, 2200 København N',
    saelger_email: 'soeren@example.com',
    saelger_telefon: '22 33 44 55',
    status: 'anmodet',
    oprettet: now,
    opdateret: now,
    token_udloeber: udloeber,
    forening_id: 1,
  },
  {
    id: 2,
    token: 'DEMO-TOKEN-KIRSTEN-2025',
    saelger_navn: 'Kirsten Mikkelsen',
    saelger_adresse: 'Haraldsgade 19, st. th, 2200 København N',
    saelger_email: 'kirsten@example.com',
    saelger_telefon: '33 44 55 66',
    status: 'rapporter_bestilt',
    oprettet: fiveDays,
    opdateret: fiveDays,
    token_udloeber: udloeber,
    forening_id: 1,
  },
  {
    id: 3,
    token: 'DEMO-TOKEN-ANDERS-2024',
    saelger_navn: 'Anders Larsen',
    saelger_adresse: 'Haraldsgade 19, st. tv, 2200 København N',
    saelger_email: 'anders@example.com',
    saelger_telefon: '44 55 66 77',
    status: 'udbudt_intern',
    oprettet: tenDays,
    opdateret: tenDays,
    token_udloeber: udloeber,
    forening_id: 1,
  },
]

const SEED_RAPPORTER: Rapport[] = [
  { sag_id: 2, type: 'vurdering', status: 'bestilt' },
  { sag_id: 2, type: 'el',        status: 'bestilt' },
  { sag_id: 2, type: 'vvs',       status: 'bestilt' },
  { sag_id: 3, type: 'vurdering', status: 'modtaget' },
  { sag_id: 3, type: 'el',        status: 'modtaget' },
  { sag_id: 3, type: 'vvs',       status: 'modtaget' },
]

const FORENING = {
  id: 1,
  kundenr: '6044',
  navn: 'AB Haraldsted',
  adresse: 'Haraldsgade 19-51',
  postnr: '2200',
  by: 'København N',
  krav_el: 1,
  krav_vvs: 1,
  intern_dage: 14,
  leverandor_vurdering: 'Cera',
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(KEY_SEEDED)) return

  localStorage.setItem(KEY_SAGER,     JSON.stringify(SEED_SAGER))
  localStorage.setItem(KEY_RAPPORTER, JSON.stringify(SEED_RAPPORTER))
  localStorage.setItem(KEY_SEEDED,    '1')
}

function readSager(): Sag[] {
  init()
  try { return JSON.parse(localStorage.getItem(KEY_SAGER) ?? '[]') } catch { return [] }
}

function readRapporter(): Rapport[] {
  init()
  try { return JSON.parse(localStorage.getItem(KEY_RAPPORTER) ?? '[]') } catch { return [] }
}

function writeSager(sager: Sag[]) {
  localStorage.setItem(KEY_SAGER, JSON.stringify(sager))
}

function writeRapporter(rapporter: Rapport[]) {
  localStorage.setItem(KEY_RAPPORTER, JSON.stringify(rapporter))
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** GET /api/sager */
export function getSager(): SagListItem[] {
  const sager     = readSager()
  const rapporter = readRapporter()

  return sager.map(s => {
    const rs = rapporter.filter(r => r.sag_id === s.id)
    const rap = (type: string) => rs.find(r => r.type === type)?.status ?? null
    return {
      id:                s.id,
      token:             s.token,
      saelger_navn:      s.saelger_navn,
      saelger_adresse:   s.saelger_adresse,
      saelger_email:     s.saelger_email,
      status:            s.status,
      oprettet:          s.oprettet,
      opdateret:         s.opdateret,
      forening_navn:     FORENING.navn,
      forening_kundenr:  FORENING.kundenr,
      rapport_vurdering: rap('vurdering'),
      rapport_el:        rap('el'),
      rapport_vvs:       rap('vvs'),
    }
  })
}

/** GET /api/sag/[token] */
export function getSag(token: string): SagMedForening | null {
  const sager = readSager()
  const sag   = sager.find(s => s.token === token)
  if (!sag) return null

  return {
    ...sag,
    forening_navn:    FORENING.navn,
    forening_adresse: FORENING.adresse,
    forening_postnr:  FORENING.postnr,
    forening_by:      FORENING.by,
    krav_el:          FORENING.krav_el,
    krav_vvs:         FORENING.krav_vvs,
    intern_dage:      FORENING.intern_dage,
  }
}

/** POST /api/sag/[token] – save wizard data */
export function saveSag(token: string, body: {
  andelsbevisMangler: boolean
  oensketOvertagelse: string
  adgangKontakt: string
  adgangNote: string
  bankkonto: string
  forbedringer: { beskrivelse: string; aar: string; beloeb: string }[]
  mangler: { beskrivelse: string; udbedres: boolean }[]
}) {
  const sager = readSager()
  const idx   = sager.findIndex(s => s.token === token)
  if (idx === -1) return

  sager[idx] = {
    ...sager[idx],
    andelsbevis_mangler:  body.andelsbevisMangler ? 1 : 0,
    oensket_overtagelse:  body.oensketOvertagelse || undefined,
    adgang_kontakt:       body.adgangKontakt || undefined,
    adgang_note:          body.adgangNote || undefined,
    bankkonto:            body.bankkonto || undefined,
    status:               'rapporter_bestilt',
    opdateret:            new Date().toISOString(),
  }
  writeSager(sager)

  // Tilføj rapporter
  const rapporter = readRapporter().filter(r => r.sag_id !== sager[idx].id)
  const typer: ('vurdering' | 'el' | 'vvs')[] = [
    'vurdering',
    ...(FORENING.krav_el  ? ['el'  as const] : []),
    ...(FORENING.krav_vvs ? ['vvs' as const] : []),
  ]
  for (const type of typer) {
    rapporter.push({ sag_id: sager[idx].id, type, status: 'bestilt' })
  }
  writeRapporter(rapporter)
}

/** PATCH /api/sager – update status */
export function updateStatus(id: number, status: string) {
  const sager = readSager()
  const idx   = sager.findIndex(s => s.id === id)
  if (idx === -1) return
  sager[idx].status    = status
  sager[idx].opdateret = new Date().toISOString()
  writeSager(sager)
}

/** POST /api/anmod – create new sag */
export function createSag(navn: string, email: string, telefon: string, adresse: string): string {
  const sager = readSager()
  const token = [
    navn.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, ''),
    Date.now().toString(36).toUpperCase(),
  ].join('-')

  const nowStr     = new Date().toISOString()
  const udloeberStr = new Date(Date.now() + 14 * 86400000).toISOString()

  const newSag: Sag = {
    id:              Math.max(0, ...sager.map(s => s.id)) + 1,
    token,
    saelger_navn:    navn,
    saelger_adresse: adresse,
    saelger_email:   email,
    saelger_telefon: telefon,
    status:          'anmodet',
    oprettet:        nowStr,
    opdateret:       nowStr,
    token_udloeber:  udloeberStr,
    forening_id:     1,
  }

  writeSager([...sager, newSag])
  return token
}

/** Wipe all data and re-seed (useful for demo reset) */
export function resetToSeed() {
  localStorage.removeItem(KEY_SEEDED)
  init()
}
