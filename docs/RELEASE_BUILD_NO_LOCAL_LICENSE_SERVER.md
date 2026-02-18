# Release Build Without Local License Server

Step-by-step plan: use Supabase Edge Functions instead of a local license server. Exact file locations, env vars, and Tauri build steps.

---

## 1. What was changed (summary)

| Item | Before | After |
|------|--------|--------|
| License check | `fetch(http://localhost:3000/license/check)` | `supabase.functions.invoke('license-check', { body: {} })` |
| Device registration | Already used `register-device` Edge Function | Unchanged; still sends session token + fingerprint, deviceName, appVersion |
| "Start license server" message | Shown on connection error | Replaced with generic "Check connection / Supabase" in all locales |
| CSP (Tauri) | Allowed localhost:3000 | Removed; only Supabase + dev ws |
| Debug logs (register-device) | Dev only | Dev always; release when `VITE_DEBUG_REGISTER_DEVICE=true` or one-line success log in release |

---

## 2. File locations

| Purpose | Path |
|--------|------|
| Supabase client (URL, anon key) | `src/lib/supabase.ts` |
| License check (now Edge Function) | `src/hooks/useLicense.ts` |
| Device registration + debug logs | `src/lib/registerDevice.ts` |
| Where registerDevice() is called | `src/App.tsx` (onAuthStateChange) |
| License error hint (UI) | `src/ui/LicenseStatus.tsx` (uses `t('licenseErrorHint')`) |
| Locale strings (no "start server") | `src/locales/en.json`, `nl.json`, `de.json`, `fr.json`, `es.json` |
| Tauri CSP (no localhost:3000) | `src-tauri/tauri.conf.json` |
| Env example | `.env.example` |

---

## 3. Environment variables

Use a `.env` in the project root (copy from `.env.example`). Vite bakes these into the build at **build time**.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Cloud URL, e.g. `https://YOUR-PROJECT-REF.supabase.co` (not localhost). |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon (public) key from Supabase Dashboard → Settings → API. |
| `VITE_DEBUG_REGISTER_DEVICE` | No | Set to `true` to enable full `[register-device]` debug logs in **release** build. |

No `VITE_LICENSE_API_URL` or localhost URL. License check uses the same Supabase project via `supabase.functions.invoke('license-check')`.

---

## 4. Supabase Edge Functions required

- **register-device** – already implemented and deployed.  
  - Called with: current session (Bearer token) + body `{ fingerprint, deviceName, appVersion }`.  
  - Inserts/updates row in `devices` table.

- **license-check** – implemented in `supabase/functions/license-check/index.ts`.  
  - Hook calls `supabase.functions.invoke('license-check', { body: {} })`.  
  - Returns JSON: `{ status, plan, validUntil, offlineGraceDays }`.  
  - You must deploy it (see section 4a below) or the app will show a license error.

### 4a. Deploy both Edge Functions (beginner-friendly)

1. Install Supabase CLI if needed:  
   [Supabase CLI](https://supabase.com/docs/guides/cli) (e.g. `npm install -g supabase` or use the installer).

2. Log in and link the project (one-time):
   ```powershell
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   ```
   Get `YOUR-PROJECT-REF` from the Supabase Dashboard URL: `https://supabase.com/dashboard/project/YOUR-PROJECT-REF`.

3. Deploy **register-device** and **license-check** from the project root:
   ```powershell
   cd c:\Users\gebruiker\KNX
   supabase functions deploy register-device
   supabase functions deploy license-check
   ```

4. Confirm in Dashboard: **Edge Functions** → you should see both `register-device` and `license-check`.

---

## 5. Release build configuration

1. **.env for production**  
   - In project root, `.env` (or `.env.production`) must have:
     - `VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co`
     - `VITE_SUPABASE_ANON_KEY=<your-anon-key>`
   - No localhost. Do not set `VITE_LICENSE_API_URL`.

2. **Optional: release debug logs for register-device**  
   - Add to `.env` (or set when building):
     - `VITE_DEBUG_REGISTER_DEVICE=true`
   - Then build. In the built app, console will show full `[register-device]` logs (session, payload, response).

3. **Build commands** (from project root, e.g. `c:\Users\gebruiker\KNX`):

   ```powershell
   # Install deps if needed
   npm install

   # Build frontend + Tauri (uses .env at build time)
   npm run tauri build
   ```

   Output: executable and installers under `src-tauri/target/release/` (and `bundle/`).

---

## 6. Verifying register-device in release

1. **Without extra env**  
   - Run the release build (exe or installed app), sign in.  
   - Open DevTools if available (e.g. right-click → Inspect), or run with console.  
   - On successful registration you should see one line:  
     `[register-device] Device registered with Supabase. Check Table Editor → devices.`

2. **With full debug logs**  
   - Set in `.env`: `VITE_DEBUG_REGISTER_DEVICE=true`  
   - Run `npm run tauri build` again, then run the new build.  
   - Console will show: Supabase URL, session exists, user ID, access token present, payload, and full Edge Function response.

3. **Database**  
   - Supabase Dashboard → Table Editor → `devices`.  
   - After signing in in the release app, a row should appear (or `last_seen` updated) for your user and device.

---

## 7. Checklist before release build

- [ ] `.env` has `VITE_SUPABASE_URL` = cloud URL (not localhost).
- [ ] `.env` has `VITE_SUPABASE_ANON_KEY` = anon key.
- [ ] Supabase Edge Function `register-device` is deployed.
- [ ] Supabase Edge Function `license-check` is deployed (source: `supabase/functions/license-check/index.ts`; deploy with `supabase functions deploy license-check`).
- [ ] CSP in `src-tauri/tauri.conf.json` does not allow localhost:3000 (already updated).
- [ ] Run `npm run tauri build` from project root; test the exe/installer, confirm device row in Supabase and that license UI shows no localhost errors.

---

## 8. If license-check is not deployed yet

The app will call `license-check` and get an error (e.g. function not found). The sidebar will show the license error and the generic hint (check connection / Supabase). To fix:

1. Deploy the function (see **section 4a**):  
   `supabase functions deploy license-check`
2. The function is in `supabase/functions/license-check/index.ts`. It requires a Bearer token and returns `{ status, plan, validUntil, offlineGraceDays }`. By default it returns an "active" license; you can later add a DB table and return real plan/validUntil per user.

Until then, device registration (`register-device`) still runs on sign-in; only the license status in the UI will show an error.

---

## 9. Troubleshooting

### Debug: "Failed to send a request to the Edge Function"

- **Cause:** The app could not reach the Supabase Edge Function (e.g. function not deployed, or wrong Supabase URL).
- **Fix:**
  1. Deploy the function: `supabase functions deploy license-check`
  2. In `.env` use your **cloud** Supabase URL: `VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co` (not localhost).
  3. Restart the dev app so it picks up the env (e.g. `npm run tauri dev`).

### Release: still shows "Start de license-server … op poort 3000"

- **Cause:** The release build was made **before** the locale change. The old `licenseErrorHint` text was baked into the bundle.
- **Fix:** Do a **clean release build** so the new locale strings are included:
  ```powershell
  npm run tauri build
  ```
  Use the new executable/installer from `src-tauri/target/release/` (or `bundle/`). After this, the license error hint will show the generic "Controleer je verbinding … Supabase" message instead of the old license-server text.

### CORS: "Response to preflight request doesn't pass access control check: It does not have HTTP ok status" (license-check)

- **Cause:** The `license-check` Edge Function is **not deployed** (or failed to deploy). The browser sends an OPTIONS preflight; the server returns 404/502 without CORS headers, so the browser reports this as a CORS error.
- **Fix:** Deploy the function and confirm it appears in the dashboard. See **section 10** below.

### 401 on register-device

- **Cause:** The Edge Function rejects the request: missing/invalid token, or the session token was created with a **different** Supabase project/anon key (e.g. before you fixed `.env`).
- **Fix:**
  1. Ensure `.env` has the correct `VITE_SUPABASE_ANON_KEY` from Dashboard → Settings → API, then restart dev server.
  2. **Sign out completely** in the app, then **sign in again** so a new JWT is issued for the correct project.
  3. If it still returns 401, check Dashboard → Edge Functions → **register-device** → Logs to see the exact error (e.g. "Invalid or expired token").

---

## 10. Deploy Edge Functions (step-by-step, fix CORS + 401)

Do this once so both `license-check` and `register-device` are deployed and your session matches the project.

1. **Install Supabase CLI** (if needed):
   ```powershell
   npm install -g supabase
   ```

2. **Login and link** (one-time; use your project ref from the dashboard URL):
   ```powershell
   supabase login
   cd C:\Users\gebruiker\KNX
   supabase link --project-ref ajdaacuzcqhuzfmaibpq
   ```
   When prompted for the database password, use the one from Dashboard → Settings → Database (or skip if you only need functions).

3. **Deploy both functions:**
   ```powershell
   supabase functions deploy license-check
   supabase functions deploy register-device
   ```
   You should see "Deployed function license-check" and "Deployed function register-device" (or similar).

4. **Verify in Dashboard:**  
   Open https://supabase.com/dashboard/project/ajdaacuzcqhuzfmaibpq/functions  
   You must see **license-check** and **register-device** in the list. If `license-check` is missing, the CORS preflight error will continue until it is deployed.

5. **Fresh session (fix 401):**  
   In the app: **Sign out**, then **Sign in** again. This issues a new JWT for project `ajdaacuzcqhuzfmaibpq`. Then reload; license-check and register-device should succeed.

---

## 11. Geen rijen in Table Editor → devices

Als je in Supabase alleen **licenses** ziet en **geen** tabel **devices** (of de tabel is leeg):

1. **Tabel aanmaken**  
   Ga naar **SQL Editor** → New query, plak en run:
   ```sql
   create table if not exists public.devices (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) on delete cascade,
     device_hash text not null,
     device_name text,
     app_version text,
     created_at timestamptz not null default now(),
     last_seen timestamptz not null default now(),
     unique(user_id, device_hash)
   );
   create index if not exists idx_devices_user_id on public.devices(user_id);
   alter table public.devices enable row level security;
   ```
   Controleer in **Table Editor** of de tabel **devices** nu bestaat.

2. **register-device opnieuw deployen** (na code-wijzigingen):
   ```powershell
   supabase functions deploy register-device
   ```

3. **In de app:** Uitloggen → opnieuw inloggen (of pagina herladen na inloggen).  
   In **devices** zou nu per ingelogde gebruiker minstens één rij moeten verschijnen.  
   - In de **browser** (dev) wordt een fallback fingerprint gebruikt (`web-<user_id>`).  
   - In de **Tauri desktop-app** wordt de echte device fingerprint gebruikt.
