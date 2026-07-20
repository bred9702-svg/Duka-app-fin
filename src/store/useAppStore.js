import { create } from 'zustand'
import {
  getTransactions,
  addTransaction as dbAddTransaction,
  classifyTransaction as dbClassify,
  setTransactionIgnored as dbSetTransactionIgnored,
  getCustomers,
  addDebtPayment as dbAddDebtPayment,
  addNewCustomer,
  getProducts,
  getTodayStats,
  recordStockPurchase as dbRecordStockPurchase,
  completeSalePayment,
  createDebtSale as dbCreateDebtSale,
  getPendingOrders,
  createPendingOrder as dbCreatePendingOrder,
  recordPendingOrderPayment as dbRecordPendingOrderPayment,
  finalizePendingOrder as dbFinalizePendingOrder,
  convertPendingOrderToDebt as dbConvertPendingOrderToDebt,
  cancelPendingOrder as dbCancelPendingOrder,
  addProduct,
  searchDukwiseCatalog as dbSearchDukwiseCatalog,
  addCatalogOpeningStock as dbAddCatalogOpeningStock,
} from '../lib/db'
import {
  registerOwnerAccount,
  registerEmployeeAccount,
  signInAccount,
  restoreAccount,
  signOutAccount,
} from '../lib/auth'
import { saveShopProfile } from '../lib/shop'
import {
  getBusinessPreferences,
  saveBusinessPreferences as saveRemoteBusinessPreferences,
} from '../lib/businessPreferences'
import { disablePushNotifications, savePushPreferences } from '../lib/pushNotifications'

let businessPreferencesSaveTimer = null

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
  trialAlerts: true,
  paymentReviewAlerts: true,
  employeeActivityAlerts: true,
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
    lowStockThreshold: String(next.lowStockThreshold ?? DEFAULT_BUSINESS_PREFERENCES.lowStockThreshold),
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
  pendingOrders: [],
  customers: [],
  products: [],
  catalogProducts: [],
  catalogLoading: false,
  todayStats: { income: 0, expenses: 0, profit: 0, unclassified: 0 },
  // Render a real loading screen on the very first React frame while the
  // persisted Supabase session and shop data are being restored.
  loading: true,
  error: null,
  theme: localStorage.getItem('duka-theme') || 'dark',
  session: loadSession(),
  businessPreferences: loadBusinessPreferences(),
  businessPreferencesSaving: false,
  businessPreferencesError: null,
  notifications: loadNotifications(),
  inAppNotifications: [],
  notificationSettings: loadNotificationSettings(),

setTheme: (theme) => {
  localStorage.setItem('duka-theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
  set({ theme })
},

updateBusinessPreference: (field, value) => {
  const businessPreferences = saveBusinessPreferences({
    ...get().businessPreferences,
    [field]: value,
  })
  set({ businessPreferences, businessPreferencesSaving: true, businessPreferencesError: null })

  clearTimeout(businessPreferencesSaveTimer)
  businessPreferencesSaveTimer = setTimeout(async () => {
    const session = get().session
    if (!session?.shopId || session.role !== 'owner') {
      set({ businessPreferencesSaving: false })
      return
    }
    try {
      const saved = await saveRemoteBusinessPreferences(session.shopId, get().businessPreferences)
      saveBusinessPreferences(saved)
      set({ businessPreferences: saved, businessPreferencesSaving: false, businessPreferencesError: null })
    } catch (error) {
      console.error('Save Business Preferences failed:', error)
      set({ businessPreferencesSaving: false, businessPreferencesError: 'Could not save preferences.' })
    }
  }, 600)
},

updateBusinessPreferences: (settings) => {
  const businessPreferences = saveBusinessPreferences(settings)
  set({ businessPreferences, businessPreferencesSaving: true, businessPreferencesError: null })

  clearTimeout(businessPreferencesSaveTimer)
  businessPreferencesSaveTimer = setTimeout(async () => {
    const session = get().session
    if (!session?.shopId || session.role !== 'owner') {
      set({ businessPreferencesSaving: false })
      return
    }
    try {
      const saved = await saveRemoteBusinessPreferences(session.shopId, get().businessPreferences)
      saveBusinessPreferences(saved)
      set({ businessPreferences: saved, businessPreferencesSaving: false, businessPreferencesError: null })
    } catch (error) {
      console.error('Save Business Preferences failed:', error)
      set({ businessPreferencesSaving: false, businessPreferencesError: 'Could not save preferences.' })
    }
  }, 600)
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
  let nextSettings
  set((s) => {
    const notificationSettings = saveNotificationSettings({
      ...s.notificationSettings,
      [id]: value,
    })
    nextSettings = notificationSettings
    return { notificationSettings }
  })

  const currentSession = get().session
  if (currentSession?.shopId && nextSettings) {
    savePushPreferences(currentSession.shopId, nextSettings).catch((error) => {
      console.error('Save push preferences failed:', error)
    })
  }
},

registerOwner: async (data) => {
  // A brand new account must never inherit a previous account's local
  // settings cache (shop profile, purchase history, preferences, etc.)
  clearLocalAppData()

  localStorage.removeItem('duka-session')
  set({ session: null, error: null })
  return registerOwnerAccount(data)
},

registerEmployee: async (data) => {
  clearLocalAppData()
  localStorage.removeItem('duka-session')
  set({ session: null, error: null })
  return registerEmployeeAccount(data)
},

signIn: async (data) => {
  const result = await signInAccount(data)
  localStorage.setItem('duka-session', JSON.stringify(result.session))
  set({ session: result.session, error: null })
  await get().bootstrap()
  return result
},

completeOnboarding: () => {
  set((s) => {
    if (!s.session) return {}
    const session = { ...s.session, isOnboarded: true }
    localStorage.setItem('duka-session', JSON.stringify(session))
    return { session }
  })
},

updateShopProfile: async (profile, logoFile = null) => {
  const currentSession = get().session
  if (!currentSession?.shopId || !currentSession?.authUserId) {
    throw new Error('No active Owner shop is available.')
  }

  const shop = await saveShopProfile({
    shopId: currentSession.shopId,
    userId: currentSession.authUserId,
    profile,
    logoFile,
  })

  const session = {
    ...currentSession,
    shopName: shop.name,
    shopType: shop.shop_type,
    shopAddress: shop.address,
    shopCity: shop.city,
    shopTimezone: shop.timezone,
    shopLogo: shop.logo_url,
  }
  localStorage.setItem('duka-session', JSON.stringify(session))
  set({ session })
  return shop
},

signOut: async () => {
  const currentSession = get().session
  if (currentSession?.shopId) {
    try {
      await disablePushNotifications(currentSession)
    } catch (error) {
      console.error('Push device unregister failed:', error)
    }
  }
  try {
    await signOutAccount()
  } catch (error) {
    console.error('Supabase sign out failed:', error)
  }
  localStorage.removeItem('duka-session')
  clearLocalAppData()
  set({
    session: null,
    businessPreferences: DEFAULT_BUSINESS_PREFERENCES,
    notifications: [],
    inAppNotifications: [],
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    transactions: [],
    pendingOrders: [],
    customers: [],
    products: [],
    catalogProducts: [],
    catalogLoading: false,
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
  set({ loading: true, error: null })
    try {
      const accountContext = await restoreAccount()
      const session = accountContext?.session || null

      if (session) localStorage.setItem('duka-session', JSON.stringify(session))
      else localStorage.removeItem('duka-session')

      set({ session })

      if (!session) {
        set({
          transactions: [],
          pendingOrders: [],
          customers: [],
          products: [],
          catalogProducts: [],
          catalogLoading: false,
          todayStats: { income: 0, expenses: 0, profit: 0, unclassified: 0 },
          loading: false,
        })
        return
      }

      // Authentication is enough to release the interface. Business data is
      // hydrated immediately afterwards without blocking startup or typing.
      set({ loading: false })

      Promise.all([
        getTransactions(50),
        getCustomers(),
        getProducts(),
        getTodayStats(),
        getBusinessPreferences(session.shopId).catch((preferencesError) => {
          console.error('Load Business Preferences failed:', preferencesError)
          return loadBusinessPreferences()
        }),
      ])
        .then(async ([transactions, customers, products, todayStats, businessPreferences]) => {
          const pendingOrders = await getPendingOrders().catch(() => [])
          // Ignore a late response if the user signed out or changed shops.
          if (get().session?.shopId !== session.shopId) return

          saveBusinessPreferences(businessPreferences)
          set({
            transactions,
            pendingOrders,
            customers,
            products,
            todayStats,
            businessPreferences,
            businessPreferencesSaving: false,
            businessPreferencesError: null,
          })
        })
        .catch((dataError) => {
          console.error('Background shop hydration failed:', dataError)
          if (get().session?.shopId === session.shopId) {
            set({ error: dataError.message })
          }
        })
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
        products: updated.productUpdate
          ? s.products.map((p) =>
              p.id === updated.productUpdate.id ? { ...p, ...updated.productUpdate } : p
            )
          : s.products,
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

  setTransactionIgnored: async (id, ignored) => {
    try {
      const updated = await dbSetTransactionIgnored(id, ignored)
      set((s) => ({
        transactions: s.transactions.map((transaction) =>
          transaction.id === id ? { ...transaction, ...updated } : transaction
        ),
      }))
      await get().refreshTodayStats()
      return updated
    } catch (err) {
      console.error('Update duplicate transaction error:', err)
      throw err
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
      const result = await dbRecordStockPurchase({
        items,
        supplier,
        purchaseDate,
        notes,
        linkedTransactionId,
      })
      const totalInvestment = Number(result.totalInvestment) || 0
      const expectedRevenue = Number(result.expectedRevenue) || 0
      const expectedProfit = Number(result.expectedProfit) || 0
      const productsById = new Map((result.products || []).map((product) => [product.id, product]))

      set((s) => ({
        products: s.products.map((product) =>
          productsById.has(product.id)
            ? { ...product, ...productsById.get(product.id) }
            : product
        ),
        transactions: linkedTransactionId
          ? s.transactions
          : [result.transaction, ...s.transactions],
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
        if (get().notificationSettings.stockPurchaseAlerts !== false) {
          get().addNotification({
            type: 'stock_purchase',
            title: 'Stock purchase recorded',
            message: `Stock purchase of KES ${Number(totalInvestment || 0).toLocaleString()} was recorded.`,
          })
        }
      }

      await get().refreshTodayStats()

      const record = {
        id: result.purchase?.id || `purchase-${Date.now()}`,
        date: result.purchase?.purchase_date || purchaseDate || new Date().toISOString(),
        supplier: supplier || null,
        notes: notes || null,
        items,
        totalInvestment,
        expectedRevenue,
        expectedProfit,
        linkedTransactionId,
        budget,
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

      const result = await dbCreateDebtSale({ items, customerId })
      const grandTotal = Number(result.grandTotal) || 0
      const totalProfit = Number(result.totalProfit) || 0
      const productById = new Map(get().products.map((product) => [product.id, product]))
      const savedTxns = (result.transactions || []).map((transaction) => ({
        ...transaction,
        product: productById.get(transaction.product_id) || null,
      }))
      const updatedCustomer = result.customer
      const productsById = new Map((result.products || []).map((product) => [product.id, product]))

      set((s) => ({
        products: s.products.map((p) => productsById.has(p.id) ? { ...p, ...productsById.get(p.id) } : p),
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

      // Classify the existing payment transaction — do NOT insert a new one,
      // otherwise the same money would be counted twice.
      const result = await completeSalePayment(linkedTransactionId, { items, customerId })
      const updatedTxn = result.transaction
      const grandTotal = Number(result.grandTotal) || 0
      const totalProfit = Number(result.totalProfit) || 0
      const productsById = new Map((result.products || []).map((product) => [product.id, product]))

      set((s) => ({
        products: s.products.map((p) => productsById.has(p.id) ? { ...p, ...productsById.get(p.id) } : p),
        transactions: s.transactions.map((t) =>
          t.id === linkedTransactionId ? { ...t, ...updatedTxn } : t
        ),
      }))

      await Promise.all([get().refreshTodayStats(), get().refreshPendingOrders()])

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
        order: result.order || null,
      }
    } catch (err) {
      console.error('Complete sale error:', err)
      throw err
    }
  },

  refreshPendingOrders: async () => {
    const pendingOrders = await getPendingOrders()
    set({ pendingOrders })
    return pendingOrders
  },

  createPendingOrder: async ({ items, customerId = null }) => {
    const order = await dbCreatePendingOrder({ items, customerId })
    await Promise.all([get().refreshPendingOrders(), getProducts().then((products) => set({ products }))])
    return order
  },

  recordPendingOrderPayment: async (payload) => {
    const order = await dbRecordPendingOrderPayment(payload)
    await get().refreshPendingOrders()
    return order
  },

  finalizePendingOrder: async (orderId) => {
    const order = await dbFinalizePendingOrder(orderId)
    await Promise.all([
      get().refreshPendingOrders(), getProducts().then((products) => set({ products })),
      getTransactions(50).then((transactions) => set({ transactions })), get().refreshTodayStats(),
    ])
    return order
  },

  convertPendingOrderToDebt: async (orderId, customerId) => {
    const result = await dbConvertPendingOrderToDebt(orderId, customerId)
    await Promise.all([
      get().refreshPendingOrders(), getProducts().then((products) => set({ products })),
      getTransactions(50).then((transactions) => set({ transactions })),
      getCustomers().then((customers) => set({ customers })), get().refreshTodayStats(),
    ])
    return result
  },

  cancelPendingOrder: async (orderId, reason = null) => {
    const order = await dbCancelPendingOrder(orderId, reason)
    await Promise.all([get().refreshPendingOrders(), getProducts().then((products) => set({ products }))])
    return order
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

  searchCatalog: async (query = '') => {
    set({ catalogLoading: true })
    try {
      const catalogProducts = await dbSearchDukwiseCatalog(query)
      set({ catalogProducts })
      return catalogProducts
    } finally {
      set({ catalogLoading: false })
    }
  },

  addOpeningStockFromCatalog: async (items) => {
    const result = await dbAddCatalogOpeningStock(items)
    const created = result?.products || []
    set((s) => ({ products: [...s.products, ...created] }))
    return result
  },
}))

export default useAppStore
