# Voegt Tauri signing key toe aan PowerShell profiel
$line = '$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Path "$env:USERPROFILE\.tauri\knx-ga-generator.key" -Raw -ErrorAction SilentlyContinue'

$profilePath = $PROFILE
$dir = Split-Path $profilePath

if (!(Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

if (Test-Path $profilePath) {
    $content = Get-Content $profilePath -Raw
    if ($content -notmatch 'TAURI_SIGNING_PRIVATE_KEY') {
        Add-Content -Path $profilePath -Value "`n$line"
        Write-Host "Regel toegevoegd aan profiel."
    } else {
        Write-Host "Regel bestaat al in profiel."
    }
} else {
    Set-Content -Path $profilePath -Value $line
    Write-Host "Nieuw profiel aangemaakt."
}

Write-Host "Profiel: $profilePath"
Write-Host "Sluit PowerShell en open opnieuw, of voer uit: . `$PROFILE"
