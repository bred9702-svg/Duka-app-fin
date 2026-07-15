import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

type QueueItem = {
  id: string
  shop_id: string
  recipient_user_id: string
  category: string
  title: string
  body: string
  route: string
  attempts: number
  payload: Record<string, unknown>
}

type PushDevice = {
  id: string
  platform: 'android' | 'web'
  token: string | null
  endpoint: string | null
  p256dh: string | null
  auth_secret: string | null
}

type FirebaseServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
  token_uri?: string
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const dispatchSecret = Deno.env.get('PUSH_DISPATCH_SECRET') ?? ''
const vapidPublicKey = Deno.env.get('WEB_PUSH_VAPID_PUBLIC_KEY') ?? ''
const vapidPrivateKey = Deno.env.get('WEB_PUSH_VAPID_PRIVATE_KEY') ?? ''
const vapidSubject = Deno.env.get('WEB_PUSH_VAPID_SUBJECT') ?? 'mailto:support@dukwise.app'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

let fcmAccessToken: { value: string; expiresAt: number } | null = null

function base64Url(value: Uint8Array | string) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToBytes(pem: string) {
  const normalized = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')
  const binary = atob(normalized)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function getFcmAccessToken(account: FirebaseServiceAccount) {
  if (fcmAccessToken && fcmAccessToken.expiresAt > Date.now() + 60_000) return fcmAccessToken.value

  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: account.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const unsigned = `${header}.${claim}`
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsigned),
  )
  const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`
  const response = await fetch(account.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!response.ok) throw new Error(`FCM OAuth failed (${response.status}).`)
  const result = await response.json()
  fcmAccessToken = {
    value: result.access_token,
    expiresAt: Date.now() + Number(result.expires_in || 3600) * 1000,
  }
  return fcmAccessToken.value
}

function getFirebaseServiceAccount() {
  const raw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing.')
  return JSON.parse(raw) as FirebaseServiceAccount
}

async function deactivateDevice(deviceId: string) {
  await supabase.from('push_devices').update({ active: false }).eq('id', deviceId)
}

async function sendAndroid(device: PushDevice, item: QueueItem) {
  if (!device.token) return false
  const account = getFirebaseServiceAccount()
  const accessToken = await getFcmAccessToken(account)
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: device.token,
          notification: { title: item.title, body: item.body },
          data: {
            category: item.category,
            route: item.route,
            queue_id: item.id,
          },
          android: {
            priority: 'high',
            notification: {
              channel_id: 'dukwise-alerts',
              icon: 'ic_stat_dukwise',
              color: '#F0A93D',
            },
          },
        },
      }),
    },
  )
  if (response.ok) return true

  const errorText = await response.text()
  if (response.status === 404 || errorText.includes('UNREGISTERED')) await deactivateDevice(device.id)
  throw new Error(`FCM delivery failed (${response.status}): ${errorText.slice(0, 240)}`)
}

async function sendWeb(device: PushDevice, item: QueueItem) {
  if (!device.endpoint || !device.p256dh || !device.auth_secret) return false
  if (!vapidPublicKey || !vapidPrivateKey) throw new Error('Web Push VAPID secrets are missing.')

  try {
    await webpush.sendNotification(
      {
        endpoint: device.endpoint,
        keys: { p256dh: device.p256dh, auth: device.auth_secret },
      },
      JSON.stringify({
        title: item.title,
        body: item.body,
        route: item.route,
        tag: `${item.category}-${item.id}`,
      }),
      { TTL: 86400, urgency: 'normal' },
    )
    return true
  } catch (error) {
    const statusCode = Number((error as { statusCode?: number }).statusCode || 0)
    if (statusCode === 404 || statusCode === 410) await deactivateDevice(device.id)
    throw error
  }
}

async function processItem(item: QueueItem) {
  const [{ data: devices, error: deviceError }, { data: preferences, error: preferenceError }] = await Promise.all([
    supabase
      .from('push_devices')
      .select('id, platform, token, endpoint, p256dh, auth_secret')
      .eq('shop_id', item.shop_id)
      .eq('user_id', item.recipient_user_id)
      .eq('active', true),
    supabase
      .from('push_notification_preferences')
      .select('*')
      .eq('shop_id', item.shop_id)
      .eq('user_id', item.recipient_user_id)
      .maybeSingle(),
  ])
  if (deviceError) throw deviceError
  if (preferenceError) throw preferenceError

  const enabled = preferences?.[item.category] !== false
  if (!enabled || !devices?.length) {
    await supabase
      .from('push_notification_queue')
      .update({ status: 'cancelled', last_error: enabled ? 'No active push device.' : 'Disabled by user preference.' })
      .eq('id', item.id)
    return { sent: false, cancelled: true }
  }

  const results = await Promise.allSettled(
    (devices as PushDevice[]).map((device) =>
      device.platform === 'android' ? sendAndroid(device, item) : sendWeb(device, item)
    ),
  )
  const delivered = results.some((result) => result.status === 'fulfilled' && result.value === true)

  if (delivered) {
    await supabase
      .from('push_notification_queue')
      .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
      .eq('id', item.id)
    return { sent: true, cancelled: false }
  }

  const errorMessage = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) => String(result.reason?.message || result.reason))
    .join(' | ')
    .slice(0, 1000)
  const terminal = item.attempts >= 5
  const retryMinutes = Math.min(60, 2 ** Math.max(1, item.attempts))
  await supabase
    .from('push_notification_queue')
    .update({
      status: terminal ? 'failed' : 'pending',
      last_error: errorMessage || 'No device accepted the notification.',
      available_at: new Date(Date.now() + retryMinutes * 60_000).toISOString(),
    })
    .eq('id', item.id)
  return { sent: false, cancelled: false }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const authorization = request.headers.get('authorization') || ''
  const suppliedSecret = request.headers.get('x-dispatch-secret') || ''
  if ((!dispatchSecret || suppliedSecret !== dispatchSecret) && authorization !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await supabase.rpc('enqueue_due_scheduled_push_notifications')
    const { data, error } = await supabase.rpc('claim_push_notification_queue', { batch_size: 50 })
    if (error) throw error

    let sent = 0
    let cancelled = 0
    for (const item of (data || []) as QueueItem[]) {
      const result = await processItem(item)
      if (result.sent) sent += 1
      if (result.cancelled) cancelled += 1
    }

    return Response.json({ claimed: data?.length || 0, sent, cancelled })
  } catch (error) {
    console.error('Push dispatcher failed:', error)
    return Response.json({ error: String((error as Error).message || error) }, { status: 500 })
  }
})
