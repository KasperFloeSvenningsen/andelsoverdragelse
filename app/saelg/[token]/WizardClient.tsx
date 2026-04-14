'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { apiGetSag, apiSaveSag } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────
type Forbedring = { id: string; beskrivelse: string; aar: string; beloeb: string }
type Mangel = { id: string; beskrivelse: string; udbedres: boolean }

type WizardData = {
  // Trin 1
  forbedringer: Forbedring[]
  mangler: Mangel[]
  inventar: string
  // Trin 2
  andelsbevisMangler: boolean
  // Trin 3
  hasteekspedition: boolean
  // Trin 4
  oensketOvertagelse: string
  adgangKontakt: string
  adgangNote: string
  bankkonto: string
}

type SagInfo = {
  saelger_navn: string
  saelger_adresse: string
  status: string
  forening_navn: string
  forening_adresse: string
  forening_postnr: string
  forening_by: string
  krav_el: number
  krav_vvs: number
  intern_dage: number
  token_udloeber: string
}

// ─── Helper ───────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) }

const STEPS = ['Boligens stand', 'Andelsbevis', 'Dokumenter', 'Praktisk', 'Godkend']

// ─── Progress bar ─────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-col items-center text-xs">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 transition-colors ${
              i < step ? 'bg-blomfelt-green text-white' :
              i === step ? 'bg-blomfelt-green-light text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={i === step ? 'text-blomfelt-green font-medium' : 'text-gray-400'}>{s}</span>
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full mt-2">
        <div
          className="h-1.5 bg-blomfelt-green rounded-full transition-all duration-300"
          style={{ width: `${(step / (total - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─── Trin 1: Boligens stand ───────────────────────────────
function Trin1({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  function addForbedring() {
    setData({ ...data, forbedringer: [...data.forbedringer, { id: uid(), beskrivelse: '', aar: '', beloeb: '' }] })
  }
  function updateForbedring(id: string, field: keyof Forbedring, val: string) {
    setData({ ...data, forbedringer: data.forbedringer.map(f => f.id === id ? { ...f, [field]: val } : f) })
  }
  function removeForbedring(id: string) {
    setData({ ...data, forbedringer: data.forbedringer.filter(f => f.id !== id) })
  }
  function addMangel() {
    setData({ ...data, mangler: [...data.mangler, { id: uid(), beskrivelse: '', udbedres: false }] })
  }
  function updateMangel(id: string, field: keyof Mangel, val: string | boolean) {
    setData({ ...data, mangler: data.mangler.map(m => m.id === id ? { ...m, [field]: val } : m) })
  }
  function removeMangel(id: string) {
    setData({ ...data, mangler: data.mangler.filter(m => m.id !== id) })
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-semibold text-blomfelt-green mb-1">Forbedringer</h3>
        <p className="text-sm text-gray-500 mb-4">
          Angiv forbedringer du har foretaget i boligen. Disse kan øge din andelspris.
          Se <a href="#" className="underline text-blomfelt-green-light">ABFs forbedringskatalog</a> for hvad der tæller.
        </p>
        {data.forbedringer.map(f => (
          <div key={f.id} className="grid grid-cols-12 gap-2 mb-3 items-start">
            <div className="col-span-5">
              <input className="input-field text-sm" placeholder="Beskrivelse (f.eks. Nyt køkken)"
                value={f.beskrivelse} onChange={e => updateForbedring(f.id, 'beskrivelse', e.target.value)} />
            </div>
            <div className="col-span-3">
              <input className="input-field text-sm" placeholder="År (f.eks. 2021)" type="number" min="1990" max="2030"
                value={f.aar} onChange={e => updateForbedring(f.id, 'aar', e.target.value)} />
            </div>
            <div className="col-span-3">
              <input className="input-field text-sm" placeholder="Beløb (kr.)" type="number"
                value={f.beloeb} onChange={e => updateForbedring(f.id, 'beloeb', e.target.value)} />
            </div>
            <div className="col-span-1 flex justify-center pt-3">
              <button onClick={() => removeForbedring(f.id)} className="text-red-400 hover:text-red-600 text-lg">×</button>
            </div>
          </div>
        ))}
        <button onClick={addForbedring} className="text-sm text-blomfelt-green-light hover:underline font-medium">
          + Tilføj forbedring
        </button>
      </section>

      <section>
        <label className="label">Inventar der medfølger i salget</label>
        <textarea className="input-field text-sm" rows={3}
          placeholder="F.eks. gardinstænger, indbyggede skabe, hårde hvidevarer..."
          value={data.inventar}
          onChange={e => setData({ ...data, inventar: e.target.value })}
        />
      </section>

      <section>
        <h3 className="font-semibold text-blomfelt-green mb-1">Kendte mangler</h3>
        <p className="text-sm text-gray-500 mb-4">
          Du har en lovpligtig oplysningspligt. Angiv kendte fejl og mangler i boligen.
          Ulovligheder skal udbedres inden overdragelse.
        </p>
        {data.mangler.map(m => (
          <div key={m.id} className="grid grid-cols-12 gap-2 mb-3 items-start">
            <div className="col-span-8">
              <input className="input-field text-sm" placeholder="Beskrivelse af manglen"
                value={m.beskrivelse} onChange={e => updateMangel(m.id, 'beskrivelse', e.target.value)} />
            </div>
            <div className="col-span-3 flex items-center gap-2 pt-3">
              <input type="checkbox" id={`udb-${m.id}`} checked={m.udbedres}
                onChange={e => updateMangel(m.id, 'udbedres', e.target.checked)} />
              <label htmlFor={`udb-${m.id}`} className="text-sm text-gray-600">Jeg udbedrer</label>
            </div>
            <div className="col-span-1 flex justify-center pt-3">
              <button onClick={() => removeMangel(m.id)} className="text-red-400 hover:text-red-600 text-lg">×</button>
            </div>
          </div>
        ))}
        <button onClick={addMangel} className="text-sm text-blomfelt-green-light hover:underline font-medium">
          + Tilføj mangel
        </button>
        {data.mangler.length === 0 && (
          <p className="text-sm text-gray-400 mt-2 italic">Ingen kendte mangler – udfyld venligst oven for hvis relevant</p>
        )}
      </section>
    </div>
  )
}

// ─── Trin 2: Andelsbevis ──────────────────────────────────
function Trin2({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-blomfelt-green mb-1">Andelsbevis</h3>
        <p className="text-sm text-gray-500 mb-6">
          Andelsbeviset dokumenterer din ejendomsret. Det skal som udgangspunkt afleveres ved overdragelse.
        </p>
        <div className="space-y-4">
          <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            !data.andelsbevisMangler ? 'border-blomfelt-green bg-blomfelt-yellow' : 'border-gray-200'
          }`}>
            <input type="radio" name="andelsbevis" checked={!data.andelsbevisMangler}
              onChange={() => setData({ ...data, andelsbevisMangler: false })}
              className="mt-1" />
            <div>
              <div className="font-medium text-blomfelt-green">Jeg har andelsbeviset</div>
              <div className="text-sm text-gray-500">Jeg uploader eller sender andelsbeviset til Blomfelt</div>
            </div>
          </label>
          <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            data.andelsbevisMangler ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
          }`}>
            <input type="radio" name="andelsbevis" checked={data.andelsbevisMangler}
              onChange={() => setData({ ...data, andelsbevisMangler: true })}
              className="mt-1" />
            <div>
              <div className="font-medium text-orange-700">Andelsbevis forefindes ikke</div>
              <div className="text-sm text-gray-500">
                Systemet genererer automatisk en erklæring herom, som skal underskrives
              </div>
            </div>
          </label>
        </div>
        {!data.andelsbevisMangler && (
          <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm text-gray-500 mb-3">
              Upload andelsbevis her (PDF, JPG eller PNG)<br />
              <span className="text-xs text-gray-400">— eller send det til handel@blomfelt.dk med sagsnummeret —</span>
            </p>
            <label className="btn-secondary text-sm cursor-pointer">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
              Vælg fil
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Trin 3: Dokumenter ───────────────────────────────────
function Trin3({ data, setData, sagInfo }: { data: WizardData; setData: (d: WizardData) => void; sagInfo: SagInfo }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-blomfelt-green mb-1">Rapporter og dokumenter</h3>
        <p className="text-sm text-gray-500 mb-6">
          Systemet bestiller automatisk de rapporter din forening kræver hos <strong>Cera</strong>, umiddelbart efter du har godkendt din ansøgning.
        </p>
        <div className="space-y-3 mb-6">
          {[
            { label: 'Vurderingsrapport', req: true, info: 'Altid påkrævet' },
            { label: 'El-tjek (installationsattest)', req: sagInfo.krav_el === 1, info: sagInfo.krav_el ? 'Krævet af din forening' : 'Ikke krævet af din forening' },
            { label: 'VVS-tjek', req: sagInfo.krav_vvs === 1, info: sagInfo.krav_vvs ? 'Krævet af din forening' : 'Ikke krævet af din forening' },
          ].map(r => (
            <div key={r.label} className={`flex items-center gap-3 p-3 rounded-lg ${r.req ? 'bg-blomfelt-yellow' : 'bg-gray-50'}`}>
              <span className={`text-lg ${r.req ? 'text-blomfelt-green' : 'text-gray-400'}`}>{r.req ? '✓' : '○'}</span>
              <div>
                <div className={`text-sm font-medium ${r.req ? 'text-blomfelt-green' : 'text-gray-400'}`}>{r.label}</div>
                <div className="text-xs text-gray-400">{r.info}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <strong>Betaling:</strong> El- og VVS-tjek betales af dig (sælger). Vurderingsrapporten deles ligeligt mellem køber og sælger. Udgifterne modregnes i dit salgsprovenu.
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-blomfelt-green mb-1">Hasteekspedition</h3>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={data.hasteekspedition}
            onChange={e => setData({ ...data, hasteekspedition: e.target.checked })}
            className="mt-1" />
          <div>
            <div className="text-sm font-medium">Tilkøb hasteekspedition</div>
            <div className="text-xs text-gray-500">Overdragelsesaftale klar på 2 hverdage i stedet for 10-20 hverdage</div>
          </div>
        </label>
      </div>
      <div>
        <h3 className="font-semibold text-blomfelt-green mb-1">Upload øvrige dokumenter (valgfrit)</h3>
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <p className="text-sm text-gray-400">Eventuelle tidligere tilstandsrapporter, energimærke m.m.</p>
          <label className="mt-3 btn-secondary text-sm cursor-pointer inline-block">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" />
            Vælg filer
          </label>
        </div>
      </div>
    </div>
  )
}

// ─── Trin 4: Praktisk ─────────────────────────────────────
function Trin4({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  const minDate = new Date(Date.now() + 6 * 7 * 86400000).toISOString().slice(0, 10)
  return (
    <div className="space-y-6">
      <div>
        <label className="label">Ønsket overtagelsesdato</label>
        <input type="date" className="input-field" min={minDate}
          value={data.oensketOvertagelse}
          onChange={e => setData({ ...data, oensketOvertagelse: e.target.value })}
        />
        <p className="text-xs text-gray-400 mt-1">
          Tidligst {new Date(minDate).toLocaleDateString('da-DK')} (6 uger fra rapporter er modtaget)
        </p>
      </div>
      <div>
        <label className="label">Kontaktperson for adgang til boligen</label>
        <input className="input-field" placeholder="Navn på kontaktperson"
          value={data.adgangKontakt}
          onChange={e => setData({ ...data, adgangKontakt: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Adgangsoplysninger (portkode, nøgleplacering m.m.)</label>
        <textarea className="input-field text-sm" rows={2}
          placeholder="F.eks. 'Nøgle hænger hos nabo, dørtelefon 12'"
          value={data.adgangNote}
          onChange={e => setData({ ...data, adgangNote: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Registreringsnr. og kontonr. til udbetaling af salgsprovenu</label>
        <input className="input-field" placeholder="1234 56789012"
          value={data.bankkonto}
          onChange={e => setData({ ...data, bankkonto: e.target.value })}
        />
        <p className="text-xs text-gray-400 mt-1">Format: reg.nr. (4 cifre) + kontonr. (op til 10 cifre)</p>
      </div>
    </div>
  )
}

// ─── Trin 5: Godkend ──────────────────────────────────────
function Trin5({ data, sagInfo }: { data: WizardData; sagInfo: SagInfo }) {
  return (
    <div className="space-y-6">
      <div className="bg-blomfelt-yellow rounded-lg p-4">
        <h3 className="font-semibold text-blomfelt-green mb-3">Opsummering</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><dt className="text-gray-500 w-40">Sælger:</dt><dd className="font-medium">{sagInfo.saelger_navn}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-40">Adresse:</dt><dd className="font-medium">{sagInfo.saelger_adresse}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-40">Forening:</dt><dd className="font-medium">{sagInfo.forening_navn}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-40">Ønsket overtagelse:</dt><dd className="font-medium">{data.oensketOvertagelse ? new Date(data.oensketOvertagelse).toLocaleDateString('da-DK') : '–'}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-40">Andelsbevis:</dt><dd className="font-medium">{data.andelsbevisMangler ? 'Forefindes ikke' : 'Fremsendes / uploadet'}</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-40">Forbedringer:</dt><dd className="font-medium">{data.forbedringer.filter(f => f.beskrivelse).length} stk. – {data.forbedringer.filter(f => f.beskrivelse && f.beloeb).reduce((s, f) => s + parseInt(f.beloeb || '0'), 0).toLocaleString('da-DK')} kr.</dd></div>
          <div className="flex gap-2"><dt className="text-gray-500 w-40">Kendte mangler:</dt><dd className="font-medium">{data.mangler.filter(m => m.beskrivelse).length} stk.</dd></div>
        </dl>
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold text-blomfelt-green">Hvad sker der efter godkendelse?</h3>
        {[
          { icon: '📋', text: 'Systemet bestiller automatisk rapporter hos Cera' },
          { icon: '📊', text: 'Når rapporter er modtaget, genereres en salgsopstilling' },
          { icon: '🏠', text: `Boligen udbydes på intern venteliste i ${sagInfo?.intern_dage || 14} dage` },
          { icon: '🌐', text: 'Herefter på ekstern liste (andelshandel.dk)' },
          { icon: '✍️', text: 'Når køber er fundet, genereres overdragelsesaftalen automatisk' },
        ].map((s, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm text-gray-600 pt-0.5">{s.text}</span>
          </div>
        ))}
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
        <strong>Vigtigt:</strong> Ved at godkende bekræfter du, at alle oplysninger er korrekte. Du har en lovpligtig oplysningspligt (BEK nr. 336 af 20/03/2025).
      </div>
    </div>
  )
}

// ─── Hoved-wizard ─────────────────────────────────────────
export default function WizardClient() {
  const params = useParams()
  const token = params.token as string

  const [step, setStep] = useState(0)
  const [sagInfo, setSagInfo] = useState<SagInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [data, setData] = useState<WizardData>({
    forbedringer: [],
    mangler: [],
    inventar: '',
    andelsbevisMangler: false,
    hasteekspedition: false,
    oensketOvertagelse: '',
    adgangKontakt: '',
    adgangNote: '',
    bankkonto: '',
  })

  useEffect(() => {
    apiGetSag(token)
      .then(d => { setSagInfo(d); setLoading(false) })
      .catch(() => { setError('Ugyldigt eller udløbet link'); setLoading(false) })
  }, [token])

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await apiSaveSag(token, data)
      setSubmitted(true)
    } catch {
      alert('Der opstod en fejl. Prøv igen.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF6E1' }}>
      <div className="text-blomfelt-green animate-pulse">Henter sag...</div>
    </div>
  )

  if (error || !sagInfo) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#FDF6E1' }}>
      <div className="card text-center max-w-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Ugyldigt link</h1>
        <p className="text-gray-500 text-sm">Dette link er udløbet eller ugyldigt.<br />Kontakt handel@blomfelt.dk</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDF6E1' }}>
      <header style={{ backgroundColor: '#2C403A' }} className="py-4 px-6">
        <div className="max-w-2xl mx-auto">
          <Image src="/logo-white.svg" alt="Blomfelt" width={160} height={72} />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="card text-center max-w-lg">
          <div className="rounded-t-xl -mx-6 -mt-6 mb-6 px-6 py-4" style={{ backgroundColor: '#2C403A' }}>
            <p className="text-white font-semibold text-lg">✓ Oplysninger modtaget!</p>
          </div>
          <p className="text-gray-600 mb-6">Tak, {sagInfo.saelger_navn}. Systemet bestiller nu rapporter hos Cera.</p>
          <div className="rounded-lg p-4 text-left text-sm space-y-2.5" style={{ backgroundColor: '#FDF6E1' }}>
            <p className="font-semibold" style={{ color: '#2C403A' }}>Hvad sker der nu?</p>
            <p className="text-gray-700">✓ Rapporter bestilt hos Cera</p>
            <p className="text-gray-700">⏳ Cera kontakter dig for at aftale tid til besigtigelse</p>
            <p className="text-gray-700">📊 Salgsopstilling genereres når rapporter er modtaget</p>
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDF6E1' }}>
      <header style={{ backgroundColor: '#2C403A' }} className="py-4 px-6">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Image src="/logo-white.svg" alt="Blomfelt" width={140} height={63} />
          <div className="text-xs text-white/50">Andelsoverdragelse</div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg px-4 py-3 mb-6 text-sm border" style={{ backgroundColor: '#2C403A14', borderColor: '#2C403A30' }}>
            <span className="font-semibold" style={{ color: '#2C403A' }}>{sagInfo.saelger_adresse}</span>
            <span className="text-gray-400 mx-2">·</span>
            <span className="text-gray-500">{sagInfo.forening_navn}</span>
          </div>

          <div className="card">
            <ProgressBar step={step} total={STEPS.length} />
            <h2 className="text-xl font-bold text-blomfelt-green mb-6">
              Trin {step + 1}: {STEPS[step]}
            </h2>

            {step === 0 && <Trin1 data={data} setData={setData} />}
            {step === 1 && <Trin2 data={data} setData={setData} />}
            {step === 2 && <Trin3 data={data} setData={setData} sagInfo={sagInfo} />}
            {step === 3 && <Trin4 data={data} setData={setData} />}
            {step === 4 && <Trin5 data={data} sagInfo={sagInfo} />}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 0 ? (
                <button onClick={() => setStep(s => s - 1)} className="btn-secondary">← Tilbage</button>
              ) : <div />}
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)} className="btn-primary">Næste →</button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary bg-green-600 hover:bg-green-700">
                  {submitting ? 'Sender...' : '✓ Godkend og igangsæt'}
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Dine oplysninger gemmes løbende · Link udløber {new Date(sagInfo.token_udloeber).toLocaleDateString('da-DK')}
          </p>
        </div>
      </main>
    </div>
  )
}
