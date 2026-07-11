import { supabase } from './supabase'

function clean(value) {
  return String(value || '').trim()
}

function normalizeEmail(value) {
  return clean(value).toLowerCase()
}

function normalizePhone(value) {
  const raw = clean(value)
  if (!raw) return ''

  const hasPlus = raw.startsWith('+')
  const digits = raw.replace(/\D/g, '')
  return `${hasPlus ? '+' : ''}${digits}`
}

function authError(error, fallback) {
  const message = String(error?.message || '').toLowerCase()

  if (message.includes('invalid login credentials')) {
    return new Error('Unable to sign in with those credentials.')
  }
  if (message.includes('email not confirmed')) {
    return new Error('Confirm your email before signing in.')
  }
  if (message.includes('already registered') || message.includes('already exists')) {
    return new Error('Unable to create this account. Try signing in instead.')
  }
  if (message.includes('password')) {
    return new Error('Use a password with at least 8 characters.')
  }

  return new Error(fallback)
}

export async function registerOwnerAccount({
  name,
  email,
  phone,
  password,
  shopName,
  shopAddress,
}) {
  const normalizedEmail = normalizeEmail(email)
  const normalizedPhone = normalizePhone(phone)

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/sign-in?confirmed=1`,
      data: {
        full_name: clean(name),
        phone: normalizedPhone,
        pending_shop_name: clean(shopName),
        pending_shop_address: clean(shopAddress),
        pending_shop_type: 'Wines & Spirits',
        pending_shop_city: '',
        pending_shop_timezone: 'Africa/Nairobi',
        pending_shop_currency: 'KES',
      },
    },
  })

  if (error) throw authError(error, 'Unable to create your account right now.')
  return data
}

async function getOwnerMembership(userId) {
  const { data, error } = await supabase
    .from('shop_members')
    .select('shop_id, role, status, joined_at, shop:shops(*)')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw error
  return data
}

async function createPendingOwnerShop(user) {
  const metadata = user.user_metadata || {}
  const shopName = clean(metadata.pending_shop_name)

  if (!shopName) {
    throw new Error('Your account has no shop setup information. Contact Duka support.')
  }

  const { error } = await supabase.rpc('create_owner_shop', {
    shop_name: shopName,
    owner_full_name: clean(metadata.full_name),
    owner_phone: normalizePhone(metadata.phone),
    shop_address: clean(metadata.pending_shop_address) || null,
    shop_city: clean(metadata.pending_shop_city) || null,
    requested_shop_type: clean(metadata.pending_shop_type) || 'Wines & Spirits',
    requested_timezone: clean(metadata.pending_shop_timezone) || 'Africa/Nairobi',
    requested_currency: clean(metadata.pending_shop_currency) || 'KES',
  })

  if (error) throw error
}

async function getSubscription(shopId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function loadOwnerSession(user, { createShopIfMissing = false } = {}) {
  if (!user) return null

  let membership = await getOwnerMembership(user.id)
  let createdShop = false

  if (!membership && createShopIfMissing) {
    await createPendingOwnerShop(user)
    membership = await getOwnerMembership(user.id)
    createdShop = true
  }

  if (!membership?.shop) {
    throw new Error('No active owner shop is linked to this account.')
  }

  const [{ data: profile, error: profileError }, subscription] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getSubscription(membership.shop_id),
  ])

  if (profileError) throw profileError

  const shop = membership.shop
  return {
    createdShop,
    session: {
      authUserId: user.id,
      role: 'owner',
      name: profile.full_name || user.user_metadata?.full_name || 'Shop Owner',
      email: user.email || null,
      phone: profile.phone || user.user_metadata?.phone || null,
      photo: profile.avatar_url || null,
      shopId: shop.id,
      shopName: shop.name,
      shopType: shop.shop_type,
      shopAddress: shop.address,
      shopCity: shop.city,
      shopTimezone: shop.timezone,
      shopLogo: shop.logo_url,
      subscriptionStatus: subscription?.status || 'free',
      subscriptionPlan: subscription?.plan || 'free',
      trialStart: subscription?.trial_started_at || null,
      trialEnd: subscription?.trial_ends_at || null,
      currentPeriodStart: subscription?.current_period_started_at || null,
      currentPeriodEnd: subscription?.current_period_ends_at || null,
      isOnboarded: !createdShop,
    },
  }
}

export async function signInOwnerAccount({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  })

  if (error) throw authError(error, 'Unable to sign in right now.')

  try {
    return await loadOwnerSession(data.user, { createShopIfMissing: true })
  } catch (contextError) {
    await supabase.auth.signOut()
    throw new Error(contextError?.message || 'Unable to load your Duka shop.')
  }
}

export async function restoreOwnerAccount() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session?.user) return null
  return loadOwnerSession(data.session.user, { createShopIfMissing: true })
}

export async function signOutOwnerAccount() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
