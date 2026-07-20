-- Give every new direct sale a durable order receipt without changing existing data.
-- The payment and the basket must match exactly; partial payments belong to pending orders.

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
  created_order public.pending_orders%rowtype;
  qty integer;
  grand_total numeric := 0;
  total_profit numeric := 0;
  updated_products jsonb := '[]'::jsonb;
  item_count integer := 0;
  first_product uuid;
  first_quantity integer;
  first_price numeric;
  payment_method text;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if sale_items is null or jsonb_typeof(sale_items) <> 'array' or jsonb_array_length(sale_items) = 0 then
    raise exception using errcode = '22023', message = 'At least one sale item is required.';
  end if;

  select * into txn from public.transactions where id = target_transaction_id for update;
  if not found or not public.is_shop_member(txn.shop_id) then
    raise exception using errcode = '42501', message = 'Transaction is not available in your shop.';
  end if;
  if txn.classified then
    raise exception using errcode = '22023', message = 'Transaction is already classified.';
  end if;
  if txn.direction <> 'in' then
    raise exception using errcode = '22023', message = 'A sale must be linked to a Cash In transaction.';
  end if;
  if target_customer_id is not null and not exists (
    select 1 from public.customers where id = target_customer_id and shop_id = txn.shop_id
  ) then
    raise exception using errcode = '22023', message = 'Customer is not available in this shop.';
  end if;

  -- First validate and lock the complete basket. Nothing is mutated during this pass.
  for item in select value from jsonb_array_elements(sale_items)
  loop
    qty := coalesce((item->>'quantity')::integer, 0);
    if qty <= 0 then
      raise exception using errcode = '22023', message = 'Every sale quantity must be greater than zero.';
    end if;
    select * into product_row from public.products
      where id = (item->>'productId')::uuid and shop_id = txn.shop_id and active = true for update;
    if not found then
      raise exception using errcode = '22023', message = 'A product is not available in this shop.';
    end if;
    if coalesce(product_row.stock_current, 0) - coalesce(product_row.reserved_stock, 0) < qty then
      raise exception using errcode = '22023', message = format('Insufficient available stock for %s.', product_row.name);
    end if;
    grand_total := grand_total + product_row.unit_price * qty;
    total_profit := total_profit + (product_row.unit_price - coalesce(product_row.cost_price, 0)) * qty;
    item_count := item_count + 1;
    if item_count = 1 then
      first_product := product_row.id;
      first_quantity := qty;
      first_price := product_row.unit_price;
    end if;
  end loop;

  if txn.amount <> grand_total then
    raise exception using errcode = '22023',
      message = format('Payment must equal the sale total of %s KES. Use a pending order for partial payment.', grand_total);
  end if;

  insert into public.pending_orders (
    shop_id, customer_id, status, total_amount, paid_amount, created_by,
    finalized_by, created_at, updated_at, finalized_at
  ) values (
    txn.shop_id, target_customer_id, 'completed', grand_total, grand_total, actor_id,
    actor_id, txn.created_at, now(), now()
  ) returning * into created_order;

  -- Deduct stock once and preserve immutable product/price snapshots on the receipt.
  for item in select value from jsonb_array_elements(sale_items)
  loop
    qty := (item->>'quantity')::integer;
    select * into product_row from public.products
      where id = (item->>'productId')::uuid and shop_id = txn.shop_id for update;
    update public.products
      set stock_current = stock_current - qty
      where id = product_row.id
      returning * into product_row;
    insert into public.pending_order_items (
      order_id, shop_id, product_id, product_name, quantity, unit_price, cost_price
    ) values (
      created_order.id, txn.shop_id, product_row.id, product_row.name, qty,
      product_row.unit_price, coalesce(product_row.cost_price, 0)
    );
    updated_products := updated_products || to_jsonb(product_row);
  end loop;

  update public.transactions
  set classified = true, operation_type = 'sale',
      product_id = case when item_count = 1 then first_product else null end,
      quantity = case when item_count = 1 then first_quantity else null end,
      unit_price = case when item_count = 1 then first_price else null end,
      total_price = grand_total, profit = total_profit, customer_id = target_customer_id,
      performed_by_user_id = actor_id,
      employee_id = case when exists (
        select 1 from public.shop_members
        where shop_id = txn.shop_id and user_id = actor_id and role = 'employee' and status = 'active'
      ) then actor_id else null end
  where id = txn.id returning * into txn;

  payment_method := case when txn.source = 'mpesa' then 'mpesa' else 'cash' end;
  insert into public.pending_order_payments (
    order_id, shop_id, transaction_id, method, amount, recorded_by, created_at
  ) values (
    created_order.id, txn.shop_id, txn.id, payment_method, grand_total, actor_id, txn.created_at
  );

  return jsonb_build_object(
    'transaction', to_jsonb(txn),
    'products', updated_products,
    'order', to_jsonb(created_order),
    'grandTotal', grand_total,
    'totalProfit', total_profit
  );
end;
$$;

revoke all on function public.finalize_sale_atomic(uuid, jsonb, uuid) from public;
grant execute on function public.finalize_sale_atomic(uuid, jsonb, uuid) to authenticated;
