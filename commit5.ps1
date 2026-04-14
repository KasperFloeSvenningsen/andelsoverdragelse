$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir

git add .
git commit -m "Add localStorage fake DB for GitHub Pages demo

- lib/clientDb.ts: full localStorage-backed fake DB seeded with
  AB Haraldsted (6044) demo data (3 sager, rapporter)
- lib/api.ts: isomorphic API layer that tries real fetch first,
  falls back to clientDb on any error (404, network, etc.)
- All three pages (landing, wizard, admin) now use api.ts instead
  of raw fetch() calls - works identically on server and Pages"

git push origin main
