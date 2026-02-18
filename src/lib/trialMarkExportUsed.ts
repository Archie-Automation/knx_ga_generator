import { supabase } from "./supabase";

const TRIAL_MARK_EXPORT_USED_FUNCTION = "trial-mark-export-used";

/**
 * Marks the current user's trial export as used (after first CSV or PDF export).
 * Call after a successful export when user is on trial. Then refetch license so UI updates.
 */
export async function markTrialExportUsed(): Promise<{ error?: string }> {
  const { error } = await supabase.functions.invoke(TRIAL_MARK_EXPORT_USED_FUNCTION, {
    method: "POST",
  });
  if (error) return { error: error.message };
  return {};
}
