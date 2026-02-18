-- Allow users to update their own device rows (e.g. device_name for friendly labels).
-- No sensitive fields; fingerprint (device_hash) is set at registration only.

create policy "Users can update own devices"
  on public.devices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
