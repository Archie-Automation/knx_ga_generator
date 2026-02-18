/**
 * TrialService – user_profiles (trial flags) and RPC can_use_trial / consume_trial_export.
 */

import { supabase, supabaseUrl } from "../lib/supabase";
import type { UserProfile, TrialStatus } from "./types";

const RPC_CAN_USE_TRIAL = "can_use_trial";
const RPC_START_TRIAL = "start_trial";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

const TRIAL_MARK_EXPORT_USED = "trial-mark-export-used";

/** In Tauri: REST PATCH via HTTP plugin (fallback als Edge Function niet gedeployed). */
async function consumeTrialExportViaRest(
  accessToken: string,
  userId: string,
  exportType: "csv" | "pdf",
  current: { trial_csv_export_used?: boolean; trial_pdf_export_used?: boolean } | null
): Promise<void> {
  const { fetch } = await import("@tauri-apps/plugin-http");
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/user_profiles?user_id=eq.${userId}`;
  const updates: Record<string, unknown> = {};
  if (exportType === "pdf") {
    updates.trial_pdf_export_used = true;
    updates.trial_export_used = current?.trial_csv_export_used === true;
  } else {
    updates.trial_csv_export_used = true;
    updates.trial_export_used = current?.trial_pdf_export_used === true;
  }
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
}

/** In Tauri: Edge Function via HTTP plugin. Gebruikt service role server-side, bypasses RLS. */
async function consumeTrialExportViaEdgeFunction(
  accessToken: string,
  exportType: "csv" | "pdf"
): Promise<void> {
  const { fetch } = await import("@tauri-apps/plugin-http");
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${TRIAL_MARK_EXPORT_USED}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ exportType }),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text || `HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; details?: string };
      if (json.error) msg = json.details ? `${json.error}: ${json.details}` : json.error;
    } catch {
      // keep msg as text
    }
    throw new Error(msg);
  }
}

/** In Tauri: fetch user_profiles via REST API (Supabase client faalt in WebView). */
async function getUserProfileViaRestApi(accessToken: string, userId: string): Promise<UserProfile | null> {
  const { fetch } = await import("@tauri-apps/plugin-http");
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/user_profiles?user_id=eq.${userId}&select=user_id,trial_active,trial_export_used,trial_csv_export_used,trial_pdf_export_used`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
  });
  if (!res.ok) return null;
  const arr = (await res.json()) as UserProfile[];
  return (arr[0] as UserProfile) ?? null;
}

export const TrialService = {
  /**
   * Fetch user profile (trial_active, trial_export_used) from public.user_profiles.
   * In Tauri: via REST API (Supabase client faalt in WebView).
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (isTauri()) {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return null;
      return getUserProfileViaRestApi(token, userId);
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("user_id, trial_active, trial_export_used, trial_csv_export_used, trial_pdf_export_used")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data as UserProfile | null;
  },

  /**
   * RPC: can_use_trial(user_id) – domain trial allowed for this user?
   */
  async canUseTrial(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc(RPC_CAN_USE_TRIAL, {
      p_user_id: userId,
    });

    if (error) throw error;
    return data === true;
  },

  /**
   * RPC: start_trial(user_id) – create user_profiles and increment domain when can_use_trial.
   */
  async startTrial(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc(RPC_START_TRIAL, {
      p_user_id: userId,
    });
    if (error) throw error;
    return data === true;
  },

  /**
   * Mark trial CSV or PDF export as used.
   * In Tauri: Edge Function via HTTP plugin (service role bypasses RLS).
   * @param accessToken - Pass from caller (AuthService) voor betrouwbaarheid in Tauri
   */
  async consumeTrialExport(userId: string, exportType: "csv" | "pdf", accessToken?: string): Promise<void> {
    const token = accessToken ?? (await supabase.auth.getSession()).data?.session?.access_token;
    if (!token) throw new Error("Not signed in");

    if (isTauri()) {
      try {
        await consumeTrialExportViaEdgeFunction(token, exportType);
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("404") || msg.includes("Not Found")) {
          const p = await getUserProfileViaRestApi(token, userId);
          const current = p ? { trial_csv_export_used: p.trial_csv_export_used, trial_pdf_export_used: p.trial_pdf_export_used } : null;
          await consumeTrialExportViaRest(token, userId, exportType, current);
          return;
        }
        throw e;
      }
    }

    let current: { trial_csv_export_used?: boolean; trial_pdf_export_used?: boolean } | null = null;
    const { data, error } = await supabase
      .from("user_profiles")
      .select("trial_csv_export_used, trial_pdf_export_used")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    current = data;

    if (!current) {
      await this.startTrial(userId);
      const retry = await supabase
        .from("user_profiles")
        .select("trial_csv_export_used, trial_pdf_export_used")
        .eq("user_id", userId)
        .maybeSingle();
      current = retry.data;
      if (retry.error) throw retry.error;
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (exportType === "pdf") {
      updates.trial_pdf_export_used = true;
      updates.trial_export_used = current?.trial_csv_export_used === true;
    } else {
      updates.trial_csv_export_used = true;
      updates.trial_export_used = current?.trial_pdf_export_used === true;
    }

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("user_id", userId);
    if (updateError) throw updateError;
  },

  /**
   * Build TrialStatus from user profile + domainTrialAllowed (from RPC).
   */
  toTrialStatus(profile: UserProfile | null, domainTrialAllowed: boolean): TrialStatus {
    const csvUsed = profile?.trial_csv_export_used === true;
    const pdfUsed = profile?.trial_pdf_export_used === true;
    return {
      trialActive: profile?.trial_active === true,
      trialExportUsed: profile?.trial_export_used === true || (csvUsed && pdfUsed),
      trialCsvExportUsed: csvUsed,
      trialPdfExportUsed: pdfUsed,
      domainTrialAllowed,
    };
  },
};
