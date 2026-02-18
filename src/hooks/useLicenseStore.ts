/**
 * useLicenseStore – central auth/license/trial/device state.
 * Uses AuthService, LicenseService, TrialService, DeviceService.
 * Caches for offline; allowed = hasActiveLicense OR (trialActive && !trialExportUsed && domainTrialAllowed).
 */

import { useState, useEffect, useCallback } from "react";
import { AuthService } from "../services/AuthService";
import { LicenseService } from "../services/LicenseService";
import { TrialService } from "../services/TrialService";
import { getCachedEntry, setCachedEntry, isWithinOfflineGrace, getOfflineGraceEnd } from "../services/cache";
import { supabase } from "../lib/supabase";
import type { LicenseState, TrialStatus } from "../services/types";
import { getDeviceInfo } from "../lib/deviceInfo";

const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG_LICENSE === "true";

/** Result shape for LicenseContext (compatible with existing UI). */
export interface UseLicenseResult {
  allowed: boolean;
  hasActiveLicense: boolean;
  license: LicenseState | null;
  loading: boolean;
  error: string | null;
  deviceLimitReached: boolean;
  /** When DEVICE_SWAP_COOLDOWN: days left before a new device can be added. */
  deviceSwapCooldownDays: number | null;
  offlineUsingCache: boolean;
  offlineGraceEnd: string | null;
  refetching: boolean;
  refetch: () => Promise<void>;
  trialActive: boolean;
  trialExportUsed: boolean;
  trialCsvExportUsed: boolean;
  trialPdfExportUsed: boolean;
  domainTrialAllowed: boolean;
  consumeTrialExport: (exportType: "csv" | "pdf") => Promise<void>;
}

export function useLicenseStore(): UseLicenseResult {
  const [license, setLicense] = useState<LicenseState | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    trialActive: false,
    trialExportUsed: false,
    trialCsvExportUsed: false,
    trialPdfExportUsed: false,
    domainTrialAllowed: false,
  });
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceLimitReached, setDeviceLimitReached] = useState(false);
  const [deviceSwapCooldownDays, setDeviceSwapCooldownDays] = useState<number | null>(null);
  const [offlineUsingCache, setOfflineUsingCache] = useState(false);
  const [offlineGraceEnd, setOfflineGraceEnd] = useState<string | null>(null);
  const [refetching, setRefetching] = useState(false);

  const computeAllowed = useCallback(
    (lic: LicenseState | null, trial: TrialStatus): boolean => {
      const hasActive = LicenseService.hasActiveLicense(lic);
      const hasNewFields = trial.trialCsvExportUsed !== undefined && trial.trialPdfExportUsed !== undefined;
      const trialFullyUsed = hasNewFields
        ? (trial.trialCsvExportUsed && trial.trialPdfExportUsed)
        : trial.trialExportUsed;
      const trialOk =
        trial.trialActive && !trialFullyUsed && trial.domainTrialAllowed;
      return hasActive || trialOk;
    },
    []
  );

  const fetchAndApply = useCallback(async () => {
    let session;
    try {
      session = await AuthService.getSession();
    } catch (e) {
      setLicense(null);
      setTrialStatus({ trialActive: false, trialExportUsed: false, trialCsvExportUsed: false, trialPdfExportUsed: false, domainTrialAllowed: false });
      setAllowed(false);
      setLoading(false);
      setError(null);
      return;
    }

    if (!session?.user) {
      setLicense(null);
      setTrialStatus({ trialActive: false, trialExportUsed: false, trialCsvExportUsed: false, trialPdfExportUsed: false, domainTrialAllowed: false });
      setAllowed(false);
      setLoading(false);
      setError(null);
      return;
    }

    const userId = session.user.id;

    try {
      const [licenseRow, profile, domainTrialAllowedResult] = await Promise.all([
        LicenseService.getLicense(userId),
        TrialService.getUserProfile(userId),
        TrialService.canUseTrial(userId).catch((e) => {
          if (DEBUG) console.warn("[useLicenseStore] canUseTrial RPC failed", e);
          return null as unknown as boolean;
        }),
      ]);

      const domainTrialAllowed = domainTrialAllowedResult === true;
      const domainTrialUnknown = domainTrialAllowedResult !== false && domainTrialAllowedResult !== true;

      let resolvedProfile = profile;
      if (!resolvedProfile && domainTrialAllowed) {
        try {
          const started = await TrialService.startTrial(userId);
          if (started) resolvedProfile = await TrialService.getUserProfile(userId);
        } catch (e) {
          if (DEBUG) console.warn("[useLicenseStore] startTrial failed", e);
        }
      }

      const licState = LicenseService.toLicenseState(licenseRow);
      const trial = TrialService.toTrialStatus(resolvedProfile, domainTrialAllowed);
      const domainTrialAllowedFinal =
        domainTrialAllowed ||
        (domainTrialUnknown && !!resolvedProfile && resolvedProfile.trial_active && !resolvedProfile.trial_export_used);
      const trialWithFallback: TrialStatus = {
        ...trial,
        domainTrialAllowed: domainTrialAllowedFinal,
      };

      setLicense(licState);
      setTrialStatus(trialWithFallback);
      setAllowed(computeAllowed(licState, trialWithFallback));
      setError(null);
      setDeviceLimitReached(false);
      setDeviceSwapCooldownDays(null);
      setOfflineUsingCache(false);
      setOfflineGraceEnd(null);

      if (licState && licenseRow) {
        await LicenseService.touchCheckin(userId);
      }

      const lastCheckAt = new Date().toISOString();
      setCachedEntry(userId, {
        license: licState ?? { status: "expired", plan: "basic", validUntil: new Date().toISOString(), offlineGraceDays: 7 },
        userProfile: resolvedProfile,
        trialStatus: trialWithFallback,
        lastCheckAt,
      });

      const deviceInfo = await getDeviceInfo().catch(() => null);
      if (deviceInfo) {
        const deviceName =
          typeof deviceInfo.deviceName === "string" && deviceInfo.deviceName.trim()
            ? deviceInfo.deviceName.trim()
            : "Desktop";
        const { data: regData } = await supabase.functions.invoke("register-device", {
          body: {
            fingerprint: deviceInfo.fingerprint || undefined,
            deviceName,
            appVersion: deviceInfo.appVersion ?? null,
          },
        }).catch((e) => {
          if (DEBUG) console.warn("[register-device] failed", e);
          return { data: null };
        });
        const err = regData && typeof regData === "object" && "error" in regData ? (regData as { error?: string; code?: string }).error : null;
        const code = regData && typeof regData === "object" && "code" in regData ? (regData as { code?: string }).code : null;
        const daysLeft = regData && typeof regData === "object" && "daysLeft" in regData ? (regData as { daysLeft?: number }).daysLeft : undefined;
        const hasDevice = regData && typeof regData === "object" && "id" in regData && "user_id" in regData;
        if (err === "DEVICE_LIMIT_REACHED" || code === "DEVICE_LIMIT_REACHED" || err === "DEVICE_SWAP_COOLDOWN" || code === "DEVICE_SWAP_COOLDOWN") {
          setDeviceLimitReached(true);
          setAllowed(false);
          setDeviceSwapCooldownDays(typeof daysLeft === "number" ? daysLeft : null);
        } else if (hasDevice) {
          setDeviceLimitReached(false);
        }
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : String(err);
      const message = raw === "[object Object]" ? "Connection or server error" : raw;
      if (DEBUG) console.warn("[useLicenseStore] fetch failed", message, err);
      setError(message);
      const cached = getCachedEntry(userId);
      if (cached && isWithinOfflineGrace(cached)) {
        setLicense(cached.license);
        setTrialStatus(cached.trialStatus);
        setAllowed(computeAllowed(cached.license, cached.trialStatus));
        setError(null);
        setOfflineUsingCache(true);
        setOfflineGraceEnd(getOfflineGraceEnd(cached));
      } else {
        setLicense(null);
        setTrialStatus({ trialActive: false, trialExportUsed: false, trialCsvExportUsed: false, trialPdfExportUsed: false, domainTrialAllowed: false });
        setAllowed(false);
        setOfflineUsingCache(false);
        setOfflineGraceEnd(null);
      }
    } finally {
      setLoading(false);
    }
  }, [computeAllowed]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let session;
      try {
        session = await AuthService.getSession();
      } catch {
        setLicense(null);
        setTrialStatus({ trialActive: false, trialExportUsed: false, trialCsvExportUsed: false, trialPdfExportUsed: false, domainTrialAllowed: false });
        setAllowed(false);
        setLoading(false);
        return;
      }

      if (!session?.user) {
        setLicense(null);
        setTrialStatus({ trialActive: false, trialExportUsed: false, trialCsvExportUsed: false, trialPdfExportUsed: false, domainTrialAllowed: false });
        setAllowed(false);
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const cached = getCachedEntry(userId);
      if (cached && isWithinOfflineGrace(cached)) {
        setLicense(cached.license);
        setTrialStatus(cached.trialStatus);
        setAllowed(computeAllowed(cached.license, cached.trialStatus));
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
  }, [fetchAndApply, computeAllowed]);

  const refetch = useCallback(async () => {
    setRefetching(true);
    const start = Date.now();
    try {
      await fetchAndApply();
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 2000) {
        await new Promise((r) => setTimeout(r, 2000 - elapsed));
      }
      setRefetching(false);
    }
  }, [fetchAndApply]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refetch]);

  const consumeTrialExport = useCallback(async (exportType: "csv" | "pdf") => {
    let session;
    try {
      session = await AuthService.getSession();
    } catch (e) {
      if (DEBUG) console.warn("[useLicenseStore] getSession failed", e);
      throw e;
    }
    if (!session?.user?.id || !session?.access_token) {
      throw new Error("Not signed in");
    }
    await TrialService.consumeTrialExport(session.user.id, exportType, session.access_token);
    await refetch();
  }, [refetch]);

  const hasActiveLicense = LicenseService.hasActiveLicense(license);

  return {
    allowed,
    hasActiveLicense,
    license,
    loading,
    error,
    deviceLimitReached,
    deviceSwapCooldownDays,
    offlineUsingCache,
    offlineGraceEnd,
    refetching,
    refetch,
    trialActive: trialStatus.trialActive,
    trialExportUsed: trialStatus.trialExportUsed,
    trialCsvExportUsed: trialStatus.trialCsvExportUsed,
    trialPdfExportUsed: trialStatus.trialPdfExportUsed,
    domainTrialAllowed: trialStatus.domainTrialAllowed,
    consumeTrialExport,
  };
}
