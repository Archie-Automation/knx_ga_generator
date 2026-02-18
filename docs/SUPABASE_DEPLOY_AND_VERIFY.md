# Deploy register-device Edge Function & Verify Devices in Database

Step-by-step plan for beginners. Do each step in order.

---

## 1. Check Supabase client (cloud URL and key)

### Where the client is

- **File:** `src/lib/supabase.ts`
- **What it uses:**
  - `VITE_SUPABASE_URL` from `.env` (or fallback `https://ajdaacuzcqhuzfmaibpq.supabase.co`)
  - `VITE_SUPABASE_ANON_KEY` from `.env` (or a fallback key)

### What you must do

1. **Create `.env` in the project root** (if you don’t have it), by copying:
   ```
   .env.example  →  .env
   ```

2. **Set the cloud URL (not localhost):**
   - Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **API**.
   - Copy **Project URL** (e.g. `https://xxxxx.supabase.co`).
   - In `.env` set:
     ```
     VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
     ```
   - Do **not** use `http://localhost` or `http://127.0.0.1` for the Edge Function.

3. **Set the anon (public) key:**
   - In the same **Settings → API** page, under **Project API keys**, copy the **anon public** key (long string, often starts with `eyJ...`).
   - In `.env` set:
     ```
     VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
     ```
   - Use the **anon** key for the frontend, not the service_role key.

4. **Check in the app:**
   - Run your app and open the browser console (F12).
   - You should see: `[Supabase] Project URL: https://xxxxx.supabase.co`.
   - If you see a warning about localhost, fix `VITE_SUPABASE_URL` in `.env` and restart the dev server.

---

## 2. Check Edge Function exists locally

### Location

- **Folder:** `supabase/functions/register-device/`
- **File:** `supabase/functions/register-device/index.ts`

### What to do

1. In File Explorer (or your editor), open:
   ```
   KNX/supabase/functions/register-device/
   ```
2. Confirm that **index.ts** is there and contains the function that:
   - Reads `Authorization` Bearer token
   - Parses JSON body: `fingerprint`, `deviceName`, `appVersion`
   - Inserts or updates a row in the `devices` table

If the file is missing, the function was not created; you need to add it (e.g. from your backup or repo).

---

## 3. Deploy the Edge Function (Supabase CLI)

### Install Supabase CLI (if needed)

**Windows (PowerShell):**

```powershell
# Option A: npm (recommended if you use Node)
npm install -g supabase

# Option B: scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Check:

```powershell
supabase --version
```

### Log in and link the project

1. **Log in:**
   ```powershell
   supabase login
   ```
   A browser window opens; sign in with your Supabase account.

2. **Go to your project folder:**
   ```powershell
   cd C:\Users\gebruiker\KNX
   ```
   (Use your real path to the KNX app.)

3. **Link to your cloud project:**
   ```powershell
   supabase link --project-ref YOUR-PROJECT-REF
   ```
   Replace `YOUR-PROJECT-REF` with the ref from your Project URL (e.g. from `https://ajdaacuzcqhuzfmaibpq.supabase.co` the ref is `ajdaacuzcqhuzfmaibpq`).

   When asked for the database password, use the password you set for the project (or reset it in Dashboard → Settings → Database).

### Deploy the function

From the same folder (`KNX`):

```powershell
supabase functions deploy register-device
```

You should see output like “Deployed function register-device”.

### If you don’t have `config.toml` yet

If `supabase link` says there is no config, run first:

```powershell
supabase init
```

Then run `supabase link --project-ref YOUR-PROJECT-REF` again, then deploy:

```powershell
supabase functions deploy register-device
```

---

## 4. Verify the function is callable from the frontend

### How your app calls it

- **File:** `src/lib/registerDevice.ts`
- **When:** Triggered from `App.tsx` when the user is signed in (`onAuthStateChange` with `SIGNED_IN` or `INITIAL_SESSION`).

It:

1. Uses the **current session** from `supabase.auth.getSession()`.
2. Sends the **access token** as **Authorization: Bearer &lt;token&gt;** (the Supabase JS client does this when you use `supabase.functions.invoke` with a logged-in client).
3. Sends a JSON body: `{ fingerprint, deviceName, appVersion }` from `getDeviceInfo()`.

No change needed here; this is how it already works.

### Debug logging (already in place)

In `src/lib/registerDevice.ts` the following are logged in the browser console (prefix `[register-device]`):

- Supabase project URL
- Session exists (true/false)
- User ID (or “(none)”)
- Access token present (true/false)
- Request payload: `fingerprint`, `deviceName`, `appVersion`
- “Calling Edge Function with Authorization Bearer token from session.”
- Either “Edge Function returned successfully. Response:” + data, or “Edge Function error:” + error

To see these: run the app, open DevTools (F12) → Console, sign in (or refresh while signed in), and look for `[register-device]` and `[Supabase]` lines.

---

## 5. Quick frontend test (device inserted in DB)

### A. Trigger the call

1. Start your app (e.g. `npm run dev` or Tauri dev).
2. Open the app in the browser (or in the Tauri window).
3. Open DevTools (F12) → **Console** tab.
4. Sign in (or refresh if already signed in).
5. Watch the console for:
   - `[Supabase] Project URL: https://...` (must be your cloud URL, not localhost).
   - `[register-device] Session exists: true`, `User ID: <uuid>`, `Access token present: true`.
   - `[register-device] Request payload ...` and `Edge Function returned successfully. Response: ...`.

If you see “Edge Function error” or “register-device call failed”, check the error message and the steps above (URL, key, deploy).

### B. Check the database (Supabase Dashboard)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. In the left sidebar click **Table Editor**.
3. Open the **devices** table (create it first if it doesn’t exist; see below).
4. After a successful call you should see a new row (or an updated row for the same user + device):
   - `user_id` = your user’s UUID
   - `device_hash` = value of `fingerprint` you sent
   - `device_name`, `app_version`, `last_seen`, etc.

### C. Check with SQL (optional)

1. In the Dashboard go to **SQL Editor**.
2. Run:

```sql
SELECT id, user_id, device_hash, device_name, app_version, created_at, last_seen
FROM public.devices
ORDER BY last_seen DESC
LIMIT 10;
```

You should see your device row(s) after a successful register-device call.

### If the `devices` table doesn’t exist

1. Dashboard → **SQL Editor**.
2. Run the contents of `supabase/migrations/create_devices_table.sql` (create table, index, RLS).
3. Then trigger the app again and re-check the Table Editor or the query above.

---

## 6. Checklist summary

| Step | What to do |
|------|------------|
| 1 | `.env` with `VITE_SUPABASE_URL` (cloud) and `VITE_SUPABASE_ANON_KEY` (anon key). Console shows `[Supabase] Project URL` = cloud URL. |
| 2 | Confirm `supabase/functions/register-device/index.ts` exists. |
| 3 | `supabase login` → `supabase link --project-ref YOUR-REF` → `supabase functions deploy register-device`. |
| 4 | Frontend already uses session + Bearer + JSON body; debug logs are in `registerDevice.ts`. |
| 5 | Console shows session, user ID, token present, payload, and “Edge Function returned successfully” or error. |
| 6 | Table Editor or SQL: `SELECT * FROM public.devices` shows the new/updated row after sign-in. |

---

## File locations (quick reference)

| What | Path |
|------|------|
| Supabase client (URL + key) | `src/lib/supabase.ts` |
| register-device caller + logs | `src/lib/registerDevice.ts` |
| Where registerDevice() is triggered | `src/App.tsx` (onAuthStateChange) |
| Edge Function code | `supabase/functions/register-device/index.ts` |
| Devices table SQL | `supabase/migrations/create_devices_table.sql` |
| Env example | `.env.example`; copy to `.env` and fill in real values |

---

## Common issues

- **“Missing Authorization header” from Edge Function**  
  Frontend is not signed in or session is missing. Check “Session exists” and “Access token present” in the console.

- **URL is localhost**  
  Set `VITE_SUPABASE_URL` in `.env` to your cloud Project URL and restart the dev server.

- **“Invalid or expired token”**  
  Use the **anon** key in `VITE_SUPABASE_ANON_KEY`, not the service_role key. Ensure the user is logged in.

- **Function not found / 404**  
  Deploy again: `supabase functions deploy register-device` from the project root.

- **No rows in `devices`**  
  Run the migration SQL so the `devices` table exists; then trigger sign-in again and check the console for “Edge Function returned successfully”.
