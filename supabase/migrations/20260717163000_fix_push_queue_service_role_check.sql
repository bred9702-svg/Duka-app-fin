-- The Edge Function already calls this RPC with Supabase's server key.
-- Authorization is enforced through EXECUTE privileges instead of relying on
-- request.jwt.claim.role, which is not populated for every server-key format.
create or replace function public.claim_push_notification_queue(batch_size integer default 50)
returns setof public.push_notification_queue
language plpgsql
security definer
set search_path = public
as $$
begin
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

revoke all on function public.claim_push_notification_queue(integer)
  from public, anon, authenticated;
grant execute on function public.claim_push_notification_queue(integer)
  to service_role;
