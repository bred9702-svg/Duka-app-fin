import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from './supabase'

const WEB_PUSH_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY || ''
const PUSH_DEVICE_ID_KEY = 'dukwise-push-device-id'
let nativeListenersReady = false
let currentSession = null

function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

function toUint8Array(base64Value) {
  const padding = '='.repeat((4 - (base64Value.length % 4)) % 4)
  const normalized = (base64Value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(normalized)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

function openNotificationRoute(data = {}) {
  const route = data.route || data.url
  if (typeof route !== 'string' || !route.startsWith('/')) return
  window.location.assign(route)
}

async function registerDevice(payload) {
  if (!currentSession?.shopId) throw new Error('No active Dukwise shop is available.')
  const { data, error } = await supabase.rpc('register_push_device', {
    target_shop_id: currentSession.shopId,
    device_platform: payload.platform,
    device_token: payload.token || null,
    web_endpoint: payload.endpoint || null,
    web_p256dh: payload.p256dh || null,
    web_auth: payload.auth || null,
    device_label: navigator.userAgent.slice(0, 180),
  })
  if (error) throw error
  if (data) localStorage.setItem(PUSH_DEVICE_ID_KEY, String(data))
  return data
}

async function ensureNativeListeners() {
  if (nativeListenersReady) return
  nativeListenersReady = true

  await PushNotifications.addListener('registration', async ({ value }) => {
    try {
      await registerDevice({ platform: 'android', token: value })
    } catch (error) {
      console.error('Unable to save Android push token:', error)
    }
  })

  await PushNotifications.addListener('registrationError', ({ error }) => {
    console.error('Android push registration failed:', error)
  })

  await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    openNotificationRoute(notification?.data)
  })
}

async function registerAndroid(requestPermission) {
  await ensureNativeListeners()
  let permission = await PushNotifications.checkPermissions()
  if (permission.receive === 'prompt' && requestPermission) {
    permission = await PushNotifications.requestPermissions()
  }
  if (permission.receive !== 'granted') {
    if (requestPermission) throw new Error('Notification permission was not granted.')
    return { supported: true, permission: permission.receive, platform: 'android', active: false }
  }

  await PushNotifications.createChannel({
    id: 'dukwise-alerts',
    name: 'Dukwise Alerts',
    description: 'Business, stock, debt and subscription alerts',
    importance: 4,
    visibility: 1,
  })
  await PushNotifications.register()
  return { supported: true, permission: 'granted', platform: 'android', active: true }
}

async function getWebRegistration() {
  return navigator.serviceWorker.register('/push-sw.js', { scope: '/' })
}

async function registerWeb(requestPermission) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { supported: false, permission: 'unsupported', platform: 'web', active: false }
  }

  let permission = Notification.permission
  if (permission === 'default' && requestPermission) permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    if (requestPermission && permission === 'denied') throw new Error('Notifications are blocked in your device settings.')
    return { supported: true, permission: permission === 'default' ? 'prompt' : permission, platform: 'web', active: false }
  }
  if (!WEB_PUSH_PUBLIC_KEY) throw new Error('Web Push is not configured yet.')

  const registration = await getWebRegistration()
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(WEB_PUSH_PUBLIC_KEY),
    })
  }
  const json = subscription.toJSON()
  await registerDevice({
    platform: 'web',
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
  })
  return { supported: true, permission: 'granted', platform: 'web', active: true }
}

export async function getPushCapability() {
  if (isAndroidNative()) {
    const permission = await PushNotifications.checkPermissions()
    return {
      supported: true,
      permission: permission.receive,
      platform: 'android',
      active: permission.receive === 'granted' && Boolean(localStorage.getItem(PUSH_DEVICE_ID_KEY)),
    }
  }
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  let active = false
  if (supported && Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.getRegistration('/')
    active = Boolean(await registration?.pushManager?.getSubscription())
  }
  return {
    supported,
    permission: supported ? (Notification.permission === 'default' ? 'prompt' : Notification.permission) : 'unsupported',
    platform: 'web',
    active,
  }
}

export async function initializePushNotifications(session) {
  currentSession = session
  if (!session?.shopId) return getPushCapability()
  return isAndroidNative() ? registerAndroid(false) : registerWeb(false)
}

export async function requestAndRegisterPushNotifications(session) {
  currentSession = session
  if (!session?.shopId) throw new Error('Sign in before enabling notifications.')
  return isAndroidNative() ? registerAndroid(true) : registerWeb(true)
}

export async function disablePushNotifications(session) {
  currentSession = session
  if (isAndroidNative()) {
    await PushNotifications.unregister()
  } else if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration('/')
    const subscription = await registration?.pushManager?.getSubscription()
    if (subscription) await subscription.unsubscribe()
  }

  const deviceId = localStorage.getItem(PUSH_DEVICE_ID_KEY)
  if (session?.shopId && deviceId) {
    const { error } = await supabase.rpc('unregister_push_device', {
      target_shop_id: session.shopId,
      target_device_id: deviceId,
    })
    if (error) throw error
  }
  localStorage.removeItem(PUSH_DEVICE_ID_KEY)
}

export async function savePushPreferences(shopId, settings) {
  if (!shopId) return
  const { error } = await supabase.rpc('save_push_notification_preferences', {
    target_shop_id: shopId,
    low_stock_value: settings.lowStockAlerts !== false,
    new_debt_value: settings.newDebtAlerts !== false,
    debt_payment_value: settings.debtPaymentAlerts !== false,
    daily_summary_value: settings.dailySummary !== false,
    weekly_summary_value: settings.weeklySummary !== false,
    trial_value: settings.trialAlerts !== false,
    payment_review_value: settings.paymentReviewAlerts !== false,
    employee_activity_value: settings.employeeActivityAlerts !== false,
  })
  if (error) throw error
}
