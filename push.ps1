$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir

# Init git
git init
git add .
git commit -m "Initial commit: Blomfelt andelsoverdragelse prototype

- Next.js 15 app med AB Haraldsted (6044) testdata
- Sælger-wizard (5 trin), admin-dashboard, landingsside
- Blomfelt designmanual: grøn #2C403A, gul #FDF6E1, Montserrat
- SQLite database med anonymiserede andelshavere
- API routes: anmod, sag, sager"

# Create private repo and push
& 'C:\Program Files\GitHub CLI\gh.exe' repo create andelsoverdragelse --private --source=. --remote=origin --push
