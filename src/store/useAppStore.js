import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { INIT_TRANSACTIONS, INIT_CUSTOMERS } from '../data/mockData'

const useAppStore = create(
  persist(
    (set, get) => ({
      transactions: INIT_TRANSACTIONS,
      customers: INIT_CUSTOMERS,

      addTransaction: (txn) =>
        set((s) => ({ transactions: [txn, ...s.transactions] })),

      classifyTransaction: (id, classification) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, classified: true, classification } : t
          ),
        })),

      addCustomer: (customer) =>
        set((s) => ({ customers: [...s.customers, customer] })),

      addDebtPayment: (customerId, amount, txnId) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  totalOwed: Math.max(0, c.totalOwed - amount),
                  payments: [
                    ...c.payments,
                    { date: new Date().toISOString(), amount, txnId },
                  ],
                }
              : c
          ),
        })),

      increaseDebt: (customerId, amount) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? { ...c, totalOwed: c.totalOwed + amount }
              : c
          ),
        })),

      getTodayStats: () => {
        const { transactions } = get()
        const today = transactions.filter(
          (t) => Date.now() - t.ts < 86400000
        )
        const income = today
          .filter(
            (t) =>
              t.direction === 'in' &&
              t.classified &&
              t.classification?.type !== 'debt'
          )
          .reduce((a, t) => a + t.amount, 0)
        const expenses = today
          .filter((t) => t.direction === 'out' && t.classified)
          .reduce((a, t) => a + t.amount, 0)
        return {
          income,
          expenses,
          profit: income - expenses,
          unclassifiedCount: transactions.filter((t) => !t.classified).length,
        }
      },

      getTotalOwed: () => {
        const { customers } = get()
        return customers.reduce((a, c) => a + c.totalOwed, 0)
      },
    }),
    {
      name: 'duka-store',
    }
  )
)

export default useAppStore
