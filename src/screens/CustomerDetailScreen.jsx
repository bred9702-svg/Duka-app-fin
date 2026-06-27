import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import BackButton from '../components/ui/BackButton'
import { newId } from '../utils/formatters'
import CustomerHeader from '../components/customer/CustomerHeader'
import CustomerStats from '../components/customer/CustomerStats'
import PaymentInput from '../components/customer/PaymentInput'
import ActiveDebts from '../components/customer/ActiveDebts'
import PaymentTimeline from '../components/customer/PaymentTimeline'


export default function CustomerDetailScreen() {
  const transactions = useAppStore((s) => s.transactions)
const products = useAppStore((s) => s.products)
  const { id } = useParams()
  const navigate = useNavigate()
  const customers = useAppStore((s) => s.customers)
  const addTransaction = useAppStore((s) => s.addTransaction)
  const addDebtPayment = useAppStore((s) => s.addDebtPayment)
  const [amount, setAmount] = useState('')

  const customer = customers.find((c) => c.id === id)
  const debts = transactions
  .filter(
    (t) =>
      t.customer_id === customer?.id &&
      t.is_debt &&
      (t.remaining_amount || 0) > 0
  )
  .map((t) => ({
    ...t,
    const debts = transactions
  .filter(
    (t) =>
      t.customer_id === customer?.id &&
      t.is_debt &&
      (t.remaining_amount || 0) > 0
  )
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  if (!customer) {
    return (
      <div style={{ flex: 1, padding: 24 }}>
        <BackButton to="/debts" />
        <p style={{ color: 'var(--text-hi)' }}>Customer not found.</p>
      </div>
    )
  }
  function handleRecordPayment(debt) {
  console.log(debt)
}

  function recordPayment() {
    const amt = parseInt(amount, 10)
    if (!amt || amt <= 0) return
    const txn = {
      id: newId('t'),
      amount: amt,
      source: 'cash',
      direction: 'in',
      ts: Date.now(),
      classified: true,
      classification: {
        type: 'debt',
        customerId: customer.id,
        productName: null,
        quantity: null,
        category: null,
      },
    }
    addTransaction(txn)
    addDebtPayment(customer.id, amt, txn.id)
    setAmount('')
  }

  return (
    <div style={{ flex: 1, padding: '14px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 120, height: 120, top: 20, right: -30, background: 'rgba(91,159,240,0.15)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <BackButton to="/debts" />
        <CustomerHeader customer={customer} />
 <CustomerStats customer={customer} />
        <ActiveDebts
  debts={debts}
  onRecordPayment={handleRecordPayment}
/>

        <PaymentInput
  customer={customer}
  amount={amount}
  setAmount={setAmount}
  onRecord={recordPayment}
/>
        <PaymentTimeline
    payments={customer.payments || []}
/>

        </div>
    </div>
  )
}
