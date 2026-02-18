-- Fix: consume_trial_export moet ook werken als user_profiles row nog niet bestaat.
-- Maak eerst een row aan indien nodig, daarna update.

CREATE OR REPLACE FUNCTION public.consume_trial_export(p_user_id uuid, p_export_type text DEFAULT 'csv')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not allowed to consume trial for another user';
  END IF;

  -- Zorg dat user_profiles row bestaat (fallback als trigger/start_trial niet liep)
  INSERT INTO public.user_profiles (user_id, trial_active, trial_export_used, trial_csv_export_used, trial_pdf_export_used)
  VALUES (p_user_id, true, false, false, false)
  ON CONFLICT (user_id) DO NOTHING;

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
