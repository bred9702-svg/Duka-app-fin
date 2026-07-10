export const EMPLOYEE_INVITES_KEY = 'duka-employee-invites'

const INVITE_PREFIX = 'DUKA'
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function normalizeInviteCode(value = '') {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export function generateEmployeeInviteCode() {
  const bytes = new Uint8Array(6)

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  const suffix = Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join('')
  return `${INVITE_PREFIX}-${suffix}`
}

export function buildEmployeeInviteLink(code) {
  return `${window.location.origin}/sign-in?invite=${encodeURIComponent(normalizeInviteCode(code))}`
}

export function getEmployeeInvites() {
  try {
    const raw = localStorage.getItem(EMPLOYEE_INVITES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveEmployeeInvite(invite) {
  const normalizedInvite = {
    ...invite,
    code: normalizeInviteCode(invite.code),
  }

  const invites = getEmployeeInvites()
  const nextInvites = [
    normalizedInvite,
    ...invites.filter((item) => normalizeInviteCode(item.code) !== normalizedInvite.code),
  ]

  localStorage.setItem(EMPLOYEE_INVITES_KEY, JSON.stringify(nextInvites))
  return normalizedInvite
}

export function getEmployeeInviteByCode(code) {
  const normalizedCode = normalizeInviteCode(code)
  if (!normalizedCode) return null

  return getEmployeeInvites().find((invite) => normalizeInviteCode(invite.code) === normalizedCode) || null
}

export function createEmployeeInvite({ shopName, ownerName }) {
  const code = generateEmployeeInviteCode()

  return saveEmployeeInvite({
    code,
    link: buildEmployeeInviteLink(code),
    shopName: shopName || 'Duka Shop',
    ownerName: ownerName || 'Shop Owner',
    createdAt: new Date().toISOString(),
  })
}
