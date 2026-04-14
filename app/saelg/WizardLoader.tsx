'use client'

import { useSearchParams } from 'next/navigation'
import WizardClient from './[token]/WizardClient'

export default function WizardLoader() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  return <WizardClient tokenOverride={token} />
}
