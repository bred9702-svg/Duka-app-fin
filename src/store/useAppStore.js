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

const STORE_SETTINGS_KEY = 'duka-store-settings'
const NOTIFICATIONS_KEY = 'duka-notifications'
const NOTIFICATION_SETTINGS_KEY = 'duka-notification-settings'

const DEFAULT_NOTIFICATION_SETTINGS = {
  lowStockAlerts: true,
  newDebtAlerts: true,
  debtPaymentAlerts: true,
  dailySummary: true,
  weeklySummary: true,
  paymentReceivedAlerts: true,
  saleAlerts: true,
  stockPurchaseAlerts: true,
  cashOutAlerts: true,
}

export const DEFAULT_BUSINESS_PREFERENCES = {
  currency: 'KES',
  taxEnabled: false,
  taxRate: '',
  stockAlerts: true,
  lowStockThreshold: '5',
  dailyAiBrief: true,
  aiRecommendations: true,
}

function normalizeBusinessPreferences(settings = {}) {
  const next = { ...DEFAULT_BUSINESS_PREFERENCES, ...settings }

  return {
    ...next,
    currency: next.currency || DEFAULT_BUSINESS_PREFERENCES.currency,
    taxEnabled: Boolean(next.taxEnabled),
    taxRate: String(next.taxRate ?? ''),
    stockAlerts: next.stockAlerts !== false,
    lowStockThreshold: String(next.lowStockThreshold || DEFAULT_BUSINESS_PREFERENCES.lowStockThreshold),
    dailyAiBrief: next.dailyAiBrief !== false,
    aiRecommendations: next.aiRecommendations !== false,
  }
}

function loadBusinessPreferences() {
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY)
    return normalizeBusinessPreferences(raw ? JSON.parse(raw) : {})
  } catch {
    return DEFAULT_BUSINESS_PREFERENCES
  }
}

function saveBusinessPreferences(settings) {
  const normalized = normalizeBusinessPreferences(settings)
  localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(normalized))
  return normalized
}

function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveNotifications(notifications) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
}

function loadNotificationSettings() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_SETTINGS_KEY)
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(raw ? JSON.parse(raw) : {}),
    }
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS
  }
}

function saveNotificationSettings(settings) {
  const normalized = { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings }
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(normalized))
  return normalized
}

function createNotification(payload) {
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title,
    message: payload.message,
    type: payload.type || 'info',
    read: false,
    createdAt: new Date().toISOString(),
    ...payload,
  }
}

// All the account-scoped local caches used across settings/purchase
// screens. Kept in one place so registration and sign-out never miss one.
// duka-theme is intentionally excluded — it's a device preference, not
// account data.
const LOCAL_APP_DATA_KEYS = [
  'duka-shop-profile',
  'duka-payment-methods',
  STORE_SETTINGS_KEY,
  NOTIFICATIONS_KEY,
  NOTIFICATION_SETTINGS_KEY,
  'duka-language',
  'duka-purchase-history',
  'duka-pending-stock-purchases',
]

function clearLocalAppData() {
  LOCAL_APP_DATA_KEYS.forEach((key) => localStorage.removeItem(key))
}

function getSessionUserAttribution(session = {}) {
  const isEmployee = session.role === 'employee'
  const ownerUserId = session.phone || session.name || 'owner'
  const employeeUserId = session.employeeId || session.phone || session.name || 'employee'

  return {
    performedByUserId: isEmployee ? employeeUserId : ownerUserId,
    employeeId: isEmployee ? employeeUserId : null,
    employeeName: isEmployee
      ? session.employeeName || session.name || 'Employee'
      : session.name || 'Owner',
    shopId: session.shopId || session.shopName || null,
  }
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
  businessPreferences: loadBusinessPreferences(),
  notifications: loadNotifications(),
  inAppNotifications: [],
  notificationSettings: loadNotificationSettings(),

setTheme: (theme) => {
  localStorage.setItem('duka-theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
  set({ theme })
},

updateBusinessPreference: (field, value) => {
  set((s) => {
    const businessPreferences = saveBusinessPreferences({
      ...s.businessPreferences,
      [field]: value,
    })
    return { businessPreferences }
  })
},

updateBusinessPreferences: (settings) => {
  const businessPreferences = saveBusinessPreferences(settings)
  set({ businessPreferences })
},

addNotification: (notification) => {
  const saved = createNotification(notification)

  set((s) => {
    const notifications = [saved, ...(s.notifications || [])].slice(0, 100)
    saveNotifications(notifications)

    return {
      notifications,
      inAppNotifications: [saved, ...(s.inAppNotifications || [])].slice(0, 3),
    }
  })

  return saved
},

dismissInAppNotification: (id) => {
  set((s) => ({
    inAppNotifications: (s.inAppNotifications || []).filter((notification) => notification.id !== id),
  }))
},

markNotificationAsRead: (id) => {
  set((s) => {
    const notifications = (s.notifications || []).map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    )
    saveNotifications(notifications)
    return { notifications }
  })
},

markAllNotificationsAsRead: () => {
  set((s) => {
    const notifications = (s.notifications || []).map((notification) => ({
      ...notification,
      read: true,
    }))
    saveNotifications(notifications)
    return { notifications }
  })
},

deleteNotification: (id) => {
  set((s) => {
    const notifications = (s.notifications || []).filter((notification) => notification.id !== id)
    saveNotifications(notifications)
    return { notifications }
  })
},

clearAllNotifications: () => {
  saveNotifications([])
  set({ notifications: [] })
},

updateNotificationSetting: (id, value) => {
  set((s) => {
    const notificationSettings = saveNotificationSettings({
      ...s.notificationSettings,
      [id]: value,
    })
    return { notificationSettings }
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
    name: data.name || data.employeeName || 'Shop Owner',
    phone: data.phone,
    shopName: data.shopName || null,
    shopAddress: data.shopAddress || null,
    photo: null,
    isOnboarded: true,
    ...(data.employeeId ? { employeeId: data.employeeId } : {}),
    ...(data.employeeName ? { employeeName: data.employeeName } : {}),
    ...(data.shopId ? { shopId: data.shopId } : {}),
  }
  localStorage.setItem('duka-session', JSON.stringify(session))
  set({ session })
  // signOut() empties products/transactions/customers — reload them now
  // that a session is active again, since bootstrap() only runs once
  // on initial app mount.
  await get().bootstrap()
},
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
    businessPreferences: DEFAULT_BUSINESS_PREFERENCES,
    notifications: [],
    inAppNotifications: [],
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
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
  set({
    theme: savedTheme,
    businessPreferences: loadBusinessPreferences(),
    notifications: loadNotifications(),
    notificationSettings: loadNotificationSettings(),
  })
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
    const attribution = getSessionUserAttribution(get().session)
    const saved = await dbAddTransaction(txn, attribution)
    set((s) => ({ transactions: [saved, ...s.transactions] }))

      const settings = get().notificationSettings
      if (saved.direction === 'in' && settings.paymentReceivedAlerts !== false) {
        get().addNotification({
          type: 'payment_received',
          title: 'Payment received',
          message: `Cash in of KES ${Number(saved.amount || 0).toLocaleString()} was recorded.`,
        })
      }
      if (saved.direction === 'out' && settings.cashOutAlerts !== false) {
        get().addNotification({
          type: 'cash_out',
          title: 'Cash out recorded',
          message: `Cash out of KES ${Number(saved.amount || 0).toLocaleString()} was recorded.`,
        })
      }

      await get().refreshTodayStats()
      return saved
    } catch (err) {
      console.error('Add transaction error:', err)
    }
  },

  classifyTransaction: async (id, classification) => {
  try {
    const attribution = getSessionUserAttribution(get().session)
    const updated = await dbClassify(id, { ...classification, ...attribution })
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

      const settings = get().notificationSettings
      if (classification === 'debt' && settings.newDebtAlerts !== false) {
        get().addNotification({
          type: 'new_debt',
          title: 'New debt recorded',
          message: `A debt of KES ${Number(updated.amount || 0).toLocaleString()} was added.`,
        })
      }
      if (classification === 'debt_payment' && settings.debtPaymentAlerts !== false) {
        get().addNotification({
          type: 'debt_payment',
          title: 'Debt payment recorded',
          message: `Debt payment of KES ${Number(updated.amount || 0).toLocaleString()} was recorded.`,
        })
      }
      if (classification === 'sale' && settings.saleAlerts !== false) {
        get().addNotification({
          type: 'sale',
          title: 'Sale recorded',
          message: `Sale of KES ${Number(updated.amount || 0).toLocaleString()} was recorded.`,
        })
      }

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
    const attribution = getSessionUserAttribution(get().session)
    const updated = await dbAddDebtPayment(customerId, amount, paymentTransactionId, attribution)
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

      if (get().notificationSettings.debtPaymentAlerts !== false) {
        get().addNotification({
          type: 'debt_payment',
          title: 'Debt payment recorded',
          message: `Debt payment of KES ${Number(amount || 0).toLocaleString()} was recorded.`,
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
     const attribution = getSessionUserAttribution(get().session)
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
  ...attribution,
})
        set((s) => ({ transactions: [savedTxn, ...s.transactions] }))

        if (get().notificationSettings.stockPurchaseAlerts !== false) {
          get().addNotification({
            type: 'stock_purchase',
            title: 'Stock purchase recorded',
            message: `Stock purchase of KES ${Number(totalInvestment || 0).toLocaleString()} was recorded.`,
          })
        }
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

      const productById = new Map(get().products.map((product) => [product.id, product]))
const attribution = getSessionUserAttribution(get().session)
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
          ...attribution,
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

      await get().refreshTodayStats()

      if (get().notificationSettings.newDebtAlerts !== false) {
        get().addNotification({
          type: 'new_debt',
          title: 'New debt recorded',
          message: `Debt sale of KES ${Number(grandTotal || 0).toLocaleString()} was recorded.`,
        })
      }

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

      // Classify the existing payment transaction — do NOT insert a new one,
      // otherwise the same money would be counted twice.
     const attribution = getSessionUserAttribution(get().session)
const updatedTxn = await completeSalePayment(linkedTransactionId, {
  items, grandTotal, totalProfit, customerId, ...attribution,
})

      set((s) => ({
        transactions: s.transactions.map((t) =>
          t.id === linkedTransactionId ? { ...t, ...updatedTxn } : t
        ),
      }))

      await get().refreshTodayStats()

      if (get().notificationSettings.saleAlerts !== false) {
        get().addNotification({
          type: 'sale',
          title: 'Sale recorded',
          message: `Sale of KES ${Number(grandTotal || 0).toLocaleString()} was recorded.`,
        })
      }

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
