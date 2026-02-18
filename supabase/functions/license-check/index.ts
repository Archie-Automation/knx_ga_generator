import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Response shape expected by frontend (LicenseData in src/lib/licenseClient.ts)
interface LicenseResponse {
  status: "active" | "expired" | "trial";
  plan: "trial" | "basic" | "pro";
  validUntil: string;
  offlineGraceDays: number;
  trial_active: boolean;
  trial_export_used: boolean;
}

const DEFAULT_OFFLINE_GRACE_DAYS = 7;
const DEFAULT_TRIAL_LIMIT_PER_DOMAIN = 5;

interface LicenseCheckBody {
  device_hash?: string;
  device_name?: string;
  app_version?: string;
}

function extractDomain(email: string | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at === -1) return null;
  const domain = trimmed.slice(at + 1);
  return domain || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    const userEmail = (claimsData.user as { email?: string }).email;
    const domain = extractDomain(userEmail);

    let body: LicenseCheckBody = {};
    try {
      const raw = await req.json();
      if (raw && typeof raw === "object") {
        body = raw as LicenseCheckBody;
      }
    } catch {
      // No body or invalid JSON is fine; body stays {}
    }

    const deviceHash =
      typeof body.device_hash === "string" && body.device_hash.trim() !== ""
        ? body.device_hash.trim()
        : null;
    const deviceNameRaw = typeof body.device_name === "string" ? body.device_name : null;
    const deviceName =
      deviceNameRaw && deviceNameRaw.trim() ? deviceNameRaw.trim() : "Desktop";
    const appVersion = typeof body.app_version === "string" ? body.app_version : null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1) Paid license
    const { data: row, error: selectError } = await supabase
      .from("licenses")
      .select("id, valid_until, last_checkin, plan, status, offline_grace_days")
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch license", details: selectError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const validUntil = row?.valid_until ? new Date(row.valid_until) : null;
    const isPaidExpired = !validUntil || validUntil <= now;
    const hasPaidLicense = row && (row.status === "active" || row.status === "trial") && !isPaidExpired;
    const offlineGraceDays = row?.offline_grace_days ?? DEFAULT_OFFLINE_GRACE_DAYS;

    let trial_active = false;
    let trial_export_used = false;

    if (hasPaidLicense && row?.id) {
      await supabase
        .from("licenses")
        .update({
          last_checkin: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", row.id);
    } else {
      // 2) Trial: get or create user_trials
      const { data: trialRow, error: trialError } = await supabase
        .from("user_trials")
        .select("trial_active, trial_export_used")
        .eq("user_id", userId)
        .maybeSingle();

      if (trialError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch trial", details: trialError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (trialRow) {
        trial_active = trialRow.trial_active === true;
        trial_export_used = trialRow.trial_export_used === true;
      } else {
        // New user: check domain limit and create trial if allowed
        if (domain) {
          const { data: domainRow, error: domainErr } = await supabase
            .from("trial_assigned_domain")
            .select("trial_count, trial_limit")
            .eq("domain", domain)
            .maybeSingle();

          if (domainErr) {
            return new Response(
              JSON.stringify({ error: "Failed to check trial domain", details: domainErr.message }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const trialLimit = domainRow?.trial_limit ?? DEFAULT_TRIAL_LIMIT_PER_DOMAIN;
          const trialCount = domainRow?.trial_count ?? 0;

          if (trialCount < trialLimit) {
            const { error: insertTrialErr } = await supabase.from("user_trials").insert({
              user_id: userId,
              trial_active: true,
              trial_export_used: false,
              updated_at: now.toISOString(),
            });
            if (insertTrialErr) {
              return new Response(
                JSON.stringify({ error: "Failed to create trial", details: insertTrialErr.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            trial_active = true;
            trial_export_used = false;

            await supabase
              .from("trial_assigned_domain")
              .upsert(
                {
                  domain,
                  trial_count: trialCount + 1,
                  trial_limit: trialLimit,
                  updated_at: now.toISOString(),
                },
                { onConflict: "domain" }
              );
          }
        }
      }
    }

    // Device registration: allow when has paid license OR trial_active (max 2 per user)
    const canRegisterDevice = hasPaidLicense || trial_active;
    if (canRegisterDevice && deviceHash) {
      const { count: totalCount, error: countErr } = await supabase
        .from("devices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countErr) {
        return new Response(
          JSON.stringify({ error: "Failed to count devices", details: countErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if ((totalCount ?? 0) > 2) {
        return new Response(
          JSON.stringify({ error: "DEVICE_LIMIT_REACHED", code: "DEVICE_LIMIT_REACHED" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: existingDevice } = await supabase
        .from("devices")
        .select("id")
        .eq("user_id", userId)
        .eq("device_hash", deviceHash)
        .maybeSingle();

      if (existingDevice) {
        await supabase
          .from("devices")
          .update({ last_seen: now.toISOString() })
          .eq("id", existingDevice.id);
      } else {
        const { count, error: countError } = await supabase
          .from("devices")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);

        if (countError) {
          return new Response(
            JSON.stringify({ error: "Failed to count devices", details: countError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const deviceCount = count ?? 0;
        if (deviceCount >= 2) {
          return new Response(
            JSON.stringify({ error: "DEVICE_LIMIT_REACHED", code: "DEVICE_LIMIT_REACHED" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { error: insertError } = await supabase.from("devices").insert({
          user_id: userId,
          device_hash: deviceHash,
          device_name: deviceName || "Desktop",
          app_version: appVersion,
        });
        if (insertError) {
          if ((insertError.message ?? "").includes("DEVICE_LIMIT_REACHED")) {
            return new Response(
              JSON.stringify({ error: "DEVICE_LIMIT_REACHED", code: "DEVICE_LIMIT_REACHED" }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          return new Response(
            JSON.stringify({ error: "Failed to register device", details: insertError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const status: "active" | "expired" | "trial" =
      hasPaidLicense
        ? (row!.status as "active" | "trial")
        : trial_active && !trial_export_used
          ? "trial"
          : "expired";

    const license: LicenseResponse = {
      status,
      plan: hasPaidLicense ? (row!.plan as "trial" | "basic" | "pro") : "trial",
      validUntil: validUntil?.toISOString() ?? now.toISOString(),
      offlineGraceDays,
      trial_active,
      trial_export_used,
    };

    return new Response(JSON.stringify(license), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
