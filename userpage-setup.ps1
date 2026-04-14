$ErrorActionPreference = 'Stop'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'

# 1. Create the user page repository
& $gh repo create KasperFloeSvenningsen.github.io --public --description "GitHub Pages user site" 2>&1

# 2. Clone it to a temp folder
$tmp = Join-Path $env:TEMP 'ghpages-usersite'
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
git clone "https://github.com/KasperFloeSvenningsen/KasperFloeSvenningsen.github.io.git" $tmp

Set-Location $tmp

# 3. Write index.html (redirect to the main app)
@'
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="refresh" content="0;url=/andelsoverdragelse/" />
  <title>Blomfelt</title>
</head>
<body><p>Omstiller til <a href="/andelsoverdragelse/">Blomfelt andelsoverdragelse</a>…</p></body>
</html>
'@ | Set-Content -Path "index.html" -Encoding UTF8

# 4. Write 404.html
@'
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="utf-8"/>
  <title>Blomfelt – omstiller…</title>
  <script>
    (function () {
      var base  = '/andelsoverdragelse';
      var path  = window.location.pathname;
      var qs    = window.location.search;

      // Strip basePath if already present
      var clean = path.indexOf(base) === 0 ? path.slice(base.length) : path;
      clean = clean.replace(/\/+$/, '') || '/';

      // /saelg/<TOKEN>  →  /saelg/?token=TOKEN
      var m = clean.match(/^\/saelg\/([^\/]+)$/);
      if (m) {
        window.location.replace(base + '/saelg/?token=' + encodeURIComponent(m[1]));
        return;
      }

      // Any known route missing the basePath prefix
      var known = ['/admin', '/saelg', '/'];
      if (known.indexOf(clean) !== -1 || clean.indexOf('/saelg') === 0) {
        window.location.replace(base + (clean === '/' ? '/' : clean + '/') + qs);
        return;
      }

      // Fallback → home
      window.location.replace(base + '/');
    })();
  </script>
  <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#FDF6E1;color:#2C403A}</style>
</head>
<body><p>Omstiller…</p></body>
</html>
'@ | Set-Content -Path "404.html" -Encoding UTF8

# 5. Commit and push
git add .
git config user.email "kasper@blomfelt.dk"
git config user.name "Kasper Floe Svenningsen"
git commit -m "Add root 404.html redirect for Blomfelt andelsoverdragelse app"
git push origin main

Write-Host "Done! User page live at https://kasperfloesvenningsen.github.io/"
