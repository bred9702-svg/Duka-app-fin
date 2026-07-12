-- Close direct browser writes for critical business tables. Authenticated
-- users write through validated, tenant-scoped server functions instead.

create or replace function public.record_cash_transaction(
  transaction_amount integer,
  transaction_source text,
  transaction_direction text,
  sender_name text default null,
  sender_phone text default null,
  external_reference text default null
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_shop_id uuid;
  actor_role text;
  normalized_source text := lower(trim(transaction_source));
  normalized_direction text := lower(trim(transaction_direction));
  normalized_reference text := upper(nullif(trim(external_reference), ''));
  created_transaction public.transactions%rowtype;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select sm.shop_id, sm.role
  into target_shop_id, actor_role
  from public.shop_members sm
  where sm.user_id = actor_id
    and sm.status = 'active'
    and public.is_shop_member(sm.shop_id)
  order by sm.joined_at asc
  limit 1;

  if target_shop_id is null then
    raise exception using errcode = '42501', message = 'An active shop membership is required.';
  end if;
  if transaction_amount is null or transaction_amount <= 0 or transaction_amount > 1000000000 then
    raise exception using errcode = '22023', message = 'Transaction amount is invalid.';
  end if;
  if normalized_source is null or normalized_source not in ('cash', 'mpesa') then
    raise exception using errcode = '22023', message = 'Transaction source must be cash or M-Pesa.';
  end if;
  if normalized_direction is null or normalized_direction not in ('in', 'out') then
    raise exception using errcode = '22023', message = 'Transaction direction must be in or out.';
  end if;
  if char_length(coalesce(sender_name, '')) > 120
    or char_length(coalesce(sender_phone, '')) > 32
    or char_length(coalesce(normalized_reference, '')) > 80 then
    raise exception using errcode = '22023', message = 'Transaction metadata is too long.';
  end if;
  if normalized_source = 'mpesa' and normalized_reference is null then
    raise exception using errcode = '22023', message = 'An M-Pesa reference is required.';
  end if;
  if normalized_source = 'mpesa' and char_length(normalized_reference) < 6 then
    raise exception using errcode = '22023', message = 'M-Pesa reference is too short.';
  end if;
  if normalized_reference is not null and exists (
    select 1 from public.transactions
    where shop_id = target_shop_id and upper(mpesa_reference) = normalized_reference
  ) then
    raise exception using errcode = '23505', message = 'This transaction reference already exists.';
  end if;

  insert into public.transactions (
    shop_id, amount, source, direction, classified,
    mpesa_sender_name, mpesa_sender_phone, mpesa_reference,
    performed_by_user_id, employee_id, day_of_week, hour_of_day
  ) values (
    target_shop_id, transaction_amount, normalized_source, normalized_direction, false,
    case when normalized_source = 'mpesa' then nullif(trim(sender_name), '') else null end,
    case when normalized_source = 'mpesa' then nullif(trim(sender_phone), '') else null end,
    case when normalized_source = 'mpesa' then normalized_reference else null end,
    actor_id, case when actor_role = 'employee' then actor_id else null end,
    extract(dow from now())::integer, extract(hour from now())::integer
  ) returning * into created_transaction;

  return created_transaction;
end;
$$;

create or replace function public.create_shop_product(
  product_name text,
  product_category text,
  product_cost_price integer,
  product_unit_price integer,
  opening_stock integer default 0,
  low_stock_alert integer default 5
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  target_shop_id uuid;
  created_product public.products%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  select sm.shop_id into target_shop_id
  from public.shop_members sm
  where sm.user_id = auth.uid() and sm.status = 'active'
    and public.is_shop_member(sm.shop_id)
  order by sm.joined_at asc limit 1;
  if target_shop_id is null then
    raise exception using errcode = '42501', message = 'An active shop membership is required.';
  end if;
  if nullif(trim(product_name), '') is null or char_length(trim(product_name)) > 160 then
    raise exception using errcode = '22023', message = 'Product name is required and must not exceed 160 characters.';
  end if;
  if nullif(trim(product_category), '') is null or char_length(trim(product_category)) > 80 then
    raise exception using errcode = '22023', message = 'Product category is required and must not exceed 80 characters.';
  end if;
  if product_cost_price is null or product_cost_price < 0
    or product_unit_price is null or product_unit_price <= 0
    or opening_stock is null or opening_stock < 0
    or low_stock_alert is null or low_stock_alert < 0 then
    raise exception using errcode = '22023', message = 'Product prices and stock values are invalid.';
  end if;

  insert into public.products (
    shop_id, name, category, cost_price, unit_price, stock_current, stock_alert, active
  ) values (
    target_shop_id, trim(product_name), trim(product_category), product_cost_price,
    product_unit_price, opening_stock, low_stock_alert, true
  ) returning * into created_product;
  return created_product;
end;
$$;

create or replace function public.create_shop_customer(
  customer_name text,
  customer_phone text default null,
  customer_mpesa_name text default null
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  target_shop_id uuid;
  normalized_phone text := nullif(trim(customer_phone), '');
  created_customer public.customers%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  select sm.shop_id into target_shop_id
  from public.shop_members sm
  where sm.user_id = auth.uid() and sm.status = 'active'
    and public.is_shop_member(sm.shop_id)
  order by sm.joined_at asc limit 1;
  if target_shop_id is null then
    raise exception using errcode = '42501', message = 'An active shop membership is required.';
  end if;
  if nullif(trim(customer_name), '') is null or char_length(trim(customer_name)) > 120 then
    raise exception using errcode = '22023', message = 'Customer name is required and must not exceed 120 characters.';
  end if;
  if normalized_phone is not null and char_length(normalized_phone) not between 7 and 32 then
    raise exception using errcode = '22023', message = 'Customer phone number is invalid.';
  end if;
  if char_length(coalesce(customer_mpesa_name, '')) > 120 then
    raise exception using errcode = '22023', message = 'M-Pesa name is too long.';
  end if;

  insert into public.customers (
    shop_id, name, phone, mpesa_name, total_owed, total_spent, visit_count
  ) values (
    target_shop_id, trim(customer_name), normalized_phone,
    nullif(trim(customer_mpesa_name), ''), 0, 0, 0
  ) returning * into created_customer;
  return created_customer;
end;
$$;

revoke all on function public.record_cash_transaction(integer, text, text, text, text, text) from public;
revoke all on function public.create_shop_product(text, text, integer, integer, integer, integer) from public;
revoke all on function public.create_shop_customer(text, text, text) from public;
grant execute on function public.record_cash_transaction(integer, text, text, text, text, text) to authenticated;
grant execute on function public.create_shop_product(text, text, integer, integer, integer, integer) to authenticated;
grant execute on function public.create_shop_customer(text, text, text) to authenticated;

-- Critical writes now go through validated security-definer functions.
drop policy if exists "products_insert_shop_members" on public.products;
drop policy if exists "products_update_shop_members" on public.products;
drop policy if exists "customers_insert_shop_members" on public.customers;
drop policy if exists "customers_update_shop_members" on public.customers;
drop policy if exists "transactions_insert_shop_members" on public.transactions;
drop policy if exists "transactions_update_shop_members" on public.transactions;

comment on function public.record_cash_transaction(integer, text, text, text, text, text) is
  'Validated server entry point for raw Cash In, Cash Out and M-Pesa inbox transactions.';
comment on function public.create_shop_product(text, text, integer, integer, integer, integer) is
  'Validated tenant-scoped product creation entry point.';
comment on function public.create_shop_customer(text, text, text) is
  'Validated tenant-scoped customer creation entry point.';
