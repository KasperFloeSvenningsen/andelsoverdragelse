$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir
git add .
git commit -m "Add 404.html redirect for legacy /saelg/TOKEN URLs

GitHub Pages serves 404.html for any unmatched path. The script
detects /saelg/TOKEN patterns and redirects to /saelg/?token=TOKEN
so the single static wizard page can handle them. Also catches
URLs missing the /andelsoverdragelse basePath."
git push origin main
