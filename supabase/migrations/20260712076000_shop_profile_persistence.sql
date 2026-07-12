-- Persistent Owner-controlled shop profile and isolated public shop logos.

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'shop-logos',
  'shop-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop_logos_insert_owner" on storage.objects;
create policy "shop_logos_insert_owner"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'shop-logos'
  and (storage.foldername(name))[1] = public.current_user_shop_id()::text
  and public.is_shop_owner(public.current_user_shop_id())
);

drop policy if exists "shop_logos_select_owner" on storage.objects;
create policy "shop_logos_select_owner"
on storage.objects for select to authenticated
using (
  bucket_id = 'shop-logos'
  and (storage.foldername(name))[1] = public.current_user_shop_id()::text
  and public.is_shop_owner(public.current_user_shop_id())
);

drop policy if exists "shop_logos_update_owner" on storage.objects;
create policy "shop_logos_update_owner"
on storage.objects for update to authenticated
using (
  bucket_id = 'shop-logos'
  and (storage.foldername(name))[1] = public.current_user_shop_id()::text
  and public.is_shop_owner(public.current_user_shop_id())
)
with check (
  bucket_id = 'shop-logos'
  and (storage.foldername(name))[1] = public.current_user_shop_id()::text
  and public.is_shop_owner(public.current_user_shop_id())
);

drop policy if exists "shop_logos_delete_owner" on storage.objects;
create policy "shop_logos_delete_owner"
on storage.objects for delete to authenticated
using (
  bucket_id = 'shop-logos'
  and (storage.foldername(name))[1] = public.current_user_shop_id()::text
  and public.is_shop_owner(public.current_user_shop_id())
);

create or replace function public.update_owned_shop_profile(
  target_shop_id uuid,
  updated_name text,
  updated_shop_type text,
  updated_phone text default null,
  updated_address text default null,
  updated_city text default null,
  updated_timezone text default 'Africa/Nairobi',
  updated_currency text default 'KES',
  updated_logo_url text default null
)
returns public.shops
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_name text := nullif(trim(updated_name), '');
  normalized_type text := nullif(trim(updated_shop_type), '');
  normalized_phone text := nullif(trim(updated_phone), '');
  normalized_timezone text := nullif(trim(updated_timezone), '');
  normalized_currency text := upper(nullif(trim(updated_currency), ''));
  normalized_logo_url text := nullif(trim(updated_logo_url), '');
  updated_shop public.shops%rowtype;
begin
  if auth.uid() is null or not public.is_shop_owner(target_shop_id) then
    raise exception using errcode = '42501', message = 'Only the Shop Owner can update this profile.';
  end if;
  if normalized_name is null or char_length(normalized_name) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'Shop name must contain between 2 and 120 characters.';
  end if;
  if normalized_type is null or char_length(normalized_type) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'Shop type must contain between 2 and 80 characters.';
  end if;
  if normalized_phone is not null and char_length(normalized_phone) not between 7 and 32 then
    raise exception using errcode = '22023', message = 'Shop phone number is invalid.';
  end if;
  if char_length(coalesce(updated_address, '')) > 240
    or char_length(coalesce(updated_city, '')) > 120 then
    raise exception using errcode = '22023', message = 'Address or city is too long.';
  end if;
  if normalized_timezone is null or char_length(normalized_timezone) > 80 then
    raise exception using errcode = '22023', message = 'Timezone is invalid.';
  end if;
  if normalized_currency is null or normalized_currency !~ '^[A-Z]{3}$' then
    raise exception using errcode = '22023', message = 'Currency must use a three-letter ISO code.';
  end if;
  if normalized_logo_url is not null and (
    char_length(normalized_logo_url) > 2048
    or normalized_logo_url !~ '^https://'
  ) then
    raise exception using errcode = '22023', message = 'Shop logo URL is invalid.';
  end if;

  update public.shops
  set name = normalized_name,
      shop_type = normalized_type,
      phone = normalized_phone,
      address = nullif(trim(updated_address), ''),
      city = nullif(trim(updated_city), ''),
      timezone = normalized_timezone,
      currency = normalized_currency,
      logo_url = normalized_logo_url
  where id = target_shop_id and deleted_at is null
  returning * into updated_shop;

  if updated_shop.id is null then
    raise exception using errcode = '22023', message = 'Active shop was not found.';
  end if;
  return updated_shop;
end;
$$;

revoke all on function public.update_owned_shop_profile(uuid, text, text, text, text, text, text, text, text)
  from public;
grant execute on function public.update_owned_shop_profile(uuid, text, text, text, text, text, text, text, text)
  to authenticated;

create or replace function public.write_shop_profile_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_before jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  row_after jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  effective_shop_id uuid := case when tg_op = 'DELETE' then old.id else new.id end;
  actor_id uuid := auth.uid();
begin
  if tg_op = 'UPDATE' and row_before = row_after then
    return new;
  end if;

  insert into public.audit_logs (
    shop_id, actor_user_id, actor_role, action, entity_type, entity_id,
    old_values, new_values
  ) values (
    effective_shop_id,
    actor_id,
    case when actor_id is null then 'system' else 'owner' end,
    lower(tg_op),
    'shops',
    effective_shop_id::text,
    row_before,
    row_after
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.write_shop_profile_audit_log() from public;

drop trigger if exists shops_write_audit_log on public.shops;
create trigger shops_write_audit_log
after insert or update or delete on public.shops
for each row execute function public.write_shop_profile_audit_log();

comment on function public.update_owned_shop_profile(uuid, text, text, text, text, text, text, text, text) is
  'Owner-only validated update of persistent Duka shop identity and location.';
