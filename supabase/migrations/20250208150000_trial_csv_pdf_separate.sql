-- Trial: 1× CSV en 1× PDF elk (beide één keer), daarna licentie.
-- Voeg aparte vlaggen toe; trial_export_used blijft voor backwards compatibility (beide gebruikt = true).

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS trial_csv_export_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_pdf_export_used boolean NOT NULL DEFAULT false;

-- Bestaande gebruikers die al hun "één export" hebben gebruikt: beide nieuwe vlaggen op true
UPDATE public.user_profiles
SET trial_csv_export_used = true, trial_pdf_export_used = true
WHERE trial_export_used = true;

COMMENT ON COLUMN public.user_profiles.trial_csv_export_used IS 'True after first CSV export during trial.';
COMMENT ON COLUMN public.user_profiles.trial_pdf_export_used IS 'True after first PDF export during trial.';

-- Vervang oude RPC (alleen user_id) door versie met export_type
-- DROP eerst: parameternaam mag niet wijzigen bij CREATE OR REPLACE (42P13)
DROP FUNCTION IF EXISTS public.consume_trial_export(uuid);
DROP FUNCTION IF EXISTS public.consume_trial_export(uuid, text);

-- RPC: consume_trial_export(p_user_id, p_export_type) met export_type 'csv' of 'pdf'
CREATE FUNCTION public.consume_trial_export(p_user_id uuid, p_export_type text DEFAULT 'csv')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not allowed to consume trial for another user';
  END IF;

  IF lower(trim(p_export_type)) = 'pdf' THEN
    UPDATE public.user_profiles
    SET trial_pdf_export_used = true,
        updated_at = now(),
        trial_export_used = (trial_csv_export_used AND true)
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.user_profiles
    SET trial_csv_export_used = true,
        updated_at = now(),
        trial_export_used = (true AND trial_pdf_export_used)
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_trial_export(uuid, text) TO authenticated;
