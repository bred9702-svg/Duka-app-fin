-- Atomic stock purchasing: purchase header, line items, stock changes, price
-- changes and the related expense are committed together or all rolled back.

create table if not exists public.stock_purchases (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  linked_transaction_id uuid references public.transactions(id) on delete restrict,
  supplier text,
  purchase_date date not null default current_date,
  notes text,
  total_investment integer not null,
  expected_revenue integer not null,
  expected_profit integer not null,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint stock_purchases_total_valid check (total_investment >= 0),
  constraint stock_purchases_revenue_valid check (expected_revenue >= 0)
);

create table if not exists public.stock_purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.stock_purchases(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  purchase_price integer not null,
  unit_price integer not null,
  stock_before integer not null,
  stock_after integer not null,
  created_at timestamptz not null default now(),
  constraint stock_purchase_items_quantity_valid check (quantity > 0),
  constraint stock_purchase_items_purchase_price_valid check (purchase_price >= 0),
  constraint stock_purchase_items_unit_price_valid check (unit_price >= 0),
  constraint stock_purchase_items_stock_valid check (
    stock_before >= 0 and stock_after = stock_before + quantity
  ),
  constraint stock_purchase_items_product_once unique (purchase_id, product_id)
);

create unique index if not exists stock_purchases_linked_transaction_unique_idx
  on public.stock_purchases (linked_transaction_id)
  where linked_transaction_id is not null;
create index if not exists stock_purchases_shop_date_idx
  on public.stock_purchases (shop_id, purchase_date desc, created_at desc);
create index if not exists stock_purchase_items_purchase_idx
  on public.stock_purchase_items (purchase_id);
create index if not exists stock_purchase_items_shop_product_idx
  on public.stock_purchase_items (shop_id, product_id, created_at desc);

alter table public.stock_purchases enable row level security;
alter table public.stock_purchase_items enable row level security;

drop policy if exists "stock_purchases_select_shop_members" on public.stock_purchases;
create policy "stock_purchases_select_shop_members"
on public.stock_purchases for select to authenticated
using (public.is_shop_member(shop_id));

drop policy if exists "stock_purchase_items_select_shop_members" on public.stock_purchase_items;
create policy "stock_purchase_items_select_shop_members"
on public.stock_purchase_items for select to authenticated
using (public.is_shop_member(shop_id));

-- Writes are intentionally available only through this server-side function.
create or replace function public.record_stock_purchase_atomic(
  purchase_items jsonb,
  supplier_name text default null,
  purchased_on date default current_date,
  purchase_notes text default null,
  target_transaction_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_shop_id uuid;
  actor_role text;
  item jsonb;
  product_row public.products%rowtype;
  purchase_row public.stock_purchases%rowtype;
  expense_transaction public.transactions%rowtype;
  product_id_value uuid;
  quantity_value integer;
  purchase_price_value integer;
  unit_price_value integer;
  stock_before_value integer;
  total_investment_value bigint := 0;
  expected_revenue_value bigint := 0;
  expected_profit_value bigint := 0;
  updated_products jsonb := '[]'::jsonb;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if purchase_items is null
    or jsonb_typeof(purchase_items) <> 'array'
    or jsonb_array_length(purchase_items) = 0 then
    raise exception using errcode = '22023', message = 'At least one stock item is required.';
  end if;
  if purchased_on is null or purchased_on > current_date + 1 then
    raise exception using errcode = '22023', message = 'Purchase date is invalid.';
  end if;
  if char_length(coalesce(supplier_name, '')) > 160
    or char_length(coalesce(purchase_notes, '')) > 1000 then
    raise exception using errcode = '22023', message = 'Supplier or notes are too long.';
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

  if (
    select count(*) <> count(distinct value ->> 'productId')
    from jsonb_array_elements(purchase_items)
  ) then
    raise exception using errcode = '22023', message = 'A product can appear only once per purchase.';
  end if;

  -- Lock every product in a deterministic order to prevent lost updates and
  -- reduce deadlock risk when two stock purchases happen simultaneously.
  perform 1
  from public.products p
  where p.id in (
    select (value ->> 'productId')::uuid
    from jsonb_array_elements(purchase_items)
  )
  order by p.id
  for update;

  for item in select value from jsonb_array_elements(purchase_items)
  loop
    begin
      product_id_value := (item ->> 'productId')::uuid;
      quantity_value := (item ->> 'quantity')::integer;
      purchase_price_value := (item ->> 'purchasePrice')::integer;
      unit_price_value := (item ->> 'unitPrice')::integer;
    exception when others then
      raise exception using errcode = '22023', message = 'A stock item contains invalid values.';
    end;

    if quantity_value <= 0 or purchase_price_value < 0 or unit_price_value < 0 then
      raise exception using errcode = '22023', message = 'Stock quantities and prices must be valid.';
    end if;

    select * into product_row
    from public.products
    where id = product_id_value
      and shop_id = target_shop_id
      and active = true;
    if not found then
      raise exception using errcode = '22023', message = 'A product is not available in this shop.';
    end if;

    total_investment_value := total_investment_value + purchase_price_value::bigint * quantity_value;
    expected_revenue_value := expected_revenue_value + unit_price_value::bigint * quantity_value;
  end loop;

  if total_investment_value > 2147483647 or expected_revenue_value > 2147483647 then
    raise exception using errcode = '22003', message = 'Purchase total exceeds the supported amount.';
  end if;
  expected_profit_value := expected_revenue_value - total_investment_value;

  if target_transaction_id is not null then
    select * into expense_transaction
    from public.transactions
    where id = target_transaction_id
      and shop_id = target_shop_id
    for update;
    if not found
      or expense_transaction.direction <> 'out'
      or expense_transaction.operation_type <> 'expense'
      or expense_transaction.expense_category <> 'stock' then
      raise exception using
        errcode = '22023',
        message = 'Linked transaction must be a stock expense from this shop.';
    end if;
  else
    insert into public.transactions (
      shop_id, amount, source, direction, classified, operation_type,
      expense_category, performed_by_user_id, employee_id, day_of_week, hour_of_day
    ) values (
      target_shop_id, total_investment_value::integer, 'cash', 'out', true, 'expense',
      'stock', actor_id,
      case when actor_role = 'employee' then actor_id else null end,
      extract(dow from now())::integer, extract(hour from now())::integer
    ) returning * into expense_transaction;
  end if;

  insert into public.stock_purchases (
    shop_id, linked_transaction_id, supplier, purchase_date, notes,
    total_investment, expected_revenue, expected_profit, recorded_by
  ) values (
    target_shop_id, target_transaction_id, nullif(trim(supplier_name), ''), purchased_on,
    nullif(trim(purchase_notes), ''), total_investment_value::integer,
    expected_revenue_value::integer, expected_profit_value::integer, actor_id
  ) returning * into purchase_row;

  for item in select value from jsonb_array_elements(purchase_items)
  loop
    product_id_value := (item ->> 'productId')::uuid;
    quantity_value := (item ->> 'quantity')::integer;
    purchase_price_value := (item ->> 'purchasePrice')::integer;
    unit_price_value := (item ->> 'unitPrice')::integer;

    select * into product_row
    from public.products
    where id = product_id_value and shop_id = target_shop_id;
    stock_before_value := coalesce(product_row.stock_current, 0);

    update public.products
    set stock_current = stock_before_value + quantity_value,
        unit_price = unit_price_value
    where id = product_id_value
    returning * into product_row;

    insert into public.stock_purchase_items (
      purchase_id, shop_id, product_id, quantity, purchase_price, unit_price,
      stock_before, stock_after
    ) values (
      purchase_row.id, target_shop_id, product_id_value, quantity_value,
      purchase_price_value, unit_price_value, stock_before_value, product_row.stock_current
    );

    updated_products := updated_products || to_jsonb(product_row);
  end loop;

  return jsonb_build_object(
    'purchase', to_jsonb(purchase_row),
    'transaction', to_jsonb(expense_transaction),
    'products', updated_products,
    'totalInvestment', total_investment_value,
    'expectedRevenue', expected_revenue_value,
    'expectedProfit', expected_profit_value
  );
end;
$$;

revoke all on function public.record_stock_purchase_atomic(jsonb, text, date, text, uuid)
  from public;
grant execute on function public.record_stock_purchase_atomic(jsonb, text, date, text, uuid)
  to authenticated;

drop trigger if exists stock_purchases_write_audit_log on public.stock_purchases;
create trigger stock_purchases_write_audit_log
after insert or update or delete on public.stock_purchases
for each row execute function public.write_business_audit_log();

drop trigger if exists stock_purchase_items_write_audit_log on public.stock_purchase_items;
create trigger stock_purchase_items_write_audit_log
after insert or update or delete on public.stock_purchase_items
for each row execute function public.write_business_audit_log();

comment on function public.record_stock_purchase_atomic(jsonb, text, date, text, uuid) is
  'Atomically records a stock purchase, updates product stock/prices and creates or links its expense.';
