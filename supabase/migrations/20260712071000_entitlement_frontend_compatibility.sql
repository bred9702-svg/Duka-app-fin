-- Compatibility read model between the server entitlement foundation and the
-- feature names consumed by the currently deployed React application.

create or replace function public.get_shop_entitlements(target_shop_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  membership_role text;
  subscription_record public.subscriptions%rowtype;
  effective_plan text := 'free';
  effective_status text := 'free';
  pro_access boolean := false;
  access_ends_at timestamptz := null;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select sm.role
  into membership_role
  from public.shop_members sm
  where sm.shop_id = target_shop_id
    and sm.user_id = auth.uid()
    and sm.status = 'active'
  limit 1;

  if membership_role is null then
    raise exception using
      errcode = '42501',
      message = 'An active shop membership is required to view entitlements.';
  end if;

  select *
  into subscription_record
  from public.subscriptions
  where shop_id = target_shop_id
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

  if membership_role = 'employee' and not pro_access then
    raise exception using
      errcode = '42501',
      message = 'Employee access requires an active Duka Pro trial or subscription.';
  end if;

  return jsonb_build_object(
    'shop_id', target_shop_id,
    'role', membership_role,
    'plan', effective_plan,
    'status', effective_status,
    'is_pro', pro_access,
    'pro_access', pro_access,
    'trial_ends_at', case when effective_status = 'trial' then access_ends_at else null end,
    'current_period_ends_at', case when effective_status = 'active' then access_ends_at else null end,
    'access_ends_at', access_ends_at,
    'amount_kes', 2999,
    'history_days', case when pro_access then null else 30 end,
    'features', jsonb_build_object(
      -- Names used by the deployed frontend.
      'core_operations', true,
      'basic_analytics', true,
      'employees', pro_access and membership_role = 'owner',
      'advanced_analytics', pro_access,
      'smart_insights', pro_access,
      'advanced_reports', pro_access,
      'duka_intelligence', false,
      -- Canonical server names retained for future screens and APIs.
      'core_transactions', true,
      'products_and_stock', true,
      'customers_and_debts', true,
      'full_history', pro_access,
      'inventory_insights', pro_access,
      'employee_management', pro_access and membership_role = 'owner',
      'employee_performance', pro_access,
      'smart_alerts', pro_access,
      'reports_and_exports', pro_access,
      'duka_ai', pro_access
    )
  );
end;
$$;

revoke all on function public.get_shop_entitlements(uuid) from public;
grant execute on function public.get_shop_entitlements(uuid) to authenticated;

comment on function public.get_shop_entitlements(uuid) is
  'Frontend-compatible Free/Pro entitlement response backed by server-time subscription validation.';
