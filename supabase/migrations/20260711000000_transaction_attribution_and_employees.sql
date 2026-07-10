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

create table if not exists public.employees (
  employee_id text primary key,
  shop_id text not null,
  name text,
  phone text,
  invite_code text,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_shop_id_idx
  on public.employees (shop_id);

-- Matches the current permissive access pattern used by the rest of the
-- schema (no RLS yet — see pending "per-shop isolation + RLS" work).
alter table public.employees enable row level security;

drop policy if exists "employees_allow_all" on public.employees;
create policy "employees_allow_all" on public.employees
  for all
  using (true)
  with check (true);
