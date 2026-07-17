-- Owners can remove an unclassified duplicate from the inbox without deleting
-- the original business record. The existing transaction audit trigger records
-- both ignore and restore operations.
create or replace function public.set_unclassified_transaction_ignored(
  target_transaction_id uuid,
  ignored boolean
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  transaction_record public.transactions%rowtype;
begin
  if actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  select *
  into transaction_record
  from public.transactions
  where id = target_transaction_id
  for update;

  if not found or not public.is_shop_owner(transaction_record.shop_id) then
    raise exception using
      errcode = '42501',
      message = 'Only the Shop Owner can manage this transaction.';
  end if;

  if ignored then
    if transaction_record.classified then
      raise exception using
        errcode = '22023',
        message = 'Only an unclassified transaction can be marked as a duplicate.';
    end if;

    update public.transactions
    set classified = true,
        operation_type = 'ignored'
    where id = target_transaction_id
    returning * into transaction_record;
  else
    if not transaction_record.classified
      or transaction_record.operation_type is distinct from 'ignored' then
      raise exception using
        errcode = '22023',
        message = 'Only an ignored duplicate can be restored.';
    end if;

    update public.transactions
    set classified = false,
        operation_type = null
    where id = target_transaction_id
    returning * into transaction_record;
  end if;

  return transaction_record;
end;
$$;

revoke all on function public.set_unclassified_transaction_ignored(uuid, boolean)
  from public, anon;
grant execute on function public.set_unclassified_transaction_ignored(uuid, boolean)
  to authenticated;

comment on function public.set_unclassified_transaction_ignored(uuid, boolean)
is 'Allows an active Shop Owner to ignore or restore an unclassified duplicate without deleting its audit history.';
