# Waar komt de link in de verificatie-e-mail vandaan?

Als er na het klikken op "Bevestig e-mail" een **lokaal adres** (bijv. localhost) opent, kan dat uit twee plekken komen.

## 1. Supabase Dashboard (meest waarschijnlijk)

De **standaard** redirect na e-mailbevestiging wordt door Supabase bepaald:

1. Ga in Supabase naar **Authentication** → **URL Configuration**.
2. **Site URL**: zet dit op de echte URL van je app (bijv. `https://jouwdomein.nl` of de URL waar gebruikers de app openen).
   - Staat hier nog `http://localhost:3000` of iets dergelijks, dan gaan alle bevestigingslinks daar naartoe.
3. **Redirect URLs**: voeg hier dezelfde URL(s) toe die je app mag gebruiken na inloggen/verificatie (bijv. `https://jouwdomein.nl`, `https://jouwdomein.nl/#/`).

Na aanpassing gaan nieuwe e-mails naar de juiste URL. Oude e-mails blijven de oude link bevatten.

## 2. De tool (frontend)

De app stuurt bij **registratie** nu expliciet een redirect-URL mee: `window.location.origin + pathname + hash`.  
Dus de link in de mail gaat naar **de plek waar de gebruiker de app op dat moment gebruikte** (productie-URL of localhost).

- **Wachtwoord vergeten**: er wordt al `redirectTo` meegegeven (zelfde principe).
- **E-mail wijzigen**: idem via `emailRedirectTo`.

Als je de app altijd op dezelfde productie-URL opent, en in Supabase **Site URL** en **Redirect URLs** ook die productie-URL staan, zou er geen localhost meer in de mail moeten staan.

## Samenvatting

| Bron              | Waar aanpassen |
|-------------------|----------------|
| **Supabase**      | Authentication → URL Configuration → **Site URL** en **Redirect URLs**. |
| **Tool**          | Bij signup wordt nu automatisch de huidige app-URL als redirect gebruikt. |

Oude "local license server"-instellingen staan niet in deze repo; die stonden waarschijnlijk alleen in Supabase (Site URL) of in een andere, oudere versie van de app.
