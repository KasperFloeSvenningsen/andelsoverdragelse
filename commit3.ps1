$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir

git add .
git commit -m "Exclude API routes from static export (force-dynamic)

With output:export, Next.js 15 tries to evaluate all route handlers.
Adding force-dynamic marks them as server-only, excluding them from
the static export so the GitHub Pages build succeeds."

git push origin main
