-- Secure employee invitation lifecycle for Duka.
-- Owners create and revoke invitations; authenticated employees accept them.

-- Phase 1 supports one active shop membership per user, regardless of role.
create unique index if not exists shop_members_one_active_shop_per_user_idx
  on public.shop_members (user_id)
  where status = 'active';

-- Owners may inspect invitations belonging to their own active shop. All
-- writes remain restricted to the security-definer RPCs below.
drop policy if exists "employee_invitations_select_shop_owners" on public.employee_invitations;
create policy "employee_invitations_select_shop_owners"
on public.employee_invitations
for select
to authenticated
using (public.is_shop_owner(shop_id));

-- Generate the existing DUKA-XXXXXX format using an alphabet that avoids
-- easily confused characters (0, 1, I and O).
create or replace function public.generate_employee_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  random_bytes bytea := gen_random_bytes(6);
  suffix text := '';
  position integer;
begin
  for position in 0..5 loop
    suffix := suffix || substr(
      alphabet,
      (get_byte(random_bytes, position) % char_length(alphabet)) + 1,
      1
    );
  end loop;

  return 'DUKA-' || suffix;
end;
$$;

revoke all on function public.generate_employee_invite_code() from public;

create or replace function public.create_employee_invitation(
  target_shop_id uuid,
  employee_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_phone text := nullif(regexp_replace(trim(coalesce(employee_phone, '')), '[^0-9+]', '', 'g'), '');
  generated_code text;
  new_invitation public.employee_invitations%rowtype;
  attempt integer := 0;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to create an invitation.';
  end if;

  if not public.is_shop_owner(target_shop_id) then
    raise exception using
      errcode = '42501',
      message = 'Only an active Shop Owner can invite employees.';
  end if;

  if normalized_phone is not null
    and char_length(normalized_phone) not between 7 and 32 then
    raise exception using
      errcode = '22023',
      message = 'Employee phone number is invalid.';
  end if;

  -- Extremely unlikely collisions are retried without exposing an error to
  -- the Owner. Each code is valid for seven days.
  loop
    attempt := attempt + 1;
    generated_code := public.generate_employee_invite_code();

    begin
      insert into public.employee_invitations (
        shop_id,
        code,
        phone,
        role,
        status,
        invited_by,
        expires_at
      )
      values (
        target_shop_id,
        generated_code,
        normalized_phone,
        'employee',
        'pending',
        current_user_id,
        now() + interval '7 days'
      )
      returning * into new_invitation;

      exit;
    exception
      when unique_violation then
        if attempt >= 5 then
          raise exception using
            errcode = '55000',
            message = 'Unable to generate a unique invitation code.';
        end if;
    end;
  end loop;

  return jsonb_build_object(
    'id', new_invitation.id,
    'shop_id', new_invitation.shop_id,
    'code', new_invitation.code,
    'phone', new_invitation.phone,
    'role', new_invitation.role,
    'status', new_invitation.status,
    'expires_at', new_invitation.expires_at,
    'created_at', new_invitation.created_at
  );
end;
$$;

revoke all on function public.create_employee_invitation(uuid, text) from public;
grant execute on function public.create_employee_invitation(uuid, text) to authenticated;

-- This preview is deliberately callable before sign-up so an invited person
-- can verify the code first. It reveals no Owner, employee, phone or member
-- data and returns the same generic error for every invalid state.
create or replace function public.get_employee_invitation_preview(
  invitation_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(regexp_replace(trim(coalesce(invitation_code, '')), '\s+', '', 'g'));
  invitation_record public.employee_invitations%rowtype;
  shop_record public.shops%rowtype;
begin
  select *
  into invitation_record
  from public.employee_invitations
  where code = normalized_code
    and status = 'pending'
    and expires_at > now();

  if not found then
    raise exception using
      errcode = '22023',
      message = 'This invitation is invalid or no longer available.';
  end if;

  select *
  into shop_record
  from public.shops
  where id = invitation_record.shop_id
    and deleted_at is null;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'This invitation is invalid or no longer available.';
  end if;

  return jsonb_build_object(
    'code', invitation_record.code,
    'shop_id', shop_record.id,
    'shop_name', shop_record.name,
    'shop_type', shop_record.shop_type,
    'role', invitation_record.role,
    'expires_at', invitation_record.expires_at
  );
end;
$$;

revoke all on function public.get_employee_invitation_preview(text) from public;
grant execute on function public.get_employee_invitation_preview(text) to anon, authenticated;

create or replace function public.accept_employee_invitation(
  invitation_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_code text := upper(regexp_replace(trim(coalesce(invitation_code, '')), '\s+', '', 'g'));
  invitation_record public.employee_invitations%rowtype;
  shop_record public.shops%rowtype;
  profile_phone text;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to accept an invitation.';
  end if;

  -- Serialize attempts against the same code so it can be consumed once.
  perform pg_advisory_xact_lock(hashtextextended(normalized_code, 0));

  select *
  into invitation_record
  from public.employee_invitations
  where code = normalized_code
  for update;

  if not found
    or invitation_record.status <> 'pending'
    or invitation_record.expires_at <= now() then
    raise exception using
      errcode = '22023',
      message = 'This invitation is invalid or no longer available.';
  end if;

  if exists (
    select 1
    from public.shop_members
    where user_id = current_user_id
      and status = 'active'
  ) then
    raise exception using
      errcode = '23505',
      message = 'This account already belongs to an active shop.';
  end if;

  if invitation_record.phone is not null then
    select nullif(regexp_replace(trim(coalesce(phone, '')), '[^0-9+]', '', 'g'), '')
    into profile_phone
    from public.profiles
    where id = current_user_id;

    if profile_phone is distinct from invitation_record.phone then
      raise exception using
        errcode = '42501',
        message = 'This invitation was issued for a different phone number.';
    end if;
  end if;

  insert into public.shop_members (shop_id, user_id, role, status)
  values (invitation_record.shop_id, current_user_id, 'employee', 'active');

  update public.employee_invitations
  set
    status = 'accepted',
    accepted_by = current_user_id,
    accepted_at = now(),
    updated_at = now()
  where id = invitation_record.id;

  select *
  into shop_record
  from public.shops
  where id = invitation_record.shop_id;

  return jsonb_build_object(
    'shop', to_jsonb(shop_record),
    'membership', jsonb_build_object(
      'shop_id', invitation_record.shop_id,
      'user_id', current_user_id,
      'role', 'employee',
      'status', 'active'
    )
  );
end;
$$;

revoke all on function public.accept_employee_invitation(text) from public;
grant execute on function public.accept_employee_invitation(text) to authenticated;

create or replace function public.revoke_employee_invitation(
  invitation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_record public.employee_invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to revoke an invitation.';
  end if;

  select *
  into invitation_record
  from public.employee_invitations
  where id = invitation_id
  for update;

  if not found or not public.is_shop_owner(invitation_record.shop_id) then
    raise exception using
      errcode = '42501',
      message = 'Invitation not found or access denied.';
  end if;

  if invitation_record.status <> 'pending' then
    raise exception using
      errcode = '22023',
      message = 'Only a pending invitation can be revoked.';
  end if;

  update public.employee_invitations
  set status = 'revoked', updated_at = now()
  where id = invitation_record.id
  returning * into invitation_record;

  return jsonb_build_object(
    'id', invitation_record.id,
    'status', invitation_record.status,
    'updated_at', invitation_record.updated_at
  );
end;
$$;

revoke all on function public.revoke_employee_invitation(uuid) from public;
grant execute on function public.revoke_employee_invitation(uuid) to authenticated;

comment on function public.create_employee_invitation(uuid, text)
is 'Creates a seven-day employee invitation for a shop owned by the authenticated user.';
comment on function public.get_employee_invitation_preview(text)
is 'Returns a minimal public preview for a valid, pending employee invitation code.';
comment on function public.accept_employee_invitation(text)
is 'Atomically consumes an invitation and creates one active employee membership.';
comment on function public.revoke_employee_invitation(uuid)
is 'Allows an active Shop Owner to revoke a pending invitation.';
