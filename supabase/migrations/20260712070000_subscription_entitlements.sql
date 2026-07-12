-- Central server-side entitlement model for Duka Free and Duka Pro.
-- Expiry is evaluated from database time, never from frontend state.

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
      and (
        (
          s.plan = 'pro'
          and s.status = 'trial'
          and s.trial_started_at <= now()
          and s.trial_ends_at > now()
        )
        or
        (
          s.plan = 'pro'
          and s.status = 'active'
          and s.current_period_started_at <= now()
          and s.current_period_ends_at > now()
        )
      )
  );
$$;

revoke all on function public.shop_has_pro_access(uuid) from public;
grant execute on function public.shop_has_pro_access(uuid) to authenticated;

-- Owners always remain active members of their shop so Free can keep its
-- essential operations. Employees require a valid Pro entitlement.
create or replace function public.is_shop_member(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_members sm
    where sm.shop_id = target_shop_id
      and sm.user_id = auth.uid()
      and sm.status = 'active'
      and (
        sm.role = 'owner'
        or (sm.role = 'employee' and public.shop_has_pro_access(target_shop_id))
      )
  );
$$;

revoke all on function public.is_shop_member(uuid) from public;
grant execute on function public.is_shop_member(uuid) to authenticated;

create or replace function public.get_current_shop_entitlements()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  membership_record public.shop_members%rowtype;
  subscription_record public.subscriptions%rowtype;
  effective_plan text := 'free';
  effective_status text := 'free';
  pro_access boolean := false;
  access_ends_at timestamptz := null;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select *
  into membership_record
  from public.shop_members
  where user_id = current_user_id
    and status = 'active'
  order by joined_at asc
  limit 1;

  if membership_record.user_id is null then
    return jsonb_build_object(
      'plan', 'free',
      'status', 'no_shop',
      'role', null,
      'shop_id', null,
      'pro_access', false,
      'access_ends_at', null,
      'history_days', 0,
      'features', '{}'::jsonb
    );
  end if;

  select *
  into subscription_record
  from public.subscriptions
  where shop_id = membership_record.shop_id
  order by
    case when status in ('trial', 'active') then 0 else 1 end,
    created_at desc
  limit 1;

  if subscription_record.id is not null then
    if subscription_record.plan = 'pro'
      and subscription_record.status = 'trial'
      and subscription_record.trial_started_at <= now()
      and subscription_record.trial_ends_at > now() then
      effective_plan := 'pro';
      effective_status := 'trial';
      pro_access := true;
      access_ends_at := subscription_record.trial_ends_at;
    elsif subscription_record.plan = 'pro'
      and subscription_record.status = 'active'
      and subscription_record.current_period_started_at <= now()
      and subscription_record.current_period_ends_at > now() then
      effective_plan := 'pro';
      effective_status := 'active';
      pro_access := true;
      access_ends_at := subscription_record.current_period_ends_at;
    elsif subscription_record.status = 'cancelled' then
      effective_status := 'cancelled';
    else
      effective_status := 'expired';
    end if;
  end if;

  -- An employee membership remains stored for future Pro reactivation, but
  -- it grants no application access while the shop is on Free.
  if membership_record.role = 'employee' and not pro_access then
    effective_status := 'employee_blocked';
  end if;

  return jsonb_build_object(
    'plan', effective_plan,
    'status', effective_status,
    'role', membership_record.role,
    'shop_id', membership_record.shop_id,
    'pro_access', pro_access,
    'access_ends_at', access_ends_at,
    'history_days', case when pro_access then null else 30 end,
    'features', jsonb_build_object(
      'core_transactions', membership_record.role = 'owner' or pro_access,
      'products_and_stock', membership_record.role = 'owner' or pro_access,
      'customers_and_debts', membership_record.role = 'owner' or pro_access,
      'full_history', pro_access,
      'advanced_analytics', pro_access,
      'inventory_insights', pro_access,
      'employee_management', pro_access and membership_record.role = 'owner',
      'employee_performance', pro_access,
      'smart_alerts', pro_access,
      'reports_and_exports', pro_access,
      'duka_ai', pro_access
    )
  );
end;
$$;

revoke all on function public.get_current_shop_entitlements() from public;
grant execute on function public.get_current_shop_entitlements() to authenticated;

-- Free Owners can read only the most recent 30 days of transactions. The
-- older records remain stored and become visible again when Pro is active.
drop policy if exists "transactions_select_shop_members" on public.transactions;
create policy "transactions_select_by_entitlement"
on public.transactions
for select
to authenticated
using (
  public.is_shop_member(shop_id)
  and (
    public.shop_has_pro_access(shop_id)
    or (
      public.is_shop_owner(shop_id)
      and created_at >= now() - interval '30 days'
    )
  )
);

-- Employee invitations and employee membership activation are Pro-only at
-- the database boundary, including calls made through security-definer RPCs.
create or replace function public.enforce_pro_employee_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  effective_shop_id uuid;
  effective_role text;
  effective_status text;
begin
  if tg_op = 'INSERT' then
    effective_shop_id := new.shop_id;
    effective_role := new.role;
    effective_status := new.status;
  else
    effective_shop_id := coalesce(new.shop_id, old.shop_id);
    effective_role := coalesce(new.role, old.role);
    effective_status := coalesce(new.status, old.status);
  end if;

  if tg_table_name = 'employee_invitations' then
    if effective_status in ('pending', 'accepted')
      and not public.shop_has_pro_access(effective_shop_id) then
      raise exception using
        errcode = '42501',
        message = 'Duka Pro is required to invite or activate employees.';
    end if;
  elsif effective_role = 'employee'
    and effective_status = 'active'
    and not public.shop_has_pro_access(effective_shop_id) then
    raise exception using
      errcode = '42501',
      message = 'Duka Pro is required to activate an employee membership.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_pro_employee_access() from public;

drop trigger if exists employee_invitations_require_pro on public.employee_invitations;
create trigger employee_invitations_require_pro
before insert or update on public.employee_invitations
for each row execute function public.enforce_pro_employee_access();

drop trigger if exists employee_memberships_require_pro on public.shop_members;
create trigger employee_memberships_require_pro
before insert or update on public.shop_members
for each row execute function public.enforce_pro_employee_access();

comment on function public.shop_has_pro_access(uuid) is
  'Server-time entitlement check for an active Duka Pro trial or paid monthly period.';

comment on function public.get_current_shop_entitlements() is
  'Returns the authenticated user effective plan, access state and server-controlled feature entitlements.';
