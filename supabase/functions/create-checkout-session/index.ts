import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

const CORS_HEADERS_NAMES = "authorization, x-client-info, apikey, content-type";
const CORS_METHODS = "POST, OPTIONS";

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": CORS_HEADERS_NAMES,
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Max-Age": "86400",
  };
}

interface CreateCheckoutBody {
  success_url: string;
  cancel_url: string;
  price_id?: string;
  /** Override or add line items; if not set, price_id or env STRIPE_PRICE_ID is used */
  line_items?: Array<{ price: string; quantity?: number }>;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: { ...headers } });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Invalid Authorization header" }),
        { status: 401, headers: { ...headers, "Content-Type": "application/json" } }
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
        { status: 401, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const supabaseUserId = claimsData.user.id;

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    let body: Partial<CreateCheckoutBody> = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const successUrl =
      typeof body.success_url === "string" && body.success_url.trim() !== ""
        ? body.success_url.trim()
        : Deno.env.get("STRIPE_SUCCESS_URL") ?? "";
    const cancelUrl =
      typeof body.cancel_url === "string" && body.cancel_url.trim() !== ""
        ? body.cancel_url.trim()
        : Deno.env.get("STRIPE_CANCEL_URL") ?? "";

    if (!successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({
          error: "Missing success_url and/or cancel_url. Provide them in the body or set STRIPE_SUCCESS_URL and STRIPE_CANCEL_URL.",
        }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const priceId = body.price_id ?? Deno.env.get("STRIPE_PRICE_ID");
    const lineItems = body.line_items;

    if (!lineItems?.length && !priceId) {
      return new Response(
        JSON.stringify({
          error: "Missing price_id or line_items. Provide price_id in the body, set STRIPE_PRICE_ID, or send line_items.",
        }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-11-20.acacia" });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: supabaseUserId,
      },
      line_items: lineItems?.length
        ? lineItems.map((item) => ({
            price: item.price,
            quantity: item.quantity ?? 1,
          }))
        : [{ price: priceId!, quantity: 1 }],
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({
        url: session.url,
        session_id: session.id,
      }),
      {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(e) }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});
