$dir = 'C:\Users\KasperFl' + [char]0xF8 + 'eSvenningse\Downloads\code\Andelsoverdragelse\.github\workflows'
New-Item -ItemType Directory -Force -Path $dir
Write-Host "Created: $dir"
