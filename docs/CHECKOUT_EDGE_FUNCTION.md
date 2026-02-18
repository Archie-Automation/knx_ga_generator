# Edge Function: create-checkout-session

Als je **"Edge Function returned a non-2xx status code"** ziet bij **Licentie kopen**, controleer het volgende.

## Verplichte secrets (Supabase Dashboard)

In **Supabase Dashboard** → **Project** → **Edge Functions** → **create-checkout-session** → **Secrets** (of **Settings** → **Edge Functions** → **Secrets**):

| Secret | Verplicht | Beschrijving |
|--------|-----------|--------------|
| `STRIPE_SECRET_KEY` | Ja | Stripe secret key (begint met `sk_live_` of `sk_test_`) |
| `STRIPE_PRICE_ID` | Ja* | Stripe Price ID voor de licentie (bijv. `price_xxx`). *Of stuur `price_id` in de request body. |
| `STRIPE_SUCCESS_URL` | Nee** | Fallback success URL als de app geen `success_url` meestuurt |
| `STRIPE_CANCEL_URL` | Nee** | Fallback cancel URL als de app geen `cancel_url` meestuurt |

** De app stuurt standaard `success_url` en `cancel_url` mee (op basis van de huidige origin). Als je alleen lokaal test met een vreemde origin, kun je hier fallbacks zetten.

## Veelvoorkomende fouten (statuscode → oorzaak)

- **401 – Missing Authorization header / Invalid or expired token**  
  Gebruiker is niet ingelogd of sessie is verlopen. Opnieuw inloggen.

- **400 – Missing success_url and/or cancel_url**  
  Geen URLs in de body en geen `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` gezet. Zet de secrets of zorg dat de app deze meestuurt.

- **400 – Missing price_id or line_items**  
  Geen `STRIPE_PRICE_ID` gezet en de app stuurt geen `price_id` mee. Zet `STRIPE_PRICE_ID` in de secrets.

- **500 – Stripe is not configured**  
  `STRIPE_SECRET_KEY` ontbreekt of is leeg. Zet de Stripe secret key in de Edge Function secrets.

- **500 – Internal server error**  
  Fout in de functie of bij Stripe (bijv. ongeldige Price ID). Bekijk de **logs** van de Edge Function in het Supabase Dashboard.

## Logs bekijken

Supabase Dashboard → **Edge Functions** → **create-checkout-session** → **Logs**. Daar zie je de echte foutmelding en stack trace.

## Na wijziging

Na het aanpassen van secrets: de Edge Function pakt ze bij de volgende aanroep. Soms is een **redeploy** nodig (bijv. **Deploy** opnieuw uitvoeren voor `create-checkout-session`).
