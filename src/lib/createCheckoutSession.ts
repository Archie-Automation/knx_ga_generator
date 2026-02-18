import { supabase, supabaseUrl } from "./supabase";

const CHECKOUT_FUNCTION_NAME = "create-checkout-session";

export interface CreateCheckoutResult {
  url: string | null;
  session_id?: string;
  error?: string;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * In Tauri gebruikt de WebView soms geen fetch naar Edge Functions; we gebruiken
 * de HTTP plugin zodat het verzoek via Rust gaat en betrouwbaar werkt.
 */
async function invokeCheckoutTauri(
  accessToken: string,
  body: Record<string, unknown>
): Promise<CreateCheckoutResult> {
  const { fetch } = await import("@tauri-apps/plugin-http");
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${CHECKOUT_FUNCTION_NAME}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return { url: null, error: text || `HTTP ${res.status}` };
  }
  const data = (await res.json()) as { url?: string; session_id?: string; error?: string };
  if (data.error) return { url: null, error: data.error };
  return { url: data.url ?? null, session_id: data.session_id };
}

/**
 * Calls the create-checkout-session Edge Function and returns the Stripe Checkout URL.
 * Redirect the user to result.url to complete the purchase.
 */
export async function createCheckoutSession(
  successUrl?: string,
  cancelUrl?: string,
  priceId?: string
): Promise<CreateCheckoutResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    return { url: null, error: "Not signed in" };
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const body: Record<string, unknown> = {
    success_url: successUrl ?? `${origin}/#/`,
    cancel_url: cancelUrl ?? `${origin}/#/`,
  };
  if (priceId) body.price_id = priceId;

  if (isTauri()) {
    return invokeCheckoutTauri(session.access_token, body);
  }

  const { data, error } = await supabase.functions.invoke(CHECKOUT_FUNCTION_NAME, {
    body,
  });

  if (error) {
    let message = error.message ?? "Checkout failed";
    const res = (error as { context?: Response }).context;
    if (res && typeof res.json === "function") {
      try {
        const body = (await res.json()) as { error?: string; details?: string };
        if (body?.error) message = body.details ? `${body.error}: ${body.details}` : body.error;
        else if (res.status) message = `${message} (${res.status})`;
      } catch {
        if (res.status) message = `${message} (HTTP ${res.status})`;
      }
    }
    return { url: null, error: message };
  }
  if (!data || typeof data !== "object") {
    return { url: null, error: "Invalid checkout response" };
  }

  const url = (data as { url?: string }).url ?? null;
  const session_id = (data as { session_id?: string }).session_id;
  const err = (data as { error?: string }).error;
  if (err) return { url: null, error: err };
  return { url, session_id };
}
