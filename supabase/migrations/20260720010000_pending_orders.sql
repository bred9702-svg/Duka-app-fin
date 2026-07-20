-- Pending orders reserve stock until they are completed, converted to debt,
-- or cancelled. Existing products and transactions remain unchanged.

alter table public.products add column if not exists reserved_stock integer not null default 0;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_reserved_stock_valid') then
    alter table public.products add constraint products_reserved_stock_valid
      check (reserved_stock >= 0 and reserved_stock <= stock_current);
  end if;
end $$;

create table if not exists public.pending_orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  order_number bigint generated always as identity,
  status text not null default 'awaiting_payment',
  total_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  finalized_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  constraint pending_orders_status_valid check (status in (
    'awaiting_payment', 'partially_paid', 'paid', 'completed', 'converted_to_debt', 'cancelled'
  )),
  constraint pending_orders_amounts_valid check (
    total_amount > 0 and paid_amount >= 0 and paid_amount <= total_amount
  )
);

create table if not exists public.pending_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pending_orders(id) on delete restrict,
  shop_id uuid not null references public.shops(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  quantity integer not null,
  unit_price numeric not null,
  cost_price numeric not null default 0,
  created_at timestamptz not null default now(),
  constraint pending_order_items_quantity_valid check (quantity > 0),
  constraint pending_order_items_prices_valid check (unit_price >= 0 and cost_price >= 0),
  constraint pending_order_items_product_once unique (order_id, product_id)
);

create table if not exists public.pending_order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.pending_orders(id) on delete restrict,
  shop_id uuid not null references public.shops(id) on delete restrict,
  transaction_id uuid references public.transactions(id) on delete restrict,
  method text not null,
  amount numeric not null,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint pending_order_payments_method_valid check (method in ('cash', 'mpesa')),
  constraint pending_order_payments_amount_valid check (amount > 0)
);

create unique index if not exists pending_order_payments_transaction_unique_idx
  on public.pending_order_payments(transaction_id) where transaction_id is not null;
create index if not exists pending_orders_shop_status_idx
  on public.pending_orders(shop_id, status, created_at desc);
create index if not exists pending_order_items_order_idx on public.pending_order_items(order_id);
create index if not exists pending_order_payments_order_idx on public.pending_order_payments(order_id, created_at);

drop trigger if exists pending_orders_set_updated_at on public.pending_orders;
create trigger pending_orders_set_updated_at before update on public.pending_orders
for each row execute function public.set_updated_at();

alter table public.pending_orders enable row level security;
alter table public.pending_order_items enable row level security;
alter table public.pending_order_payments enable row level security;

drop policy if exists "pending_orders_select_shop_members" on public.pending_orders;
create policy "pending_orders_select_shop_members" on public.pending_orders
for select to authenticated using (public.is_shop_member(shop_id));
drop policy if exists "pending_order_items_select_shop_members" on public.pending_order_items;
create policy "pending_order_items_select_shop_members" on public.pending_order_items
for select to authenticated using (public.is_shop_member(shop_id));
drop policy if exists "pending_order_payments_select_shop_members" on public.pending_order_payments;
create policy "pending_order_payments_select_shop_members" on public.pending_order_payments
for select to authenticated using (public.is_shop_member(shop_id));

create or replace function public.create_pending_order_atomic(order_items jsonb, target_customer_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  actor_id uuid := auth.uid(); target_shop_id uuid; created_order public.pending_orders%rowtype;
  item jsonb; product_row public.products%rowtype; qty integer; total numeric := 0;
begin
  if actor_id is null then raise exception using errcode='42501', message='Authentication is required.'; end if;
  target_shop_id := public.current_user_shop_id();
  if target_shop_id is null or not public.is_shop_member(target_shop_id) then
    raise exception using errcode='42501', message='An active shop membership is required.';
  end if;
  if order_items is null or jsonb_typeof(order_items) <> 'array' or jsonb_array_length(order_items)=0 then
    raise exception using errcode='22023', message='At least one product is required.';
  end if;
  if target_customer_id is not null and not exists(select 1 from public.customers where id=target_customer_id and shop_id=target_shop_id) then
    raise exception using errcode='22023', message='Customer is not available in this shop.';
  end if;

  insert into public.pending_orders(shop_id, customer_id, total_amount, created_by)
  values(target_shop_id, target_customer_id, 1, actor_id) returning * into created_order;

  for item in select value from jsonb_array_elements(order_items) loop
    qty := coalesce((item->>'quantity')::integer,0);
    if qty <= 0 then raise exception using errcode='22023', message='Every quantity must be greater than zero.'; end if;
    select * into product_row from public.products
      where id=(item->>'productId')::uuid and shop_id=target_shop_id and active=true for update;
    if not found then raise exception using errcode='22023', message='Product is not available in this shop.'; end if;
    if product_row.stock_current - product_row.reserved_stock < qty then
      raise exception using errcode='22023', message=format('Insufficient available stock for %s.', product_row.name);
    end if;
    update public.products set reserved_stock=reserved_stock+qty where id=product_row.id;
    insert into public.pending_order_items(order_id,shop_id,product_id,product_name,quantity,unit_price,cost_price)
      values(created_order.id,target_shop_id,product_row.id,product_row.name,qty,product_row.unit_price,coalesce(product_row.cost_price,0));
    total := total + product_row.unit_price * qty;
  end loop;
  update public.pending_orders set total_amount=total where id=created_order.id returning * into created_order;
  return to_jsonb(created_order);
end $$;

create or replace function public.record_pending_order_payment_atomic(
  target_order_id uuid, payment_amount numeric, payment_method text, target_transaction_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare actor_id uuid:=auth.uid(); order_row public.pending_orders%rowtype; new_paid numeric; payment_txn_id uuid:=target_transaction_id;
begin
  select * into order_row from public.pending_orders where id=target_order_id for update;
  if not found or not public.is_shop_member(order_row.shop_id) then raise exception using errcode='42501',message='Order is not available in your shop.'; end if;
  if order_row.status not in ('awaiting_payment','partially_paid') then raise exception using errcode='22023',message='This order cannot receive a payment.'; end if;
  if payment_amount <= 0 or payment_amount > order_row.total_amount-order_row.paid_amount then raise exception using errcode='22023',message='Payment exceeds the outstanding balance.'; end if;
  if payment_method not in ('cash','mpesa') then raise exception using errcode='22023',message='Unsupported payment method.'; end if;
  if target_transaction_id is not null and not exists(select 1 from public.transactions where id=target_transaction_id and shop_id=order_row.shop_id and direction='in' and classified=false) then
    raise exception using errcode='22023',message='Payment transaction is not available.';
  end if;
  if payment_txn_id is null then
    insert into public.transactions(shop_id,amount,source,direction,classified,operation_type,profit,customer_id,performed_by_user_id)
      values(order_row.shop_id,payment_amount,payment_method,'in',true,'sale',0,order_row.customer_id,actor_id)
      returning id into payment_txn_id;
  else
    update public.transactions set classified=true,operation_type='sale',profit=0,customer_id=order_row.customer_id,performed_by_user_id=actor_id
      where id=payment_txn_id;
  end if;
  insert into public.pending_order_payments(order_id,shop_id,transaction_id,method,amount,recorded_by)
    values(order_row.id,order_row.shop_id,payment_txn_id,payment_method,payment_amount,actor_id);
  new_paid:=order_row.paid_amount+payment_amount;
  update public.pending_orders set paid_amount=new_paid,status=case when new_paid=total_amount then 'paid' else 'partially_paid' end
    where id=order_row.id returning * into order_row;
  return to_jsonb(order_row);
end $$;

create or replace function public.finalize_pending_order_sale_atomic(target_order_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor_id uuid:=auth.uid(); order_row public.pending_orders%rowtype; line public.pending_order_items%rowtype;
  payment public.pending_order_payments%rowtype; total_profit numeric:=0; payment_profit numeric;
begin
  select * into order_row from public.pending_orders where id=target_order_id for update;
  if not found or not public.is_shop_member(order_row.shop_id) then raise exception using errcode='42501',message='Order is not available in your shop.'; end if;
  if order_row.status <> 'paid' then raise exception using errcode='22023',message='The order must be fully paid before completion.'; end if;
  for line in select * from public.pending_order_items where order_id=order_row.id order by id for update loop
    update public.products set stock_current=stock_current-line.quantity,reserved_stock=reserved_stock-line.quantity
      where id=line.product_id and shop_id=order_row.shop_id and reserved_stock>=line.quantity and stock_current>=line.quantity;
    if not found then raise exception using errcode='22023',message='Reserved stock is inconsistent.'; end if;
    total_profit:=total_profit+(line.unit_price-line.cost_price)*line.quantity;
  end loop;
  for payment in select * from public.pending_order_payments where order_id=order_row.id order by created_at,id loop
    payment_profit:=case when order_row.total_amount=0 then 0 else total_profit*(payment.amount/order_row.total_amount) end;
    if payment.transaction_id is null then
      raise exception using errcode='22023',message='Order payment transaction is missing.';
    end if;
    update public.transactions set classified=true,operation_type='sale',profit=payment_profit,customer_id=order_row.customer_id,performed_by_user_id=payment.recorded_by
    where id=payment.transaction_id;
  end loop;
  update public.pending_orders set status='completed',finalized_by=actor_id,finalized_at=now() where id=order_row.id returning * into order_row;
  return to_jsonb(order_row);
end $$;

create or replace function public.convert_pending_order_to_debt_atomic(target_order_id uuid,target_customer_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor_id uuid:=auth.uid(); order_row public.pending_orders%rowtype; line public.pending_order_items%rowtype;
  payment public.pending_order_payments%rowtype; remaining numeric; total_profit numeric:=0; debt_row public.transactions%rowtype;
begin
  select * into order_row from public.pending_orders where id=target_order_id for update;
  if not found or not public.is_shop_member(order_row.shop_id) then raise exception using errcode='42501',message='Order is not available in your shop.'; end if;
  if order_row.status not in ('awaiting_payment','partially_paid') then raise exception using errcode='22023',message='This order cannot be converted to debt.'; end if;
  if not exists(select 1 from public.customers where id=target_customer_id and shop_id=order_row.shop_id) then raise exception using errcode='22023',message='A customer is required for debt.'; end if;
  for line in select * from public.pending_order_items where order_id=order_row.id order by id for update loop
    update public.products set stock_current=stock_current-line.quantity,reserved_stock=reserved_stock-line.quantity where id=line.product_id and reserved_stock>=line.quantity;
    if not found then raise exception using errcode='22023',message='Reserved stock is inconsistent.'; end if;
    total_profit:=total_profit+(line.unit_price-line.cost_price)*line.quantity;
  end loop;
  for payment in select * from public.pending_order_payments where order_id=order_row.id loop
    update public.transactions set classified=true,operation_type='sale',profit=total_profit*(payment.amount/order_row.total_amount),customer_id=target_customer_id where id=payment.transaction_id;
  end loop;
  remaining:=order_row.total_amount-order_row.paid_amount;
  insert into public.transactions(shop_id,amount,source,direction,classified,operation_type,customer_id,is_debt,original_amount,paid_amount,remaining_amount,debt_status,profit,performed_by_user_id)
    values(order_row.shop_id,remaining,'cash','out',true,'debt',target_customer_id,true,remaining,0,remaining,'active',total_profit*(remaining/order_row.total_amount),actor_id)
    returning * into debt_row;
  update public.customers set total_owed=coalesce((select sum(remaining_amount) from public.transactions where shop_id=order_row.shop_id and customer_id=target_customer_id and is_debt=true and remaining_amount>0),0),last_seen=now() where id=target_customer_id;
  update public.pending_orders set customer_id=target_customer_id,status='converted_to_debt',finalized_by=actor_id,finalized_at=now() where id=order_row.id returning * into order_row;
  return jsonb_build_object('order',to_jsonb(order_row),'debt',to_jsonb(debt_row));
end $$;

create or replace function public.cancel_pending_order_atomic(target_order_id uuid,cancel_reason text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor_id uuid:=auth.uid(); order_row public.pending_orders%rowtype; line public.pending_order_items%rowtype;
begin
  select * into order_row from public.pending_orders where id=target_order_id for update;
  if not found or not public.is_shop_member(order_row.shop_id) then raise exception using errcode='42501',message='Order is not available in your shop.'; end if;
  if order_row.status <> 'awaiting_payment' or order_row.paid_amount<>0 then raise exception using errcode='22023',message='An order with payments cannot be cancelled.'; end if;
  for line in select * from public.pending_order_items where order_id=order_row.id for update loop
    update public.products set reserved_stock=reserved_stock-line.quantity where id=line.product_id and reserved_stock>=line.quantity;
    if not found then raise exception using errcode='22023',message='Reserved stock is inconsistent.'; end if;
  end loop;
  update public.pending_orders set status='cancelled',finalized_by=actor_id,finalized_at=now(),cancelled_at=now(),cancellation_reason=nullif(trim(cancel_reason),'') where id=order_row.id returning * into order_row;
  return to_jsonb(order_row);
end $$;

revoke all on function public.create_pending_order_atomic(jsonb,uuid) from public;
revoke all on function public.record_pending_order_payment_atomic(uuid,numeric,text,uuid) from public;
revoke all on function public.finalize_pending_order_sale_atomic(uuid) from public;
revoke all on function public.convert_pending_order_to_debt_atomic(uuid,uuid) from public;
revoke all on function public.cancel_pending_order_atomic(uuid,text) from public;
grant execute on function public.create_pending_order_atomic(jsonb,uuid) to authenticated;
grant execute on function public.record_pending_order_payment_atomic(uuid,numeric,text,uuid) to authenticated;
grant execute on function public.finalize_pending_order_sale_atomic(uuid) to authenticated;
grant execute on function public.convert_pending_order_to_debt_atomic(uuid,uuid) to authenticated;
grant execute on function public.cancel_pending_order_atomic(uuid,text) to authenticated;

drop trigger if exists pending_orders_write_audit_log on public.pending_orders;
create trigger pending_orders_write_audit_log after insert or update on public.pending_orders
for each row execute function public.write_business_audit_log();
drop trigger if exists pending_order_items_write_audit_log on public.pending_order_items;
create trigger pending_order_items_write_audit_log after insert on public.pending_order_items
for each row execute function public.write_business_audit_log();
drop trigger if exists pending_order_payments_write_audit_log on public.pending_order_payments;
create trigger pending_order_payments_write_audit_log after insert on public.pending_order_payments
for each row execute function public.write_business_audit_log();
