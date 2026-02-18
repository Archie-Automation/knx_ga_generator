# Stripe webhook lokaal testen met Stripe CLI

Stappen om de `stripe-webhook` Edge Function lokaal te testen met de Stripe CLI op Windows.

---

## 1. Stripe CLI installeren op Windows

### Optie A: Met Scoop (aanbevolen)

Als je [Scoop](https://scoop.sh/) hebt:

```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Optie B: Handmatig

1. Ga naar [Stripe CLI releases](https://github.com/stripe/stripe-cli/releases/latest).
2. Download het **Windows** zip-bestand (bijv. `stripe_X.X.X_windows_x86_64.zip`).
3. Pak uit en zet `stripe.exe` in een map die in je **PATH** staat (bijv. `C:\Program Files\Stripe\`), zodat je overal `stripe` kunt typen.

### Eerste keer: inloggen

```powershell
stripe login
```

Volg de instructies in de browser (pairing code) om je Stripe-account te koppelen.

---

## 2. Lokale Supabase starten

Zorg dat je **lokale** Supabase (inclusief Edge Functions) draait:

```powershell
cd c:\Users\gebruiker\KNX
npx supabase start
```

Edge Functions lokaal serveren (in een **aparte** terminal):

```powershell
cd c:\Users\gebruiker\KNX
npx supabase functions serve
```

De functies zijn dan bereikbaar op o.a.:

- `http://localhost:54321/functions/v1/stripe-webhook`

---

## 3. Stripe-events doorsturen naar je webhook

In weer een **aparte** terminal:

```powershell
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

De CLI toont iets als:

```text
Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Kopieer dit geheim** (`whsec_...`); je hebt het nodig voor de volgende stap.

Je kunt ook alleen `checkout.session.completed` doorsturen:

```powershell
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook --events checkout.session.completed
```

---

## 4. STRIPE_WEBHOOK_SECRET instellen voor lokaal testen

De Edge Function moet het **zelfde** webhook-geheim gebruiken als de Stripe CLI (het `whsec_...` uit stap 3).

### Methode: `.env` in de functions-map

1. Maak (of open) het bestand:
   ```text
   supabase/functions/.env
   ```
2. Zet daarin de secret die `stripe listen` toonde:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. **Herstart** de Functions-server zodat de nieuwe env wordt geladen:
   - Stop `supabase functions serve` (Ctrl+C).
   - Start opnieuw:
     ```powershell
     npx supabase functions serve
     ```

Supabase laadt automatisch `supabase/functions/.env` bij `supabase functions serve`. Zonder deze variabele faalt de signature-verificatie en krijg je een 400 van de webhook.

**Let op:** Voeg `supabase/functions/.env` toe aan `.gitignore` en commit nooit echte secrets.

---

## 5. Testevent triggeren

Met `stripe listen` nog aan, in een **nieuwe** terminal:

```powershell
stripe trigger checkout.session.completed
```

De CLI stuurt een test-`checkout.session.completed` event naar je lokale webhook. In de output van `stripe listen` zie je of het verzoek is doorgestuurd en wat de response was (bijv. 200 of 400).

**Let op:** Het getriggerde event heeft vaak **geen** echte `metadata.supabase_user_id`. Voor een volledige test kun je:

- In Stripe Dashboard (Test mode) een echte test-Checkout-sessie afronden die wél `metadata.supabase_user_id` heeft (zoals je app doet), of  
- Tijdelijk in de Edge Function voor tests een fallback user-id gebruiken (alleen lokaal, niet in productie).

---

## Overzicht

| Stap | Actie |
|------|--------|
| 1 | Stripe CLI installeren (`scoop install stripe` of handmatig) en `stripe login` |
| 2 | `supabase start` en `supabase functions serve` |
| 3 | `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook` en secret kopiëren |
| 4 | In `supabase/functions/.env` zetten: `STRIPE_WEBHOOK_SECRET=whsec_...` en functions serve herstarten |
| 5 | `stripe trigger checkout.session.completed` (of echte test-checkout) om te testen |
