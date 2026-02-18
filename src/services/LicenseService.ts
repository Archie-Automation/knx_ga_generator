/**
 * LicenseService – Fetch license from public.licenses, cache, offline grace.
 */

import { supabase } from "../lib/supabase";
import type { LicenseRow, LicenseState } from "./types";
import { getCachedEntry, setCachedEntry, isWithinOfflineGrace } from "./cache";

const DEFAULT_OFFLINE_GRACE_DAYS = 14;

/** Map DB license_status + expires_at to UI state. */
function toLicenseState(row: LicenseRow | null): LicenseState | null {
  if (!row) return null;
  const status: LicenseState["status"] =
    row.license_status === "active" ? "active" : "expired";
  const validUntil = row.expires_at ?? "";
  return {
    status,
    plan: row.plan_type ?? "basic",
    validUntil,
    offlineGraceDays: row.offline_grace_days ?? DEFAULT_OFFLINE_GRACE_DAYS,
  };
}

export const LicenseService = {
  /**
   * Fetch license for user from public.licenses.
   */
  async getLicense(userId: string): Promise<LicenseRow | null> {
    const { data, error } = await supabase
      .from("licenses")
      .select("id, user_id, license_status, expires_at, last_checkin, offline_grace_days, plan_type, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data as LicenseRow | null;
  },

  /**
   * Update last_checkin for license (call after successful online check).
   */
  async touchCheckin(userId: string): Promise<void> {
    const { error } = await supabase
      .from("licenses")
      .update({
        last_checkin: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;
  },

  /**
   * hasActiveLicense = status === "active" AND (geen expires_at of expires_at > now)
   */
  hasActiveLicense(license: LicenseState | null): boolean {
    if (!license) return false;
    if (license.status !== "active") return false;
    const expiresAt = new Date(license.validUntil);
    return expiresAt.getTime() === 0 || expiresAt > new Date();
  },

  toLicenseState,

  getCachedEntry,
  setCachedEntry,
  isWithinOfflineGrace,
};
