/**
 * Shared types for license, trial, auth and device services.
 */

export interface UserProfile {
  user_id: string;
  trial_active: boolean;
  trial_export_used: boolean;
  trial_csv_export_used?: boolean;
  trial_pdf_export_used?: boolean;
  updated_at?: string;
}

/** Database row: kolommen zoals in jouw schema (license_status, expires_at, plan_type). */
export interface LicenseRow {
  id: string;
  user_id: string;
  license_status: "active" | "inactive" | "expired" | "past_due" | "canceled";
  expires_at: string | null;
  last_checkin: string;
  offline_grace_days: number;
  plan_type?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceRow {
  id: string;
  user_id: string;
  device_hash: string;
  device_name: string | null;
  app_version: string | null;
  created_at: string;
  last_seen: string;
}

/** Normalized license state for UI and cache. */
export interface LicenseState {
  status: "active" | "expired" | "trial";
  plan: string;
  validUntil: string;
  offlineGraceDays: number;
}

/** Combined trial status from user_profiles + can_use_trial RPC. */
export interface TrialStatus {
  trialActive: boolean;
  trialExportUsed: boolean;
  trialCsvExportUsed: boolean;
  trialPdfExportUsed: boolean;
  domainTrialAllowed: boolean;
}

/** Cached auth/license/trial state for offline use. */
export interface LicenseCacheEntry {
  license: LicenseState;
  userProfile: UserProfile | null;
  trialStatus: TrialStatus;
  lastCheckAt: string;
}
