-- Trial: domain limit and per-user trial flags.
-- license-check Edge Function (service role) creates/updates these.
-- trial_assigned_domain: max trials per email domain (e.g. bedrijf.nl).
create table if not exists public.trial_assigned_domain (
  domain text primary key,
  trial_count int not null default 0,
  trial_limit int not null default 5,
  updated_at timestamptz not null default now()
);

alter table public.trial_assigned_domain enable row level security;
-- No policies: only service role (Edge Function) can read/write.

comment on table public.trial_assigned_domain is 'Max trials per email domain; license-check increments trial_count when granting trial.';

-- user_trials: one row per user; trial_active = true on first check if domain allows, trial_export_used set after first CSV/PDF export.
create table if not exists public.user_trials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trial_active boolean not null default true,
  trial_export_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_trials_user_id on public.user_trials(user_id);

alter table public.user_trials enable row level security;

-- Users can read their own trial row (for caching / UI).
create policy "Users can read own trial"
  on public.user_trials for select
  using (auth.uid() = user_id);

-- Only service role / Edge Function can insert/update (no policy for insert/update for anon/authenticated).
comment on table public.user_trials is 'Trial state per user: trial_active (allowed by domain), trial_export_used (after first export).';
