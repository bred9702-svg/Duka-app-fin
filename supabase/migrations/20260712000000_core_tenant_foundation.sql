-- Duka core multi-tenant foundation.
--
-- This migration deliberately creates the new identity and tenancy model
-- alongside the existing prototype tables. Frontend cutover and legacy
-- employee cleanup will happen in later, independently reversible steps.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── PROFILES ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_full_name_length check (
    full_name is null or char_length(trim(full_name)) between 1 and 120
  ),
  constraint profiles_phone_length check (
    phone is null or char_length(trim(phone)) between 7 and 32
  )
);

create unique index if not exists profiles_phone_unique_idx
  on public.profiles (phone)
  where phone is not null and deleted_at is null;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Keep the public profile identity aligned with Supabase Auth. This creates
-- only the user's own profile; shop creation remains an explicit server flow.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.phone, new.raw_user_meta_data ->> 'phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ── SHOPS ───────────────────────────────────────────────────────────────────

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shop_type text not null default 'Wines & Spirits',
  phone text,
  address text,
  city text,
  timezone text not null default 'Africa/Nairobi',
  currency text not null default 'KES',
  logo_url text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint shops_name_length check (char_length(trim(name)) between 2 and 120),
  constraint shops_type_length check (char_length(trim(shop_type)) between 2 and 80),
  constraint shops_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint shops_timezone_not_blank check (char_length(trim(timezone)) > 0),
  constraint shops_phone_length check (
    phone is null or char_length(trim(phone)) between 7 and 32
  )
);

create index if not exists shops_created_by_idx on public.shops (created_by);
create index if not exists shops_active_idx
  on public.shops (created_at desc)
  where deleted_at is null;

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at
before update on public.shops
for each row execute function public.set_updated_at();

-- ── SHOP MEMBERS ────────────────────────────────────────────────────────────

create table if not exists public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (shop_id, user_id),
  constraint shop_members_role_valid check (role in ('owner', 'employee')),
  constraint shop_members_status_valid check (status in ('active', 'suspended', 'removed')),
  constraint shop_members_removed_state_valid check (
    (status = 'removed' and removed_at is not null)
    or (status <> 'removed' and removed_at is null)
  )
);

create index if not exists shop_members_user_idx
  on public.shop_members (user_id, status);
create index if not exists shop_members_shop_role_idx
  on public.shop_members (shop_id, role, status);

drop trigger if exists shop_members_set_updated_at on public.shop_members;
create trigger shop_members_set_updated_at
before update on public.shop_members
for each row execute function public.set_updated_at();

-- ── SUBSCRIPTIONS ───────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  plan text not null default 'pro',
  status text not null default 'trial',
  trial_started_at timestamptz default now(),
  trial_ends_at timestamptz default (now() + interval '15 days'),
  current_period_started_at timestamptz,
  current_period_ends_at timestamptz,
  amount_kes integer not null default 2999,
  payment_method text,
  payment_reference text,
  activated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_plan_valid check (plan in ('free', 'pro')),
  constraint subscriptions_status_valid check (
    status in ('trial', 'active', 'expired', 'cancelled')
  ),
  constraint subscriptions_amount_valid check (amount_kes >= 0),
  constraint subscriptions_trial_dates_valid check (
    (status <> 'trial')
    or (
      trial_started_at is not null
      and trial_ends_at is not null
      and trial_ends_at > trial_started_at
    )
  ),
  constraint subscriptions_period_dates_valid check (
    current_period_ends_at is null
    or (
      current_period_started_at is not null
      and current_period_ends_at > current_period_started_at
    )
  )
);

-- A shop can have only one entitlement that currently grants Pro access.
create unique index if not exists subscriptions_one_current_per_shop_idx
  on public.subscriptions (shop_id)
  where status in ('trial', 'active');

create unique index if not exists subscriptions_payment_reference_unique_idx
  on public.subscriptions (payment_reference)
  where payment_reference is not null;

create index if not exists subscriptions_shop_history_idx
  on public.subscriptions (shop_id, created_at desc);
create index if not exists subscriptions_trial_expiry_idx
  on public.subscriptions (trial_ends_at)
  where status = 'trial';
create index if not exists subscriptions_period_expiry_idx
  on public.subscriptions (current_period_ends_at)
  where status = 'active';

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- ── EMPLOYEE INVITATIONS ────────────────────────────────────────────────────

create table if not exists public.employee_invitations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  phone text,
  role text not null default 'employee',
  status text not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_invitations_code_format check (
    code ~ '^DUKA-[A-Z2-9]{6}$'
  ),
  constraint employee_invitations_phone_length check (
    phone is null or char_length(trim(phone)) between 7 and 32
  ),
  constraint employee_invitations_role_valid check (role = 'employee'),
  constraint employee_invitations_status_valid check (
    status in ('pending', 'accepted', 'expired', 'revoked')
  ),
  constraint employee_invitations_expiry_valid check (expires_at > created_at),
  constraint employee_invitations_acceptance_valid check (
    (status = 'accepted' and accepted_by is not null and accepted_at is not null)
    or (status <> 'accepted' and accepted_by is null and accepted_at is null)
  )
);

create unique index if not exists employee_invitations_code_unique_idx
  on public.employee_invitations (code);
create index if not exists employee_invitations_shop_idx
  on public.employee_invitations (shop_id, status, created_at desc);
create index if not exists employee_invitations_expiry_idx
  on public.employee_invitations (expires_at)
  where status = 'pending';
create index if not exists employee_invitations_phone_idx
  on public.employee_invitations (phone)
  where phone is not null and status = 'pending';

drop trigger if exists employee_invitations_set_updated_at on public.employee_invitations;
create trigger employee_invitations_set_updated_at
before update on public.employee_invitations
for each row execute function public.set_updated_at();

-- RLS is locked by default. Explicit least-privilege policies and server-side
-- workflows are added in the next migration before the frontend is connected.
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.employee_invitations enable row level security;

comment on table public.profiles is 'Public application profile linked one-to-one with auth.users.';
comment on table public.shops is 'Top-level tenant boundary for every Duka business.';
comment on table public.shop_members is 'Owner and employee membership of a Duka shop.';
comment on table public.subscriptions is 'Server-controlled trial and paid entitlement history per shop.';
comment on table public.employee_invitations is 'Time-limited invitation records used to join employees to a shop.';
