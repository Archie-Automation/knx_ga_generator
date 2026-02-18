-- Fix: consume_trial_export - parameternaam wijzigen vereist DROP + CREATE.
-- Herstel na gefaalde 20250208150000 (ERROR: cannot change name of input parameter).

DROP FUNCTION IF EXISTS public.consume_trial_export(uuid);
DROP FUNCTION IF EXISTS public.consume_trial_export(uuid, text);

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
