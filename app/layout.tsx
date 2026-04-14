import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Blomfelt – Andelsoverdragelse',
  description: 'Sælg din andelsbolig nemt og hurtigt med Blomfelt Ejendomsadministration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body className="min-h-screen" style={{ backgroundColor: '#FDF6E1' }}>
        {children}
      </body>
    </html>
  )
}
