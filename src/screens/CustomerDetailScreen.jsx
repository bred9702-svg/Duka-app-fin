import { useState } from 'react'
import { useParams } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import BackButton from '../components/ui/BackButton'
import { newId } from '../utils/formatters'
import { fmtRelativeDay, getLastPaymentDate } from '../utils/debtInsights'
import CustomerHeader from '../components/customer/CustomerHeader'
import CustomerStats from '../components/customer/CustomerStats'
import PaymentInput from '../components/customer/PaymentInput'
import ActiveDebts from '../components/customer/ActiveDebts'
import PaymentTimeline from '../components/customer/PaymentTimeline'
import CustomerTimeline from '../components/customer/CustomerTimeline'

export default function CustomerDetailScreen() {
  const transactions = useAppStore((s) => s.transactions)
  const customers = useAppStore((s) => s.customers)
  const addTransaction = useAppStore((s) => s.addTransaction)
  const addDebtPayment = useAppStore((s) => s.addDebtPayment)

  const { id } = useParams()

  const [amount, setAmount] = useState('')

  // ← C'était cette ligne qui avait disparu
  const customer = customers.find((c) => c.id === id)

  const lastPaymentLabel = fmtRelativeDay(
    getLastPaymentDate(customer, transactions),
    'Never'
  )

  const paymentHistory = transactions
    .filter((t) =>
      (t.customer_id === customer?.id || t.classification?.customerId === customer?.id) &&
      t.direction === 'in' &&
      (t.operation_type === 'debt_payment' || t.classification?.type === 'debt')
    )
    .sort((a, b) => new Date(b.created_at || b.ts) - new Date(a.created_at || a.ts))

  const debts = transactions
    .filter(
      (t) =>
        t.customer_id === customer?.id &&
        t.is_debt &&
        (t.remaining_amount || 0) > 0
    )
    .sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    )

  if (!customer) {
    return (
      <div style={{ flex: 1, padding: 24 }}>
        <BackButton to="/debts" />
        <p style={{ color: 'var(--text-hi)' }}>
          Customer not found.
        </p>
      </div>
    )
  }

  function handleRecordPayment(debt) {
    console.log(debt)
  }

  async function recordPayment() {
    const amt = parseInt(amount, 10)

    if (!amt || amt <= 0) return

    const txn = {
      id: newId('t'),
      amount: amt,
      source: 'cash',
      direction: 'in',
      ts: Date.now(),
      classified: true,
      operation_type: 'debt_payment',
      customer_id: customer.id,
      is_debt: false,
      remaining_amount: 0,
      classification: {
        type: 'debt',
        customerId: customer.id,
        productName: null,
        quantity: null,
        category: null,
      },
    }

    const saved = await addTransaction(txn)
    await addDebtPayment(customer.id, amt, saved?.id || txn.id)

    setAmount('')
  }

  return (
    <div
      style={{
        flex: 1,
        padding: '14px 14px 8px',
        position: 'relative',
      }}
    >
      <div
        className="bg-blob"
        style={{
          width: 120,
          height: 120,
          top: 20,
          right: -30,
          background: 'rgba(91,159,240,0.15)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <BackButton to="/debts" />

        <CustomerHeader customer={customer} />

        <CustomerStats
  customer={customer}
  lastPaymentLabel={lastPaymentLabel}
  activeDebtCount={debts.length}
/>

     <CustomerTimeline
  debts={debts}
  payments={paymentHistory}
/>

<PaymentInput
  customer={customer}
  amount={amount}
  setAmount={setAmount}
  onRecord={recordPayment}
/>
      </div>
    </div>
  )
}
