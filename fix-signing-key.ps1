# Verwijder de verkeerde TAURI_SIGNING_PRIVATE_KEY (stond op pad i.p.v. key-inhoud)
[Environment]::SetEnvironmentVariable('TAURI_SIGNING_PRIVATE_KEY', $null, 'User')
Write-Host "Verkeerde User environment variable verwijderd." -ForegroundColor Green
Write-Host ""
Write-Host "Nu:" -ForegroundColor Cyan
Write-Host "1. Sluit ALLE PowerShell/terminal vensters"
Write-Host "2. Open een nieuwe PowerShell"
Write-Host "3. Het profiel laadt dan de key correct uit het bestand"
Write-Host "4. Voer uit: npm run tauri build"
Write-Host ""
Write-Host "Of voer nu in deze sessie uit:"
Write-Host '  $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Path "$env:USERPROFILE\.tauri\knx-ga-generator.key" -Raw'
Write-Host "  npm run tauri build"
