-- Dukwise manual M-Pesa subscription checkout and verification queue.

create table if not exists public.subscription_payment_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  payer_name text,
  payer_phone text,
  amount_kes integer not null default 2999,
  mpesa_reference text not null,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_payment_request_amount check (amount_kes = 2999),
  constraint subscription_payment_request_reference check (
    mpesa_reference = upper(trim(mpesa_reference))
    and char_length(mpesa_reference) between 6 and 40
    and mpesa_reference ~ '^[A-Z0-9-]+$'
  ),
  constraint subscription_payment_request_status check (
    status in ('pending', 'confirmed', 'rejected', 'cancelled')
  ),
  constraint subscription_payment_request_review check (
    (status = 'pending' and reviewed_at is null)
    or (status <> 'pending' and reviewed_at is not null)
  )
);

create unique index if not exists subscription_payment_request_one_pending_shop_idx
  on public.subscription_payment_requests (shop_id)
  where status = 'pending';
create unique index if not exists subscription_payment_request_active_reference_idx
  on public.subscription_payment_requests (upper(mpesa_reference))
  where status in ('pending', 'confirmed');
create index if not exists subscription_payment_request_shop_time_idx
  on public.subscription_payment_requests (shop_id, requested_at desc);

drop trigger if exists subscription_payment_requests_set_updated_at
  on public.subscription_payment_requests;
create trigger subscription_payment_requests_set_updated_at
before update on public.subscription_payment_requests
for each row execute function public.set_updated_at();

alter table public.subscription_payment_requests enable row level security;

drop policy if exists "subscription_payment_requests_select_owner"
  on public.subscription_payment_requests;
create policy "subscription_payment_requests_select_owner"
on public.subscription_payment_requests for select to authenticated
using (public.is_shop_owner(shop_id));

revoke all on table public.subscription_payment_requests from public, anon, authenticated;
grant select on table public.subscription_payment_requests to authenticated;

create or replace function public.submit_subscription_payment_request(
  target_shop_id uuid,
  submitted_mpesa_reference text
)
returns public.subscription_payment_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  normalized_reference text := upper(nullif(trim(submitted_mpesa_reference), ''));
  actor_profile public.profiles%rowtype;
  request_record public.subscription_payment_requests%rowtype;
begin
  if actor_id is null or not public.is_shop_owner(target_shop_id) then
    raise exception using errcode = '42501', message = 'Only the Shop Owner can submit a subscription payment.';
  end if;
  if normalized_reference is null
    or char_length(normalized_reference) < 6
    or char_length(normalized_reference) > 40
    or normalized_reference !~ '^[A-Z0-9-]+$' then
    raise exception using errcode = '22023', message = 'Enter a valid M-Pesa transaction code.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_shop_id::text, 31));

  if exists (
    select 1 from public.subscription_payment_requests
    where upper(mpesa_reference) = normalized_reference
      and status in ('pending', 'confirmed')
      and shop_id <> target_shop_id
  ) or exists (
    select 1 from public.subscription_payments
    where upper(payment_reference) = normalized_reference
  ) then
    raise exception using errcode = '23505', message = 'This M-Pesa reference has already been submitted.';
  end if;

  select * into actor_profile from public.profiles where id = actor_id;

  select * into request_record
  from public.subscription_payment_requests
  where shop_id = target_shop_id and status = 'pending'
  limit 1 for update;

  if request_record.id is not null then
    if request_record.mpesa_reference = normalized_reference then
      return request_record;
    end if;
    update public.subscription_payment_requests
    set mpesa_reference = normalized_reference,
        payer_name = actor_profile.full_name,
        payer_phone = actor_profile.phone,
        requested_by = actor_id,
        requested_at = now(),
        rejection_reason = null
    where id = request_record.id
    returning * into request_record;
  else
    insert into public.subscription_payment_requests (
      shop_id, requested_by, payer_name, payer_phone,
      amount_kes, mpesa_reference, status
    ) values (
      target_shop_id, actor_id, actor_profile.full_name, actor_profile.phone,
      2999, normalized_reference, 'pending'
    ) returning * into request_record;
  end if;

  return request_record;
end;
$$;

create or replace function public.review_subscription_payment_request(
  target_request_id uuid,
  review_decision text,
  review_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_decision text := lower(trim(review_decision));
  request_record public.subscription_payment_requests%rowtype;
  activation_result jsonb := null;
begin
  if normalized_decision not in ('confirmed', 'rejected') then
    raise exception using errcode = '22023', message = 'Decision must be confirmed or rejected.';
  end if;

  select * into request_record
  from public.subscription_payment_requests
  where id = target_request_id
  for update;

  if request_record.id is null then
    raise exception using errcode = '22023', message = 'Payment request was not found.';
  end if;
  if request_record.status <> 'pending' then
    raise exception using errcode = '22023', message = 'Payment request has already been reviewed.';
  end if;

  if normalized_decision = 'confirmed' then
    activation_result := public.activate_manual_pro_subscription(
      request_record.shop_id,
      request_record.mpesa_reference,
      request_record.amount_kes,
      request_record.requested_at
    );
  end if;

  update public.subscription_payment_requests
  set status = normalized_decision,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      rejection_reason = case
        when normalized_decision = 'rejected' then nullif(trim(review_reason), '')
        else null
      end
  where id = request_record.id;

  return jsonb_build_object(
    'request_id', request_record.id,
    'status', normalized_decision,
    'activation', activation_result
  );
end;
$$;

revoke all on function public.submit_subscription_payment_request(uuid, text)
  from public, anon, authenticated;
grant execute on function public.submit_subscription_payment_request(uuid, text)
  to authenticated;
revoke all on function public.review_subscription_payment_request(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_subscription_payment_request(uuid, text, text)
  to service_role;

drop trigger if exists subscription_payment_requests_write_audit_log
  on public.subscription_payment_requests;
create trigger subscription_payment_requests_write_audit_log
after insert or update or delete on public.subscription_payment_requests
for each row execute function public.write_business_audit_log();

comment on table public.subscription_payment_requests is
  'Owner-submitted manual M-Pesa confirmations awaiting trusted review.';
