$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir
git add .
git commit -m "Fix logo missing on GitHub Pages (basePath not prepended)

next/image with unoptimized:true does not auto-prepend basePath to
public/ assets. All three pages now construct the logo src from
NEXT_PUBLIC_BASE_PATH so the path is correct on both localhost and
GitHub Pages (/andelsoverdragelse/logo-white.svg)."
git push origin main
