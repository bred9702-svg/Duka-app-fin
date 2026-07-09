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
  completeSalePayment,
  addProduct,
} from '../lib/db'

function loadSession() {
  try {
    const raw = localStorage.getItem('duka-session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// All the account-scoped local caches used across settings/purchase
// screens. Kept in one place so registration and sign-out never miss one.
// duka-theme is intentionally excluded — it's a device preference, not
// account data.
const LOCAL_APP_DATA_KEYS = [
  'duka-shop-profile',
  'duka-payment-methods',
  'duka-store-settings',
  'duka-notifications',
  'duka-language',
  'duka-purchase-history',
  'duka-pending-stock-purchases',
]

function clearLocalAppData() {
  LOCAL_APP_DATA_KEYS.forEach((key) => localStorage.removeItem(key))
}

const useAppStore = create((set, get) => ({
  transactions: [],
  customers: [],
  products: [],
  todayStats: { income: 0, expenses: 0, profit: 0, unclassified: 0 },
  loading: false,
  error: null,
  theme: localStorage.getItem('duka-theme') || 'dark',
  session: loadSession(),

setTheme: (theme) => {
  localStorage.setItem('duka-theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
  set({ theme })
},

registerOwner: async (data) => {
  // A brand new account must never inherit a previous account's local
  // settings cache (shop profile, purchase history, preferences, etc.)
  clearLocalAppData()

  const session = {
    role: 'owner',
    name: data.name,
    phone: data.phone,
    shopName: data.shopName,
    shopAddress: data.shopAddress,
    photo: data.photo || null,
    isOnboarded: false,
  }
  localStorage.setItem('duka-session', JSON.stringify(session))

  // Seed the Shop Profile screen with what was just entered, so it
  // reflects this account immediately instead of stale defaults.
  localStorage.setItem('duka-shop-profile', JSON.stringify({
    name: data.shopName,
    type: 'Wines & Spirits',
    phone: data.phone,
    address: data.shopAddress || '',
    currency: 'KES — Kenyan Shilling',
    timezone: 'Africa/Nairobi',
  }))

  set({ session })
  // In case registration follows a signOut() that emptied the data —
  // bootstrap() only runs once on initial app mount otherwise.
  await get().bootstrap()
},

signIn: async (data) => {
  const session = {
    role: data.role || 'owner',
    name: data.name || 'Shop Owner',
    phone: data.phone,
    shopName: data.shopName || null,
    shopAddress: data.shopAddress || null,
    photo: null,
    isOnboarded: true,
  }
  localStorage.setItem('duka-session', JSON.stringify(session))
  set({ session })
  // signOut() empties products/transactions/customers — reload them now
  // that a session is active again, since bootstrap() only runs once
  // on initial app mount.
  await get().bootstrap()
},

completeOnboarding: () => {
  set((s) => {
    if (!s.session) return {}
    const session = { ...s.session, isOnboarded: true }
    localStorage.setItem('duka-session', JSON.stringify(session))
    return { session }
  })
},

signOut: () => {
  localStorage.removeItem('duka-session')
  clearLocalAppData()
  set({
    session: null,
    transactions: [],
    customers: [],
    products: [],
    todayStats: { income: 0, expenses: 0, profit: 0, unclassified: 0 },
    loading: false,
    error: null,
  })
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
        // Standalone purchase (not started from Cash Out) — record its own
        // expense, using the exact same transaction shape as the proven
        // working Cash In/Out flow.
        const savedTxn = await dbAddTransaction({
          amount: totalInvestment,
          source: 'cash',
          direction: 'out',
          classified: true,
          operation_type: 'expense',
          expense_category: 'stock',
          mpesa_sender_name: null,
          mpesa_sender_phone: null,
          mpesa_reference: null,
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

  createDebtSale: async ({ items, customerId }) => {
    try {
      if (!customerId) {
        throw new Error('A customer is required for a debt sale.')
      }
      if (!items?.length) {
        throw new Error('Add at least one product before confirming debt.')
      }

      const grandTotal = items.reduce((a, it) => a + it.unitPrice * it.quantity, 0)
      const totalProfit = items.reduce(
        (a, it) => a + (it.unitPrice - (it.costPrice || 0)) * it.quantity,
        0
      )

      const updatedStocks = {}
      for (const item of items) {
        const newStock = await updateStock(item.productId, item.quantity)
        updatedStocks[item.productId] = newStock
      }

      const savedTxn = await dbAddTransaction({
        amount: grandTotal,
        source: 'manual',
        direction: 'out',
        classified: true,
        operation_type: 'debt',
        customer_id: customerId,
        product_id: items.length === 1 ? items[0].productId : null,
        quantity: items.length === 1 ? items[0].quantity : null,
        unit_price: items.length === 1 ? items[0].unitPrice : null,
        total_price: grandTotal,
        profit: totalProfit,
        is_debt: true,
        original_amount: grandTotal,
        paid_amount: 0,
        remaining_amount: grandTotal,
        debt_status: 'active',
        mpesa_sender_name: null,
        mpesa_sender_phone: null,
        mpesa_reference: null,
      })

      const updatedCustomer = await dbIncreaseDebt(customerId, grandTotal)

      set((s) => ({
        products: s.products.map((p) =>
          p.id in updatedStocks ? { ...p, stock_current: updatedStocks[p.id] } : p
        ),
        transactions: [savedTxn, ...s.transactions],
        customers: s.customers.map((c) =>
          c.id === customerId ? { ...c, ...updatedCustomer } : c
        ),
      }))

      await get().refreshTodayStats()

      return {
        grandTotal,
        totalProfit,
        itemCount: items.length,
        totalQuantity: items.reduce((a, it) => a + it.quantity, 0),
        transaction: savedTxn,
        customer: updatedCustomer,
      }
    } catch (err) {
      console.error('Create debt sale error:', err)
      throw err
    }
  },

  completeSale: async ({ linkedTransactionId, items }) => {
    try {
      if (!linkedTransactionId) {
        throw new Error('A sale must be linked to a payment transaction.')
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

      // Classify the existing payment transaction — do NOT insert a new one,
      // otherwise the same money would be counted twice.
      const updatedTxn = await completeSalePayment(linkedTransactionId, {
        items, grandTotal, totalProfit,
      })

      set((s) => ({
        transactions: s.transactions.map((t) =>
          t.id === linkedTransactionId ? { ...t, ...updatedTxn } : t
        ),
      }))

      await get().refreshTodayStats()

      return {
        grandTotal,
        totalProfit,
        itemCount: items.length,
        totalQuantity: items.reduce((a, it) => a + it.quantity, 0),
        transaction: updatedTxn,
      }
    } catch (err) {
      console.error('Complete sale error:', err)
      throw err
    }
  },

  createProduct: async (data) => {
    try {
      const saved = await addProduct(data)
      set((s) => ({ products: [...s.products, saved] }))
      return saved
    } catch (err) {
      console.error('Create product error:', err)
      throw err
    }
  },
}))

export default useAppStore
