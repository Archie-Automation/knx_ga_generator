# Supabase & register-device Edge Function – Audit Summary

## 1. Supabase client (createClient)

- **Primary:** `src/lib/supabase.ts`  
  - Uses `createClient(supabaseUrl, supabaseAnonKey)`.
  - Exports `supabase` and `supabaseUrl`.
- **Duplicate (legacy):** `src/supabaseClient.ts`  
  - Same URL/key, not used by the main app (App, useLicense, Login use `../lib/supabase`).

## 2. Supabase URL in use

- **Source:** `import.meta.env.VITE_SUPABASE_URL` with fallback  
  `https://ajdaacuzcqhuzfmaibpq.supabase.co`.
- **Logging:** In `src/lib/supabase.ts`, in DEV the URL is logged on load:  
  `[Supabase] Project URL: <url>`.

## 3. Localhost check

- In `src/lib/supabase.ts`, the URL is treated as localhost if it starts with  
  `http://localhost` or `http://127.0.0.1`.
- In DEV, a warning is logged if so:  
  `[Supabase] URL is pointing to localhost...`
- **Result:** Default and typical `.env` point to hosted Supabase; no localhost in production if you use `VITE_SUPABASE_URL` from dashboard.

## 4. register-device Edge Function – call sites

- **Before audit:** No calls to `register-device` anywhere in the project.
- **After audit:** The function is invoked from the auth flow via `src/lib/registerDevice.ts` (see below).

## 5. Request shape (Authorization + body)

The Edge Function is called with:

- **Authorization:** The Supabase client sends the session’s access token as `Authorization: Bearer <access_token>` when calling `supabase.functions.invoke(...)` with an active session.
- **Body:**  
  `{ fingerprint, deviceName, appVersion }`  
  - From `getDeviceInfo()`: Tauri `get_device_fingerprint` (or `""` in browser), `navigator.userAgent` as device name, and app version from Tauri or env.

So the request includes: Bearer token, `fingerprint`, `deviceName`, `appVersion`.

## 6. Debug logging

- **`src/lib/supabase.ts`**  
  - DEV: logs Supabase project URL.  
  - DEV: warns if URL is localhost.

- **`src/lib/registerDevice.ts`**  
  - Logs Supabase project URL.  
  - Logs request payload: `fingerprint`, `deviceName`, `appVersion`.  
  - Logs that the Edge Function is called with a Bearer token (no token value logged).  
  - Logs Edge Function response on success.  
  - Logs/warns on session error, getDeviceInfo failure, invoke error, or thrown exception.

All under a `DEBUG` flag in `registerDevice.ts` (currently `true`).

## 7. Where register-device is called

- **File:** `src/App.tsx`
- **When:** In `supabase.auth.onAuthStateChange` when:
  - `session?.user?.email` is set, and  
  - `session?.access_token` is present, and  
  - `event` is `'SIGNED_IN'` or `'INITIAL_SESSION'`.
- So it runs:
  - On initial load if the user already has a session (`INITIAL_SESSION`).
  - After sign-in (`SIGNED_IN`).

No other business logic was changed; only this call and the above logging were added.
