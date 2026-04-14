import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  const sager = db.prepare(`
    SELECT
      s.id, s.token, s.saelger_navn, s.saelger_adresse, s.saelger_email,
      s.status, s.oprettet, s.opdateret,
      f.navn as forening_navn, f.kundenr as forening_kundenr,
      MAX(CASE WHEN r.type = 'vurdering' THEN r.status END) as rapport_vurdering,
      MAX(CASE WHEN r.type = 'el'        THEN r.status END) as rapport_el,
      MAX(CASE WHEN r.type = 'vvs'       THEN r.status END) as rapport_vvs
    FROM sager s
    JOIN foreninger f ON f.id = s.forening_id
    LEFT JOIN rapporter r ON r.sag_id = s.id
    GROUP BY s.id
    ORDER BY s.oprettet DESC
  `).all()

  return NextResponse.json(sager)
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  const db = getDb()
  db.prepare(`UPDATE sager SET status = ?, opdateret = ? WHERE id = ?`).run(status, new Date().toISOString(), id)
  return NextResponse.json({ ok: true })
}
