import { create } from 'zustand'
import {
  getTransactions,
  addTransaction as dbAddTransaction,
  classifyTransaction as dbClassify,
  getCustomers,
  addDebtPayment as dbAddDebtPayment,
  increaseDebt as dbIncreaseDebt,
  addNewCustomer,
  getProducts,
  getTodayStats,
  addStock,
} from '../lib/db'

const useAppStore = create((set, get) => ({
  transactions: [],
  customers: [],
  products: [],
  todayStats: { income: 0, expenses: 0, profit: 0, unclassified: 0 },
  loading: false,
  error: null,
  theme: localStorage.getItem('duka-theme') || 'dark',

setTheme: (theme) => {
  localStorage.setItem('duka-theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
  set({ theme })
},

bootstrap: async () => {
  // Applique le thème sauvegardé
  const savedTheme = localStorage.getItem('duka-theme') || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
  set({ theme: savedTheme })
  // ... reste du code bootstrap    
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

  addTransaction: async (txn) => {
    try {
      const saved = await dbAddTransaction(txn)
      set((s) => ({ transactions: [saved, ...s.transactions] }))
      await get().refreshTodayStats()
      return saved
    } catch (err) {
      console.error('Add transaction error:', err)
    }
  },

  classifyTransaction: async (id, classification) => {
    try {
      const updated = await dbClassify(id, classification)
      set((s) => ({
        transactions: s.transactions.map((t) => {
          const debtUpdate = updated.debtUpdates?.find((d) => d.id === t.id)
          if (debtUpdate) return { ...t, ...debtUpdate }
          return t.id === id ? { ...t, ...updated } : t
        }),
        customers: updated.customerUpdate
          ? s.customers.map((c) =>
              c.id === updated.customerUpdate.id ? { ...c, ...updated.customerUpdate } : c
            )
          : s.customers,
      }))
      await get().refreshTodayStats()
      return updated
    } catch (err) {
      console.error('Classify error:', err)
    }
  },

  addCustomer: async (customer) => {
    try {
      const saved = await addNewCustomer(customer.name, customer.phone)
      set((s) => ({ customers: [...s.customers, saved] }))
      return saved
    } catch (err) {
      console.error('Add customer error:', err)
    }
  },

  addDebtPayment: async (customerId, amount, paymentTransactionId = null) => {
    try {
      const updated = await dbAddDebtPayment(customerId, amount, paymentTransactionId)
      set((s) => ({
        customers: s.customers.map((c) =>
          c.id === customerId ? { ...c, ...updated.customer } : c
        ),
        transactions: s.transactions.map((t) => {
          const debtUpdate = updated.debts?.find((d) => d.id === t.id)
          if (debtUpdate) return { ...t, ...debtUpdate }
          if (paymentTransactionId && t.id === paymentTransactionId) {
            return {
              ...t,
              classified: true,
              operation_type: 'debt_payment',
              customer_id: customerId,
              is_debt: false,
              remaining_amount: 0,
            }
          }
          return t
        }),
      }))
      return updated
    } catch (err) {
      console.error('Debt payment error:', err)
    }
  },

  increaseDebt: async (customerId, amount) => {
    try {
      const updated = await dbIncreaseDebt(customerId, amount)
      set((s) => ({
        customers: s.customers.map((c) =>
          c.id === customerId ? { ...c, ...updated } : c
        ),
      }))
    } catch (err) {
      console.error('Increase debt error:', err)
    }
  },

  refreshTodayStats: async () => {
    try {
      const todayStats = await getTodayStats()
      set({ todayStats })
    } catch (err) {
      console.error('Stats error:', err)
    }
  },

  recordPurchase: async ({ items, supplier, purchaseDate, notes }) => {
    try {
      const totalInvestment = items.reduce((a, it) => a + it.purchasePrice * it.quantity, 0)
      const expectedRevenue = items.reduce((a, it) => a + it.unitPrice * it.quantity, 0)
      const expectedProfit = expectedRevenue - totalInvestment

      // Increase stock for every line item, one product at a time
      const updatedStocks = {}
      for (const item of items) {
        const newStock = await addStock(item.productId, item.quantity)
        updatedStocks[item.productId] = newStock
      }

      set((s) => ({
        products: s.products.map((p) =>
          p.id in updatedStocks ? { ...p, stock_current: updatedStocks[p.id] } : p
        ),
      }))

      // Register the purchase as a single expense transaction
      const productNames = items.map((it) => it.name).join(', ')
      const savedTxn = await dbAddTransaction({
        operation_type: 'expense',
        expense_category: 'stock',
        amount: totalInvestment,
        direction: 'out',
        classified: true,
        raw_message: supplier
          ? `Stock purchase from ${supplier}: ${productNames}`
          : `Stock purchase: ${productNames}`,
      })
      set((s) => ({ transactions: [savedTxn, ...s.transactions] }))
      await get().refreshTodayStats()

      // Local purchase history record (no dedicated backend table yet)
      const record = {
        id: `purchase-${Date.now()}`,
        date: purchaseDate || new Date().toISOString(),
        supplier: supplier || null,
        notes: notes || null,
        items,
        totalInvestment,
        expectedRevenue,
        expectedProfit,
      }
      try {
        const key = 'duka-purchase-history'
        const existing = JSON.parse(localStorage.getItem(key) || '[]')
        localStorage.setItem(key, JSON.stringify([record, ...existing].slice(0, 100)))
      } catch (e) {
        console.error('Purchase history save error:', e)
      }

      return record
    } catch (err) {
      console.error('Record purchase error:', err)
      throw err
    }
  },
}))

export default useAppStore
