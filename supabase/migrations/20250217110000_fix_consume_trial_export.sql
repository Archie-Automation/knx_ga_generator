-- Fix trial export consumption: gebruik user_id en export_type (PostgREST-compatibel)
-- Zorg dat row bestaat, update daarna.

DROP FUNCTION IF EXISTS public.consume_trial_export(uuid);
DROP FUNCTION IF EXISTS public.consume_trial_export(uuid, text);

CREATE OR REPLACE FUNCTION public.consume_trial_export(user_id uuid, export_type text DEFAULT 'csv')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> user_id THEN
    RAISE EXCEPTION 'Not allowed to consume trial for another user';
  END IF;

  -- Zorg dat user_profiles row bestaat
  INSERT INTO public.user_profiles (user_id, trial_active, trial_export_used, trial_csv_export_used, trial_pdf_export_used)
  VALUES (user_id, true, false, false, false)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update de juiste export-vlag
  IF lower(trim(export_type)) = 'pdf' THEN
    UPDATE public.user_profiles
    SET trial_pdf_export_used = true,
        updated_at = now(),
        trial_export_used = (trial_csv_export_used AND true)
    WHERE user_profiles.user_id = consume_trial_export.user_id;
  ELSE
    UPDATE public.user_profiles
    SET trial_csv_export_used = true,
        updated_at = now(),
        trial_export_used = (trial_pdf_export_used)
    WHERE user_profiles.user_id = consume_trial_export.user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_trial_export(uuid, text) TO authenticated;
