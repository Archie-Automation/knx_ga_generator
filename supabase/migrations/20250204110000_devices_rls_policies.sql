-- RLS policies for devices: users can read and delete their own rows (for License & Apparaten UI).

create policy "Users can read own devices"
  on public.devices for select
  using (auth.uid() = user_id);

create policy "Users can delete own devices"
  on public.devices for delete
  using (auth.uid() = user_id);
