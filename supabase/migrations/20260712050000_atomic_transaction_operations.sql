-- Atomic, tenant-scoped business operations for Duka.
-- Stock, transactions and customer debt are committed together or rolled back.

create or replace function public.apply_debt_payment_atomic(
  target_customer_id uuid,
  payment_amount numeric,
  payment_transaction_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_shop_id uuid;
  remaining_payment numeric;
  applied_amount numeric := 0;
  debt_row public.transactions%rowtype;
  amount_for_debt numeric;
  original_for_debt numeric;
  updated_customer public.customers%rowtype;
  updated_debts jsonb := '[]'::jsonb;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if payment_amount is null or payment_amount <= 0 then
    raise exception using errcode = '22023', message = 'Payment amount must be greater than zero.';
  end if;

  select shop_id into target_shop_id
  from public.customers
  where id = target_customer_id
  for update;

  if target_shop_id is null or not public.is_shop_member(target_shop_id) then
    raise exception using errcode = '42501', message = 'Customer is not available in your shop.';
  end if;

  if payment_transaction_id is not null then
    perform 1 from public.transactions
    where id = payment_transaction_id and shop_id = target_shop_id
    for update;
    if not found then
      raise exception using errcode = '22023', message = 'Payment transaction is not available in this shop.';
    end if;
  end if;

  remaining_payment := payment_amount;
  for debt_row in
    select * from public.transactions
    where shop_id = target_shop_id
      and customer_id = target_customer_id
      and is_debt = true
      and remaining_amount > 0
    order by created_at asc, id asc
    for update
  loop
    exit when remaining_payment <= 0;
    amount_for_debt := least(remaining_payment, debt_row.remaining_amount);
    original_for_debt := coalesce(debt_row.original_amount, debt_row.total_price, debt_row.amount, debt_row.remaining_amount);

    update public.transactions
    set original_amount = original_for_debt,
        paid_amount = greatest(0, original_for_debt - (debt_row.remaining_amount - amount_for_debt)),
        remaining_amount = debt_row.remaining_amount - amount_for_debt,
        debt_status = case when debt_row.remaining_amount - amount_for_debt = 0 then 'closed' else 'active' end,
        closed_at = case when debt_row.remaining_amount - amount_for_debt = 0 then now() else null end
    where id = debt_row.id
    returning * into debt_row;

    updated_debts := updated_debts || to_jsonb(debt_row);
    remaining_payment := remaining_payment - amount_for_debt;
    applied_amount := applied_amount + amount_for_debt;
  end loop;

  if payment_transaction_id is not null then
    update public.transactions
    set classified = true,
        operation_type = 'debt_payment',
        customer_id = target_customer_id,
        is_debt = false,
        remaining_amount = 0,
        paid_amount = applied_amount,
        debt_status = 'payment',
        performed_by_user_id = actor_id,
        employee_id = case
          when exists (select 1 from public.shop_members where shop_id = target_shop_id and user_id = actor_id and role = 'employee' and status = 'active')
          then actor_id else null end
    where id = payment_transaction_id;
  end if;

  update public.customers
  set total_owed = coalesce((
        select sum(remaining_amount) from public.transactions
        where shop_id = target_shop_id and customer_id = target_customer_id
          and is_debt = true and remaining_amount > 0
      ), 0),
      last_seen = now()
  where id = target_customer_id
  returning * into updated_customer;

  return jsonb_build_object(
    'customer', to_jsonb(updated_customer),
    'debts', updated_debts,
    'applied', applied_amount,
    'unapplied', remaining_payment,
    'paymentTransaction', case when payment_transaction_id is null then null else
      (select to_jsonb(t) from public.transactions t where t.id = payment_transaction_id) end
  );
end;
$$;

create or replace function public.classify_transaction_atomic(
  target_transaction_id uuid,
  classification_type text,
  target_product_id uuid default null,
  requested_quantity integer default null,
  expense_category_value text default null,
  target_customer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  txn public.transactions%rowtype;
  product_row public.products%rowtype;
  customer_row public.customers%rowtype;
  qty integer := coalesce(requested_quantity, 1);
  calculated_total numeric;
  calculated_profit numeric;
  stock_result integer;
begin
  if actor_id is null then raise exception using errcode = '42501', message = 'Authentication is required.'; end if;
  if classification_type not in ('sale', 'debt', 'expense') then
    raise exception using errcode = '22023', message = 'Unsupported transaction classification.';
  end if;

  select * into txn from public.transactions where id = target_transaction_id for update;
  if not found or not public.is_shop_member(txn.shop_id) then
    raise exception using errcode = '42501', message = 'Transaction is not available in your shop.';
  end if;

  if classification_type in ('sale', 'debt') and target_product_id is not null then
    if qty <= 0 then raise exception using errcode = '22023', message = 'Quantity must be greater than zero.'; end if;
    select * into product_row from public.products
    where id = target_product_id and shop_id = txn.shop_id and active = true for update;
    if not found then raise exception using errcode = '22023', message = 'Product is not available in this shop.'; end if;
    if coalesce(product_row.stock_current, 0) < qty then
      raise exception using errcode = '22023', message = 'Insufficient stock.';
    end if;
    stock_result := product_row.stock_current - qty;
    calculated_total := product_row.unit_price * qty;
    calculated_profit := (product_row.unit_price - coalesce(product_row.cost_price, 0)) * qty;
    update public.products set stock_current = stock_result where id = product_row.id;
  end if;

  if target_customer_id is not null then
    select * into customer_row from public.customers
    where id = target_customer_id and shop_id = txn.shop_id for update;
    if not found then raise exception using errcode = '22023', message = 'Customer is not available in this shop.'; end if;
  end if;
  if classification_type = 'debt' and target_customer_id is null then
    raise exception using errcode = '22023', message = 'A customer is required for a debt.';
  end if;

  calculated_total := coalesce(calculated_total, txn.amount);
  update public.transactions
  set classified = true,
      operation_type = classification_type,
      product_id = target_product_id,
      quantity = case when target_product_id is null then null else qty end,
      expense_category = expense_category_value,
      customer_id = target_customer_id,
      unit_price = case when target_product_id is null then null else product_row.unit_price end,
      total_price = case when classification_type in ('sale', 'debt') then calculated_total else null end,
      profit = calculated_profit,
      stock_after = stock_result,
      is_debt = classification_type = 'debt',
      original_amount = case when classification_type = 'debt' then calculated_total else null end,
      paid_amount = 0,
      remaining_amount = case when classification_type = 'debt' then calculated_total else 0 end,
      debt_status = case when classification_type = 'debt' then 'active' else null end,
      closed_at = null,
      performed_by_user_id = actor_id,
      employee_id = case when exists (
        select 1 from public.shop_members where shop_id = txn.shop_id and user_id = actor_id and role = 'employee' and status = 'active'
      ) then actor_id else null end
  where id = txn.id
  returning * into txn;

  if classification_type = 'debt' then
    update public.customers
    set total_owed = coalesce((select sum(remaining_amount) from public.transactions
      where shop_id = txn.shop_id and customer_id = target_customer_id and is_debt = true and remaining_amount > 0), 0),
      last_seen = now()
    where id = target_customer_id returning * into customer_row;
  end if;

  return jsonb_build_object(
    'transaction', to_jsonb(txn),
    'product', case when target_product_id is null then null else (select to_jsonb(p) from public.products p where p.id = target_product_id) end,
    'customer', case when classification_type = 'debt' then to_jsonb(customer_row) else null end
  );
end;
$$;

create or replace function public.finalize_sale_atomic(
  target_transaction_id uuid,
  sale_items jsonb,
  target_customer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  txn public.transactions%rowtype;
  item jsonb;
  product_row public.products%rowtype;
  qty integer;
  grand_total numeric := 0;
  total_profit numeric := 0;
  updated_products jsonb := '[]'::jsonb;
  item_count integer := 0;
  first_product uuid;
  first_quantity integer;
  first_price numeric;
begin
  if actor_id is null then raise exception using errcode = '42501', message = 'Authentication is required.'; end if;
  if sale_items is null or jsonb_typeof(sale_items) <> 'array' or jsonb_array_length(sale_items) = 0 then
    raise exception using errcode = '22023', message = 'At least one sale item is required.';
  end if;
  select * into txn from public.transactions where id = target_transaction_id for update;
  if not found or not public.is_shop_member(txn.shop_id) then
    raise exception using errcode = '42501', message = 'Transaction is not available in your shop.';
  end if;
  if txn.classified then raise exception using errcode = '22023', message = 'Transaction is already classified.'; end if;
  if target_customer_id is not null and not exists (
    select 1 from public.customers where id = target_customer_id and shop_id = txn.shop_id
  ) then raise exception using errcode = '22023', message = 'Customer is not available in this shop.'; end if;

  for item in select value from jsonb_array_elements(sale_items)
  loop
    qty := coalesce((item->>'quantity')::integer, 0);
    if qty <= 0 then raise exception using errcode = '22023', message = 'Every sale quantity must be greater than zero.'; end if;
    select * into product_row from public.products
    where id = (item->>'productId')::uuid and shop_id = txn.shop_id and active = true for update;
    if not found then raise exception using errcode = '22023', message = 'A product is not available in this shop.'; end if;
    if coalesce(product_row.stock_current, 0) < qty then
      raise exception using errcode = '22023', message = format('Insufficient stock for %s.', product_row.name);
    end if;
    update public.products set stock_current = stock_current - qty where id = product_row.id returning * into product_row;
    grand_total := grand_total + product_row.unit_price * qty;
    total_profit := total_profit + (product_row.unit_price - coalesce(product_row.cost_price, 0)) * qty;
    updated_products := updated_products || to_jsonb(product_row);
    item_count := item_count + 1;
    if item_count = 1 then first_product := product_row.id; first_quantity := qty; first_price := product_row.unit_price; end if;
  end loop;

  update public.transactions
  set classified = true, operation_type = 'sale',
      product_id = case when item_count = 1 then first_product else null end,
      quantity = case when item_count = 1 then first_quantity else null end,
      unit_price = case when item_count = 1 then first_price else null end,
      total_price = grand_total, profit = total_profit, customer_id = target_customer_id,
      performed_by_user_id = actor_id,
      employee_id = case when exists (select 1 from public.shop_members where shop_id = txn.shop_id and user_id = actor_id and role = 'employee' and status = 'active') then actor_id else null end
  where id = txn.id returning * into txn;

  return jsonb_build_object('transaction', to_jsonb(txn), 'products', updated_products,
    'grandTotal', grand_total, 'totalProfit', total_profit);
end;
$$;

create or replace function public.create_debt_sale_atomic(
  sale_items jsonb,
  target_customer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_shop_id uuid;
  item jsonb;
  product_row public.products%rowtype;
  customer_row public.customers%rowtype;
  created_txn public.transactions%rowtype;
  qty integer;
  line_total numeric;
  line_profit numeric;
  grand_total numeric := 0;
  total_profit numeric := 0;
  created_transactions jsonb := '[]'::jsonb;
  updated_products jsonb := '[]'::jsonb;
begin
  if actor_id is null then raise exception using errcode = '42501', message = 'Authentication is required.'; end if;
  if sale_items is null or jsonb_typeof(sale_items) <> 'array' or jsonb_array_length(sale_items) = 0 then
    raise exception using errcode = '22023', message = 'At least one debt item is required.';
  end if;
  select * into customer_row from public.customers where id = target_customer_id for update;
  target_shop_id := customer_row.shop_id;
  if target_shop_id is null or not public.is_shop_member(target_shop_id) then
    raise exception using errcode = '42501', message = 'Customer is not available in your shop.';
  end if;

  for item in select value from jsonb_array_elements(sale_items)
  loop
    qty := coalesce((item->>'quantity')::integer, 0);
    if qty <= 0 then raise exception using errcode = '22023', message = 'Every debt quantity must be greater than zero.'; end if;
    select * into product_row from public.products
    where id = (item->>'productId')::uuid and shop_id = target_shop_id and active = true for update;
    if not found then raise exception using errcode = '22023', message = 'A product is not available in this shop.'; end if;
    if coalesce(product_row.stock_current, 0) < qty then
      raise exception using errcode = '22023', message = format('Insufficient stock for %s.', product_row.name);
    end if;
    update public.products set stock_current = stock_current - qty where id = product_row.id returning * into product_row;
    line_total := product_row.unit_price * qty;
    line_profit := (product_row.unit_price - coalesce(product_row.cost_price, 0)) * qty;
    insert into public.transactions (
      amount, source, direction, classified, operation_type, customer_id, product_id,
      quantity, unit_price, total_price, profit, stock_after, is_debt, original_amount,
      paid_amount, remaining_amount, debt_status, performed_by_user_id, employee_id,
      day_of_week, hour_of_day, shop_id
    ) values (
      line_total, 'cash', 'out', true, 'debt', target_customer_id, product_row.id,
      qty, product_row.unit_price, line_total, line_profit, product_row.stock_current, true,
      line_total, 0, line_total, 'active', actor_id,
      case when exists (select 1 from public.shop_members where shop_id = target_shop_id and user_id = actor_id and role = 'employee' and status = 'active') then actor_id else null end,
      extract(dow from now())::integer, extract(hour from now())::integer, target_shop_id
    ) returning * into created_txn;
    created_transactions := created_transactions || to_jsonb(created_txn);
    updated_products := updated_products || to_jsonb(product_row);
    grand_total := grand_total + line_total;
    total_profit := total_profit + line_profit;
  end loop;

  update public.customers
  set total_owed = coalesce((select sum(remaining_amount) from public.transactions
    where shop_id = target_shop_id and customer_id = target_customer_id and is_debt = true and remaining_amount > 0), 0),
    last_seen = now()
  where id = target_customer_id returning * into customer_row;

  return jsonb_build_object('transactions', created_transactions, 'products', updated_products,
    'customer', to_jsonb(customer_row), 'grandTotal', grand_total, 'totalProfit', total_profit);
end;
$$;

revoke all on function public.apply_debt_payment_atomic(uuid, numeric, uuid) from public;
revoke all on function public.classify_transaction_atomic(uuid, text, uuid, integer, text, uuid) from public;
revoke all on function public.finalize_sale_atomic(uuid, jsonb, uuid) from public;
revoke all on function public.create_debt_sale_atomic(jsonb, uuid) from public;
grant execute on function public.apply_debt_payment_atomic(uuid, numeric, uuid) to authenticated;
grant execute on function public.classify_transaction_atomic(uuid, text, uuid, integer, text, uuid) to authenticated;
grant execute on function public.finalize_sale_atomic(uuid, jsonb, uuid) to authenticated;
grant execute on function public.create_debt_sale_atomic(jsonb, uuid) to authenticated;
