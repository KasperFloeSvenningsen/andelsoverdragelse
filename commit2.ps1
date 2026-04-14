$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir

git add .
git commit -m "Fix static export: split wizard into server wrapper + client component

generateStaticParams cannot be used in a 'use client' file (Next.js 15).
Split into page.tsx (server, exports generateStaticParams) and
WizardClient.tsx ('use client', all interactive logic)."

git push origin main
