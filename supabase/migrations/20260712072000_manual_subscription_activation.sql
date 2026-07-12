-- Administrative M-Pesa activation flow for Duka Pro's manual launch phase.
-- Application users can read their confirmed payments but cannot create or
-- confirm them. Activation is reserved for trusted server/admin execution.

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete restrict,
  subscription_id uuid not null references public.subscriptions(id) on delete restrict,
  amount_kes integer not null,
  payment_method text not null default 'mpesa',
  payment_reference text not null,
  status text not null default 'confirmed',
  paid_at timestamptz not null,
  confirmed_at timestamptz not null default now(),
  confirmed_by uuid references auth.users(id) on delete set null,
  period_starts_at timestamptz not null,
  period_ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint subscription_payments_amount_valid check (amount_kes = 2999),
  constraint subscription_payments_method_valid check (payment_method = 'mpesa'),
  constraint subscription_payments_status_valid check (status = 'confirmed'),
  constraint subscription_payments_reference_length check (
    char_length(payment_reference) between 6 and 40
  ),
  constraint subscription_payments_period_valid check (
    period_ends_at > period_starts_at
  )
);

create unique index if not exists subscription_payments_reference_unique_idx
  on public.subscription_payments (upper(payment_reference));

create index if not exists subscription_payments_shop_paid_idx
  on public.subscription_payments (shop_id, paid_at desc);

create index if not exists subscription_payments_subscription_idx
  on public.subscription_payments (subscription_id, created_at desc);

alter table public.subscription_payments enable row level security;

drop policy if exists "subscription_payments_select_shop_owners"
  on public.subscription_payments;
create policy "subscription_payments_select_shop_owners"
on public.subscription_payments
for select
to authenticated
using (public.is_shop_owner(shop_id));

-- No application INSERT, UPDATE or DELETE policy is intentionally provided.

create or replace function public.activate_manual_pro_subscription(
  target_shop_id uuid,
  mpesa_reference text,
  received_amount_kes integer default 2999,
  payment_received_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_reference text := upper(nullif(trim(mpesa_reference), ''));
  current_subscription public.subscriptions%rowtype;
  payment_record public.subscription_payments%rowtype;
  coverage_starts_at timestamptz;
  coverage_ends_at timestamptz;
  entitlement_started_at timestamptz;
begin
  if target_shop_id is null or not exists (
    select 1 from public.shops
    where id = target_shop_id and deleted_at is null
  ) then
    raise exception using errcode = '22023', message = 'An active Duka shop is required.';
  end if;

  if normalized_reference is null
    or char_length(normalized_reference) < 6
    or char_length(normalized_reference) > 40 then
    raise exception using
      errcode = '22023',
      message = 'A valid M-Pesa reference containing 6 to 40 characters is required.';
  end if;

  if received_amount_kes <> 2999 then
    raise exception using
      errcode = '22023',
      message = 'The Duka Pro monthly payment must be exactly KES 2,999.';
  end if;

  if payment_received_at is null or payment_received_at > now() + interval '5 minutes' then
    raise exception using errcode = '22023', message = 'Payment date is invalid.';
  end if;

  -- Serialize every activation for the same shop. This prevents simultaneous
  -- confirmations from producing overlapping subscription periods.
  perform pg_advisory_xact_lock(hashtextextended(target_shop_id::text, 0));

  if exists (
    select 1 from public.subscription_payments
    where upper(payment_reference) = normalized_reference
  ) then
    raise exception using
      errcode = '23505',
      message = 'This M-Pesa reference has already been used.';
  end if;

  select *
  into current_subscription
  from public.subscriptions
  where shop_id = target_shop_id
    and status in ('trial', 'active')
  order by created_at desc
  limit 1
  for update;

  if current_subscription.id is null then
    select *
    into current_subscription
    from public.subscriptions
    where shop_id = target_shop_id
    order by created_at desc
    limit 1
    for update;
  end if;

  if current_subscription.id is not null
    and current_subscription.status = 'active'
    and current_subscription.current_period_ends_at > now() then
    -- Early renewal: the new paid month begins after the existing one.
    coverage_starts_at := current_subscription.current_period_ends_at;
    entitlement_started_at := current_subscription.current_period_started_at;
  elsif current_subscription.id is not null
    and current_subscription.status = 'trial'
    and current_subscription.trial_ends_at > now() then
    -- Early conversion: preserve every remaining free-trial day, then append
    -- the paid month. Pro access remains uninterrupted from today.
    coverage_starts_at := current_subscription.trial_ends_at;
    entitlement_started_at := now();
  else
    coverage_starts_at := now();
    entitlement_started_at := now();
  end if;

  coverage_ends_at := coverage_starts_at + interval '1 month';

  if current_subscription.id is null then
    insert into public.subscriptions (
      shop_id,
      plan,
      status,
      current_period_started_at,
      current_period_ends_at,
      amount_kes,
      payment_method,
      payment_reference,
      activated_by
    )
    values (
      target_shop_id,
      'pro',
      'active',
      entitlement_started_at,
      coverage_ends_at,
      2999,
      'mpesa',
      normalized_reference,
      auth.uid()
    )
    returning * into current_subscription;
  else
    update public.subscriptions
    set plan = 'pro',
        status = 'active',
        current_period_started_at = entitlement_started_at,
        current_period_ends_at = coverage_ends_at,
        amount_kes = 2999,
        payment_method = 'mpesa',
        payment_reference = normalized_reference,
        activated_by = auth.uid()
    where id = current_subscription.id
    returning * into current_subscription;
  end if;

  insert into public.subscription_payments (
    shop_id,
    subscription_id,
    amount_kes,
    payment_method,
    payment_reference,
    status,
    paid_at,
    confirmed_by,
    period_starts_at,
    period_ends_at
  )
  values (
    target_shop_id,
    current_subscription.id,
    2999,
    'mpesa',
    normalized_reference,
    'confirmed',
    payment_received_at,
    auth.uid(),
    coverage_starts_at,
    coverage_ends_at
  )
  returning * into payment_record;

  return jsonb_build_object(
    'shop_id', target_shop_id,
    'plan', 'pro',
    'status', 'active',
    'amount_kes', 2999,
    'payment_reference', normalized_reference,
    'payment_id', payment_record.id,
    'period_starts_at', coverage_starts_at,
    'period_ends_at', coverage_ends_at,
    'subscription', to_jsonb(current_subscription)
  );
end;
$$;

revoke all on function public.activate_manual_pro_subscription(uuid, text, integer, timestamptz)
  from public;
grant execute on function public.activate_manual_pro_subscription(uuid, text, integer, timestamptz)
  to service_role;

-- Include confirmed subscription payments in the immutable audit trail.
drop trigger if exists subscription_payments_write_audit_log
  on public.subscription_payments;
create trigger subscription_payments_write_audit_log
after insert or update or delete on public.subscription_payments
for each row execute function public.write_business_audit_log();

comment on table public.subscription_payments is
  'Immutable registry of manually verified Duka Pro M-Pesa payments and their covered periods.';

comment on function public.activate_manual_pro_subscription(uuid, text, integer, timestamptz) is
  'Admin-only idempotent activation or extension of Duka Pro after manual M-Pesa verification.';
