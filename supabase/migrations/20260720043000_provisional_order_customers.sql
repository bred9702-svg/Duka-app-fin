-- Give every unidentified order debt its own provisional customer. This keeps
-- balances isolated while allowing the shop to identify the customer later.

alter table public.customers
  add column if not exists is_provisional boolean not null default false;
alter table public.customers
  add column if not exists provisional_order_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'customers_provisional_order_id_fkey') then
    alter table public.customers
      add constraint customers_provisional_order_id_fkey
      foreign key (provisional_order_id) references public.pending_orders(id) on delete restrict;
  end if;
end;
$$;

create unique index if not exists customers_provisional_order_unique
  on public.customers(provisional_order_id)
  where provisional_order_id is not null;
create index if not exists customers_shop_provisional_idx
  on public.customers(shop_id, is_provisional, total_owed desc);

create or replace function public.convert_pending_order_to_provisional_debt_atomic(target_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  order_row public.pending_orders%rowtype;
  provisional_customer public.customers%rowtype;
  conversion_result jsonb;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select * into order_row
  from public.pending_orders
  where id = target_order_id
  for update;

  if not found or not public.is_shop_member(order_row.shop_id) then
    raise exception using errcode = '42501', message = 'Order is not available in your shop.';
  end if;
  if order_row.status not in ('awaiting_payment', 'partially_paid') then
    raise exception using errcode = '22023', message = 'This order cannot be converted to debt.';
  end if;
  if order_row.customer_id is not null then
    raise exception using errcode = '22023', message = 'This order already has an identified customer.';
  end if;

  insert into public.customers (
    shop_id, name, phone, mpesa_name, total_owed, total_spent, visit_count,
    is_provisional, provisional_order_id
  ) values (
    order_row.shop_id,
    concat('Unidentified customer · Order #', order_row.order_number),
    null, null, 0, 0, 0, true, order_row.id
  ) returning * into provisional_customer;

  conversion_result := public.convert_pending_order_to_debt_atomic(
    order_row.id, provisional_customer.id
  );

  return conversion_result || jsonb_build_object(
    'customer', to_jsonb(provisional_customer),
    'provisional', true
  );
end;
$$;

create or replace function public.identify_provisional_order_customer(
  target_order_id uuid,
  customer_name text,
  customer_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  order_row public.pending_orders%rowtype;
  customer_row public.customers%rowtype;
  normalized_phone text := nullif(trim(customer_phone), '');
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if nullif(trim(customer_name), '') is null or char_length(trim(customer_name)) > 120 then
    raise exception using errcode = '22023', message = 'Customer name is required and must not exceed 120 characters.';
  end if;
  if normalized_phone is not null and char_length(normalized_phone) not between 7 and 32 then
    raise exception using errcode = '22023', message = 'Customer phone number is invalid.';
  end if;

  select * into order_row
  from public.pending_orders
  where id = target_order_id
  for update;
  if not found or not public.is_shop_member(order_row.shop_id) then
    raise exception using errcode = '42501', message = 'Order is not available in your shop.';
  end if;
  if order_row.status <> 'converted_to_debt' or order_row.customer_id is null then
    raise exception using errcode = '22023', message = 'This order does not have an unidentified debt customer.';
  end if;

  select * into customer_row
  from public.customers
  where id = order_row.customer_id
    and shop_id = order_row.shop_id
    and is_provisional = true
    and provisional_order_id = order_row.id
  for update;
  if not found then
    raise exception using errcode = '22023', message = 'This customer has already been identified.';
  end if;

  update public.customers
  set name = trim(customer_name),
      phone = normalized_phone,
      is_provisional = false,
      last_seen = now()
  where id = customer_row.id
  returning * into customer_row;

  return jsonb_build_object('customer', to_jsonb(customer_row), 'order', to_jsonb(order_row));
end;
$$;

revoke all on function public.convert_pending_order_to_provisional_debt_atomic(uuid) from public;
revoke all on function public.identify_provisional_order_customer(uuid, text, text) from public;
grant execute on function public.convert_pending_order_to_provisional_debt_atomic(uuid) to authenticated;
grant execute on function public.identify_provisional_order_customer(uuid, text, text) to authenticated;

comment on column public.customers.is_provisional is
  'True only for a unique unidentified customer created to hold one order debt safely.';
comment on function public.identify_provisional_order_customer(uuid, text, text) is
  'Identifies a provisional order-debt customer without moving or deleting its financial history.';
