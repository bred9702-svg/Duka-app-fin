-- Least-privilege read models for Owner team management and authenticated
-- session restoration. These functions expose only explicitly selected data.

create or replace function public.get_shop_team(
  target_shop_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  team jsonb;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to view a shop team.';
  end if;

  if not public.is_shop_owner(target_shop_id) then
    raise exception using
      errcode = '42501',
      message = 'Only an active Shop Owner can view this team.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id', member.user_id,
        'full_name', profile.full_name,
        'phone', profile.phone,
        'avatar_url', profile.avatar_url,
        'role', member.role,
        'status', member.status,
        'joined_at', member.joined_at,
        'removed_at', member.removed_at
      )
      order by member.joined_at asc
    ),
    '[]'::jsonb
  )
  into team
  from public.shop_members as member
  join public.profiles as profile on profile.id = member.user_id
  where member.shop_id = target_shop_id
    and member.role = 'employee'
    and member.status in ('active', 'suspended');

  return team;
end;
$$;

revoke all on function public.get_shop_team(uuid) from public;
grant execute on function public.get_shop_team(uuid) to authenticated;

create or replace function public.get_current_shop_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_record public.profiles%rowtype;
  membership_record public.shop_members%rowtype;
  shop_record public.shops%rowtype;
  subscription_record public.subscriptions%rowtype;
  subscription_payload jsonb := null;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to load a shop session.';
  end if;

  select *
  into profile_record
  from public.profiles
  where id = current_user_id
    and deleted_at is null;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'No active Duka profile was found for this account.';
  end if;

  select *
  into membership_record
  from public.shop_members
  where user_id = current_user_id
    and status = 'active'
  order by joined_at asc
  limit 1;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'No active shop membership was found for this account.';
  end if;

  select *
  into shop_record
  from public.shops
  where id = membership_record.shop_id
    and deleted_at is null;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The linked shop is no longer available.';
  end if;

  select *
  into subscription_record
  from public.subscriptions
  where shop_id = shop_record.id
  order by created_at desc
  limit 1;

  if found then
    subscription_payload := jsonb_build_object(
      'plan', subscription_record.plan,
      'status', subscription_record.status,
      'trial_started_at', subscription_record.trial_started_at,
      'trial_ends_at', subscription_record.trial_ends_at,
      'current_period_started_at', subscription_record.current_period_started_at,
      'current_period_ends_at', subscription_record.current_period_ends_at
    );
  end if;

  return jsonb_build_object(
    'profile', jsonb_build_object(
      'id', profile_record.id,
      'full_name', profile_record.full_name,
      'phone', profile_record.phone,
      'avatar_url', profile_record.avatar_url
    ),
    'membership', jsonb_build_object(
      'shop_id', membership_record.shop_id,
      'user_id', membership_record.user_id,
      'role', membership_record.role,
      'status', membership_record.status,
      'joined_at', membership_record.joined_at
    ),
    'shop', jsonb_build_object(
      'id', shop_record.id,
      'name', shop_record.name,
      'shop_type', shop_record.shop_type,
      'phone', shop_record.phone,
      'address', shop_record.address,
      'city', shop_record.city,
      'timezone', shop_record.timezone,
      'currency', shop_record.currency,
      'logo_url', shop_record.logo_url
    ),
    'subscription', subscription_payload
  );
end;
$$;

revoke all on function public.get_current_shop_context() from public;
grant execute on function public.get_current_shop_context() to authenticated;

comment on function public.get_shop_team(uuid)
is 'Returns the minimum employee profile and membership fields required by an active Shop Owner.';
comment on function public.get_current_shop_context()
is 'Returns only the authenticated user profile, active membership, shop and limited subscription context.';
