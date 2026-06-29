const DAY_MS = 24 * 60 * 60 * 1000

function toDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function fmtRelativeDay(value, emptyLabel = 'Never') {
  const date = toDate(value)
  if (!date) return emptyLabel

  const today = startOfDay(new Date())
  const target = startOfDay(date)
  const diffDays = Math.round((today - target) / DAY_MS)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 1) return `${diffDays} days ago`

  const daysAhead = Math.abs(diffDays)
  return daysAhead === 1 ? 'Tomorrow' : `In ${daysAhead} days`
}

export function fmtDueStatus(debt) {
  const dueDate = toDate(
    debt.due_date ||
    debt.due_at ||
    debt.payment_due_at ||
    debt.expected_payment_at
  )

  if (!dueDate) return null

  const today = startOfDay(new Date())
  const due = startOfDay(dueDate)
  const diffDays = Math.round((today - due) / DAY_MS)

  if (diffDays > 0) return `${diffDays} days overdue`
  return fmtRelativeDay(dueDate)
}

export function getDebtOriginalAmount(debt) {
  const original =
    debt.original_amount ??
    debt.initial_amount ??
    debt.total_price ??
    debt.amount ??
    debt.remaining_amount ??
    0

  return Number(original) || 0
}

export function getDebtRemainingAmount(debt) {
  const remaining = debt.remaining_amount ?? debt.total_owed ?? getDebtOriginalAmount(debt)
  return Math.max(0, Number(remaining) || 0)
}

export function getDebtPaidAmount(debt) {
  const original = getDebtOriginalAmount(debt)
  const remaining = getDebtRemainingAmount(debt)
  return Math.max(0, original - remaining)
}

export function getDebtProgress(debt) {
  const original = getDebtOriginalAmount(debt)
  if (original <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((getDebtPaidAmount(debt) / original) * 100)))
}

function getPaymentTimestamp(payment) {
  return payment?.paid_at || payment?.created_at || payment?.date || payment?.ts || null
}

export function getLastPaymentDate(customer, transactions = []) {
  const explicitPayments = (customer?.payments || [])
    .map(getPaymentTimestamp)
    .filter(Boolean)

  const transactionPayments = transactions
    .filter((t) => {
      const matchesCustomer =
        t.customer_id === customer?.id ||
        t.classification?.customerId === customer?.id

      const looksLikeDebtPayment =
        t.direction === 'in' &&
        (
          t.operation_type === 'debt_payment' ||
          t.payment_type === 'debt_payment' ||
          t.classification?.type === 'debt'
        )

      return matchesCustomer && looksLikeDebtPayment
    })
    .map((t) => t.paid_at || t.created_at || t.ts)
    .filter(Boolean)

  const latest = [...explicitPayments, ...transactionPayments]
    .map(toDate)
    .filter(Boolean)
    .sort((a, b) => b - a)[0]

  return latest || null
}

export function getActiveDebtCount(customerId, transactions = []) {
  return transactions.filter((t) =>
    t.customer_id === customerId &&
    t.is_debt &&
    (t.remaining_amount || 0) > 0
  ).length
}
