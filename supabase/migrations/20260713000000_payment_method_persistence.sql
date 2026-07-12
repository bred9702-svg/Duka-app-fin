-- Persistent, Owner-controlled checkout payment preferences per shop.

create table if not exists public.shop_payment_settings (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  cash_enabled boolean not null default true,
  mpesa_enabled boolean not null default true,
  card_enabled boolean not null default true,
  bank_enabled boolean not null default false,
  credit_enabled boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_payment_settings_one_method check (
    cash_enabled or mpesa_enabled or card_enabled or bank_enabled or credit_enabled
  )
);

drop trigger if exists shop_payment_settings_set_updated_at on public.shop_payment_settings;
create trigger shop_payment_settings_set_updated_at
before update on public.shop_payment_settings
for each row execute function public.set_updated_at();

alter table public.shop_payment_settings enable row level security;

drop policy if exists "shop_payment_settings_select_owner" on public.shop_payment_settings;
create policy "shop_payment_settings_select_owner"
on public.shop_payment_settings for select to authenticated
using (public.is_shop_owner(shop_id));

create or replace function public.get_owned_shop_payment_settings(target_shop_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  settings public.shop_payment_settings%rowtype;
begin
  if auth.uid() is null or not public.is_shop_owner(target_shop_id) then
    raise exception using errcode = '42501', message = 'Only the Shop Owner can view payment settings.';
  end if;

  select * into settings
  from public.shop_payment_settings
  where shop_id = target_shop_id;

  return jsonb_build_object(
    'cash', coalesce(settings.cash_enabled, true),
    'mpesa', coalesce(settings.mpesa_enabled, true),
    'card', coalesce(settings.card_enabled, true),
    'bank', coalesce(settings.bank_enabled, false),
    'credit', coalesce(settings.credit_enabled, false)
  );
end;
$$;

create or replace function public.update_owned_shop_payment_settings(
  target_shop_id uuid,
  cash_value boolean,
  mpesa_value boolean,
  card_value boolean,
  bank_value boolean,
  credit_value boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.shop_payment_settings%rowtype;
begin
  if auth.uid() is null or not public.is_shop_owner(target_shop_id) then
    raise exception using errcode = '42501', message = 'Only the Shop Owner can update payment settings.';
  end if;
  if not (
    coalesce(cash_value, false)
    or coalesce(mpesa_value, false)
    or coalesce(card_value, false)
    or coalesce(bank_value, false)
    or coalesce(credit_value, false)
  ) then
    raise exception using errcode = '22023', message = 'At least one payment method must remain enabled.';
  end if;

  insert into public.shop_payment_settings (
    shop_id, cash_enabled, mpesa_enabled, card_enabled, bank_enabled,
    credit_enabled, updated_by
  ) values (
    target_shop_id, cash_value, mpesa_value, card_value, bank_value,
    credit_value, auth.uid()
  )
  on conflict (shop_id) do update
  set cash_enabled = excluded.cash_enabled,
      mpesa_enabled = excluded.mpesa_enabled,
      card_enabled = excluded.card_enabled,
      bank_enabled = excluded.bank_enabled,
      credit_enabled = excluded.credit_enabled,
      updated_by = excluded.updated_by
  returning * into settings;

  return jsonb_build_object(
    'cash', settings.cash_enabled,
    'mpesa', settings.mpesa_enabled,
    'card', settings.card_enabled,
    'bank', settings.bank_enabled,
    'credit', settings.credit_enabled
  );
end;
$$;

revoke all on function public.get_owned_shop_payment_settings(uuid) from public;
revoke all on function public.update_owned_shop_payment_settings(uuid, boolean, boolean, boolean, boolean, boolean) from public;
grant execute on function public.get_owned_shop_payment_settings(uuid) to authenticated;
grant execute on function public.update_owned_shop_payment_settings(uuid, boolean, boolean, boolean, boolean, boolean) to authenticated;

drop trigger if exists shop_payment_settings_write_audit_log on public.shop_payment_settings;
create trigger shop_payment_settings_write_audit_log
after insert or update or delete on public.shop_payment_settings
for each row execute function public.write_business_audit_log();

comment on table public.shop_payment_settings is
  'Persistent checkout payment methods selected by the Shop Owner.';
