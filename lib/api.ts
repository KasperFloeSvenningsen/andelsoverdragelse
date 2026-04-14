/**
 * api.ts – isomorphic API client
 *
 * Tries the real Next.js API routes first.
 * If they are unreachable (GitHub Pages, no server) falls back to
 * the localStorage-based clientDb automatically.
 */

import * as db from './clientDb'

async function tryFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ─── GET /api/sager ───────────────────────────────────────
export async function apiGetSager(): Promise<db.SagListItem[]> {
  try {
    return await tryFetch('/api/sager')
  } catch {
    return db.getSager()
  }
}

// ─── PATCH /api/sager ─────────────────────────────────────
export async function apiUpdateStatus(id: number, status: string): Promise<void> {
  try {
    await tryFetch('/api/sager', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  } catch {
    db.updateStatus(id, status)
  }
}

// ─── GET /api/sag/[token] ─────────────────────────────────
export async function apiGetSag(token: string): Promise<db.SagMedForening> {
  try {
    return await tryFetch(`/api/sag/${token}`)
  } catch {
    const sag = db.getSag(token)
    if (!sag) throw new Error('Sag ikke fundet')
    return sag
  }
}

// ─── POST /api/sag/[token] ────────────────────────────────
export async function apiSaveSag(token: string, body: Parameters<typeof db.saveSag>[1]): Promise<void> {
  try {
    await tryFetch(`/api/sag/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    db.saveSag(token, body)
  }
}

// ─── POST /api/anmod ──────────────────────────────────────
export async function apiAnmod(
  navn: string, email: string, telefon: string, adresse: string
): Promise<{ token: string }> {
  try {
    return await tryFetch('/api/anmod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ navn, email, telefon, adresse }),
    })
  } catch {
    const token = db.createSag(navn, email, telefon, adresse)
    return { token }
  }
}
