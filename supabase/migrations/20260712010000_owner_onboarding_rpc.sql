-- Secure owner onboarding and minimum read access for Duka's core tenant
-- tables. All privileged writes happen inside a security-definer RPC.

-- ── MEMBERSHIP HELPERS ──────────────────────────────────────────────────────

create or replace function public.is_shop_member(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members
    where shop_id = target_shop_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.is_shop_owner(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members
    where shop_id = target_shop_id
      and user_id = auth.uid()
      and role = 'owner'
      and status = 'active'
  );
$$;

revoke all on function public.is_shop_member(uuid) from public;
revoke all on function public.is_shop_owner(uuid) from public;
grant execute on function public.is_shop_member(uuid) to authenticated;
grant execute on function public.is_shop_owner(uuid) to authenticated;

-- The first release supports one active Owner shop per user. Employees may
-- still belong to the same or another shop through a later invitation flow.
create unique index if not exists shop_members_one_active_owner_shop_per_user_idx
  on public.shop_members (user_id)
  where role = 'owner' and status = 'active';

-- ── MINIMUM RLS POLICIES ────────────────────────────────────────────────────

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "shops_select_active_members" on public.shops;
create policy "shops_select_active_members"
on public.shops
for select
to authenticated
using (deleted_at is null and public.is_shop_member(id));

drop policy if exists "shop_members_select_self_or_owner" on public.shop_members;
create policy "shop_members_select_self_or_owner"
on public.shop_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_shop_owner(shop_id)
);

drop policy if exists "subscriptions_select_shop_owners" on public.subscriptions;
create policy "subscriptions_select_shop_owners"
on public.subscriptions
for select
to authenticated
using (public.is_shop_owner(shop_id));

-- No direct INSERT/UPDATE/DELETE policies are added for shops, memberships or
-- subscriptions. Those writes remain server-controlled through RPCs.

-- ── ATOMIC OWNER ONBOARDING ─────────────────────────────────────────────────

create or replace function public.create_owner_shop(
  shop_name text,
  owner_full_name text,
  owner_phone text,
  shop_address text default null,
  shop_city text default null,
  requested_shop_type text default 'Wines & Spirits',
  requested_timezone text default 'Africa/Nairobi',
  requested_currency text default 'KES'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_shop_name text := nullif(trim(shop_name), '');
  normalized_owner_name text := nullif(trim(owner_full_name), '');
  normalized_owner_phone text := nullif(trim(owner_phone), '');
  normalized_shop_type text := coalesce(nullif(trim(requested_shop_type), ''), 'Wines & Spirits');
  normalized_timezone text := coalesce(nullif(trim(requested_timezone), ''), 'Africa/Nairobi');
  normalized_currency text := upper(coalesce(nullif(trim(requested_currency), ''), 'KES'));
  new_shop public.shops%rowtype;
  new_subscription public.subscriptions%rowtype;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to create a shop.';
  end if;

  -- Serialize onboarding attempts for this user. Combined with the unique
  -- owner index, this prevents duplicate shops from rapid repeated requests.
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  if normalized_shop_name is null
    or char_length(normalized_shop_name) < 2
    or char_length(normalized_shop_name) > 120 then
    raise exception using
      errcode = '22023',
      message = 'Shop name must contain between 2 and 120 characters.';
  end if;

  if normalized_owner_name is null
    or char_length(normalized_owner_name) > 120 then
    raise exception using
      errcode = '22023',
      message = 'Owner name is required and must not exceed 120 characters.';
  end if;

  if normalized_owner_phone is null
    or char_length(normalized_owner_phone) < 7
    or char_length(normalized_owner_phone) > 32 then
    raise exception using
      errcode = '22023',
      message = 'A valid owner phone number is required.';
  end if;

  if normalized_currency !~ '^[A-Z]{3}$' then
    raise exception using
      errcode = '22023',
      message = 'Currency must be a three-letter ISO code.';
  end if;

  if exists (
    select 1
    from public.shop_members
    where user_id = current_user_id
      and role = 'owner'
      and status = 'active'
  ) then
    raise exception using
      errcode = '23505',
      message = 'This account already owns an active shop.';
  end if;

  -- Also repairs a missing profile for Auth users created before the profile
  -- trigger was installed.
  insert into public.profiles (id, full_name, phone)
  values (current_user_id, normalized_owner_name, normalized_owner_phone)
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    phone = excluded.phone,
    deleted_at = null,
    updated_at = now();

  insert into public.shops (
    name,
    shop_type,
    phone,
    address,
    city,
    timezone,
    currency,
    created_by
  )
  values (
    normalized_shop_name,
    normalized_shop_type,
    normalized_owner_phone,
    nullif(trim(shop_address), ''),
    nullif(trim(shop_city), ''),
    normalized_timezone,
    normalized_currency,
    current_user_id
  )
  returning * into new_shop;

  insert into public.shop_members (shop_id, user_id, role, status)
  values (new_shop.id, current_user_id, 'owner', 'active');

  insert into public.subscriptions (
    shop_id,
    plan,
    status,
    trial_started_at,
    trial_ends_at,
    amount_kes
  )
  values (
    new_shop.id,
    'pro',
    'trial',
    now(),
    now() + interval '15 days',
    2999
  )
  returning * into new_subscription;

  return jsonb_build_object(
    'shop', to_jsonb(new_shop),
    'membership', jsonb_build_object(
      'shop_id', new_shop.id,
      'user_id', current_user_id,
      'role', 'owner',
      'status', 'active'
    ),
    'subscription', to_jsonb(new_subscription)
  );
end;
$$;

revoke all on function public.create_owner_shop(text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_owner_shop(text, text, text, text, text, text, text, text) to authenticated;

comment on function public.create_owner_shop(text, text, text, text, text, text, text, text)
is 'Atomically creates one Owner shop, active membership and 15-day Pro trial for the authenticated user.';
