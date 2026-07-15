-- Owner-controlled employee suspension and reactivation. Membership rows and
-- historical transaction attribution are preserved at all times.

create or replace function public.set_employee_membership_status(
  target_shop_id uuid,
  target_user_id uuid,
  target_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  membership_record public.shop_members%rowtype;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to manage employees.';
  end if;

  if not public.is_shop_owner(target_shop_id) then
    raise exception using
      errcode = '42501',
      message = 'Only an active Shop Owner can manage employees.';
  end if;

  if target_status not in ('active', 'suspended') then
    raise exception using
      errcode = '22023',
      message = 'Employee status must be active or suspended.';
  end if;

  select *
  into membership_record
  from public.shop_members
  where shop_id = target_shop_id
    and user_id = target_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Employee membership was not found.';
  end if;

  if membership_record.role <> 'employee' then
    raise exception using
      errcode = '42501',
      message = 'Owner memberships cannot be changed from employee management.';
  end if;

  if membership_record.status = 'removed' then
    raise exception using
      errcode = '55000',
      message = 'A removed membership cannot be reactivated.';
  end if;

  update public.shop_members
  set status = target_status,
      removed_at = null,
      updated_at = now()
  where shop_id = target_shop_id
    and user_id = target_user_id;

  return jsonb_build_object(
    'shop_id', target_shop_id,
    'user_id', target_user_id,
    'role', membership_record.role,
    'status', target_status
  );
end;
$$;

revoke all on function public.set_employee_membership_status(uuid, uuid, text) from public, anon;
grant execute on function public.set_employee_membership_status(uuid, uuid, text) to authenticated;

comment on function public.set_employee_membership_status(uuid, uuid, text)
is 'Allows an active Shop Owner to suspend or reactivate an employee without deleting membership or history.';
