$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir

git add .
git commit -m "Fix Pages build: remove app/api in workflow before static export

API routes cannot exist (force-static or force-dynamic) with
output:export. The workflow deletes app/api before building so
Next.js only exports the UI pages. The source code is unaffected."

git push origin main
