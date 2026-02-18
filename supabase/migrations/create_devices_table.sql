-- Devices table for Supabase
-- Run in Supabase SQL Editor

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_hash text not null,
  device_name text,
  app_version text,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique(user_id, device_hash)
);

create index if not exists idx_devices_user_id on public.devices(user_id);

alter table public.devices enable row level security;
