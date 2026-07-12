import { supabase } from './supabase'

export function fromBusinessPreferencesRow(row = {}) {
  return {
    currency: row.currency || 'KES',
    taxEnabled: row.tax_enabled === true,
    taxRate: String(row.tax_rate ?? ''),
    stockAlerts: row.stock_alerts !== false,
    lowStockThreshold: String(row.low_stock_threshold ?? 5),
    dailyAiBrief: row.daily_ai_brief !== false,
    aiRecommendations: row.ai_recommendations !== false,
  }
}

export async function getBusinessPreferences(shopId) {
  const { data, error } = await supabase.rpc('get_shop_business_preferences', {
    target_shop_id: shopId,
  })
  if (error) throw error
  return fromBusinessPreferencesRow(data)
}

export async function saveBusinessPreferences(shopId, preferences) {
  const taxRate = Number(preferences.taxRate)
  const lowStockThreshold = Number.parseInt(preferences.lowStockThreshold, 10)
  const { data, error } = await supabase.rpc('update_shop_business_preferences', {
    target_shop_id: shopId,
    requested_currency: preferences.currency || 'KES',
    requested_tax_enabled: preferences.taxEnabled === true,
    requested_tax_rate: Number.isFinite(taxRate) ? taxRate : 0,
    requested_stock_alerts: preferences.stockAlerts !== false,
    requested_low_stock_threshold: Number.isFinite(lowStockThreshold) ? lowStockThreshold : 5,
    requested_daily_ai_brief: preferences.dailyAiBrief !== false,
    requested_ai_recommendations: preferences.aiRecommendations !== false,
  })
  if (error) throw error
  return fromBusinessPreferencesRow(data)
}
