-- Keep the existing operation type validation while allowing Owners to archive
-- an unclassified duplicate without deleting its original transaction record.
alter table public.transactions
  drop constraint if exists transactions_operation_type_check;

alter table public.transactions
  add constraint transactions_operation_type_check
  check (
    operation_type is null
    or operation_type in ('sale', 'expense', 'debt', 'debt_payment', 'ignored')
  );

comment on constraint transactions_operation_type_check on public.transactions
is 'Allows supported transaction classifications, including safely ignored duplicates.';
