import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseUrl } from "../lib/supabase";
import type { LicenseData } from "../lib/licenseClient";
import {
  getCachedLicense,
  setCachedLicense,
  isWithinOfflineGrace,
  isAllowedByLicense,
  getOfflineGraceEnd,
} from "../lib/licenseClient";
import { getDeviceInfo } from "../lib/deviceInfo";

// License check: Supabase Edge Function (deploy "license-check" in your project).
// No local license server; uses same Supabase project as auth.
const LICENSE_FUNCTION_NAME = "license-check";
const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_LICENSE === "true";

export interface UseLicenseResult {
  /** True when user can use projects and export (paid license or trial with export not yet used). */
  allowed: boolean;
  /** True when user has a paid active license (online check or within offline grace). */
  hasActiveLicense: boolean;
  license: LicenseData | null;
  loading: boolean;
  error: string | null;
  /** True when backend returned DEVICE_LIMIT_REACHED (max 2 devices). */
  deviceLimitReached: boolean;
  /** True when current license comes from cache (offline grace). */
  offlineUsingCache: boolean;
  /** When offlineUsingCache, end of offline grace period (ISO string). */
  offlineGraceEnd: string | null;
  refetching: boolean;
  refetch: () => Promise<void>;
  /** Trial: can create project and do 1 export. */
  trialActive: boolean;
  /** Trial export already used; license required for project/export. */
  trialExportUsed: boolean;
}

/**
 * Fetches license via Supabase Edge Function (license-check), caches response,
 * allows offline use within offlineGraceDays of lastCheckAt. Blocks app when grace expired.
 */
export function useLicense(): UseLicenseResult {
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceLimitReached, setDeviceLimitReached] = useState(false);
  const [offlineUsingCache, setOfflineUsingCache] = useState(false);
  const [offlineGraceEnd, setOfflineGraceEnd] = useState<string | null>(null);
  const [refetching, setRefetching] = useState(false);

  const fetchAndApply = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      setLicense(null);
      setAllowed(false);
      setLoading(false);
      setError(null);
      return;
    }

    const userId = session.user.id;

    let body: { device_hash?: string; device_name?: string; app_version?: string } = {};
    try {
      const deviceInfo = await getDeviceInfo();
      if (deviceInfo.fingerprint) body.device_hash = deviceInfo.fingerprint;
      body.device_name =
        typeof deviceInfo.deviceName === "string" && deviceInfo.deviceName.trim()
          ? deviceInfo.deviceName.trim()
          : "Desktop";
      if (deviceInfo.appVersion) body.app_version = deviceInfo.appVersion;
    } catch (e) {
      if (DEBUG) console.warn("[license-check] getDeviceInfo failed:", e);
    }

    try {
      if (DEBUG) {
        console.log("[license-check] Calling Edge Function", LICENSE_FUNCTION_NAME, "URL:", supabaseUrl);
      }
      const { data, error } = await supabase.functions.invoke(LICENSE_FUNCTION_NAME, {
        body,
      });

      if (error) {
        if (DEBUG) {
          console.warn("[license-check] Edge Function error:", error.message, error);
        }
        const msg = error.message || "";
        if (msg.includes("DEVICE_LIMIT_REACHED") || (data as { code?: string })?.code === "DEVICE_LIMIT_REACHED") {
          throw new Error("DEVICE_LIMIT_REACHED");
        }
        throw new Error(msg || "License check failed");
      }
      if (!data || typeof data !== "object") {
        if (DEBUG) console.warn("[license-check] Invalid response shape:", data);
        throw new Error("Invalid license response");
      }
      if ((data as { error?: string }).error === "DEVICE_LIMIT_REACHED") {
        throw new Error("DEVICE_LIMIT_REACHED");
      }

      const licenseData = data as LicenseData;
      const lastCheckAt = new Date().toISOString();
      setCachedLicense(userId, licenseData, lastCheckAt);
      setLicense(licenseData);
      setAllowed(isAllowedByLicense(licenseData));
      setError(null);
      setDeviceLimitReached(false);
      setOfflineUsingCache(false);
      setOfflineGraceEnd(null);
      // trial_active / trial_export_used are on licenseData, exposed via return
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (DEBUG) {
        console.warn("[license-check] Failed:", message, err);
      }
      const isDeviceLimit = message === "DEVICE_LIMIT_REACHED";
      setDeviceLimitReached(isDeviceLimit);
      setError(message);
      const cached = getCachedLicense(userId);
      if (cached && isWithinOfflineGrace(cached) && !isDeviceLimit) {
        setLicense(cached.license);
        setAllowed(isAllowedByLicense(cached.license));
        setError(null);
        setOfflineUsingCache(true);
        setOfflineGraceEnd(getOfflineGraceEnd(cached));
      } else {
        setLicense(null);
        setAllowed(false);
        setOfflineUsingCache(false);
        setOfflineGraceEnd(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setLicense(null);
        setAllowed(false);
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const cached = getCachedLicense(userId);

      if (cached && isWithinOfflineGrace(cached)) {
        setLicense(cached.license);
        setAllowed(isAllowedByLicense(cached.license));
        setLoading(false);
        setError(null);
        setOfflineUsingCache(false);
        setOfflineGraceEnd(null);
        if (!cancelled) fetchAndApply();
        return;
      }

      setLoading(true);
      await fetchAndApply();
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchAndApply]);

  const REFETCH_MIN_DISPLAY_MS = 2000;

  const refetch = useCallback(async () => {
    setRefetching(true);
    const start = Date.now();
    try {
      await fetchAndApply();
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < REFETCH_MIN_DISPLAY_MS) {
        await new Promise((r) => setTimeout(r, REFETCH_MIN_DISPLAY_MS - elapsed));
      }
      setRefetching(false);
    }
  }, [fetchAndApply]);

  const trialActive = license?.trial_active === true;
  const trialExportUsed = license?.trial_export_used === true;

  return {
    allowed,
    hasActiveLicense: allowed,
    license,
    loading,
    error,
    deviceLimitReached,
    offlineUsingCache,
    offlineGraceEnd,
    refetching,
    refetch,
    trialActive,
    trialExportUsed,
  };
}
