export const EMPLOYEE_INVITES_KEY = 'duka-employee-invites'
export const JOINED_EMPLOYEES_KEY = 'duka-joined-employees'

const INVITE_PREFIX = 'DUKA'
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function normalizeInviteCode(value = '') {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export function createShopId(shopName, ownerName) {
  const source = `${shopName || 'Duka Shop'}-${ownerName || 'Shop Owner'}`
  return `shop-${source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'duka-shop'}`
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
  const normalizedCode = normalizeInviteCode(invite.code)
  const normalizedInvite = {
    ...invite,
    code: normalizedCode,
    shopId: invite.shopId || normalizedCode,
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

  const invite = getEmployeeInvites().find((item) => normalizeInviteCode(item.code) === normalizedCode)
  if (!invite) return null

  return {
    ...invite,
    code: normalizedCode,
    shopId: invite.shopId || normalizedCode,
  }
}

export function createEmployeeInvite({ shopName, ownerName, shopId }) {
  const code = generateEmployeeInviteCode()
  const normalizedShopName = shopName || 'Duka Shop'
  const normalizedOwnerName = ownerName || 'Shop Owner'

  return saveEmployeeInvite({
    code,
    link: buildEmployeeInviteLink(code),
    shopId: shopId || createShopId(normalizedShopName, normalizedOwnerName),
    shopName: normalizedShopName,
    ownerName: normalizedOwnerName,
    createdAt: new Date().toISOString(),
  })
}

export function getJoinedEmployees() {
  try {
    const raw = localStorage.getItem(JOINED_EMPLOYEES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveJoinedEmployee(employee) {
  const normalizedEmployee = {
    ...employee,
    role: 'employee',
    joinedAt: employee.joinedAt || new Date().toISOString(),
  }

  const employees = getJoinedEmployees()
  const nextEmployees = [
    normalizedEmployee,
    ...employees.filter((item) => item.employeeId !== normalizedEmployee.employeeId),
  ]

  localStorage.setItem(JOINED_EMPLOYEES_KEY, JSON.stringify(nextEmployees))
  return normalizedEmployee
}
