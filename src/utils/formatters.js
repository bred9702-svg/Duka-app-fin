const STORE_SETTINGS_KEY = 'duka-store-settings'

const CURRENCY_META = {
  KES: { code: 'KES', label: 'KES — Kenyan Shilling', locale: 'en-KE' },
  USD: { code: 'USD', label: 'USD — US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', label: 'EUR — Euro', locale: 'en-IE' },
  GBP: { code: 'GBP', label: 'GBP — British Pound', locale: 'en-GB' },
  TZS: { code: 'TZS', label: 'TZS — Tanzanian Shilling', locale: 'en-TZ' },
  UGX: { code: 'UGX', label: 'UGX — Ugandan Shilling', locale: 'en-UG' },
}

export function getBusinessPreferences() {
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getCurrencyCode() {
  const currency = getBusinessPreferences().currency || 'KES'
  return CURRENCY_META[currency]?.code || 'KES'
}

export function getCurrencyLabel() {
  const currency = getCurrencyCode()
  return CURRENCY_META[currency]?.label || CURRENCY_META.KES.label
}

export function getCurrencyLocale() {
  const currency = getCurrencyCode()
  return CURRENCY_META[currency]?.locale || CURRENCY_META.KES.locale
}

export function fmtNumber(n) {
  if (!n && n !== 0) return '0'
  return Math.round(Number(n) || 0).toLocaleString()
}

export function fmtKES(n) {
  return fmtNumber(n)
}

export function fmtMoney(n, options = {}) {
  const currency = options.currency || getCurrencyCode()
  const locale = CURRENCY_META[currency]?.locale || getCurrencyLocale()

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(n) || 0)
  } catch {
    return `${fmtNumber(n)} ${currency}`
  }
}

export function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'
  if (diff < 86400000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export function fmtDateLong(ts) {
  return new Date(ts).toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function fmtShortDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })
}

export function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function newId(prefix = 't') {
  return prefix + Date.now() + Math.floor(Math.random() * 1000)
}

export function fmtDay(dayIndex) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[dayIndex] || ''
}

export function fmtHour(hour) {
  if (hour === 0) return '12am'
  if (hour < 12) return hour + 'am'
  if (hour === 12) return '12pm'
  return (hour - 12) + 'pm'
}