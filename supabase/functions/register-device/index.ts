import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RegisterDeviceBody {
  fingerprint: string;
  deviceName: string;
  appVersion: string;
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

    let body: RegisterDeviceBody;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let { fingerprint, deviceName, appVersion } = body;
    if (typeof fingerprint !== "string" || fingerprint.trim() === "") {
      fingerprint = `web-${userId}`;
    } else {
      fingerprint = fingerprint.trim();
    }
    const displayName =
      typeof deviceName === "string" && deviceName.trim()
        ? deviceName.trim()
        : "Desktop";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existing, error: selectError } = await supabase
      .from("devices")
      .select("id, user_id, device_hash, device_name, app_version, created_at, last_seen")
      .eq("user_id", userId)
      .eq("device_hash", fingerprint)
      .maybeSingle();

    if (selectError) {
      return new Response(
        JSON.stringify({ error: "Failed to check device", details: selectError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Always check device count – block if user has >2 devices (also for existing devices that slipped through)
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

    let device: typeof existing;

    if (!existing) {
      // Max 2 devices per user – enforce before insert
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
      if ((count ?? 0) >= 2) {
        return new Response(
          JSON.stringify({ error: "DEVICE_LIMIT_REACHED", code: "DEVICE_LIMIT_REACHED" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Device swap cooldown: prevent constant switching (max 1 swap per 30 days)
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("last_device_removal_at")
        .eq("user_id", userId)
        .maybeSingle();

      const lastRemoval = profile?.last_device_removal_at ? new Date(profile.last_device_removal_at) : null;
      const cooldownDays = 30;
      if (lastRemoval && (count ?? 0) >= 1) {
        const daysSinceRemoval = (Date.now() - lastRemoval.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceRemoval < cooldownDays) {
          const daysLeft = Math.ceil(cooldownDays - daysSinceRemoval);
          return new Response(
            JSON.stringify({
              error: "DEVICE_SWAP_COOLDOWN",
              code: "DEVICE_SWAP_COOLDOWN",
              daysLeft,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from("devices")
        .insert({
          user_id: userId,
          device_hash: fingerprint,
          device_name: displayName,
          app_version: appVersion ?? null,
        })
        .select("id, user_id, device_hash, device_name, app_version, created_at, last_seen")
        .single();

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
      device = inserted;
    } else {
      // Update last_seen, app_version; only overwrite device_name when empty or looks like user-agent
      const currentName = existing.device_name?.trim();
      const looksLikeUA =
        !currentName ||
        currentName.length > 60 ||
        currentName.startsWith("Mozilla/") ||
        currentName.includes("AppleWebKit") ||
        currentName.includes("Chrome/") ||
        currentName.includes("Safari/");
      const updatePayload: Record<string, unknown> = {
        last_seen: new Date().toISOString(),
        app_version: appVersion ?? existing.app_version,
      };
      if (looksLikeUA) {
        updatePayload.device_name = displayName;
      }
      const { data: updated, error: updateError } = await supabase
        .from("devices")
        .update(updatePayload)
        .eq("id", existing.id)
        .select("id, user_id, device_hash, device_name, app_version, created_at, last_seen")
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update device", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      device = updated;
    }

    return new Response(JSON.stringify(device), {
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
