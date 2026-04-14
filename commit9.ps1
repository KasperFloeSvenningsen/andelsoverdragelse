$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir
git add .
git commit -m "Fix 404 on /admin and other routes missing basePath

404.html now handles any known route missing /andelsoverdragelse:
  /admin          -> /andelsoverdragelse/admin/
  /saelg/TOKEN    -> /andelsoverdragelse/saelg/?token=TOKEN
  /saelg          -> /andelsoverdragelse/saelg/
  anything else   -> /andelsoverdragelse/"
git push origin main
