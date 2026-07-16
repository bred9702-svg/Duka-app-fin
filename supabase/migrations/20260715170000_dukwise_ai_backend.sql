-- Secure usage gate and minimal audit trail for Dukwise AI.
-- Conversation text and business context are deliberately never persisted.

create table if not exists public.dukwise_ai_usage (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  model text,
  success boolean not null default false,
  error_code text,
  constraint dukwise_ai_usage_model_length check (
    model is null or char_length(model) between 1 and 100
  ),
  constraint dukwise_ai_usage_error_length check (
    error_code is null or char_length(error_code) between 1 and 80
  )
);

create index if not exists dukwise_ai_usage_shop_time_idx
  on public.dukwise_ai_usage (shop_id, requested_at desc);

create index if not exists dukwise_ai_usage_user_time_idx
  on public.dukwise_ai_usage (user_id, requested_at desc);

alter table public.dukwise_ai_usage enable row level security;

revoke all on table public.dukwise_ai_usage from public, anon, authenticated;
grant select, insert, update on table public.dukwise_ai_usage to service_role;

create or replace function public.authorize_dukwise_ai_request(target_shop_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  request_id uuid;
  daily_count integer;
  minute_count integer;
  kenya_day_start timestamptz;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  if target_shop_id is null or not public.is_shop_owner(target_shop_id) then
    raise exception using errcode = '42501', message = 'Only the Shop Owner can use Dukwise AI.';
  end if;

  if not public.shop_has_pro_access(target_shop_id) then
    raise exception using errcode = '42501', message = 'Dukwise AI requires an active Pro trial or subscription.';
  end if;

  -- Serialize quota checks per shop so concurrent requests cannot bypass limits.
  perform pg_advisory_xact_lock(hashtext(target_shop_id::text));

  kenya_day_start := date_trunc('day', now() at time zone 'Africa/Nairobi')
    at time zone 'Africa/Nairobi';

  select count(*)::integer into daily_count
  from public.dukwise_ai_usage
  where shop_id = target_shop_id
    and requested_at >= kenya_day_start;

  if daily_count >= 30 then
    raise exception using errcode = 'P0001', message = 'Daily Dukwise AI limit reached. Try again tomorrow.';
  end if;

  select count(*)::integer into minute_count
  from public.dukwise_ai_usage
  where shop_id = target_shop_id
    and requested_at >= now() - interval '1 minute';

  if minute_count >= 5 then
    raise exception using errcode = 'P0001', message = 'Too many questions at once. Wait a minute and try again.';
  end if;

  insert into public.dukwise_ai_usage (shop_id, user_id)
  values (target_shop_id, actor_id)
  returning id into request_id;

  return jsonb_build_object(
    'request_id', request_id,
    'remaining_today', 29 - daily_count
  );
end;
$$;

revoke all on function public.authorize_dukwise_ai_request(uuid) from public, anon;
grant execute on function public.authorize_dukwise_ai_request(uuid) to authenticated;

comment on table public.dukwise_ai_usage is
  'Metadata-only Dukwise AI quota and reliability audit. No prompts, answers or shop data are stored.';

comment on function public.authorize_dukwise_ai_request(uuid) is
  'Owner/Pro authorization and per-shop rate limit for the Dukwise AI Edge Function.';
