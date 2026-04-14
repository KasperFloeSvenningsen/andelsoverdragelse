'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { apiGetSager, apiUpdateStatus } from '@/lib/api'

const logoSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo-white.svg`

type Sag = {
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

const STATUS_LABELS: Record<string, string> = {
  anmodet:           'Link sendt',
  data_indsamlet:    'Data modtaget',
  rapporter_bestilt: 'Rapporter bestilt',
  rapport_modtaget:  'Rapport modtaget',
  opstilling_klar:   'Salgsopstilling klar',
  udbudt_intern:     'Udbudt – intern liste',
  udbudt_ekstern:    'Udbudt – ekstern',
  koeber_fundet:     'Køber fundet',
  overdragelse_klar: 'Overdragelse klar',
  underskrevet:      'Underskrevet',
  fortrydelse:       'Fortrydelsesret',
  betalt:            'Betaling modtaget',
  afsluttet:         'Afsluttet',
}

const STATUS_COLORS: Record<string, string> = {
  anmodet:           'bg-gray-100 text-gray-600',
  data_indsamlet:    'bg-blue-100 text-blomfelt-green',
  rapporter_bestilt: 'bg-yellow-100 text-yellow-700',
  rapport_modtaget:  'bg-amber-100 text-amber-700',
  opstilling_klar:   'bg-orange-100 text-orange-700',
  udbudt_intern:     'bg-purple-100 text-purple-700',
  udbudt_ekstern:    'bg-purple-200 text-purple-800',
  koeber_fundet:     'bg-indigo-100 text-indigo-700',
  overdragelse_klar: 'bg-cyan-100 text-cyan-700',
  underskrevet:      'bg-teal-100 text-teal-700',
  fortrydelse:       'bg-orange-200 text-orange-800',
  betalt:            'bg-green-100 text-green-700',
  afsluttet:         'bg-green-200 text-green-800',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'
  const label = STATUS_LABELS[status] ?? status
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
}

function RapportDot({ status }: { status: string | null }) {
  if (!status) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-200" title="Ikke krævet/bestilt" />
  if (status === 'modtaget') return <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" title="Modtaget" />
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" title="Bestilt – afventer" />
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export default function AdminDashboard() {
  const [sager, setSager] = useState<Sag[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Sag | null>(null)
  const [filter, setFilter] = useState('alle')

  useEffect(() => {
    apiGetSager().then(d => { setSager(d); setLoading(false) })
  }, [])

  const statuses = ['alle', ...Array.from(new Set(sager.map(s => s.status)))]
  const filtered = filter === 'alle' ? sager : sager.filter(s => s.status === filter)

  const stats = {
    total: sager.length,
    aktive: sager.filter(s => !['afsluttet'].includes(s.status)).length,
    afventerRapport: sager.filter(s => s.status === 'rapporter_bestilt').length,
    kræverHandling: sager.filter(s => ['opstilling_klar', 'koeber_fundet', 'overdragelse_klar'].includes(s.status)).length,
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDF6E1' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#2C403A' }} className="py-4 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Image src={logoSrc} alt="Blomfelt" width={160} height={72} priority />
          <div className="flex items-center gap-6">
            <span className="text-white/50 text-xs border border-white/20 px-2 py-1 rounded">Admin</span>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="text-white/70 hover:text-white transition-colors">Ny sag</a>
              <a href="/admin" className="text-white font-semibold">Sager</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Aktive sager', value: stats.aktive, color: 'text-blomfelt-green' },
            { label: 'Afventer rapport', value: stats.afventerRapport, color: 'text-yellow-600' },
            { label: 'Kræver handling', value: stats.kræverHandling, color: 'text-red-600' },
            { label: 'Sager i alt', value: stats.total, color: 'text-gray-600' },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Liste */}
          <div className="flex-1">
            {/* Filter tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {statuses.map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === s ? 'bg-blomfelt-green text-white' : 'bg-white text-gray-600 border hover:border-blomfelt-green-light'
                  }`}>
                  {s === 'alle' ? 'Alle' : (STATUS_LABELS[s] ?? s)}
                  {s !== 'alle' && <span className="ml-1 text-inherit opacity-60">({sager.filter(sg => sg.status === s).length})</span>}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="card text-center py-10 text-gray-400">Henter sager...</div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">Ingen sager matcher filteret</div>
            ) : (
              <div className="space-y-2">
                {filtered.map(sag => (
                  <div key={sag.id}
                    onClick={() => setSelected(sag)}
                    className={`card cursor-pointer hover:shadow-md transition-shadow p-4 ${selected?.id === sag.id ? 'ring-2 ring-blomfelt-green' : ''}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{sag.saelger_navn}</div>
                        <div className="text-sm text-gray-500 truncate">{sag.saelger_adresse}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {sag.forening_kundenr} · {sag.forening_navn}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={sag.status} />
                        <div className="flex gap-1 items-center">
                          <span className="text-xs text-gray-400 mr-1">V</span>
                          <RapportDot status={sag.rapport_vurdering} />
                          <span className="text-xs text-gray-400 mx-1">El</span>
                          <RapportDot status={sag.rapport_el} />
                          <span className="text-xs text-gray-400 mx-1">VVS</span>
                          <RapportDot status={sag.rapport_vvs} />
                        </div>
                        <div className="text-xs text-gray-400">{daysSince(sag.oprettet)}d siden</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detalje-panel */}
          {selected && (
            <div className="w-80 shrink-0">
              <div className="card sticky top-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-blomfelt-green">Sagsdetaljer</h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>

                <StatusBadge status={selected.status} />

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Sælger</dt>
                    <dd className="font-medium">{selected.saelger_navn}</dd>
                    <dd className="text-gray-500">{selected.saelger_email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Adresse</dt>
                    <dd>{selected.saelger_adresse}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Forening</dt>
                    <dd>{selected.forening_kundenr} – {selected.forening_navn}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Rapporter</dt>
                    <dd className="flex gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs"><RapportDot status={selected.rapport_vurdering} /> Vurdering</span>
                      <span className="flex items-center gap-1 text-xs"><RapportDot status={selected.rapport_el} /> El</span>
                      <span className="flex items-center gap-1 text-xs"><RapportDot status={selected.rapport_vvs} /> VVS</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Oprettet</dt>
                    <dd>{new Date(selected.oprettet).toLocaleDateString('da-DK')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">Sagsnummer</dt>
                    <dd className="font-mono text-xs text-gray-600">{selected.token}</dd>
                  </div>
                </dl>

                <div className="mt-6 space-y-2">
                  {selected.status === 'anmodet' && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/saelg/?token=${selected.token}`}
                      target="_blank"
                      className="btn-secondary text-sm w-full text-center block"
                    >
                      Åbn sælger-wizard
                    </a>
                  )}
                  {selected.status === 'opstilling_klar' && (
                    <button className="btn-primary text-sm w-full">Godkend salgsopstilling</button>
                  )}
                  {selected.status === 'koeber_fundet' && (
                    <button className="btn-primary text-sm w-full">Generer overdragelsesaftale</button>
                  )}
                  <button className="btn-secondary text-sm w-full" onClick={() => {
                    const next = prompt('Ny status:')
                    if (next) apiUpdateStatus(selected.id, next).then(() => location.reload())
                  }}>
                    Opdater status
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
