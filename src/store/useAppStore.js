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
  updateStock,
  updateProductPrice,
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

  recordPurchase: async ({ items, supplier, purchaseDate, notes, linkedTransactionId = null, budget = null }) => {
    try {
      const totalInvestment = items.reduce((a, it) => a + it.purchasePrice * it.quantity, 0)
      const expectedRevenue = items.reduce((a, it) => a + it.unitPrice * it.quantity, 0)
      const expectedProfit = expectedRevenue - totalInvestment

      // Increase stock for every line item, one product at a time
      const updatedStocks = {}
      const updatedPrices = {}
      for (const item of items) {
        const newStock = await addStock(item.productId, item.quantity)
        updatedStocks[item.productId] = newStock

        if (item.priceChanged) {
          await updateProductPrice(item.productId, item.unitPrice)
          updatedPrices[item.productId] = item.unitPrice
        }
      }

      set((s) => ({
        products: s.products.map((p) => {
          if (!(p.id in updatedStocks)) return p
          return {
            ...p,
            stock_current: updatedStocks[p.id],
            ...(p.id in updatedPrices ? { unit_price: updatedPrices[p.id] } : {}),
          }
        }),
      }))

      const productNames = items.map((it) => it.name).join(', ')

      if (linkedTransactionId) {
        // This purchase completes an existing Cash Out → Expense → Stock
        // transaction — don't record a second expense, just mark it done.
        try {
          const key = 'duka-pending-stock-purchases'
          const pending = JSON.parse(localStorage.getItem(key) || '[]')
          localStorage.setItem(
            key,
            JSON.stringify(pending.filter((p) => p.transactionId !== linkedTransactionId))
          )
        } catch (e) {
          console.error('Pending purchase cleanup error:', e)
        }
      } else {
        // Standalone purchase (not started from Cash Out) — record its own expense
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
      }

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
        linkedTransactionId,
        budget,
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

  addPendingStockPurchase: (record) => {
    try {
      const key = 'duka-pending-stock-purchases'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      localStorage.setItem(key, JSON.stringify([record, ...existing]))
    } catch (e) {
      console.error('Add pending purchase error:', e)
    }
  },

  recordSale: async ({ items, type, customerId, newCustomer }) => {
    try {
      let finalCustomerId = customerId

      if (type === 'debt' && !finalCustomerId && newCustomer?.name) {
        const saved = await addNewCustomer(newCustomer.name, newCustomer.phone || null)
        if (!saved?.id) throw new Error('Failed to create customer')
        finalCustomerId = saved.id
        set((s) => ({ customers: [...s.customers, saved] }))
      }

      const grandTotal = items.reduce((a, it) => a + it.unitPrice * it.quantity, 0)
      const totalProfit = items.reduce(
        (a, it) => a + (it.unitPrice - (it.costPrice || 0)) * it.quantity, 0
      )

      // Reduce stock for every item in the cart
      const updatedStocks = {}
      for (const item of items) {
        const newStock = await updateStock(item.productId, item.quantity)
        updatedStocks[item.productId] = newStock
      }
      set((s) => ({
        products: s.products.map((p) =>
          p.id in updatedStocks ? { ...p, stock_current: updatedStocks[p.id] } : p
        ),
      }))

      const productSummary = items.map((it) => `${it.name} x${it.quantity}`).join(', ')
      const isDebt = type === 'debt'

      // One transaction row represents the whole multi-item sale
      const savedTxn = await dbAddTransaction({
        operation_type: isDebt ? 'debt' : 'sale',
        direction: 'in',
        amount: grandTotal,
        classified: true,
        product_id: items.length === 1 ? items[0].productId : null,
        quantity: items.length === 1 ? items[0].quantity : null,
        unit_price: items.length === 1 ? items[0].unitPrice : null,
        total_price: grandTotal,
        profit: totalProfit,
        customer_id: isDebt ? finalCustomerId : null,
        is_debt: isDebt,
        original_amount: isDebt ? grandTotal : null,
        paid_amount: 0,
        remaining_amount: isDebt ? grandTotal : 0,
        debt_status: isDebt ? 'active' : null,
        raw_message: `Sale: ${productSummary}`,
      })

      set((s) => ({ transactions: [savedTxn, ...s.transactions] }))

      if (isDebt && finalCustomerId) {
        const updatedCustomer = await dbIncreaseDebt(finalCustomerId, grandTotal)
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === finalCustomerId ? { ...c, ...updatedCustomer } : c
          ),
        }))
      }

      await get().refreshTodayStats()

      return {
        grandTotal,
        totalProfit,
        itemCount: items.length,
        totalQuantity: items.reduce((a, it) => a + it.quantity, 0),
        transaction: savedTxn,
      }
    } catch (err) {
      console.error('Record sale error:', err)
      throw err
    }
  },
}))

export default useAppStore
