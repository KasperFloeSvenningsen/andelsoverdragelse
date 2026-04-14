$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse'
Set-Location $dir

git add .
git commit -m "Fix 404 on dynamic tokens + basePath in links

- next.config.ts: expose NEXT_PUBLIC_BASE_PATH env var
- app/saelg/page.tsx + WizardLoader.tsx: single static page that
  handles any token via ?token= query param (no pre-generation needed)
- WizardClient: accepts optional tokenOverride prop
- Landing page: links now use /saelg/?token=XXX + correct basePath
- Admin: Abn szelger-wizard also uses correct basePath + query format"

git push origin main
