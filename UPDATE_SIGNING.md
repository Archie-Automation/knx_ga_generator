# Tauri Updater – Signing Keys

De Tauri updater vereist **code signing** zodat gebruikers alleen vertrouwde updates installeren.

## 1. Keys genereren

Voer het volgende uit in de projectmap:

```bash
npx tauri signer generate -w ~/.tauri/knx-ga-generator.key
```

Dit maakt:
- **Private key**: `~/.tauri/knx-ga-generator.key` (lokaal bewaren, nooit delen)
- **Public key**: wordt in de terminal getoond

## 2. Public key in configuratie

Kopieer de **public key** en zet die in `src-tauri/tauri.conf.json`:

```json
"plugins": {
  "updater": {
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1...",
    "endpoints": ["https://github.com/JOUW_GITHUB_USER/JOUW_REPO/releases/latest/download/latest.json"]
  }
}
```

Vervang `VERVANG_DIT_DOOR_PUBLIEKE_SLEUTEL_NA_tauri_signer_generate` door de gegenereerde public key.

## 3. GitHub-repo configureren

Vervang in `tauri.conf.json`:
- `JOUW_GITHUB_USER` → jouw GitHub-gebruikersnaam
- `JOUW_REPO` → de repositorynaam (bijv. `knx-ga-builder`)

## 4. Build met signing

Bij het bouwen van installers moet de **private key** beschikbaar zijn:

```bash
# Linux/macOS
export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/knx-ga-generator.key)"

# Windows PowerShell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Path "$env:USERPROFILE\.tauri\knx-ga-generator.key" -Raw

# Daarna builden
npm run tauri build
```

## 5. GitHub Releases

Bij elke release moet je uploaden:

1. **latest.json** – gegenereerd door `tauri build` (in `src-tauri/target/release/bundle/`)
2. **Installers** – `.msi` (Windows), `.dmg` (macOS), `.deb`/`.AppImage` (Linux)
3. **Update-bestanden** – `.nsis.zip`, `.app.tar.gz`, etc.

De `latest.json` ziet er zo uit:

```json
{
  "version": "0.1.0",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/.../KNX_GA_Generator_0.1.0_x64_en-US.msi",
      "signature": "..."
    }
  }
}
```

## 6. GitHub Actions (optioneel)

Voor geautomatiseerde releases kun je een workflow gebruiken die:

1. `tauri build` uitvoert met `TAURI_SIGNING_PRIVATE_KEY` als GitHub secret
2. De artifacts uploadt naar een GitHub Release
3. `latest.json` en de installers publiceert

De private key moet als **GitHub Secret** worden opgeslagen (bijv. `TAURI_SIGNING_PRIVATE_KEY`).
