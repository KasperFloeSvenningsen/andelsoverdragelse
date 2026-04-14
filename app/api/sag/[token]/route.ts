import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params
  const db = getDb()

  const sag = db.prepare(`
    SELECT s.*, f.navn as forening_navn, f.adresse as forening_adresse,
           f.postnr as forening_postnr, f.by as forening_by,
           f.krav_el, f.krav_vvs, f.intern_dage
    FROM sager s
    JOIN foreninger f ON f.id = s.forening_id
    WHERE s.token = ?
  `).get(token) as Record<string, unknown> | undefined

  if (!sag) {
    return NextResponse.json({ error: 'Sag ikke fundet' }, { status: 404 })
  }

  if (new Date(sag.token_udloeber as string) < new Date()) {
    return NextResponse.json({ error: 'Link udløbet' }, { status: 410 })
  }

  return NextResponse.json(sag)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params
  const db = getDb()

  const sag = db.prepare(`SELECT * FROM sager WHERE token = ?`).get(token) as { id: number; forening_id: number } | undefined
  if (!sag) return NextResponse.json({ error: 'Sag ikke fundet' }, { status: 404 })

  const body = await req.json()
  const now = new Date().toISOString()

  // Gem wizard-data
  db.prepare(`
    UPDATE sager SET
      andelsbevis_mangler = ?,
      oensket_overtagelse = ?,
      adgang_kontakt = ?,
      adgang_note = ?,
      bankkonto = ?,
      status = 'rapporter_bestilt',
      opdateret = ?
    WHERE id = ?
  `).run(
    body.andelsbevisMangler ? 1 : 0,
    body.oensketOvertagelse || null,
    body.adgangKontakt || null,
    body.adgangNote || null,
    body.bankkonto || null,
    now,
    sag.id
  )

  // Gem forbedringer
  for (const f of (body.forbedringer ?? []).filter((f: { beskrivelse: string }) => f.beskrivelse)) {
    db.prepare(`INSERT INTO forbedringer (sag_id, beskrivelse, aar, beloeb) VALUES (?,?,?,?)`).run(
      sag.id, f.beskrivelse, parseInt(f.aar) || null, parseInt(f.beloeb) || null
    )
  }

  // Gem mangler
  for (const m of (body.mangler ?? []).filter((m: { beskrivelse: string }) => m.beskrivelse)) {
    db.prepare(`INSERT INTO mangler (sag_id, beskrivelse, udbedres) VALUES (?,?,?)`).run(
      sag.id, m.beskrivelse, m.udbedres ? 1 : 0
    )
  }

  // Hent foreningsdata for rapportbestilling
  const forening = db.prepare(`SELECT * FROM foreninger WHERE id = ?`).get(sag.forening_id) as {
    leverandor_vurdering: string; cera_email: string; krav_el: number; krav_vvs: number
    navn: string
  }

  const sagData = db.prepare(`SELECT saelger_adresse, saelger_navn, saelger_telefon FROM sager WHERE id = ?`).get(sag.id) as {
    saelger_adresse: string; saelger_navn: string; saelger_telefon: string
  }

  // Bestil rapporter (tilføj til mail-kø)
  const typer = ['vurdering', ...(forening.krav_el ? ['el'] : []), ...(forening.krav_vvs ? ['vvs'] : [])]
  for (const type of typer) {
    db.prepare(`INSERT INTO rapporter (sag_id, type, status, bestilt, leverandor) VALUES (?,?,?,?,?)`).run(
      sag.id, type, 'bestilt', now, forening.leverandor_vurdering
    )
  }

  const rapportliste = typer.map(t => t === 'vurdering' ? 'Vurderingsrapport' : t === 'el' ? 'El-tjek' : 'VVS-tjek').join(', ')

  db.prepare(`INSERT INTO mail_queue (sag_id, til, emne, body, status, oprettet) VALUES (?,?,?,?,?,?)`).run(
    sag.id,
    forening.cera_email,
    `Bestilling af rapporter – ${sagData.saelger_adresse}`,
    `Kære ${forening.leverandor_vurdering},\n\nBlomfelt A/S bestiller hermed følgende rapporter:\n${rapportliste}\n\nAdresse: ${sagData.saelger_adresse}\nSagsref: ${token}\nKontaktperson: ${sagData.saelger_navn}, tlf. ${sagData.saelger_telefon}\n\nFaktura bedes sendt til faktura@blomfelt.dk\nRapporter sendes til handel@blomfelt.dk med sagsnummeret som reference.\n\nMvh Blomfelt A/S\nhandel@blomfelt.dk · 35 25 02 55`,
    'pending', now
  )

  return NextResponse.json({ ok: true })
}
