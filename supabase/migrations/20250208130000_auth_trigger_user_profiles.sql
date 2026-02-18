-- Fix "Database error saving new user": trigger on auth.users to create user_profiles row.
-- The function is SECURITY DEFINER and uses EXCEPTION so a failure here never blocks signup
-- (profile can be created later via start_trial on first app load).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, trial_active, trial_export_used, updated_at)
  values (new.id, true, false, now())
  on conflict (user_id) do update set updated_at = now();
  return new;
exception
  when others then
    -- Do not fail signup; profile will be created on first load via start_trial RPC
    return new;
end;
$$;

-- Ensure trigger can run (idempotent)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on function public.handle_new_user() is 'Trigger: create user_profiles row when a new auth user is created. On failure, signup still succeeds; profile created via start_trial.';
