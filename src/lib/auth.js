import { supabase } from './supabase'
import { acceptEmployeeInvitation, normalizeInviteCode } from './invitations'

const clean = (value) => String(value || '').trim()
const normalizeEmail = (value) => clean(value).toLowerCase()
const normalizePhone = (value) => {
  const raw = clean(value)
  const digits = raw.replace(/\D/g, '')
  return `${raw.startsWith('+') ? '+' : ''}${digits}`
}

function safeAuthError(error, fallback) {
  const message = String(error?.message || '').toLowerCase()
  if (message.includes('invalid login credentials')) return new Error('Unable to sign in with those credentials.')
  if (message.includes('email not confirmed')) return new Error('Confirm your email before signing in.')
  if (message.includes('password')) return new Error('Use at least 8 characters with letters and numbers.')
  return new Error(fallback)
}

async function signUp({ email, password, metadata, redirectQuery }) {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/sign-in?${redirectQuery}`,
      data: metadata,
    },
  })
  if (error) throw safeAuthError(error, 'Unable to create your account right now.')
  return data
}

export function registerOwnerAccount({ name, email, phone, password, shopName, shopAddress }) {
  return signUp({
    email,
    password,
    redirectQuery: 'confirmed=1',
    metadata: {
      full_name: clean(name), phone: normalizePhone(phone), account_role: 'owner',
      pending_shop_name: clean(shopName), pending_shop_address: clean(shopAddress),
      pending_shop_type: 'Wines & Spirits', pending_shop_city: '',
      pending_shop_timezone: 'Africa/Nairobi', pending_shop_currency: 'KES',
    },
  })
}

export function registerEmployeeAccount({ name, email, phone, password, inviteCode }) {
  const code = normalizeInviteCode(inviteCode)
  return signUp({
    email,
    password,
    redirectQuery: `mode=join&invite=${encodeURIComponent(code)}&confirmed=1`,
    metadata: { full_name: clean(name), phone: normalizePhone(phone), account_role: 'employee', pending_invite_code: code },
  })
}

async function createPendingOwnerShop(user) {
  const m = user.user_metadata || {}
  const { error } = await supabase.rpc('create_owner_shop', {
    shop_name: clean(m.pending_shop_name), owner_full_name: clean(m.full_name), owner_phone: normalizePhone(m.phone),
    shop_address: clean(m.pending_shop_address) || null, shop_city: clean(m.pending_shop_city) || null,
    requested_shop_type: clean(m.pending_shop_type) || 'Wines & Spirits',
    requested_timezone: clean(m.pending_shop_timezone) || 'Africa/Nairobi', requested_currency: clean(m.pending_shop_currency) || 'KES',
  })
  if (error) throw error
}

async function getContext() {
  const { data, error } = await supabase.rpc('get_current_shop_context')
  if (error) return null
  if (!data?.shop?.id) return data

  const { data: entitlements, error: entitlementsError } = await supabase.rpc(
    'get_shop_entitlements',
    { target_shop_id: data.shop.id }
  )
  if (entitlementsError) throw entitlementsError
  return { ...data, entitlements }
}

async function getInactiveEmployeeMembership(userId) {
  const { data, error } = await supabase
    .from('shop_members')
    .select('status')
    .eq('user_id', userId)
    .eq('role', 'employee')
    .in('status', ['suspended', 'removed'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

function toSession(user, context, isOnboarded = true) {
  const { profile, membership, shop, subscription, entitlements } = context
  const effectivePlan = entitlements?.plan || subscription?.plan || 'free'
  const effectiveStatus = entitlements?.status || subscription?.status || 'free'
  return {
    authUserId: user.id, role: membership.role,
    name: profile.full_name || user.user_metadata?.full_name || (membership.role === 'owner' ? 'Shop Owner' : 'Employee'),
    employeeId: membership.role === 'employee' ? user.id : null,
    employeeName: membership.role === 'employee' ? profile.full_name : null,
    email: user.email || null, phone: profile.phone || null, photo: profile.avatar_url || null,
    shopId: shop.id, shopName: shop.name, shopType: shop.shop_type, shopAddress: shop.address,
    shopCity: shop.city, shopTimezone: shop.timezone, shopLogo: shop.logo_url,
    subscriptionStatus: effectiveStatus, subscriptionPlan: effectivePlan,
    trialStart: subscription?.trial_started_at || null, trialEnd: subscription?.trial_ends_at || null,
    currentPeriodStart: subscription?.current_period_started_at || null,
    currentPeriodEnd: entitlements?.current_period_ends_at || subscription?.current_period_ends_at || null,
    isPro: entitlements?.is_pro === true,
    entitlements: entitlements?.features || {},
    subscriptionAmountKes: entitlements?.amount_kes || 2999,
    isOnboarded,
  }
}

async function ensureContext(user, { role, inviteCode } = {}) {
  let context = await getContext()
  let created = false
  if (!context && role === 'owner') { await createPendingOwnerShop(user); context = await getContext(); created = true }
  if (!context && role === 'employee') {
    const inactiveMembership = await getInactiveEmployeeMembership(user.id)
    if (inactiveMembership?.status === 'suspended') {
      throw new Error('Your access to this shop has been deactivated by the Shop Owner.')
    }
    if (inactiveMembership?.status === 'removed') {
      throw new Error('Your employee membership is no longer active.')
    }
    await acceptEmployeeInvitation(inviteCode || user.user_metadata?.pending_invite_code)
    context = await getContext()
    created = true
  }
  if (!context) throw new Error('No active Duka shop is linked to this account.')
  return { createdShop: created && role === 'owner', session: toSession(user, context, role === 'employee' ? true : !created) }
}

export async function signInAccount({ email, password, role, inviteCode }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password })
  if (error) throw safeAuthError(error, 'Unable to sign in right now.')
  try { return await ensureContext(data.user, { role, inviteCode }) }
  catch (error) { await supabase.auth.signOut(); throw error }
}

export async function restoreAccount() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session?.user) return null
  const user = data.session.user
  const context = await getContext()
  if (context) return { createdShop: false, session: toSession(user, context, true) }

  // Owners can safely finish their own shop creation after email confirmation.
  // Employees must explicitly sign in before a one-use invitation is consumed.
  if (user.user_metadata?.account_role === 'owner') {
    return ensureContext(user, { role: 'owner' })
  }
  return null
}

export async function signOutAccount() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
