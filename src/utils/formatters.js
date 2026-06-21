export function fmtKES(n) {
  return Math.round(n).toLocaleString()
}

export function fmtTime(ts) {
  const diff = Date.now() - ts
  const d = new Date(ts)
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
  return new Date(isoString).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })
}

export function initials(name) {
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
