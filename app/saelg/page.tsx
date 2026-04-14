/**
 * /saelg/?token=XXX
 *
 * Fallback wizard page for dynamically-created tokens (e.g. tokens
 * generated via the form on GitHub Pages). Because Next.js static
 * export can only pre-render the three known demo tokens at
 * /saelg/[token]/, any new token links to this single static page
 * instead and the token is passed as a query parameter.
 */
import { Suspense } from 'react'
import WizardLoader from './WizardLoader'

export default function WizardQueryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF6E1' }}>
        <div className="text-blomfelt-green animate-pulse">Henter sag...</div>
      </div>
    }>
      <WizardLoader />
    </Suspense>
  )
}
