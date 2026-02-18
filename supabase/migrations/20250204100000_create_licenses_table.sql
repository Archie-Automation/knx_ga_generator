-- Licenses table: one row per user, used by license-check Edge Function.
-- last_checkin is updated on each successful online check; client uses it with
-- offline_grace_days (e.g. 7 days) for offline use.

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  valid_until timestamptz not null,
  last_checkin timestamptz not null default now(),
  plan text not null default 'basic' check (plan in ('trial', 'basic', 'pro')),
  status text not null default 'active' check (status in ('active', 'expired', 'trial')),
  offline_grace_days int not null default 7,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index if not exists idx_licenses_user_id on public.licenses(user_id);

alter table public.licenses enable row level security;

-- RLS: users can read/update only their own license row (service role used by Edge Function bypasses RLS)
create policy "Users can read own license"
  on public.licenses for select
  using (auth.uid() = user_id);

create policy "Users can update own license last_checkin"
  on public.licenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role (Edge Function) can do anything; anon cannot insert (license created via webhook/backend).
comment on table public.licenses is 'One row per user; last_checkin updated on each online license check; 7-day offline grace.';
