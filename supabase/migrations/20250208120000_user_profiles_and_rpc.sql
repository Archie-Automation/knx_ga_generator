-- user_profiles: trial flags per user (trial_active, trial_export_used).
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trial_active boolean not null default true,
  trial_export_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);
alter table public.user_profiles enable row level security;

create policy "Users can read own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role / backend can insert (e.g. on signup).
comment on table public.user_profiles is 'Per-user trial flags; RPC consume_trial_export updates trial_export_used.';

-- trial_domains: max trials per email domain (optional; used by can_use_trial).
create table if not exists public.trial_domains (
  domain text primary key,
  trial_count int not null default 0,
  trial_limit int not null default 5,
  updated_at timestamptz not null default now()
);

alter table public.trial_domains enable row level security;
-- No policies: only RPC/service writes.

-- RPC: can_use_trial(user_id) -> true if user can use trial (domain under limit).
create or replace function public.can_use_trial(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_domain text;
  v_count int;
  v_limit int;
begin
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null then
    return false;
  end if;
  v_domain := split_part(trim(lower(v_email)), '@', 2);
  if v_domain = '' then
    return false;
  end if;
  select trial_count, trial_limit into v_count, v_limit
  from public.trial_domains
  where domain = v_domain;
  if v_count is null then
    return true;
  end if;
  return v_count < v_limit;
end;
$$;

-- RPC: consume_trial_export(user_id) -> set trial_export_used = true and optionally increment domain.
create or replace function public.consume_trial_export(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, trial_export_used, updated_at)
  values (p_user_id, true, now())
  on conflict (user_id) do update
  set trial_export_used = true, updated_at = now();
end;
$$;

-- RPC: start_trial(user_id) -> if can_use_trial, create user_profiles and increment trial_domains (only when creating new profile).
create or replace function public.start_trial(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_domain text;
  v_already_has_profile boolean;
begin
  if not public.can_use_trial(p_user_id) then
    return false;
  end if;

  select exists (select 1 from public.user_profiles where user_id = p_user_id) into v_already_has_profile;
  if v_already_has_profile then
    return true;
  end if;

  insert into public.user_profiles (user_id, trial_active, trial_export_used, updated_at)
  values (p_user_id, true, false, now());

  select email into v_email from auth.users where id = p_user_id;
  v_domain := split_part(trim(lower(coalesce(v_email, ''))), '@', 2);
  if v_domain != '' then
    insert into public.trial_domains (domain, trial_count, trial_limit, updated_at)
    values (v_domain, 1, 5, now())
    on conflict (domain) do update
    set trial_count = trial_domains.trial_count + 1, updated_at = now();
  end if;
  return true;
end;
$$;

grant execute on function public.can_use_trial(uuid) to authenticated;
grant execute on function public.consume_trial_export(uuid) to authenticated;
grant execute on function public.start_trial(uuid) to authenticated;
