import { useMemo, useState } from 'react'
import useAppStore from '../store/useAppStore'

export default function useCustomerDetails(id) {
  const customers = useAppStore((s) => s.customers)
  const transactions = useAppStore((s) => s.transactions)
  const products = useAppStore((s) => s.products)
  const addTransaction = useAppStore((s) => s.addTransaction)
  const addDebtPayment = useAppStore((s) => s.addDebtPayment)

  const [amount, setAmount] = useState('')

  const customer = useMemo(
    () => customers.find((c) => c.id === id),
    [customers, id]
  )

  const debts = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.customer_id === id &&
          t.is_debt &&
          (t.remaining_amount || 0) > 0
      )
      .map((t) => ({
        ...t,
        product: products.find((p) => p.id === t.product_id),
      }))
  }, [transactions, products, id])

  return {
    customer,
    debts,
    amount,
    setAmount,
    addTransaction,
    addDebtPayment,
  }
}
