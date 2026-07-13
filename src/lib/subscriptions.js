import { supabase } from './supabase'

export const SUBSCRIPTION_PAYMENT = Object.freeze({
  amountKes: 2999,
  mpesaPhone: '+254 742 599 719',
  mpesaRecipient: 'Gheremy Kazadi Mwepu',
  whatsappPhone: '254742599719',
})

export async function getLatestPaymentRequest(shopId) {
  const { data, error } = await supabase
    .from('subscription_payment_requests')
    .select('id, amount_kes, mpesa_reference, status, requested_at, reviewed_at, rejection_reason')
    .eq('shop_id', shopId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function submitPaymentRequest(shopId, mpesaReference) {
  const { data, error } = await supabase.rpc('submit_subscription_payment_request', {
    target_shop_id: shopId,
    submitted_mpesa_reference: String(mpesaReference || '').trim().toUpperCase(),
  })
  if (error) throw error
  return data
}

export function buildPaymentWhatsAppUrl({ shopName, ownerName, reference }) {
  const message = [
    'Hello Dukwise Support, I have paid for Dukwise Pro.',
    `Shop: ${shopName || 'My shop'}`,
    `Owner: ${ownerName || 'Shop Owner'}`,
    `Amount: KES ${SUBSCRIPTION_PAYMENT.amountKes.toLocaleString()}`,
    `M-Pesa reference: ${String(reference || '').trim().toUpperCase() || 'Not entered yet'}`,
    'Please verify and activate my subscription.',
  ].join('\n')
  return `https://wa.me/${SUBSCRIPTION_PAYMENT.whatsappPhone}?text=${encodeURIComponent(message)}`
}
