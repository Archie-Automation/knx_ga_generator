# Tauri desktop app (Stap 1)

De KNX webtool kan als desktop app draaien via Tauri. Licentie en device-registratie lopen via Supabase Edge Functions (geen lokale license-server meer).

## Vereisten

- **Rust** (voor Tauri): installeer via https://rustup.rs/  
  Daarna in een nieuwe terminal: `rustup default stable`
- **Node** en **npm** (al aanwezig)
- **Supabase:** `.env` met `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` (zie docs/RELEASE_BUILD_NO_LOCAL_LICENSE_SERVER.md)

## Starten (development)

```bash
npm run tauri dev
```

**Belangrijk:** Start de app altijd met `npm run tauri dev`, niet door de .exe direct dubbel te klikken.  
`tauri dev` start de Vite dev-server en opent het Tauri-venster. De **debug** .exe laadt de UI van `http://localhost:5173`.

**Zwart scherm of "src-t" in het venster:** Het venster kan opengaan vóórdat Vite klaar is. Wacht in de terminal tot je iets als `Local: http://localhost:5173` ziet, en druk dan in het Tauri-venster op **F5** om te herladen. Als je de .exe los start (zonder dev-server), krijg je "localhost heeft geweigerd verbinding te maken" (ERR_CONNECTION_REFUSED).

Login en licentie werken via Supabase.

## Build (productie)

```bash
npm run tauri build
```

Output staat in `src-tauri/target/release/` (en in `bundle/` voor installers).  
De **release** .exe laadt de UI uit de gebundelde `dist/` en heeft **geen** dev-server nodig; die kun je wél dubbelklikken om de app te starten.

## Eigen icoon (installer + app)

Vervang het standaard Tauri-icoon door je eigen icoon voor de .exe, .msi en toekomstige builds:

1. **Plaats je icoon** als `app-icon.png` in de projectmap (KNX/).
   - Formaat: PNG of SVG, vierkant, minimaal 512×512 px
   - Transparante achtergrond werkt goed

2. **Genereer alle iconen:**
   ```bash
   npm run tauri:icon
   ```
   Dit maakt icon.ico, icon.icns en alle PNG-formaten in `src-tauri/icons/`.

3. **Bouw opnieuw:**
   ```bash
   npm run tauri build
   ```

De installers (KNX GA Generator_0.1.0_x64-setup.exe en KNX GA Generator_0.1.0_x64_en-US.msi) gebruiken dan jouw icoon.

**Als de iconen nog steeds niet kloppen:** voer een volledige clean build uit:
```bash
npm run clean
npm run tauri build
```
Dit verwijdert ook de bundle-map zodat de installers opnieuw worden gebouwd met de juiste iconen.

## Configuratie

- **Tauri:** `src-tauri/tauri.conf.json` – devUrl, frontendDist, CSP (Supabase toegestaan).
- **Vite:** `vite.config.ts` – poort 5173, Tauri dev host en HMR.
- **Env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; zie `.env.example`.
