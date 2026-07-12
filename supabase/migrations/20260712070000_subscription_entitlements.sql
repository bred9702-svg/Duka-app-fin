-- Server-side subscription source of truth for Duka Free and Duka Pro.
-- Expired trials and paid periods resolve to Free immediately, even before a
-- background job updates the historical subscription status column.

create or replace function public.get_shop_entitlements(target_shop_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  subscription_record public.subscriptions%rowtype;
  effective_plan text := 'free';
  effective_status text := 'free';
  pro_access boolean := false;
begin
  if auth.uid() is null or not public.is_shop_member(target_shop_id) then
    raise exception using
      errcode = '42501',
      message = 'An active shop membership is required to view entitlements.';
  end if;

  select *
  into subscription_record
  from public.subscriptions
  where shop_id = target_shop_id
  order by created_at desc
  limit 1;

  if found then
    if subscription_record.status = 'trial'
      and subscription_record.trial_ends_at is not null
      and subscription_record.trial_ends_at > now() then
      effective_plan := 'pro';
      effective_status := 'trial';
      pro_access := true;
    elsif subscription_record.status = 'active'
      and subscription_record.current_period_ends_at is not null
      and subscription_record.current_period_ends_at > now() then
      effective_plan := 'pro';
      effective_status := 'active';
      pro_access := true;
    end if;
  end if;

  return jsonb_build_object(
    'shop_id', target_shop_id,
    'plan', effective_plan,
    'status', effective_status,
    'is_pro', pro_access,
    'trial_ends_at', case
      when effective_status = 'trial' then subscription_record.trial_ends_at
      else null
    end,
    'current_period_ends_at', case
      when effective_status = 'active' then subscription_record.current_period_ends_at
      else null
    end,
    'amount_kes', 2999,
    'features', jsonb_build_object(
      'core_operations', true,
      'basic_analytics', true,
      'employees', pro_access,
      'advanced_analytics', pro_access,
      'smart_insights', pro_access,
      'advanced_reports', pro_access,
      -- Reserved for the future server-connected Wine & Spirits advisor.
      'duka_intelligence', false
    )
  );
end;
$$;

revoke all on function public.get_shop_entitlements(uuid) from public;
grant execute on function public.get_shop_entitlements(uuid) to authenticated;

-- Internal check used by database guards. It deliberately has no EXECUTE
-- grant for application roles and therefore cannot be called directly by the
-- frontend to probe another shop.
create or replace function public.shop_has_current_pro_access(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where shop_id = target_shop_id
      and (
        (status = 'trial' and trial_ends_at is not null and trial_ends_at > now())
        or
        (status = 'active' and current_period_ends_at is not null and current_period_ends_at > now())
      )
  );
$$;

revoke all on function public.shop_has_current_pro_access(uuid) from public;

create or replace function public.enforce_pro_employee_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Owner memberships are created during onboarding and remain part of Free.
  -- Only employee invitations/memberships require a current Pro entitlement.
  if tg_table_name = 'shop_members' and new.role <> 'employee' then
    return new;
  end if;

  if not public.shop_has_current_pro_access(new.shop_id) then
    raise exception using
      errcode = '42501',
      message = 'Employee access requires an active Duka Pro trial or subscription.';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_pro_employee_entitlement() from public;

drop trigger if exists employee_invitations_require_pro on public.employee_invitations;
create trigger employee_invitations_require_pro
before insert on public.employee_invitations
for each row execute function public.enforce_pro_employee_entitlement();

drop trigger if exists employee_memberships_require_pro on public.shop_members;
create trigger employee_memberships_require_pro
before insert on public.shop_members
for each row
when (new.role = 'employee')
execute function public.enforce_pro_employee_entitlement();

comment on function public.get_shop_entitlements(uuid) is
  'Returns effective Free/Pro access and feature flags for an active member of the target shop.';

comment on function public.shop_has_current_pro_access(uuid) is
  'Internal subscription check used by server-side guards. Expired periods never grant Pro.';
