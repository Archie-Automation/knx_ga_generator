-- Enforce max 2 devices per user at database level.
-- Prevents race conditions where multiple devices register simultaneously and bypass the Edge Function check.

create or replace function public.check_devices_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  device_count int;
begin
  select count(*) into device_count
  from public.devices
  where user_id = new.user_id;

  if device_count >= 2 then
    raise exception 'DEVICE_LIMIT_REACHED: Maximum 2 devices per license'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists devices_before_insert_limit on public.devices;
create trigger devices_before_insert_limit
  before insert on public.devices
  for each row
  execute function public.check_devices_limit();
