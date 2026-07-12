-- Persistent tenant-scoped Business Preferences for Duka.

create table if not exists public.shop_business_preferences (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  currency text not null default 'KES',
  tax_enabled boolean not null default false,
  tax_rate numeric(5,2) not null default 0,
  stock_alerts boolean not null default true,
  low_stock_threshold integer not null default 5,
  daily_ai_brief boolean not null default true,
  ai_recommendations boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_business_preferences_currency_valid check (currency ~ '^[A-Z]{3}$'),
  constraint shop_business_preferences_tax_rate_valid check (tax_rate between 0 and 100),
  constraint shop_business_preferences_stock_threshold_valid check (
    low_stock_threshold between 0 and 100000
  )
);

insert into public.shop_business_preferences (shop_id, currency)
select id, currency
from public.shops
where deleted_at is null
on conflict (shop_id) do nothing;

drop trigger if exists shop_business_preferences_set_updated_at
  on public.shop_business_preferences;
create trigger shop_business_preferences_set_updated_at
before update on public.shop_business_preferences
for each row execute function public.set_updated_at();

alter table public.shop_business_preferences enable row level security;

drop policy if exists "business_preferences_select_shop_members"
  on public.shop_business_preferences;
create policy "business_preferences_select_shop_members"
on public.shop_business_preferences
for select
to authenticated
using (public.is_shop_member(shop_id));

-- No direct INSERT, UPDATE or DELETE policy is provided. Owner writes pass
-- through the validated function below.

create or replace function public.get_shop_business_preferences(
  target_shop_id uuid
)
returns public.shop_business_preferences
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  preferences public.shop_business_preferences%rowtype;
begin
  if auth.uid() is null or not public.is_shop_member(target_shop_id) then
    raise exception using
      errcode = '42501',
      message = 'An active shop membership is required.';
  end if;

  select * into preferences
  from public.shop_business_preferences
  where shop_id = target_shop_id;

  if preferences.shop_id is null then
    raise exception using errcode = '22023', message = 'Business preferences were not found.';
  end if;
  return preferences;
end;
$$;

create or replace function public.update_shop_business_preferences(
  target_shop_id uuid,
  requested_currency text,
  requested_tax_enabled boolean,
  requested_tax_rate numeric,
  requested_stock_alerts boolean,
  requested_low_stock_threshold integer,
  requested_daily_ai_brief boolean,
  requested_ai_recommendations boolean
)
returns public.shop_business_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_currency text := upper(nullif(trim(requested_currency), ''));
  updated_preferences public.shop_business_preferences%rowtype;
begin
  if auth.uid() is null or not public.is_shop_owner(target_shop_id) then
    raise exception using
      errcode = '42501',
      message = 'Only the Shop Owner can update Business Preferences.';
  end if;
  if normalized_currency is null or normalized_currency !~ '^[A-Z]{3}$' then
    raise exception using errcode = '22023', message = 'Currency must use a three-letter ISO code.';
  end if;
  if requested_tax_rate is null or requested_tax_rate < 0 or requested_tax_rate > 100 then
    raise exception using errcode = '22023', message = 'Tax rate must be between 0 and 100.';
  end if;
  if requested_low_stock_threshold is null
    or requested_low_stock_threshold < 0
    or requested_low_stock_threshold > 100000 then
    raise exception using errcode = '22023', message = 'Low-stock threshold is invalid.';
  end if;

  insert into public.shop_business_preferences (
    shop_id,
    currency,
    tax_enabled,
    tax_rate,
    stock_alerts,
    low_stock_threshold,
    daily_ai_brief,
    ai_recommendations
  ) values (
    target_shop_id,
    normalized_currency,
    coalesce(requested_tax_enabled, false),
    case when coalesce(requested_tax_enabled, false) then requested_tax_rate else 0 end,
    coalesce(requested_stock_alerts, true),
    requested_low_stock_threshold,
    coalesce(requested_daily_ai_brief, true),
    coalesce(requested_ai_recommendations, true)
  )
  on conflict (shop_id) do update
  set currency = excluded.currency,
      tax_enabled = excluded.tax_enabled,
      tax_rate = excluded.tax_rate,
      stock_alerts = excluded.stock_alerts,
      low_stock_threshold = excluded.low_stock_threshold,
      daily_ai_brief = excluded.daily_ai_brief,
      ai_recommendations = excluded.ai_recommendations
  returning * into updated_preferences;

  -- Currency is shared with the shop profile so every formatter receives the
  -- same authoritative value after the next session refresh.
  update public.shops
  set currency = normalized_currency
  where id = target_shop_id and deleted_at is null;

  return updated_preferences;
end;
$$;

revoke all on function public.get_shop_business_preferences(uuid) from public;
revoke all on function public.update_shop_business_preferences(
  uuid, text, boolean, numeric, boolean, integer, boolean, boolean
) from public;
grant execute on function public.get_shop_business_preferences(uuid) to authenticated;
grant execute on function public.update_shop_business_preferences(
  uuid, text, boolean, numeric, boolean, integer, boolean, boolean
) to authenticated;

drop trigger if exists shop_business_preferences_write_audit_log
  on public.shop_business_preferences;
create trigger shop_business_preferences_write_audit_log
after insert or update or delete on public.shop_business_preferences
for each row execute function public.write_business_audit_log();

comment on table public.shop_business_preferences is
  'Persistent currency, tax, stock-alert and AI-display preferences for one Duka shop.';
