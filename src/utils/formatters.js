export function fmtKES(n) {
  if (!n && n !== 0) return '0'
  return Math.round(n).toLocaleString()
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
