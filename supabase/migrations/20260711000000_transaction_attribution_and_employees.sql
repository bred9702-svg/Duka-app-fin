-- Employee attribution support.
-- 1) transactions: who performed each cash in / cash out / sale / debt action.
-- 2) employees: registry synced from an employee's device so the owner can
--    see who joined their shop (previously only stored in localStorage on
--    the employee's own device, never visible to the owner).

alter table public.transactions
  add column if not exists performed_by_user_id text,
  add column if not exists employee_id text,
  add column if not exists employee_name text,
  add column if not exists shop_id text;

-- Preserve a legacy registry if it already exists. Some production databases
-- received this table before the migration history was introduced.
create table if not exists public.employees (
  employee_id text primary key,
  shop_id text not null,
  name text,
  phone text,
  invite_code text,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees
  add column if not exists shop_id text,
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists invite_code text,
  add column if not exists joined_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists employees_shop_id_idx
  on public.employees (shop_id);

alter table public.employees enable row level security;

drop policy if exists "employees_allow_all" on public.employees;
create policy "employees_allow_all" on public.employees
  for all
  using (true)
  with check (true);
-- Never downgrade modern UUID attribution columns to text. The following
-- migration archives text identifiers and keeps UUID columns/FKs in place.
-- When this database is already on the modern schema, create empty archive
-- columns so that the follow-up migration remains idempotent.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'shop_id' and udt_name = 'uuid'
  ) then
    alter table public.transactions add column if not exists legacy_shop_id text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'employee_id' and udt_name = 'uuid'
  ) then
    alter table public.transactions add column if not exists legacy_employee_id text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions'
      and column_name = 'performed_by_user_id' and udt_name = 'uuid'
  ) then
    alter table public.transactions add column if not exists legacy_performed_by_user_id text;
  end if;
end;
$$;
