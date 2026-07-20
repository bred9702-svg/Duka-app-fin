-- Preserve the seller identity displayed on each order receipt.
-- Existing order, payment, stock and transaction values remain unchanged.

alter table public.pending_orders
  add column if not exists seller_name text,
  add column if not exists seller_role text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'pending_orders_seller_name_length') then
    alter table public.pending_orders add constraint pending_orders_seller_name_length
      check (seller_name is null or char_length(trim(seller_name)) between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pending_orders_seller_role_valid') then
    alter table public.pending_orders add constraint pending_orders_seller_role_valid
      check (seller_role is null or seller_role in ('owner', 'employee'));
  end if;
end $$;

-- Backfill receipt identity without changing any business totals or statuses.
update public.pending_orders as order_row
set
  seller_name = coalesce(
    nullif(trim((select profile.full_name from public.profiles as profile where profile.id = order_row.created_by)), ''),
    'Shop team member'
  ),
  seller_role = (
    select member.role
    from public.shop_members as member
    where member.shop_id = order_row.shop_id
      and member.user_id = order_row.created_by
    limit 1
  )
where order_row.seller_name is null or order_row.seller_role is null;

create or replace function public.capture_pending_order_seller_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  captured_name text;
  captured_role text;
begin
  select nullif(trim(profile.full_name), ''), member.role
  into captured_name, captured_role
  from public.profiles as profile
  left join public.shop_members as member
    on member.user_id = profile.id
   and member.shop_id = new.shop_id
  where profile.id = new.created_by
  limit 1;

  new.seller_name := coalesce(captured_name, 'Shop team member');
  new.seller_role := captured_role;
  return new;
end;
$$;

drop trigger if exists pending_orders_capture_seller_identity on public.pending_orders;
create trigger pending_orders_capture_seller_identity
before insert on public.pending_orders
for each row execute function public.capture_pending_order_seller_identity();

comment on column public.pending_orders.seller_name is
  'Immutable display-name snapshot of the shop member who created the order receipt.';
comment on column public.pending_orders.seller_role is
  'Owner or employee role snapshot for the seller shown on the receipt.';

revoke all on function public.capture_pending_order_seller_identity() from public;
