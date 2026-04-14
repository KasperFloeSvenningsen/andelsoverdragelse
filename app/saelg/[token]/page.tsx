// Server component — handles static params for `next export`.
// All interactive logic lives in WizardClient (client component).

import WizardClient from './WizardClient'

// Pre-render the known demo pages at build time (required for static export).
// Real tokens are resolved client-side at runtime via the API.
export async function generateStaticParams() {
  return [
    { token: 'DEMO-TOKEN-SOEREN-2025' },
    { token: 'DEMO-TOKEN-KIRSTEN-2025' },
    { token: 'DEMO-TOKEN-ANDERS-2024' },
  ]
}

export default function WizardPage() {
  return <WizardClient />
}
