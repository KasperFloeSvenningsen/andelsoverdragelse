'use client'

import { useState } from 'react'
import Image from 'next/image'
import { apiAnmod } from '@/lib/api'

export default function LandingPage() {
  const [form, setForm] = useState({ navn: '', email: '', telefon: '', adresse: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [token, setToken] = useState<string>('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const data = await apiAnmod(form.navn, form.email, form.telefon, form.adresse)
      setToken(data.token)
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDF6E1' }}>

      {/* Header – Blomfelt Green med hvidt logo */}
      <header style={{ backgroundColor: '#2C403A' }} className="py-5 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <Image
            src="/logo-white.svg"
            alt="Blomfelt Ejendomsadministration"
            width={220}
            height={99}
            priority
          />
        </div>
      </header>

      {/* Hero-bånd */}
      <div style={{ backgroundColor: '#2C403A' }} className="px-6 pb-10 pt-2">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-3xl font-bold mb-2">Sælg din andelsbolig</h1>
          <p className="text-white/70 text-sm max-w-md">
            Udfyld formularen nedenfor – vi sender dig et personligt link, så du kan igangsætte salget fra sofaen.
          </p>
        </div>
      </div>

      {/* Bølge-overgang */}
      <div style={{ backgroundColor: '#2C403A' }}>
        <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#FDF6E1" />
        </svg>
      </div>

      <main className="flex-1 flex justify-center px-6 pb-16 -mt-2">
        <div className="w-full max-w-lg">
          {status === 'sent' ? (
            <div className="card">
              {/* Grøn top-stripe */}
              <div className="rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4" style={{ backgroundColor: '#2C403A' }}>
                <p className="text-white font-semibold text-lg">✓ Link sendt!</p>
              </div>
              <p className="text-gray-700 mb-6">
                Vi har sendt et personligt link til <strong>{form.email}</strong>.<br />
                Linket er gyldigt i 14 dage.
              </p>
              {/* Demo-link */}
              <div className="rounded-lg p-4 text-left border" style={{ backgroundColor: '#AFD0E7' + '33', borderColor: '#AFD0E7' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#2C403A' }}>
                  Demo – dit unikke link
                </p>
                <a
                  href={`/saelg/${token}`}
                  className="font-medium break-all hover:underline text-sm"
                  style={{ color: '#2C403A' }}
                >
                  {typeof window !== 'undefined' ? `${window.location.origin}/saelg/${token}` : `/saelg/${token}`}
                </a>
              </div>
              <a href="/admin" className="btn-secondary mt-4 inline-block text-center text-sm w-full">
                Se admin-dashboard →
              </a>
            </div>
          ) : (
            <div className="card">
              {/* Grøn top-stripe */}
              <div className="rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4" style={{ backgroundColor: '#2C403A' }}>
                <p className="text-white font-semibold">Igangsæt dit andelsboligsalg</p>
                <p className="text-white/60 text-xs mt-0.5">Tager under 2 minutter</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Fulde navn</label>
                  <input className="input-field" type="text" placeholder="Anders Jensen"
                    value={form.navn} onChange={e => setForm({ ...form, navn: e.target.value })} required />
                </div>

                <div>
                  <label className="label">E-mailadresse</label>
                  <input className="input-field" type="email" placeholder="anders@mail.dk"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>

                <div>
                  <label className="label">Mobiltelefon</label>
                  <input className="input-field" type="tel" placeholder="12 34 56 78"
                    value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} required />
                </div>

                <div>
                  <label className="label">Boligens adresse</label>
                  <input className="input-field" type="text"
                    placeholder="Haraldsgade 19, 1. tv, 2200 København N"
                    value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} required />
                  <p className="text-xs text-gray-400 mt-1">Vi finder automatisk din forening ud fra adressen</p>
                </div>

                {status === 'error' && (
                  <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    Noget gik galt. Prøv igen eller ring til handel@blomfelt.dk
                  </p>
                )}

                <button type="submit" disabled={status === 'loading'} className="btn-primary w-full mt-2">
                  {status === 'loading' ? 'Sender…' : 'Bestil mit personlige link'}
                </button>
              </form>

              <p className="text-xs text-gray-400 mt-5 text-center">
                Dine oplysninger behandles fortroligt · Blomfelt A/S
              </p>
            </div>
          )}

          {/* Tre-trins forklaring */}
          {status !== 'sent' && (
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { n: '1', label: 'Du bestiller link', sub: 'Her på siden' },
                { n: '2', label: 'Du udfylder', sub: 'Via dit personlige link' },
                { n: '3', label: 'Vi ordner resten', sub: 'Rapporter, opslag, overdragelse' },
              ].map(s => (
                <div key={s.n} className="card py-4 px-3">
                  <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: '#2C403A' }}>
                    {s.n}
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer style={{ backgroundColor: '#2C403A' }} className="text-white/50 text-xs text-center py-5 px-6">
        <Image src="/logo-white.svg" alt="Blomfelt" width={90} height={40} className="mx-auto mb-3 opacity-60" />
        Blomfelt A/S · handel@blomfelt.dk · Tlf. 35 25 02 55
      </footer>
    </div>
  )
}
