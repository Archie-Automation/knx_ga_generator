/**
 * Offline cache for license + trial state.
 * Valid while: now <= lastCheckAt + offline_grace_days.
 */

import type { LicenseCacheEntry } from "./types";

const STORAGE_KEY_PREFIX = "knx-license-cache";

function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}-${userId}`;
}

export function getCachedEntry(userId: string): LicenseCacheEntry | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LicenseCacheEntry;
    if (!parsed?.license || !parsed?.lastCheckAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedEntry(userId: string, entry: LicenseCacheEntry): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function isWithinOfflineGrace(entry: LicenseCacheEntry): boolean {
  const now = new Date();
  const last = new Date(entry.lastCheckAt);
  const days = entry.license.offlineGraceDays ?? 0;
  const graceEnd = new Date(last);
  graceEnd.setDate(graceEnd.getDate() + days);
  return now <= graceEnd;
}

export function getOfflineGraceEnd(entry: LicenseCacheEntry): string {
  const last = new Date(entry.lastCheckAt);
  const days = entry.license.offlineGraceDays ?? 0;
  const graceEnd = new Date(last);
  graceEnd.setDate(graceEnd.getDate() + days);
  return graceEnd.toISOString();
}
