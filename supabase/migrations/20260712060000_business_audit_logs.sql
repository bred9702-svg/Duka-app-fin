-- Immutable, tenant-scoped audit trail for Duka's sensitive business data.
-- Audit entries are written by database triggers, never by the frontend.

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  shop_id uuid not null references public.shops(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  constraint audit_logs_action_valid check (action in ('insert', 'update', 'delete')),
  constraint audit_logs_actor_role_valid check (
    actor_role is null or actor_role in ('owner', 'employee', 'system')
  )
);

create index if not exists audit_logs_shop_created_idx
  on public.audit_logs (shop_id, created_at desc);

create index if not exists audit_logs_shop_entity_idx
  on public.audit_logs (shop_id, entity_type, entity_id, created_at desc);

create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_user_id, created_at desc)
  where actor_user_id is not null;

alter table public.audit_logs enable row level security;

-- Recreate the policy explicitly so rerunning the migration is safe.
drop policy if exists "audit_logs_select_shop_owners" on public.audit_logs;
create policy "audit_logs_select_shop_owners"
on public.audit_logs
for select
to authenticated
using (public.is_shop_owner(shop_id));

-- No INSERT, UPDATE or DELETE policy is intentionally provided. The trigger
-- function below is the only application path allowed to append audit rows.

create or replace function public.write_business_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_before jsonb;
  row_after jsonb;
  effective_row jsonb;
  effective_shop_id uuid;
  effective_entity_id text;
  current_actor uuid := auth.uid();
  current_actor_role text;
begin
  if tg_op = 'INSERT' then
    row_before := null;
    row_after := to_jsonb(new);
    effective_row := row_after;
  elsif tg_op = 'UPDATE' then
    row_before := to_jsonb(old);
    row_after := to_jsonb(new);
    effective_row := row_after;

    -- Avoid noise from updates that do not actually change stored values.
    if row_before = row_after then
      return new;
    end if;
  else
    row_before := to_jsonb(old);
    row_after := null;
    effective_row := row_before;
  end if;

  effective_shop_id := nullif(effective_row ->> 'shop_id', '')::uuid;
  if effective_shop_id is null then
    raise exception using
      errcode = '23502',
      message = format('Audit source %.% has no shop_id.', tg_table_schema, tg_table_name);
  end if;

  effective_entity_id := coalesce(
    nullif(effective_row ->> 'id', ''),
    nullif(effective_row ->> 'user_id', ''),
    nullif(effective_row ->> 'shop_id', '')
  );

  if current_actor is null then
    current_actor_role := 'system';
  else
    select sm.role
    into current_actor_role
    from public.shop_members sm
    where sm.shop_id = effective_shop_id
      and sm.user_id = current_actor
      and sm.status = 'active'
    limit 1;
  end if;

  insert into public.audit_logs (
    shop_id,
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  values (
    effective_shop_id,
    current_actor,
    coalesce(current_actor_role, 'system'),
    lower(tg_op),
    tg_table_name,
    effective_entity_id,
    row_before,
    row_after
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.write_business_audit_log() from public;

-- Business records.
drop trigger if exists products_write_audit_log on public.products;
create trigger products_write_audit_log
after insert or update or delete on public.products
for each row execute function public.write_business_audit_log();

drop trigger if exists customers_write_audit_log on public.customers;
create trigger customers_write_audit_log
after insert or update or delete on public.customers
for each row execute function public.write_business_audit_log();

drop trigger if exists transactions_write_audit_log on public.transactions;
create trigger transactions_write_audit_log
after insert or update or delete on public.transactions
for each row execute function public.write_business_audit_log();

-- Access and subscription records.
drop trigger if exists shop_members_write_audit_log on public.shop_members;
create trigger shop_members_write_audit_log
after insert or update or delete on public.shop_members
for each row execute function public.write_business_audit_log();

drop trigger if exists employee_invitations_write_audit_log on public.employee_invitations;
create trigger employee_invitations_write_audit_log
after insert or update or delete on public.employee_invitations
for each row execute function public.write_business_audit_log();

drop trigger if exists subscriptions_write_audit_log on public.subscriptions;
create trigger subscriptions_write_audit_log
after insert or update or delete on public.subscriptions
for each row execute function public.write_business_audit_log();

comment on table public.audit_logs is
  'Immutable tenant audit trail. Owners may read their shop logs; only database triggers append entries.';

comment on column public.audit_logs.old_values is
  'Complete row snapshot before an update or deletion. Null for inserts.';

comment on column public.audit_logs.new_values is
  'Complete row snapshot after an insert or update. Null for deletions.';
