-- Convert Duka's prototype business tables to UUID-based multi-tenancy while
-- preserving every legacy attribution value for audit/debugging purposes.

-- ── ARCHIVE LEGACY TEXT IDENTIFIERS ─────────────────────────────────────────

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'shop_id' and udt_name = 'text'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'legacy_shop_id'
  ) then
    alter table public.transactions rename column shop_id to legacy_shop_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'employee_id' and udt_name = 'text'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'legacy_employee_id'
  ) then
    alter table public.transactions rename column employee_id to legacy_employee_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'performed_by_user_id' and udt_name = 'text'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'legacy_performed_by_user_id'
  ) then
    alter table public.transactions rename column performed_by_user_id to legacy_performed_by_user_id;
  end if;
end;
$$;

alter table public.products add column if not exists shop_id uuid;
alter table public.customers add column if not exists shop_id uuid;
alter table public.transactions add column if not exists shop_id uuid;
alter table public.transactions add column if not exists employee_id uuid;
alter table public.transactions add column if not exists performed_by_user_id uuid;

-- ── BACKFILL EXISTING PROTOTYPE DATA ────────────────────────────────────────

do $$
declare
  target_shop_id uuid;
  owner_shop_count integer;
  rows_requiring_backfill bigint;
begin
  select count(distinct shop_id)
  into owner_shop_count
  from public.shop_members
  where role = 'owner' and status = 'active';

  select
    (select count(*) from public.products where shop_id is null)
    + (select count(*) from public.customers where shop_id is null)
    + (select count(*) from public.transactions where shop_id is null)
  into rows_requiring_backfill;

  -- A database that already uses UUID tenant attribution needs no legacy
  -- backfill, even when it legitimately contains several Owner shops.
  if rows_requiring_backfill > 0 and owner_shop_count <> 1 then
    raise exception using
      errcode = '55000',
      message = 'Legacy business data requires exactly one active Owner shop for safe backfill.';
  end if;

  if rows_requiring_backfill > 0 and owner_shop_count = 1 then
    select shop_id
    into target_shop_id
    from public.shop_members
    where role = 'owner' and status = 'active'
    limit 1;

    update public.products set shop_id = target_shop_id where shop_id is null;
    update public.customers set shop_id = target_shop_id where shop_id is null;
    update public.transactions set shop_id = target_shop_id where shop_id is null;
  end if;
end;
$$;

-- Recover only legacy values that are both valid UUID strings and real Duka
-- profiles. Invalid prototype identifiers remain archived in legacy_*.
update public.transactions as txn
set employee_id = txn.legacy_employee_id::uuid
where txn.employee_id is null
  and txn.legacy_employee_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.profiles
    where id = txn.legacy_employee_id::uuid
  );

update public.transactions as txn
set performed_by_user_id = txn.legacy_performed_by_user_id::uuid
where txn.performed_by_user_id is null
  and txn.legacy_performed_by_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.profiles
    where id = txn.legacy_performed_by_user_id::uuid
  );

-- ── FOREIGN KEYS AND REQUIRED TENANT BOUNDARY ───────────────────────────────

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_shop_id_fkey') then
    alter table public.products
      add constraint products_shop_id_fkey foreign key (shop_id)
      references public.shops(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'customers_shop_id_fkey') then
    alter table public.customers
      add constraint customers_shop_id_fkey foreign key (shop_id)
      references public.shops(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_shop_id_fkey') then
    alter table public.transactions
      add constraint transactions_shop_id_fkey foreign key (shop_id)
      references public.shops(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_employee_id_fkey') then
    alter table public.transactions
      add constraint transactions_employee_id_fkey foreign key (employee_id)
      references public.profiles(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_performed_by_user_id_fkey') then
    alter table public.transactions
      add constraint transactions_performed_by_user_id_fkey foreign key (performed_by_user_id)
      references public.profiles(id) on delete set null;
  end if;
end;
$$;

alter table public.products alter column shop_id set not null;
alter table public.customers alter column shop_id set not null;
alter table public.transactions alter column shop_id set not null;

create index if not exists products_shop_active_idx
  on public.products (shop_id, active, category, name);
create index if not exists customers_shop_name_idx
  on public.customers (shop_id, name);
create index if not exists customers_shop_phone_idx
  on public.customers (shop_id, phone)
  where phone is not null;
create index if not exists transactions_shop_created_idx
  on public.transactions (shop_id, created_at desc);
create index if not exists transactions_shop_customer_idx
  on public.transactions (shop_id, customer_id, created_at desc)
  where customer_id is not null;
create index if not exists transactions_shop_employee_idx
  on public.transactions (shop_id, employee_id, created_at desc)
  where employee_id is not null;

-- ── SAFE DEFAULT FOR AUTHENTICATED INSERTS ──────────────────────────────────

create or replace function public.current_user_shop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select shop_id
  from public.shop_members
  where user_id = auth.uid()
    and status = 'active'
  order by joined_at asc
  limit 1;
$$;

revoke all on function public.current_user_shop_id() from public;
grant execute on function public.current_user_shop_id() to authenticated;

alter table public.products
  alter column shop_id set default public.current_user_shop_id();
alter table public.customers
  alter column shop_id set default public.current_user_shop_id();
alter table public.transactions
  alter column shop_id set default public.current_user_shop_id();

-- ── MULTI-TENANT RLS ────────────────────────────────────────────────────────

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;

-- Remove prototype policies, including any historical allow-all policy, then
-- install one explicit least-privilege policy set.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('products', 'customers', 'transactions')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

create policy "products_select_shop_members"
on public.products for select to authenticated
using (public.is_shop_member(shop_id));
create policy "products_insert_shop_members"
on public.products for insert to authenticated
with check (public.is_shop_member(shop_id));
create policy "products_update_shop_members"
on public.products for update to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));
create policy "products_delete_shop_owners"
on public.products for delete to authenticated
using (public.is_shop_owner(shop_id));

create policy "customers_select_shop_members"
on public.customers for select to authenticated
using (public.is_shop_member(shop_id));
create policy "customers_insert_shop_members"
on public.customers for insert to authenticated
with check (public.is_shop_member(shop_id));
create policy "customers_update_shop_members"
on public.customers for update to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));
create policy "customers_delete_shop_owners"
on public.customers for delete to authenticated
using (public.is_shop_owner(shop_id));

create policy "transactions_select_shop_members"
on public.transactions for select to authenticated
using (public.is_shop_member(shop_id));
create policy "transactions_insert_shop_members"
on public.transactions for insert to authenticated
with check (public.is_shop_member(shop_id));
create policy "transactions_update_shop_members"
on public.transactions for update to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));
create policy "transactions_delete_shop_owners"
on public.transactions for delete to authenticated
using (public.is_shop_owner(shop_id));

comment on column public.transactions.legacy_shop_id
is 'Archived prototype shop identifier. Never used for authorization.';
comment on column public.transactions.legacy_employee_id
is 'Archived prototype employee identifier. Never used for authorization.';
comment on column public.transactions.legacy_performed_by_user_id
is 'Archived prototype actor identifier. Never used for authorization.';
