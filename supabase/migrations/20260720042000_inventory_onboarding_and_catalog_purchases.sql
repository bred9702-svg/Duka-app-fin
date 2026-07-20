-- Persist inventory onboarding and allow real stock purchases from the global
-- catalog without ever exposing catalog entries as sellable shop stock.

alter table public.shops
  add column if not exists inventory_setup_completed_at timestamptz;

-- Existing shops that already carry stock must never be sent back through
-- onboarding. Empty shops remain incomplete and will see the setup flow.
update public.shops s
set inventory_setup_completed_at = coalesce(s.inventory_setup_completed_at, now())
where s.inventory_setup_completed_at is null
  and exists (
    select 1 from public.products p
    where p.shop_id = s.id and p.active = true and p.stock_current > 0
  );

create or replace function public.get_inventory_setup_status()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when sm.role = 'employee' then true
    else s.inventory_setup_completed_at is not null
  end
  from public.shop_members sm
  join public.shops s on s.id = sm.shop_id and s.deleted_at is null
  where sm.user_id = auth.uid() and sm.status = 'active'
  order by sm.joined_at asc
  limit 1;
$$;

create or replace function public.add_catalog_opening_stock(p_items jsonb)
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
  variant_record record;
  created_product public.products%rowtype;
  created_products jsonb := '[]'::jsonb;
  item_count integer;
  completed_at timestamptz;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select sm.shop_id, sm.role into target_shop_id, actor_role
  from public.shop_members sm
  where sm.user_id = actor_id and sm.status = 'active'
  order by sm.joined_at asc limit 1;

  if target_shop_id is null or actor_role <> 'owner' then
    raise exception using errcode = '42501', message = 'Only an active shop owner can add opening inventory.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'Opening inventory items must be an array.';
  end if;

  item_count := jsonb_array_length(p_items);
  if item_count < 1 or item_count > 100 then
    raise exception using errcode = '22023', message = 'Select between 1 and 100 product formats at a time.';
  end if;
  if (select count(distinct value->>'catalogVariantId') from jsonb_array_elements(p_items)) <> item_count then
    raise exception using errcode = '22023', message = 'The same product format was selected more than once.';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce((item->>'quantity')::integer, 0) <= 0
      or coalesce((item->>'costPrice')::integer, 0) <= 0
      or coalesce((item->>'unitPrice')::integer, 0) <= 0
      or coalesce((item->>'stockAlert')::integer, 5) < 0 then
      raise exception using errcode = '22023', message = 'Quantity, buying price and selling price must be greater than zero.';
    end if;

    select cv.id, cv.volume_value, cv.volume_unit, cv.package_type, cp.name, cp.category
    into variant_record
    from public.catalog_product_variants cv
    join public.catalog_products cp on cp.id = cv.catalog_product_id
    where cv.id = (item->>'catalogVariantId')::uuid
      and cv.active = true and cp.active = true;

    if variant_record.id is null then
      raise exception using errcode = '22023', message = 'A selected catalog format is unavailable.';
    end if;
    if exists (select 1 from public.products where shop_id = target_shop_id and catalog_variant_id = variant_record.id) then
      raise exception using errcode = '23505', message = 'One selected product format is already in this shop.';
    end if;

    insert into public.products (
      shop_id, catalog_variant_id, name, category, cost_price, unit_price,
      stock_current, stock_alert, active
    ) values (
      target_shop_id, variant_record.id,
      concat(variant_record.name, ' ', trim(to_char(variant_record.volume_value, 'FM999999990.##')), variant_record.volume_unit,
        case when variant_record.package_type = 'Bottle' then '' else concat(' (', variant_record.package_type, ')') end),
      variant_record.category, (item->>'costPrice')::integer, (item->>'unitPrice')::integer,
      (item->>'quantity')::integer, coalesce((item->>'stockAlert')::integer, 5), true
    ) returning * into created_product;

    created_products := created_products || to_jsonb(created_product);
  end loop;

  update public.shops
  set inventory_setup_completed_at = coalesce(inventory_setup_completed_at, now())
  where id = target_shop_id
  returning inventory_setup_completed_at into completed_at;

  return jsonb_build_object(
    'products', created_products,
    'count', item_count,
    'inventorySetupCompletedAt', completed_at
  );
end;
$$;

create or replace function public.record_inventory_purchase_atomic(
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
  item jsonb;
  normalized_items jsonb := '[]'::jsonb;
  variant_record record;
  product_record public.products%rowtype;
  product_id_value uuid;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;
  if purchase_items is null or jsonb_typeof(purchase_items) <> 'array' or jsonb_array_length(purchase_items) < 1 then
    raise exception using errcode = '22023', message = 'At least one stock item is required.';
  end if;

  select sm.shop_id into target_shop_id
  from public.shop_members sm
  where sm.user_id = actor_id and sm.status = 'active'
  order by sm.joined_at asc limit 1;
  if target_shop_id is null then
    raise exception using errcode = '42501', message = 'An active shop membership is required.';
  end if;

  for item in select value from jsonb_array_elements(purchase_items)
  loop
    product_id_value := null;
    if nullif(item->>'productId', '') is not null then
      product_id_value := (item->>'productId')::uuid;
      if not exists (
        select 1 from public.products
        where id = product_id_value and shop_id = target_shop_id and active = true
      ) then
        raise exception using errcode = '22023', message = 'A product is not available in this shop.';
      end if;
    elsif nullif(item->>'catalogVariantId', '') is not null then
      select cv.id, cv.volume_value, cv.volume_unit, cv.package_type, cp.name, cp.category
      into variant_record
      from public.catalog_product_variants cv
      join public.catalog_products cp on cp.id = cv.catalog_product_id
      where cv.id = (item->>'catalogVariantId')::uuid and cv.active = true and cp.active = true;
      if variant_record.id is null then
        raise exception using errcode = '22023', message = 'A selected catalog format is unavailable.';
      end if;

      select * into product_record
      from public.products
      where shop_id = target_shop_id and catalog_variant_id = variant_record.id
      for update;

      if found then
        product_id_value := product_record.id;
      else
        insert into public.products (
          shop_id, catalog_variant_id, name, category, cost_price, unit_price,
          stock_current, stock_alert, active
        ) values (
          target_shop_id, variant_record.id,
          concat(variant_record.name, ' ', trim(to_char(variant_record.volume_value, 'FM999999990.##')), variant_record.volume_unit,
            case when variant_record.package_type = 'Bottle' then '' else concat(' (', variant_record.package_type, ')') end),
          variant_record.category, (item->>'purchasePrice')::integer, (item->>'unitPrice')::integer,
          0, 5, true
        ) returning id into product_id_value;
      end if;
    else
      raise exception using errcode = '22023', message = 'Each item requires a shop product or a catalog format.';
    end if;

    normalized_items := normalized_items || jsonb_build_array(
      (item - 'catalogVariantId') || jsonb_build_object('productId', product_id_value)
    );
  end loop;

  return public.record_stock_purchase_atomic(
    normalized_items, supplier_name, purchased_on, purchase_notes, target_transaction_id
  );
end;
$$;

revoke all on function public.get_inventory_setup_status() from public;
revoke all on function public.add_catalog_opening_stock(jsonb) from public;
revoke all on function public.record_inventory_purchase_atomic(jsonb, text, date, text, uuid) from public;
grant execute on function public.get_inventory_setup_status() to authenticated;
grant execute on function public.add_catalog_opening_stock(jsonb) to authenticated;
grant execute on function public.record_inventory_purchase_atomic(jsonb, text, date, text, uuid) to authenticated;

comment on column public.shops.inventory_setup_completed_at is
  'Server-side completion marker for the mandatory opening inventory flow.';
comment on function public.record_inventory_purchase_atomic(jsonb, text, date, text, uuid) is
  'Records one atomic stock purchase from existing shop products and/or Dukwise catalog formats.';
