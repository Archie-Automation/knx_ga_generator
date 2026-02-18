-- Fix PGRST204: voeg updated_at toe aan user_profiles als die ontbreekt.
-- Sommige projecten hebben user_profiles zonder deze kolom (bijv. Database Fundament v2).

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
