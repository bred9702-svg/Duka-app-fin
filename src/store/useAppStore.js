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

const DEFAULT_NOTIFICATION_SETTINGS = {
  lowStockAlerts: true,
  newDebtAlerts: true,
  debtPaymentAlerts: true,
  paymentReceivedAlerts: true,
  saleAlerts: true,
  stockPurchaseAlerts: true,
  cashOutAlerts: true,
  dailySummary: false,
  weeklySummary: true,
}

function loadSession() {
  try {
    const raw = localStorage.getItem('duka-session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadNotificationSettings() {
  try {
    const raw = localStorage.getItem('duka-notifications')
    return raw
      ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) }
      : DEFAULT_NOTIFICATION_SETTINGS
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS
  }
}

function createInAppNotification({ type, title, message, dedupeKey = null }) {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    title,
    message,
    dedupeKey,
    createdAt: new Date().toISOString(),
  }
}

function isNotificationEnabled(settings, key, fallbackKeys = []) {
  if (!settings) return true

  if (typeof settings[key] === 'boolean') {
    return settings[key]
  }

  for (const fallbackKey of fallbackKeys) {
    if (typeof settings[fallbackKey] === 'boolean') {
      return settings[fallbackKey]
    }
  }

  return true
}

function formatAmount(amount) {
  return `${Number(amount || 0).toLocaleString('en-KE')} KES`
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
  notificationSettings: loadNotificationSettings(),
  inAppNotifications: [],

  setTheme: (theme) => {
    localStorage.setItem('duka-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },

  updateNotificationSetting: (key, value) => {
    set((s) => {
      const notificationSettings = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...s.notificationSettings,
        [key]: value,
      }

      localStorage.setItem('duka-notifications', JSON.stringify(notificationSettings))

      return { notificationSettings }
    })
  },

  pushInAppNotification: (notification) => {
    const saved = createInAppNotification(notification)

    set((s) => {
      if (
        saved.dedupeKey &&
        s.inAppNotifications.some((existing) => existing.dedupeKey === saved.dedupeKey)
      ) {
        return {}
      }

      return {
        inAppNotifications: [saved, ...s.inAppNotifications].slice(0, 5),
      }
    })

    return saved
  },

  dismissInAppNotification: (id) => {
    set((s) => ({
      inAppNotifications: s.inAppNotifications.filter((notification) => notification.id !== id),
    }))
  },

  notifyLowStockIfNeeded: (productId, newStock) => {
    const settings = get().notificationSettings

    if (!isNotificationEnabled(settings, 'lowStockAlerts', ['lowStock'])) {
      return
    }

    const product = get().products.find((p) => p.id === productId)
    if (!product) return

    const alertLevel = Number(product.stock_alert ?? 0)
    const currentStock = Number(newStock ?? product.stock_current ?? 0)

    if (currentStock > alertLevel) return

    get().pushInAppNotification({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${product.name} is running low. ${currentStock} unit${currentStock === 1 ? '' : 's'} left.`,
      dedupeKey: `low-stock:${productId}:${currentStock}`,
    })
  },

  registerOwner: async (data) => {
    // A brand new account must never inherit a previous account's local
    // settings cache (shop profile, purchase history, preferences, etc.)
    clearLocalAppData()

    const trialStart = new Date()
    const trialEnd = new Date(trialStart)
    trialEnd.setDate(trialStart.getDate() + 15)

    const session = {
      role: 'owner',
      name: data.name,
      phone: data.phone,
      shopName: data.shopName,
      shopAddress: data.shopAddress,
      photo: data.photo || null,
      isOnboarded: false,
      trialStart: trialStart.toISOString(),
      trialEnd: trialEnd.toISOString(),
      subscriptionStatus: 'trial',
    }

    localStorage.setItem('duka-session', JSON.stringify(session))
    localStorage.setItem('duka-notifications', JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS))

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

    set({
      session,
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
      inAppNotifications: [],
    })

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

    set({
      session,
      notificationSettings: loadNotificationSettings(),
      inAppNotifications: [],
    })

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
      notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
      inAppNotifications: [],
      loading: false,
      error: null,
    })
  },

  bootstrap: async () => {
    // Applique le thème sauvegardé
    const savedTheme = localStorage.getItem('duka-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)

    set({
      theme: savedTheme,
      notificationSettings: loadNotificationSettings(),
    })

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
      const existingTransaction = get().transactions.find((t) => t.id === id)
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

      const settings = get().notificationSettings
      const direction = existingTransaction?.direction || updated.direction
      const operationType = updated.operation_type || classification?.type || classification?.operation_type
      const expenseCategory =
        updated.expense_category ||
        classification?.expense_category ||
        classification?.category

      if (
        direction === 'in' &&
        isNotificationEnabled(settings, 'paymentReceivedAlerts', ['paymentReceived'])
      ) {
        get().pushInAppNotification({
          type: 'payment_received',
          title: 'Payment Received',
          message: `${formatAmount(updated.amount || existingTransaction?.amount)} cash in has been classified.`,
          dedupeKey: `payment-received:${id}`,
        })
      }

      if (
        direction === 'out' &&
        operationType === 'expense' &&
        ['rent', 'salary', 'utilities', 'other'].includes(expenseCategory) &&
        isNotificationEnabled(settings, 'cashOutAlerts', ['dailySummary'])
      ) {
        const labelMap = {
          rent: 'Rent',
          salary: 'Salary',
          utilities: 'Utilities',
          other: 'Other',
        }

        get().pushInAppNotification({
          type: 'cash_out',
          title: 'Cash Out Classified',
          message: `${formatAmount(updated.amount || existingTransaction?.amount)} was classified as ${labelMap[expenseCategory] || 'Expense'}.`,
          dedupeKey: `cash-out-expense:${id}`,
        })
      }

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

      const settings = get().notificationSettings
      const customer = updated.customer || get().customers.find((c) => c.id === customerId)

      if (isNotificationEnabled(settings, 'debtPaymentAlerts', ['paymentReceived'])) {
        get().pushInAppNotification({
          type: 'debt_payment',
          title: 'Debt Payment Received',
          message: `${customer?.name || 'Customer'} paid ${formatAmount(amount)} toward their debt.`,
          dedupeKey: paymentTransactionId
            ? `debt-payment:${paymentTransactionId}`
            : `debt-payment:${customerId}:${amount}:${Date.now()}`,
        })
      }

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

      const settings = get().notificationSettings

      if (isNotificationEnabled(settings, 'stockPurchaseAlerts', ['dailySummary'])) {
        get().pushInAppNotification({
          type: 'stock_purchase',
          title: 'Stock Purchase Saved',
          message: `${items.length} product${items.length === 1 ? '' : 's'} added to inventory. Total investment: ${formatAmount(totalInvestment)}.`,
          dedupeKey: `stock-purchase:${record.id}`,
        })
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

      const productById = new Map(get().products.map((product) => [product.id, product]))
      const savedTxns = []

      for (const item of items) {
        const lineTotal = item.unitPrice * item.quantity
        const lineProfit = (item.unitPrice - (item.costPrice || 0)) * item.quantity

        const savedTxn = await dbAddTransaction({
          amount: lineTotal,
          source: 'cash',
          direction: 'out',
          classified: true,
          operation_type: 'debt',
          customer_id: customerId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: lineTotal,
          profit: lineProfit,
          is_debt: true,
          original_amount: lineTotal,
          paid_amount: 0,
          remaining_amount: lineTotal,
          debt_status: 'active',
          mpesa_sender_name: null,
          mpesa_sender_phone: null,
          mpesa_reference: null,
        })

        savedTxns.push({
          ...savedTxn,
          product: productById.get(item.productId) || null,
        })
      }

      const updatedCustomer = await dbIncreaseDebt(customerId, grandTotal)

      set((s) => ({
        products: s.products.map((p) =>
          p.id in updatedStocks ? { ...p, stock_current: updatedStocks[p.id] } : p
        ),
        transactions: [...savedTxns, ...s.transactions],
        customers: s.customers.map((c) =>
          c.id === customerId ? { ...c, ...updatedCustomer } : c
        ),
      }))

      Object.entries(updatedStocks).forEach(([productId, newStock]) => {
        get().notifyLowStockIfNeeded(productId, newStock)
      })

      const settings = get().notificationSettings
      const customer = updatedCustomer || get().customers.find((c) => c.id === customerId)

      if (isNotificationEnabled(settings, 'newDebtAlerts', ['newDebt'])) {
        get().pushInAppNotification({
          type: 'new_debt',
          title: 'New Debt Created',
          message: `${customer?.name || 'Customer'} now owes ${formatAmount(grandTotal)}.`,
          dedupeKey: `new-debt:${savedTxns.map((txn) => txn.id).join(',') || customerId}`,
        })
      }

      await get().refreshTodayStats()

      return {
        grandTotal,
        totalProfit,
        itemCount: items.length,
        totalQuantity: items.reduce((a, it) => a + it.quantity, 0),
        transaction: savedTxns[0] || null,
        transactions: savedTxns,
        customer: updatedCustomer,
      }
    } catch (err) {
      console.error('Create debt sale error:', err)
      throw err
    }
  },

  completeSale: async ({ linkedTransactionId, items, customerId = null }) => {
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

      Object.entries(updatedStocks).forEach(([productId, newStock]) => {
        get().notifyLowStockIfNeeded(productId, newStock)
      })

      // Classify the existing payment transaction — do NOT insert a new one,
      // otherwise the same money would be counted twice.
      const updatedTxn = await completeSalePayment(linkedTransactionId, {
        items,
        grandTotal,
        totalProfit,
        customerId,
      })

      set((s) => ({
        transactions: s.transactions.map((t) =>
          t.id === linkedTransactionId ? { ...t, ...updatedTxn } : t
        ),
      }))

      const settings = get().notificationSettings

      if (isNotificationEnabled(settings, 'saleAlerts', ['paymentReceivedAlerts', 'paymentReceived'])) {
        get().pushInAppNotification({
          type: 'sale',
          title: 'Sale Confirmed',
          message: `Sale of ${formatAmount(grandTotal)} was recorded successfully.`,
          dedupeKey: `sale:${linkedTransactionId}`,
        })
      }

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
