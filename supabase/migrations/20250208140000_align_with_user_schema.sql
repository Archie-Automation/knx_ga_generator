-- =====================================================
-- PATCH: Sluit aan op jouw "Database Fundament (v2)".
-- Voer dit uit NA je bestaande schema (geen DROP tabellen).
--
-- Beveiliging:
-- - Geen wachtwoorden of API-keys in dit bestand.
-- - can_use_trial / consume_trial_export / start_trial: alleen eigen auth.uid() toegestaan.
-- - SECURITY DEFINER: nodig voor trigger en RLS-bypass; search_path = public tegen hijacking.
-- - GRANT alleen aan authenticated (niet anon).
-- =====================================================

-- 1. TRIGGER: Profiel aanmaken bij nieuwe user (blokkeert signup nooit)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_domain text;
BEGIN
    user_domain := lower(trim(split_part(coalesce(NEW.email, ''), '@', 2)));

    INSERT INTO public.user_profiles (user_id, email, trial_active, trial_export_used)
    VALUES (NEW.id, coalesce(NEW.email, ''), true, false);

    IF user_domain <> '' THEN
        INSERT INTO public.trial_domains (domain, trial_count, trial_limit)
        VALUES (user_domain, 1, 5)
        ON CONFLICT (domain)
        DO UPDATE SET trial_count = public.trial_domains.trial_count + 1;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();


-- 2. CAN_USE_TRIAL: email uit public.user_profiles (auth.users is niet leesbaar voor alle rollen in Supabase)
-- Alleen voor eigen user_id (geen inzicht in trial-status van anderen)
CREATE OR REPLACE FUNCTION public.can_use_trial(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email text;
    v_domain text;
    v_count int;
    v_limit int;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RETURN false;
    END IF;

    -- Email uit user_profiles (trigger vult dit bij aanmelding); fallback naar auth.users indien nodig
    SELECT email INTO v_email FROM public.user_profiles WHERE user_id = p_user_id;
    IF v_email IS NULL OR trim(v_email) = '' THEN
        SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
    END IF;
    IF v_email IS NULL OR trim(v_email) = '' THEN
        RETURN false;
    END IF;

    v_domain := lower(trim(split_part(v_email, '@', 2)));
    IF v_domain = '' THEN
        RETURN false;
    END IF;

    SELECT trial_count, trial_limit INTO v_count, v_limit
    FROM public.trial_domains
    WHERE domain = v_domain;

    IF v_count IS NULL THEN
        RETURN true;
    END IF;
    RETURN v_count < v_limit;
END;
$$;


-- 3. CONSUME_TRIAL_EXPORT (alleen voor eigen user_id)
CREATE OR REPLACE FUNCTION public.consume_trial_export(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Not allowed to consume trial for another user';
    END IF;

    UPDATE public.user_profiles
    SET trial_active = false, trial_export_used = true
    WHERE user_id = p_user_id;
END;
$$;


-- 4. START_TRIAL (frontend-fallback als profiel nog niet bestaat; alleen eigen user_id)
CREATE OR REPLACE FUNCTION public.start_trial(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email text;
    v_domain text;
    v_exists boolean;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RETURN false;
    END IF;

    IF NOT public.can_use_trial(p_user_id) THEN
        RETURN false;
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = p_user_id) INTO v_exists;
    IF v_exists THEN
        RETURN true;
    END IF;

    SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

    INSERT INTO public.user_profiles (user_id, email, trial_active, trial_export_used)
    VALUES (p_user_id, coalesce(v_email, ''), true, false);

    v_domain := lower(trim(split_part(coalesce(v_email, ''), '@', 2)));
    IF v_domain <> '' THEN
        INSERT INTO public.trial_domains (domain, trial_count, trial_limit)
        VALUES (v_domain, 1, 5)
        ON CONFLICT (domain)
        DO UPDATE SET trial_count = public.trial_domains.trial_count + 1;
    END IF;
    RETURN true;
END;
$$;


-- 5. Rechten voor authenticated
GRANT EXECUTE ON FUNCTION public.can_use_trial(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_trial_export(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_trial(uuid) TO authenticated;
