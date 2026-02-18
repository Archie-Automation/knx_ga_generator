/**
 * License client: cache + offline grace for license-server.
 * Contract: { status, plan, validUntil, offlineGraceDays }
 */

const STORAGE_PREFIX = "knx-license";

export interface LicenseData {
  status: "active" | "expired" | "trial";
  plan: "trial" | "basic" | "pro";
  validUntil: string;
  offlineGraceDays: number;
  /** True when user has trial access (domain limit not reached). */
  trial_active?: boolean;
  /** True after first CSV/PDF export; then license required for project/export. */
  trial_export_used?: boolean;
}

export interface CachedLicense {
  license: LicenseData;
  lastCheckAt: string; // ISO
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}-${userId}`;
}

export function getCachedLicense(userId: string): CachedLicense | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLicense;
    if (!parsed?.license || !parsed?.lastCheckAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedLicense(
  userId: string,
  license: LicenseData,
  lastCheckAt: string
): void {
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ license, lastCheckAt })
    );
  } catch {
    // ignore
  }
}

/**
 * Offline use allowed while (now - lastCheckAt) <= offlineGraceDays.
 */
export function isWithinOfflineGrace(cached: CachedLicense): boolean {
  const now = new Date();
  const last = new Date(cached.lastCheckAt);
  const days = cached.license.offlineGraceDays ?? 0;
  const graceEnd = new Date(last);
  graceEnd.setDate(graceEnd.getDate() + days);
  return now <= graceEnd;
}

/** End of offline grace period (ISO string). */
export function getOfflineGraceEnd(cached: CachedLicense): string {
  const last = new Date(cached.lastCheckAt);
  const days = cached.license.offlineGraceDays ?? 0;
  const graceEnd = new Date(last);
  graceEnd.setDate(graceEnd.getDate() + days);
  return graceEnd.toISOString();
}

/**
 * Server says user may use the app (active or trial; not expired).
 */
export function isAllowedByLicense(license: LicenseData): boolean {
  return license.status === "active" || license.status === "trial";
}
