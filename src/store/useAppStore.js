import { create } from 'zustand'
import {
  getTransactions,
  addTransaction,
  classifyTransaction,
  getCustomers,
  addDebtPayment,
  increaseDebt,
  addNewCustomer,
  getProducts,
  getTodayStats,
} from '../lib/db'

const useAppStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────
  transactions: [],
  customers: [],
  products: [],
  todayStats: { income: 0, expenses: 0, profit: 0, unclassified: 0 },
  loading: false,
  error: null,

  // ── Bootstrap — charge tout au démarrage ──────────────────
  bootstrap: async () => {
    set({ loading: true, error: null })
    try {
      const [transactions, customers, products, todayStats] = await Promise.all([
        getTransactions(50),
        getCustomers(),
        getProducts(),
        getTodayStats(),
      ])
      set({ transactions, customers, products, todayStats, loading: false })
    } catch (err) {
      console.error('Bootstrap error:', err)
      set({ error: err.message, loading: false })
    }
  },

  // ── Transactions ──────────────────────────────────────────
  addTransaction: async (txn) => {
    try {
      const saved = await addTransaction(txn)
      set((s) => ({ transactions: [saved, ...s.transactions] }))
      await get().refreshTodayStats()
    } catch (err) {
      console.error('Add transaction error:', err)
    }
  },

  classifyTransaction: async (id, classification) => {
    try {
      const updated = await classifyTransaction(id, classification)
      set((s) => ({
        transactions: s.transactions.map((t) =>
          t.id === id ? { ...t, ...updated } : t
        ),
      }))
      await get().refreshTodayStats()
    } catch (err) {
      console.error('Classify error:', err)
    }
  },

  // ── Customers ─────────────────────────────────────────────
  addCustomer: async (customer) => {
    try {
      const saved = await addNewCustomer(customer.name, customer.phone)
      set((s) => ({ customers: [...s.customers, saved] }))
      return saved
    } catch (err) {
      console.error('Add customer error:', err)
    }
  },

  addDebtPayment: async (customerId, amount, txnId) => {
    try {
      const updated = await addDebtPayment(customerId, amount)
      set((s) => ({
        customers: s.customers.map((c) =>
          c.id === customerId ? { ...c, ...updated } : c
        ),
      }))
    } catch (err) {
      console.error('Debt payment error:', err)
    }
  },

  increaseDebt: async (customerId, amount) => {
    try {
      const updated = await increaseDebt(customerId, amount)
      set((s) => ({
        customers: s.customers.map((c) =>
          c.id === customerId ? { ...c, ...updated } : c
        ),
      }))
    } catch (err) {
      console.error('Increase debt error:', err)
    }
  },

  // ── Stats ─────────────────────────────────────────────────
  refreshTodayStats: async () => {
    try {
      const todayStats = await getTodayStats()
      set({ todayStats })
    } catch (err) {
      console.error('Stats error:', err)
    }
  },
}))

export default useAppStore
