export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const { navn, email, telefon, adresse } = await req.json()

  if (!navn || !email || !adresse) {
    return NextResponse.json({ error: 'Manglende felter' }, { status: 400 })
  }

  const db = getDb()

  // Find forening baseret på adresse (simpel: tag første forening i test)
  const forening = db.prepare(`SELECT * FROM foreninger LIMIT 1`).get() as { id: number } | undefined
  if (!forening) {
    return NextResponse.json({ error: 'Forening ikke fundet – kontakt handel@blomfelt.dk' }, { status: 404 })
  }

  const token = uuidv4()
  const now = new Date().toISOString()
  const udloeber = new Date(Date.now() + 14 * 86400000).toISOString()

  db.prepare(`
    INSERT INTO sager (token, forening_id, saelger_navn, saelger_email, saelger_telefon, saelger_adresse,
      status, oprettet, opdateret, token_udloeber)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(token, forening.id, navn, email, telefon ?? '', adresse, 'anmodet', now, now, udloeber)

  // Tilføj bekræftelsesmail til køen
  db.prepare(`
    INSERT INTO mail_queue (sag_id, til, emne, body, status, oprettet)
    SELECT id, ?, ?, ?, 'pending', ?
    FROM sager WHERE token = ?
  `).run(
    email,
    'Dit personlige link til andelsoverdragelse – Blomfelt',
    `Kære ${navn},\n\nDu har anmodet om et link til at sælge din andelsbolig på ${adresse}.\n\nDit personlige link:\nhttps://blomfelt.dk/saelg/${token}\n\nLinket er gyldigt i 14 dage. Hvis du ikke har anmodet om dette, bedes du kontakte os.\n\nMvh Blomfelt A/S\nhandel@blomfelt.dk`,
    now,
    token
  )

  return NextResponse.json({ token, message: 'Link oprettet' })
}
