-- Global Dukwise catalog. Catalog identity is shared; stock and prices remain
-- private shop data in public.products.

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null,
  category text not null,
  keywords text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint catalog_products_name_length check (char_length(trim(name)) between 1 and 160),
  constraint catalog_products_brand_length check (char_length(trim(brand)) between 1 and 100),
  constraint catalog_products_category_length check (char_length(trim(category)) between 1 and 80)
);

create table if not exists public.catalog_product_variants (
  id uuid primary key default gen_random_uuid(),
  catalog_product_id uuid not null references public.catalog_products(id) on delete cascade,
  volume_value numeric(10,2) not null,
  volume_unit text not null,
  package_type text not null default 'Bottle',
  barcode text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_variant_positive_volume check (volume_value > 0),
  constraint catalog_variant_unit check (volume_unit in ('ml', 'L', 'g', 'kg', 'piece')),
  constraint catalog_variant_package_length check (char_length(trim(package_type)) between 1 and 40),
  constraint catalog_variant_barcode_length check (barcode is null or char_length(barcode) between 6 and 32),
  unique (catalog_product_id, volume_value, volume_unit, package_type)
);

alter table public.products add column if not exists catalog_variant_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_catalog_variant_id_fkey') then
    alter table public.products
      add constraint products_catalog_variant_id_fkey
      foreign key (catalog_variant_id) references public.catalog_product_variants(id) on delete restrict;
  end if;
end;
$$;

create unique index if not exists products_shop_catalog_variant_unique
  on public.products (shop_id, catalog_variant_id)
  where catalog_variant_id is not null;
create index if not exists catalog_products_search_idx
  on public.catalog_products (active, category, brand, name);
create index if not exists catalog_variants_product_idx
  on public.catalog_product_variants (catalog_product_id, active, volume_value);

alter table public.catalog_products enable row level security;
alter table public.catalog_product_variants enable row level security;

drop policy if exists "catalog_products_authenticated_read" on public.catalog_products;
create policy "catalog_products_authenticated_read"
on public.catalog_products for select to authenticated
using (active = true);

drop policy if exists "catalog_variants_authenticated_read" on public.catalog_product_variants;
create policy "catalog_variants_authenticated_read"
on public.catalog_product_variants for select to authenticated
using (
  active = true
  and exists (
    select 1 from public.catalog_products cp
    where cp.id = catalog_product_id and cp.active = true
  )
);

revoke all on table public.catalog_products from anon, authenticated;
revoke all on table public.catalog_product_variants from anon, authenticated;
grant select on table public.catalog_products to authenticated;
grant select on table public.catalog_product_variants to authenticated;

create or replace function public.search_dukwise_catalog(
  search_query text default '',
  result_limit integer default 60
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(row_data order by row_data->>'brand', row_data->>'name'), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', cp.id,
      'slug', cp.slug,
      'name', cp.name,
      'brand', cp.brand,
      'category', cp.category,
      'keywords', cp.keywords,
      'variants', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', cv.id,
          'volumeValue', cv.volume_value,
          'volumeUnit', cv.volume_unit,
          'packageType', cv.package_type
        ) order by
          case cv.volume_unit when 'ml' then cv.volume_value when 'L' then cv.volume_value * 1000 else cv.volume_value end,
          cv.package_type)
        from public.catalog_product_variants cv
        where cv.catalog_product_id = cp.id and cv.active = true
      ), '[]'::jsonb)
    ) as row_data
    from public.catalog_products cp
    where cp.active = true
      and (
        nullif(trim(search_query), '') is null
        or concat_ws(' ', cp.brand, cp.name, cp.category, array_to_string(cp.keywords, ' ')) ilike '%' || trim(search_query) || '%'
        or exists (
          select 1 from public.catalog_product_variants cv
          where cv.catalog_product_id = cp.id and cv.active = true
            and concat(cv.volume_value::text, cv.volume_unit, ' ', cv.package_type) ilike '%' || replace(trim(search_query), ' ', '') || '%'
        )
      )
    order by cp.brand, cp.name
    limit least(greatest(coalesce(result_limit, 60), 1), 100)
  ) catalog_rows;
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
    if coalesce((item->>'quantity')::integer, -1) < 0
      or coalesce((item->>'costPrice')::integer, -1) < 0
      or coalesce((item->>'unitPrice')::integer, 0) <= 0
      or coalesce((item->>'stockAlert')::integer, 5) < 0 then
      raise exception using errcode = '22023', message = 'A quantity or price is invalid.';
    end if;

    select cv.id, cv.volume_value, cv.volume_unit, cv.package_type,
           cp.name, cp.category
    into variant_record
    from public.catalog_product_variants cv
    join public.catalog_products cp on cp.id = cv.catalog_product_id
    where cv.id = (item->>'catalogVariantId')::uuid
      and cv.active = true and cp.active = true;

    if variant_record.id is null then
      raise exception using errcode = '22023', message = 'A selected catalog format is unavailable.';
    end if;
    if exists (
      select 1 from public.products
      where shop_id = target_shop_id and catalog_variant_id = variant_record.id
    ) then
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

  return jsonb_build_object('products', created_products, 'count', item_count);
end;
$$;

revoke all on function public.search_dukwise_catalog(text, integer) from public;
revoke all on function public.add_catalog_opening_stock(jsonb) from public;
grant execute on function public.search_dukwise_catalog(text, integer) to authenticated;
grant execute on function public.add_catalog_opening_stock(jsonb) to authenticated;

comment on table public.catalog_products is 'Global Dukwise product families. Never contains shop prices or stock.';
comment on table public.catalog_product_variants is 'Verified sellable formats belonging to a global catalog product family.';
comment on column public.products.catalog_variant_id is 'Optional link to the exact Dukwise catalog format used to create this private shop product.';
comment on function public.add_catalog_opening_stock(jsonb) is 'Atomically creates private shop products from catalog formats without creating a financial transaction.';
