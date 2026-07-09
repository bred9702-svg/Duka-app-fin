-- Debt FIFO engine support.
-- Each credit sale remains an independent transaction-backed debt.

alter table public.transactions
  add column if not exists original_amount numeric,
  add column if not exists paid_amount numeric not null default 0,
  add column if not exists debt_status text,
  add column if not exists closed_at timestamptz;

update public.transactions
set
  original_amount = coalesce(original_amount, total_price, amount, remaining_amount, 0),
  paid_amount = greatest(
    0,
    coalesce(original_amount, total_price, amount, remaining_amount, 0) - coalesce(remaining_amount, 0)
  ),
  debt_status = case
    when is_debt = true and coalesce(remaining_amount, 0) > 0 then 'active'
    when is_debt = true then 'closed'
    when operation_type = 'debt_payment' then 'payment'
    else debt_status
  end,
  closed_at = case
    when is_debt = true and coalesce(remaining_amount, 0) = 0 then coalesce(closed_at, created_at)
    else closed_at
  end
where is_debt = true or operation_type = 'debt_payment';

create index if not exists transactions_active_debts_fifo_idx
  on public.transactions (customer_id, created_at)
  where is_debt = true and remaining_amount > 0;

create index if not exists transactions_debt_payments_idx
  on public.transactions (customer_id, created_at desc)
  where operation_type = 'debt_payment';
