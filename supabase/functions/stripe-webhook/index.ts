import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

/**
 * Stripe webhook handler for checkout.session.completed.
 * Verifies the Stripe signature, then creates or updates the licenses row
 * for the user in metadata.supabase_user_id (status=active, plan=pro, valid_until=+1 year).
 */

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const signature = req.headers.get("Stripe-Signature");
  if (!signature) {
    return new Response("Missing Stripe-Signature header", { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error("Failed to read body:", e);
    return new Response("Invalid body", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe signature verification failed:", message);
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const supabaseUserId = metadata.supabase_user_id;
  if (!supabaseUserId || typeof supabaseUserId !== "string") {
    console.error("checkout.session.completed missing metadata.supabase_user_id", session.id);
    return new Response("Missing supabase_user_id in session metadata", { status: 400 });
  }

  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { error } = await supabase.from("licenses").upsert(
    {
      user_id: supabaseUserId,
      valid_until: validUntil.toISOString(),
      last_checkin: now.toISOString(),
      plan: "pro",
      status: "active",
      offline_grace_days: 7,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Failed to upsert license:", error.message, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true, user_id: supabaseUserId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
