import { supabase } from './supabase'

const LOGO_BUCKET = 'shop-logos'

export async function getShopProfile(shopId) {
  const { data, error } = await supabase
    .from('shops')
    .select('id, name, shop_type, phone, address, city, timezone, currency, logo_url')
    .eq('id', shopId)
    .single()
  if (error) throw error
  return data
}

function currencyCode(value) {
  const match = String(value || 'KES').toUpperCase().match(/[A-Z]{3}/)
  return match?.[0] || 'KES'
}

async function uploadShopLogo(shopId, userId, file) {
  if (!file) return null
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Use a JPG, PNG or WebP logo.')
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('The shop logo must be smaller than 2 MB.')
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${shopId}/logo-${userId}.${extension}`
  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  })
  if (error) throw error

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function saveShopProfile({ shopId, userId, profile, logoFile }) {
  const uploadedLogo = await uploadShopLogo(shopId, userId, logoFile)
  const { data, error } = await supabase.rpc('update_owned_shop_profile', {
    target_shop_id: shopId,
    updated_name: profile.name,
    updated_shop_type: profile.type,
    updated_phone: profile.phone || null,
    updated_address: profile.address || null,
    updated_city: profile.city || null,
    updated_timezone: profile.timezone || 'Africa/Nairobi',
    updated_currency: currencyCode(profile.currency),
    updated_logo_url: uploadedLogo || profile.logo || null,
  })
  if (error) throw error
  return data
}

export async function getPaymentSettings(shopId) {
  const { data, error } = await supabase.rpc('get_owned_shop_payment_settings', {
    target_shop_id: shopId,
  })
  if (error) throw error
  return data
}

export async function savePaymentSettings(shopId, settings) {
  const { data, error } = await supabase.rpc('update_owned_shop_payment_settings', {
    target_shop_id: shopId,
    cash_value: Boolean(settings.cash),
    mpesa_value: Boolean(settings.mpesa),
    card_value: Boolean(settings.card),
    bank_value: Boolean(settings.bank),
    credit_value: Boolean(settings.credit),
  })
  if (error) throw error
  return data
}
