-- Device swap cooldown: track when user removes a device to prevent constant switching.
-- When adding a new device, if user removed one in the last 30 days, registration is blocked.

alter table public.user_profiles
  add column if not exists last_device_removal_at timestamptz;

comment on column public.user_profiles.last_device_removal_at is
  'Set when user deletes a device; used to enforce 30-day cooldown before adding a new device.';

create or replace function public.on_device_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_profiles
  set last_device_removal_at = now(),
      updated_at = now()
  where user_id = old.user_id;
  return old;
end;
$$;

drop trigger if exists devices_after_delete on public.devices;
create trigger devices_after_delete
  after delete on public.devices
  for each row
  execute function public.on_device_deleted();
