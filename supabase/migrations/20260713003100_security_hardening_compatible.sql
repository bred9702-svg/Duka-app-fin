-- DUKWISE SECURITY HARDENING COMPATIBLE V2
-- Additive security hardening for Dukwise.
-- Keeps the existing application API intact while closing implicit grants,
-- limiting invitation abuse and recording security-sensitive events.

-- Repair a missing entitlement helper required by employee access and account
-- recovery. Access is evaluated from database time, never client state.
create or replace function public.shop_has_pro_access(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.shop_id = target_shop_id
      and s.plan = 'pro'
      and (
        (
          s.status = 'trial'
          and s.trial_started_at <= now()
          and s.trial_ends_at > now()
        )
        or
        (
          s.status = 'active'
          and s.current_period_started_at <= now()
          and s.current_period_ends_at > now()
        )
      )
  );
$$;

create table if not exists public.security_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  severity text not null default 'info',
  actor_id uuid references auth.users(id) on delete set null,
  shop_id uuid references public.shops(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint security_events_type_valid check (
    event_type ~ '^[a-z][a-z0-9_]{2,79}$'
  ),
  constraint security_events_severity_valid check (
    severity in ('info', 'warning', 'critical')
  ),
  constraint security_events_metadata_object check (
    jsonb_typeof(metadata) = 'object'
  )
);

create index if not exists security_events_shop_time_idx
  on public.security_events (shop_id, occurred_at desc);
create index if not exists security_events_actor_time_idx
  on public.security_events (actor_id, occurred_at desc);
create index if not exists security_events_severity_time_idx
  on public.security_events (severity, occurred_at desc);

alter table public.security_events enable row level security;

drop policy if exists "security_events_select_shop_owners" on public.security_events;
create policy "security_events_select_shop_owners"
on public.security_events for select to authenticated
using (shop_id is not null and public.is_shop_owner(shop_id));

revoke all on table public.security_events from public, anon, authenticated;
grant select on table public.security_events to authenticated;

-- PostgreSQL gives PUBLIC function execution by default. Existing migrations
-- explicitly grant the application RPCs that are intended to be callable, so
-- remove the implicit fallback from every function in the public schema.
do $$
declare
  function_record record;
begin
  for function_record in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from public', function_record.signature);
  end loop;
end;
$$;

-- Explicit grants made by earlier migrations to authenticated, anon and
-- service_role remain intact; revoking PUBLIC above does not remove them.

-- These tenant and subscription records must only be changed through their
-- validated server functions, never through the browser REST table endpoint.
revoke insert, update, delete on table public.shops from anon, authenticated;
revoke insert, update, delete on table public.shop_members from anon, authenticated;
revoke insert, update, delete on table public.subscriptions from anon, authenticated;
revoke insert, update, delete on table public.employee_invitations from anon, authenticated;
revoke insert, update, delete on table public.account_deletion_requests from anon, authenticated;

-- Prevent rapid invite generation from being used to spam or accumulate
-- large numbers of valid join codes. Normal shops remain well below this.
create or replace function public.enforce_employee_invitation_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
  pending_count integer;
begin
  if not public.is_shop_owner(new.shop_id) then
    raise exception using errcode = '42501', message = 'Only the Shop Owner can create invitations.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.shop_id::text, 17));

  select count(*) into recent_count
  from public.employee_invitations
  where shop_id = new.shop_id
    and created_at >= now() - interval '1 hour';

  select count(*) into pending_count
  from public.employee_invitations
  where shop_id = new.shop_id
    and status = 'pending'
    and expires_at > now();

  if recent_count >= 10 then
    raise exception using errcode = '42901', message = 'Too many invitations were created recently. Try again later.';
  end if;
  if pending_count >= 5 then
    raise exception using errcode = '42901', message = 'Revoke an unused invitation before creating another.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_employee_invitation_rate_limit() from public, anon, authenticated;

drop trigger if exists employee_invitations_rate_limit on public.employee_invitations;
create trigger employee_invitations_rate_limit
before insert on public.employee_invitations
for each row execute function public.enforce_employee_invitation_rate_limit();

-- Record successful security-sensitive state changes without exposing a
-- client-writable logging endpoint.
create or replace function public.write_security_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  effective_shop_id uuid;
  effective_event_type text;
  effective_metadata jsonb := '{}'::jsonb;
begin
  effective_shop_id := case
    when tg_table_name = 'account_deletion_requests' then new.shop_id
    when tg_table_name = 'employee_invitations' then new.shop_id
    when tg_table_name = 'subscription_payments' then new.shop_id
    else null
  end;

  effective_event_type := case
    when tg_table_name = 'account_deletion_requests' and tg_op = 'INSERT' then 'account_deletion_requested'
    when tg_table_name = 'account_deletion_requests' and tg_op = 'UPDATE' then 'account_deletion_status_changed'
    when tg_table_name = 'employee_invitations' and tg_op = 'INSERT' then 'employee_invitation_created'
    when tg_table_name = 'employee_invitations' and tg_op = 'UPDATE' then 'employee_invitation_status_changed'
    when tg_table_name = 'subscription_payments' then 'subscription_payment_recorded'
    else 'security_state_changed'
  end;

  if tg_table_name = 'account_deletion_requests' then
    effective_metadata := jsonb_build_object('status', new.status, 'request_id', new.id);
  elsif tg_table_name = 'employee_invitations' then
    effective_metadata := jsonb_build_object('status', new.status, 'invitation_id', new.id);
  elsif tg_table_name = 'subscription_payments' then
    effective_metadata := jsonb_build_object('payment_id', new.id, 'amount_kes', new.amount_kes);
  end if;

  insert into public.security_events (
    event_type, severity, actor_id, shop_id, metadata
  ) values (
    effective_event_type, 'info', auth.uid(), effective_shop_id, effective_metadata
  );

  return new;
end;
$$;

revoke all on function public.write_security_event() from public, anon, authenticated;

drop trigger if exists account_deletion_security_event on public.account_deletion_requests;
create trigger account_deletion_security_event
after insert or update on public.account_deletion_requests
for each row execute function public.write_security_event();

drop trigger if exists employee_invitation_security_event on public.employee_invitations;
create trigger employee_invitation_security_event
after insert or update on public.employee_invitations
for each row execute function public.write_security_event();

drop trigger if exists subscription_payment_security_event on public.subscription_payments;
create trigger subscription_payment_security_event
after insert on public.subscription_payments
for each row execute function public.write_security_event();

comment on table public.security_events is
  'Owner-readable, server-written record of security-sensitive account, invitation and subscription events.';
