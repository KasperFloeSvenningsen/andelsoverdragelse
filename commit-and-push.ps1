$env:PATH = 'C:\Program Files\GitHub CLI;' + $env:PATH
$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir

# Enable GitHub Pages (source: GitHub Actions)
& 'C:\Program Files\GitHub CLI\gh.exe' api `
  --method PUT `
  -H "Accept: application/vnd.github+json" `
  /repos/KasperFloeSvenningsen/andelsoverdragelse/pages `
  -f source='{"branch":"main","path":"/"}' `
  --input - 2>&1 | Out-Null

# Actually use the newer Pages API to set build_type to workflow
& 'C:\Program Files\GitHub CLI\gh.exe' api `
  --method POST `
  -H "Accept: application/vnd.github+json" `
  /repos/KasperFloeSvenningsen/andelsoverdragelse/pages `
  -f build_type='workflow' 2>&1 | Out-Null

# Commit all new/changed files
git add .
git status
git commit -m "Add GitHub Pages static export and Actions deploy workflow

- next.config.ts: output=export, basePath, trailingSlash, unoptimized images
- wizard page: generateStaticParams for demo tokens
- .github/workflows/deploy.yml: build + deploy on push to main"

git push origin main
