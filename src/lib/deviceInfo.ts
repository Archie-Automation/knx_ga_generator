import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import pkg from "../../package.json";

export interface DeviceInfo {
  /** SHA-256 hash of device fingerprint (from Rust). Never raw machine ID. */
  fingerprint: string;
  appVersion: string;
  /** Display name for device list (hostname in Tauri, userAgent in web). */
  deviceName: string;
}

const WEB_FINGERPRINT_KEY = "knx_ga_web_device_id";

/**
 * Detects if the app is running inside Tauri (desktop).
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * Gets or creates a stable device ID for web (browser). Each browser/device gets a unique ID
 * stored in localStorage so we can distinguish multiple web sessions.
 */
function getWebDeviceId(): string {
  if (typeof window === "undefined" || !window.localStorage) return "web-unknown";
  let id = localStorage.getItem(WEB_FINGERPRINT_KEY);
  if (!id || id.length < 10) {
    id = `web-${crypto.randomUUID()}`;
    try {
      localStorage.setItem(WEB_FINGERPRINT_KEY, id);
    } catch {
      return "web-session";
    }
  }
  return id;
}

/**
 * Gets device info for registration and device list.
 *
 * Tauri (desktop):
 * - fingerprint: SHA-256 hash from Rust (get_device_fingerprint). Includes hostname for uniqueness.
 * - deviceName: from Rust get_device_display_name (hostname).
 *
 * Web (non-Tauri): fingerprint is a unique ID per browser (localStorage); deviceName falls back to userAgent.
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (!isTauri()) {
    return {
      fingerprint: getWebDeviceId(),
      appVersion: import.meta.env?.APP_VERSION ?? "0.0.0",
      deviceName:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };
  }

  // Always request fingerprint AND friendly name (hostname) together for registration/display.
  const [fingerprintResult, deviceNameResult, tauriVersion] = await Promise.all([
    invoke<string>("get_device_fingerprint").catch(() => ""),
    invoke<string>("get_device_display_name").catch(() => "Desktop"),
    getVersion().catch(() => "0.0.0"),
  ]);

  const fingerprint = typeof fingerprintResult === "string" ? fingerprintResult : "";
  let deviceName =
    typeof deviceNameResult === "string" && deviceNameResult.trim()
      ? deviceNameResult.trim()
      : "Desktop";
  if (deviceName.startsWith("Mozilla/") || deviceName.length > 60) {
    deviceName = "Desktop";
  }

  // Use Tauri version; fallback to package.json if getVersion returns 0.0.0 or empty
  const appVersion =
    tauriVersion && tauriVersion !== "0.0.0"
      ? tauriVersion
      : (pkg.version || "0.0.0");

  return {
    fingerprint,
    appVersion,
    deviceName,
  };
}
