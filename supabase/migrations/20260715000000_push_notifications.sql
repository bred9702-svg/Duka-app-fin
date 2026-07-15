-- Cross-platform push notification infrastructure for Dukwise.
-- Android devices store an FCM token; installed Web/PWA clients store a
-- standards-based Web Push subscription. Business writes only enqueue work;
-- the dispatch-push Edge Function performs external delivery.

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  platform text not null,
  token text,
  endpoint text,
  p256dh text,
  auth_secret text,
  label text,
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_devices_platform_valid check (platform in ('android', 'web')),
  constraint push_devices_destination_valid check (
    (platform = 'android' and token is not null and endpoint is null)
    or
    (platform = 'web' and token is null and endpoint is not null and p256dh is not null and auth_secret is not null)
  )
);

create unique index if not exists push_devices_token_unique_idx
  on public.push_devices (token) where token is not null;
create unique index if not exists push_devices_endpoint_unique_idx
  on public.push_devices (endpoint) where endpoint is not null;
create index if not exists push_devices_recipient_idx
  on public.push_devices (user_id, shop_id, active);

drop trigger if exists push_devices_set_updated_at on public.push_devices;
create trigger push_devices_set_updated_at
before update on public.push_devices
for each row execute function public.set_updated_at();

create table if not exists public.push_notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  low_stock boolean not null default true,
  new_debt boolean not null default true,
  debt_payment boolean not null default true,
  daily_summary boolean not null default true,
  weekly_summary boolean not null default true,
  trial boolean not null default true,
  payment_review boolean not null default true,
  employee_activity boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, shop_id)
);

drop trigger if exists push_notification_preferences_set_updated_at
  on public.push_notification_preferences;
create trigger push_notification_preferences_set_updated_at
before update on public.push_notification_preferences
for each row execute function public.set_updated_at();

create table if not exists public.push_notification_queue (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  route text not null default '/notification-center',
  dedupe_key text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_notification_queue_category_valid check (
    category in (
      'low_stock', 'new_debt', 'debt_payment', 'daily_summary',
      'weekly_summary', 'trial', 'payment_review', 'employee_activity',
      'security', 'general'
    )
  ),
  constraint push_notification_queue_status_valid check (
    status in ('pending', 'processing', 'sent', 'failed', 'cancelled')
  ),
  constraint push_notification_queue_attempts_valid check (attempts between 0 and 10),
  constraint push_notification_queue_route_valid check (route like '/%')
);

create unique index if not exists push_notification_queue_dedupe_idx
  on public.push_notification_queue (recipient_user_id, dedupe_key)
  where dedupe_key is not null;
create index if not exists push_notification_queue_dispatch_idx
  on public.push_notification_queue (status, available_at, created_at);

drop trigger if exists push_notification_queue_set_updated_at
  on public.push_notification_queue;
create trigger push_notification_queue_set_updated_at
before update on public.push_notification_queue
for each row execute function public.set_updated_at();

alter table public.push_devices enable row level security;
alter table public.push_notification_preferences enable row level security;
alter table public.push_notification_queue enable row level security;

drop policy if exists "push_devices_select_own" on public.push_devices;
create policy "push_devices_select_own"
on public.push_devices for select to authenticated
using (user_id = auth.uid() and public.is_shop_member(shop_id));

drop policy if exists "push_preferences_select_own" on public.push_notification_preferences;
create policy "push_preferences_select_own"
on public.push_notification_preferences for select to authenticated
using (user_id = auth.uid() and public.is_shop_member(shop_id));

drop policy if exists "push_queue_select_own" on public.push_notification_queue;
create policy "push_queue_select_own"
on public.push_notification_queue for select to authenticated
using (recipient_user_id = auth.uid() and public.is_shop_member(shop_id));

revoke all on table public.push_devices from public, anon, authenticated;
revoke all on table public.push_notification_preferences from public, anon, authenticated;
revoke all on table public.push_notification_queue from public, anon, authenticated;
grant select on table public.push_devices to authenticated;
grant select on table public.push_notification_preferences to authenticated;
grant select on table public.push_notification_queue to authenticated;
grant all on table public.push_devices to service_role;
grant all on table public.push_notification_preferences to service_role;
grant all on table public.push_notification_queue to service_role;

create or replace function public.register_push_device(
  target_shop_id uuid,
  device_platform text,
  device_token text default null,
  web_endpoint text default null,
  web_p256dh text default null,
  web_auth text default null,
  device_label text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  normalized_platform text := lower(trim(device_platform));
  device_record public.push_devices%rowtype;
begin
  if actor_id is null or not public.is_shop_member(target_shop_id) then
    raise exception using errcode = '42501', message = 'An active shop membership is required.';
  end if;
  if normalized_platform not in ('android', 'web') then
    raise exception using errcode = '22023', message = 'Unsupported push platform.';
  end if;
  if normalized_platform = 'android' and nullif(trim(device_token), '') is null then
    raise exception using errcode = '22023', message = 'An Android push token is required.';
  end if;
  if normalized_platform = 'web' and (
    nullif(trim(web_endpoint), '') is null
    or nullif(trim(web_p256dh), '') is null
    or nullif(trim(web_auth), '') is null
  ) then
    raise exception using errcode = '22023', message = 'A complete Web Push subscription is required.';
  end if;

  if normalized_platform = 'android' then
    insert into public.push_devices (
      user_id, shop_id, platform, token, label, active, last_seen_at
    ) values (
      actor_id, target_shop_id, 'android', trim(device_token), left(device_label, 180), true, now()
    )
    on conflict (token) where token is not null do update
    set user_id = excluded.user_id,
        shop_id = excluded.shop_id,
        platform = excluded.platform,
        label = excluded.label,
        active = true,
        last_seen_at = now()
    returning * into device_record;
  else
    insert into public.push_devices (
      user_id, shop_id, platform, endpoint, p256dh, auth_secret,
      label, active, last_seen_at
    ) values (
      actor_id, target_shop_id, 'web', trim(web_endpoint), trim(web_p256dh), trim(web_auth),
      left(device_label, 180), true, now()
    )
    on conflict (endpoint) where endpoint is not null do update
    set user_id = excluded.user_id,
        shop_id = excluded.shop_id,
        p256dh = excluded.p256dh,
        auth_secret = excluded.auth_secret,
        label = excluded.label,
        active = true,
        last_seen_at = now()
    returning * into device_record;
  end if;

  insert into public.push_notification_preferences (user_id, shop_id)
  values (actor_id, target_shop_id)
  on conflict (user_id, shop_id) do nothing;

  return device_record.id;
end;
$$;

create or replace function public.unregister_push_device(
  target_shop_id uuid,
  target_device_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  update public.push_devices
  set active = false, last_seen_at = now()
  where id = target_device_id
    and shop_id = target_shop_id
    and user_id = auth.uid();

  return found;
end;
$$;

create or replace function public.save_push_notification_preferences(
  target_shop_id uuid,
  low_stock_value boolean,
  new_debt_value boolean,
  debt_payment_value boolean,
  daily_summary_value boolean,
  weekly_summary_value boolean,
  trial_value boolean,
  payment_review_value boolean,
  employee_activity_value boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  saved_record public.push_notification_preferences%rowtype;
begin
  if actor_id is null or not public.is_shop_member(target_shop_id) then
    raise exception using errcode = '42501', message = 'An active shop membership is required.';
  end if;

  insert into public.push_notification_preferences (
    user_id, shop_id, low_stock, new_debt, debt_payment, daily_summary,
    weekly_summary, trial, payment_review, employee_activity
  ) values (
    actor_id, target_shop_id, coalesce(low_stock_value, true),
    coalesce(new_debt_value, true), coalesce(debt_payment_value, true),
    coalesce(daily_summary_value, true), coalesce(weekly_summary_value, true),
    coalesce(trial_value, true), coalesce(payment_review_value, true),
    coalesce(employee_activity_value, true)
  )
  on conflict (user_id, shop_id) do update
  set low_stock = excluded.low_stock,
      new_debt = excluded.new_debt,
      debt_payment = excluded.debt_payment,
      daily_summary = excluded.daily_summary,
      weekly_summary = excluded.weekly_summary,
      trial = excluded.trial,
      payment_review = excluded.payment_review,
      employee_activity = excluded.employee_activity
  returning * into saved_record;

  return to_jsonb(saved_record) - 'created_at' - 'updated_at';
end;
$$;

create or replace function public.enqueue_shop_owner_push_notification(
  target_shop_id uuid,
  notification_category text,
  notification_title text,
  notification_body text,
  notification_route text default '/notification-center',
  notification_dedupe_key text default null,
  notification_payload jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.push_notification_queue (
    shop_id, recipient_user_id, category, title, body, route, dedupe_key, payload
  )
  select
    target_shop_id,
    member.user_id,
    notification_category,
    left(notification_title, 120),
    left(notification_body, 500),
    notification_route,
    case when notification_dedupe_key is null then null
      else target_shop_id::text || ':' || notification_dedupe_key end,
    coalesce(notification_payload, '{}'::jsonb)
  from public.shop_members member
  where member.shop_id = target_shop_id
    and member.role = 'owner'
    and member.status = 'active'
  on conflict (recipient_user_id, dedupe_key) where dedupe_key is not null do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.enqueue_product_stock_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.active = true
    and new.stock_current <= coalesce(new.stock_alert, 5)
    and (old.stock_current > coalesce(old.stock_alert, 5) or old.stock_current is distinct from new.stock_current) then
    perform public.enqueue_shop_owner_push_notification(
      new.shop_id,
      'low_stock',
      case when new.stock_current <= 0 then 'Product out of stock' else 'Low stock alert' end,
      new.name || case when new.stock_current <= 0 then ' is out of stock.'
        else ' has only ' || new.stock_current || ' unit(s) remaining.' end,
      '/inventory',
      'stock:' || new.id::text || ':' || new.stock_current::text || ':' || current_date::text,
      jsonb_build_object('product_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists products_enqueue_stock_push on public.products;
create trigger products_enqueue_stock_push
after update of stock_current on public.products
for each row execute function public.enqueue_product_stock_push();

create or replace function public.enqueue_transaction_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_debt = true then
    perform public.enqueue_shop_owner_push_notification(
      new.shop_id, 'new_debt', 'New customer debt',
      'A debt of KES ' || trim(to_char(new.amount, 'FM999G999G999G990D00')) || ' was recorded.',
      '/debts', 'debt:' || new.id::text, jsonb_build_object('transaction_id', new.id)
    );
  elsif new.operation_type = 'debt_payment' then
    perform public.enqueue_shop_owner_push_notification(
      new.shop_id, 'debt_payment', 'Debt payment received',
      'A debt payment of KES ' || trim(to_char(new.amount, 'FM999G999G999G990D00')) || ' was recorded.',
      '/debts', 'debt-payment:' || new.id::text, jsonb_build_object('transaction_id', new.id)
    );
  end if;

  if new.employee_id is not null then
    perform public.enqueue_shop_owner_push_notification(
      new.shop_id, 'employee_activity', 'Employee activity',
      'An employee recorded a ' || replace(coalesce(new.operation_type, 'transaction'), '_', ' ') ||
        ' of KES ' || trim(to_char(new.amount, 'FM999G999G999G990D00')) || '.',
      '/employee-performance', 'employee-transaction:' || new.id::text,
      jsonb_build_object('transaction_id', new.id, 'employee_id', new.employee_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_enqueue_push on public.transactions;
create trigger transactions_enqueue_push
after insert on public.transactions
for each row execute function public.enqueue_transaction_push();

create or replace function public.enqueue_payment_review_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'pending' and new.status in ('confirmed', 'rejected') then
    perform public.enqueue_shop_owner_push_notification(
      new.shop_id,
      'payment_review',
      case when new.status = 'confirmed' then 'M-Pesa payment accepted' else 'M-Pesa payment rejected' end,
      case when new.status = 'confirmed'
        then 'Your Dukwise Pro payment has been accepted.'
        else 'Your Dukwise Pro payment was rejected. Open Subscription & Billing for details.' end,
      '/subscription',
      'payment-review:' || new.id::text || ':' || new.status,
      jsonb_build_object('payment_request_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists subscription_payment_requests_enqueue_push
  on public.subscription_payment_requests;
create trigger subscription_payment_requests_enqueue_push
after update of status on public.subscription_payment_requests
for each row execute function public.enqueue_payment_review_push();

create or replace function public.enqueue_due_scheduled_push_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription_record record;
  shop_record record;
  remaining_days integer;
  inserted_total integer := 0;
  local_now timestamp;
  sales_total numeric;
  expenses_total numeric;
begin
  for subscription_record in
    select subscription.id, subscription.shop_id, subscription.trial_ends_at
    from public.subscriptions subscription
    where subscription.status = 'trial'
      and subscription.trial_ends_at between now() - interval '2 days' and now() + interval '8 days'
  loop
    remaining_days := ceil(extract(epoch from (subscription_record.trial_ends_at - now())) / 86400.0);
    if remaining_days in (7, 3, 1) then
      inserted_total := inserted_total + public.enqueue_shop_owner_push_notification(
        subscription_record.shop_id, 'trial',
        'Dukwise Pro trial: ' || remaining_days || ' day' || case when remaining_days = 1 then '' else 's' end || ' left',
        'Your Pro trial ends soon. Review Subscription & Billing to keep Pro features.',
        '/subscription',
        'trial:' || subscription_record.id::text || ':' || remaining_days::text
      );
    elsif remaining_days <= 0 then
      inserted_total := inserted_total + public.enqueue_shop_owner_push_notification(
        subscription_record.shop_id, 'trial', 'Dukwise Pro trial ended',
        'Your shop has returned to the Free plan. You can activate Pro at any time.',
        '/subscription', 'trial:' || subscription_record.id::text || ':expired'
      );
    end if;
  end loop;

  for shop_record in
    select shop.id, coalesce(shop.timezone, 'Africa/Nairobi') as timezone
    from public.shops shop
    where shop.deleted_at is null
  loop
    local_now := timezone(shop_record.timezone, now());

    if extract(hour from local_now) = 18 then
      select
        coalesce(sum(transaction.amount) filter (where transaction.direction = 'in'), 0),
        coalesce(sum(transaction.amount) filter (where transaction.direction = 'out'), 0)
      into sales_total, expenses_total
      from public.transactions transaction
      where transaction.shop_id = shop_record.id
        and timezone(shop_record.timezone, transaction.created_at)::date = local_now::date;

      inserted_total := inserted_total + public.enqueue_shop_owner_push_notification(
        shop_record.id, 'daily_summary', 'Today at Dukwise',
        'Cash in: KES ' || trim(to_char(sales_total, 'FM999G999G999G990D00')) ||
          ' · Cash out: KES ' || trim(to_char(expenses_total, 'FM999G999G999G990D00')),
        '/', 'daily-summary:' || local_now::date::text
      );
    end if;

    if extract(isodow from local_now) = 1 and extract(hour from local_now) = 8 then
      inserted_total := inserted_total + public.enqueue_shop_owner_push_notification(
        shop_record.id, 'weekly_summary', 'Your weekly Dukwise review is ready',
        'Open Dukwise to review sales, stock, debts and employee performance.',
        '/analytics', 'weekly-summary:' || to_char(local_now, 'IYYY-IW')
      );
    end if;
  end loop;

  return inserted_total;
end;
$$;

create or replace function public.claim_push_notification_queue(batch_size integer default 50)
returns setof public.push_notification_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required.';
  end if;

  return query
  with claimed as (
    select queue.id
    from public.push_notification_queue queue
    where queue.status = 'pending'
      and queue.available_at <= now()
      and queue.attempts < 5
    order by queue.created_at asc
    limit greatest(1, least(coalesce(batch_size, 50), 100))
    for update skip locked
  )
  update public.push_notification_queue queue
  set status = 'processing',
      attempts = queue.attempts + 1,
      last_error = null
  from claimed
  where queue.id = claimed.id
  returning queue.*;
end;
$$;

revoke all on function public.register_push_device(uuid, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_push_device(uuid, text, text, text, text, text, text)
  to authenticated;
revoke all on function public.unregister_push_device(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.unregister_push_device(uuid, uuid)
  to authenticated;
revoke all on function public.save_push_notification_preferences(uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.save_push_notification_preferences(uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean)
  to authenticated;

revoke all on function public.enqueue_shop_owner_push_notification(uuid, text, text, text, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.enqueue_due_scheduled_push_notifications()
  from public, anon, authenticated;
grant execute on function public.enqueue_due_scheduled_push_notifications()
  to service_role;
revoke all on function public.claim_push_notification_queue(integer)
  from public, anon, authenticated;
grant execute on function public.claim_push_notification_queue(integer)
  to service_role;
revoke all on function public.enqueue_product_stock_push() from public, anon, authenticated;
revoke all on function public.enqueue_transaction_push() from public, anon, authenticated;
revoke all on function public.enqueue_payment_review_push() from public, anon, authenticated;

comment on table public.push_devices is
  'Per-user Android FCM tokens and standards-based Web Push subscriptions.';
comment on table public.push_notification_queue is
  'Deduplicated server-side queue consumed by the dispatch-push Edge Function.';
