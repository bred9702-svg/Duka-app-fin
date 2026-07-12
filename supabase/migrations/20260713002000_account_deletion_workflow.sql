-- Immediate account deactivation with a 30-day verified recovery window.

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  shop_id uuid not null references public.shops(id) on delete restrict,
  account_role text not null,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  recoverable_until timestamptz not null default (now() + interval '30 days'),
  restored_at timestamptz,
  completed_at timestamptz,
  processed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_deletion_role_valid check (account_role in ('owner', 'employee')),
  constraint account_deletion_status_valid check (status in ('pending', 'restored', 'completed')),
  constraint account_deletion_recovery_valid check (recoverable_until > requested_at),
  constraint account_deletion_state_valid check (
    (status = 'pending' and restored_at is null and completed_at is null)
    or (status = 'restored' and restored_at is not null and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  )
);

create unique index if not exists account_deletion_one_pending_user_idx
  on public.account_deletion_requests (user_id)
  where status = 'pending';
create index if not exists account_deletion_due_idx
  on public.account_deletion_requests (recoverable_until)
  where status = 'pending';
create index if not exists account_deletion_shop_idx
  on public.account_deletion_requests (shop_id, requested_at desc);

drop trigger if exists account_deletion_requests_set_updated_at
  on public.account_deletion_requests;
create trigger account_deletion_requests_set_updated_at
before update on public.account_deletion_requests
for each row execute function public.set_updated_at();

alter table public.account_deletion_requests enable row level security;

drop policy if exists "account_deletion_select_own" on public.account_deletion_requests;
create policy "account_deletion_select_own"
on public.account_deletion_requests for select to authenticated
using (user_id = auth.uid());

create or replace function public.request_account_deletion(confirmation_text text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  membership_record public.shop_members%rowtype;
  request_record public.account_deletion_requests%rowtype;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if upper(trim(coalesce(confirmation_text, ''))) <> 'DELETE MY ACCOUNT' then
    raise exception using errcode = '22023', message = 'Account deletion confirmation is incorrect.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor_id::text, 0));

  if exists (
    select 1 from public.account_deletion_requests
    where user_id = actor_id and status = 'pending'
  ) then
    raise exception using errcode = '23505', message = 'A deletion request is already pending.';
  end if;

  select * into membership_record
  from public.shop_members
  where user_id = actor_id and status = 'active'
  order by joined_at asc
  limit 1
  for update;

  if membership_record.user_id is null then
    raise exception using errcode = '22023', message = 'No active Duka account was found.';
  end if;

  insert into public.account_deletion_requests (
    user_id, shop_id, account_role, status, requested_at, recoverable_until
  ) values (
    actor_id, membership_record.shop_id, membership_record.role,
    'pending', now(), now() + interval '30 days'
  ) returning * into request_record;

  update public.profiles
  set deleted_at = now()
  where id = actor_id;

  if membership_record.role = 'owner' then
    update public.shops
    set deleted_at = now()
    where id = membership_record.shop_id and deleted_at is null;
  else
    update public.shop_members
    set status = 'suspended', removed_at = null
    where shop_id = membership_record.shop_id and user_id = actor_id;
  end if;

  -- Prevent a new login or a second shop from being created with the same
  -- Auth identity while deletion is pending.
  update auth.users
  set banned_until = 'infinity'::timestamptz,
      updated_at = now()
  where id = actor_id;

  return jsonb_build_object(
    'request_id', request_record.id,
    'status', request_record.status,
    'account_role', request_record.account_role,
    'recoverable_until', request_record.recoverable_until
  );
end;
$$;

create or replace function public.restore_deleted_account(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  request_record public.account_deletion_requests%rowtype;
  restored_employee_access boolean := false;
begin
  select * into request_record
  from public.account_deletion_requests
  where user_id = target_user_id and status = 'pending'
  order by requested_at desc limit 1
  for update;

  if request_record.id is null then
    raise exception using errcode = '22023', message = 'No pending deletion request was found.';
  end if;
  if request_record.recoverable_until <= now() then
    raise exception using errcode = '22023', message = 'The 30-day recovery period has expired.';
  end if;

  update public.profiles set deleted_at = null where id = target_user_id;

  if request_record.account_role = 'owner' then
    update public.shops set deleted_at = null where id = request_record.shop_id;
  elsif public.shop_has_pro_access(request_record.shop_id) then
    update public.shop_members
    set status = 'active', removed_at = null
    where shop_id = request_record.shop_id and user_id = target_user_id;
    restored_employee_access := true;
  end if;

  update auth.users
  set banned_until = null, updated_at = now()
  where id = target_user_id;

  update public.account_deletion_requests
  set status = 'restored', restored_at = now(), processed_by = auth.uid()
  where id = request_record.id;

  return jsonb_build_object(
    'request_id', request_record.id,
    'status', 'restored',
    'employee_access_restored', restored_employee_access
  );
end;
$$;

create or replace function public.finalize_account_deletion(target_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  request_record public.account_deletion_requests%rowtype;
begin
  select * into request_record
  from public.account_deletion_requests
  where id = target_request_id and status = 'pending'
  for update;

  if request_record.id is null then
    raise exception using errcode = '22023', message = 'Pending deletion request was not found.';
  end if;
  if request_record.recoverable_until > now() then
    raise exception using errcode = '22023', message = 'The 30-day recovery period has not expired.';
  end if;

  if request_record.account_role = 'owner' then
    delete from public.stock_purchase_items where shop_id = request_record.shop_id;
    delete from public.stock_purchases where shop_id = request_record.shop_id;
    delete from public.transactions where shop_id = request_record.shop_id;
    delete from public.customers where shop_id = request_record.shop_id;
    delete from public.products where shop_id = request_record.shop_id;
    delete from public.employee_invitations where shop_id = request_record.shop_id;
    delete from public.shop_business_preferences where shop_id = request_record.shop_id;
    if to_regclass('public.shop_payment_settings') is not null then
      execute 'delete from public.shop_payment_settings where shop_id = $1'
      using request_record.shop_id;
    end if;
    delete from public.shop_members where shop_id = request_record.shop_id;

    update public.shops
    set name = 'Deleted Shop', phone = null, address = null, city = null,
        logo_url = null, deleted_at = coalesce(deleted_at, now())
    where id = request_record.shop_id;
  else
    delete from public.shop_members
    where shop_id = request_record.shop_id and user_id = request_record.user_id;
  end if;

  update public.profiles
  set full_name = 'Deleted User', phone = null, avatar_url = null,
      deleted_at = coalesce(deleted_at, now())
  where id = request_record.user_id;

  update public.account_deletion_requests
  set status = 'completed', completed_at = now(), processed_by = auth.uid()
  where id = request_record.id;

  return jsonb_build_object('request_id', request_record.id, 'status', 'completed');
end;
$$;

revoke all on function public.request_account_deletion(text) from public;
grant execute on function public.request_account_deletion(text) to authenticated;
revoke all on function public.restore_deleted_account(uuid) from public;
revoke all on function public.finalize_account_deletion(uuid) from public;
grant execute on function public.restore_deleted_account(uuid) to service_role;
grant execute on function public.finalize_account_deletion(uuid) to service_role;

drop trigger if exists account_deletion_requests_write_audit_log
  on public.account_deletion_requests;
create trigger account_deletion_requests_write_audit_log
after insert or update or delete on public.account_deletion_requests
for each row execute function public.write_business_audit_log();

comment on table public.account_deletion_requests is
  'Immediate deactivation requests with a 30-day verified recovery window.';
