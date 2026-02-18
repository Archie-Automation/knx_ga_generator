# Diagnose Tauri signing key
$keyPath = "$env:USERPROFILE\.tauri\knx-ga-generator.key"

Write-Host "=== Diagnose ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Key bestand bestaat:" (Test-Path $keyPath)
Write-Host "   Pad: $keyPath"
Write-Host ""

if (Test-Path $keyPath) {
    $content = Get-Content $keyPath -Raw
    Write-Host "2. Eerste 60 tekens van key bestand:"
    Write-Host "   $($content.Substring(0, [Math]::Min(60, $content.Length)))..."
    Write-Host "   (Bevat dubbele punt : ?" ($content -match ':') ")"
    Write-Host "   (Bevat backslash \ ?" ($content -match '\\') ")"
} else {
    Write-Host "2. Key bestand niet gevonden!"
}

Write-Host ""
Write-Host "3. TAURI_SIGNING_PRIVATE_KEY (User env var):"
$userVal = [Environment]::GetEnvironmentVariable('TAURI_SIGNING_PRIVATE_KEY', 'User')
if ($userVal) {
    Write-Host "   Gezet: $($userVal.Substring(0, [Math]::Min(30, $userVal.Length)))..."
    Write-Host "   (Bevat dubbele punt : ?" ($userVal -match ':') ")"
} else {
    Write-Host "   Niet gezet"
}

Write-Host ""
Write-Host "4. TAURI_SIGNING_PRIVATE_KEY (Machine env var):"
$machineVal = [Environment]::GetEnvironmentVariable('TAURI_SIGNING_PRIVATE_KEY', 'Machine')
if ($machineVal) {
    Write-Host "   Gezet: $($machineVal.Substring(0, [Math]::Min(30, $machineVal.Length)))..."
} else {
    Write-Host "   Niet gezet"
}
