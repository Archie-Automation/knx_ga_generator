/**
 * Registers the current device with the Supabase register-device Edge Function.
 * Requires an authenticated session. Safe to call when not in Tauri (fingerprint may be empty).
 * Debug logging is included for verification.
 */

import { supabase, supabaseUrl } from "./supabase";
import { getDeviceInfo } from "./deviceInfo";

// Log in dev always; in release when VITE_DEBUG_REGISTER_DEVICE=true (e.g. for verification)
const DEBUG =
  import.meta.env.DEV ||
  import.meta.env.VITE_DEBUG_REGISTER_DEVICE === "true";

function debugLog(...args: unknown[]) {
  if (DEBUG && typeof console !== "undefined") {
    console.log("[register-device]", ...args);
  }
}

function debugWarn(...args: unknown[]) {
  if (DEBUG && typeof console !== "undefined") {
    console.warn("[register-device]", ...args);
  }
}

/**
 * Calls the register-device Edge Function with:
 * - Authorization: Bearer &lt;session.access_token&gt;
 * - Body: { fingerprint, deviceName, appVersion }
 * Logs project URL, request payload, response, and any errors.
 */
export async function registerDevice(): Promise<void> {
  debugLog("Supabase project URL:", supabaseUrl);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // Verify session is loaded before calling register-device
  const sessionExists = session != null;
  const accessTokenPresent = Boolean(session?.access_token);
  const userId = session?.user?.id ?? null;

  debugLog("Session exists:", sessionExists);
  debugLog("User ID:", userId ?? "(none)");
  debugLog("Access token present:", accessTokenPresent);

  if (sessionError) {
    debugWarn("Could not get session:", sessionError.message);
    return;
  }
  if (!session) {
    debugLog("No session; skipping register-device.");
    return;
  }
  if (!session.access_token) {
    debugLog("No access_token; skipping register-device.");
    return;
  }

  // Token is passed automatically by supabase.functions.invoke using the current session
  debugLog("Calling Edge Function with Authorization Bearer token from session.");

  let deviceInfo;
  try {
    deviceInfo = await getDeviceInfo();
  } catch (e) {
    debugWarn("getDeviceInfo failed:", e);
    return;
  }

  const payload = {
    fingerprint: deviceInfo.fingerprint,
    deviceName:
      typeof deviceInfo.deviceName === "string" && deviceInfo.deviceName.trim()
        ? deviceInfo.deviceName.trim()
        : "Desktop",
    appVersion: deviceInfo.appVersion,
  };
  debugLog("Request payload (fingerprint, deviceName, appVersion):", payload);

  try {
    const { data, error } = await supabase.functions.invoke("register-device", {
      body: payload,
    });

    if (error) {
      debugWarn("Edge Function error:", error);
      return;
    }
    debugLog("Edge Function returned successfully. Response:", data);
    // Release build: one-line verification that device was registered (no env needed)
    if (!import.meta.env.DEV && typeof console !== "undefined" && data) {
      console.log("[register-device] Device registered with Supabase. Check Table Editor → devices.");
    }
  } catch (e) {
    debugWarn("register-device call failed:", e);
  }
}
