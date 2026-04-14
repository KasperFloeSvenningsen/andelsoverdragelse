$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir
git add .
git commit -m "Fix internal links: use Next.js Link (auto-prepends basePath)

Replace all internal <a href='/...'> with <Link href='/...'>.
Next.js Link automatically prepends the basePath so links are
correct on both localhost and GitHub Pages without manual prefixing.

- app/page.tsx: Link to /admin, Link for wizard token URL
- app/admin/page.tsx: Link for nav (Ny sag, Sager), Link for wizard"
git push origin main
