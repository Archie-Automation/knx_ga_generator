import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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

    let exportType: "csv" | "pdf" = "csv";
    try {
      const body = await req.json();
      if (body?.exportType === "pdf") exportType = "pdf";
    } catch {
      // default csv
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Zorg dat user_profiles row bestaat (alleen insert, niet overschrijven bij conflict)
    await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        trial_active: true,
        trial_export_used: false,
        trial_csv_export_used: false,
        trial_pdf_export_used: false,
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

    // Haal huidige waarden op
    const { data: current } = await supabase
      .from("user_profiles")
      .select("trial_csv_export_used, trial_pdf_export_used")
      .eq("user_id", userId)
      .single();

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

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to mark export used", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
