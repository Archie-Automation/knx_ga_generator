-- Free device swap: 1× per 30 days a user may remove a device and add a new one without cooldown.
-- Second removal within 30 days triggers the 30-day cooldown.

alter table public.user_profiles
  add column if not exists free_swap_used_at timestamptz;

comment on column public.user_profiles.free_swap_used_at is
  'When user used their free device swap (first removal in 30-day window). Second removal sets last_device_removal_at.';

create or replace function public.on_device_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free_swap user_profiles.free_swap_used_at%type;
  v_cooldown_days int := 30;
begin
  select free_swap_used_at into v_free_swap
  from public.user_profiles
  where user_id = old.user_id;

  -- First removal in 30 days: use free swap (don't set last_device_removal_at)
  if v_free_swap is null or v_free_swap < (now() - (v_cooldown_days || ' days')::interval) then
    update public.user_profiles
    set free_swap_used_at = now(),
        updated_at = now()
    where user_id = old.user_id;
  else
    -- Second removal within 30 days: set cooldown
    update public.user_profiles
    set last_device_removal_at = now(),
        updated_at = now()
    where user_id = old.user_id;
  end if;
  return old;
end;
$$;
