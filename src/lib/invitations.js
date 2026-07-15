import { supabase } from './supabase'

export function normalizeInviteCode(value = '') {
  return String(value).trim().toUpperCase().replace(/\s+/g, '')
}

export function buildEmployeeInviteLink(code) {
  return `${window.location.origin}/sign-in?mode=join&invite=${encodeURIComponent(normalizeInviteCode(code))}`
}

export async function createEmployeeInvitation(shopId, phone = null) {
  const { data, error } = await supabase.rpc('create_employee_invitation', {
    target_shop_id: shopId,
    employee_phone: phone || null,
  })
  if (error) throw error
  return { ...data, shopName: null, link: buildEmployeeInviteLink(data.code) }
}

export async function previewEmployeeInvitation(code) {
  const { data, error } = await supabase.rpc('get_employee_invitation_preview', {
    invitation_code: normalizeInviteCode(code),
  })
  if (error) throw new Error('Invalid or expired invitation code.')
  return { ...data, code: normalizeInviteCode(data.code) }
}

export async function acceptEmployeeInvitation(code) {
  const { data, error } = await supabase.rpc('accept_employee_invitation', {
    invitation_code: normalizeInviteCode(code),
  })
  if (error) throw new Error(error.message || 'Unable to accept this invitation.')
  return data
}

export async function revokeEmployeeInvitation(id) {
  const { data, error } = await supabase.rpc('revoke_employee_invitation', { invitation_id: id })
  if (error) throw error
  return data
}

export async function listEmployeeInvitations(shopId) {
  const { data, error } = await supabase
    .from('employee_invitations')
    .select('id, shop_id, code, phone, role, status, expires_at, created_at')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getShopTeam(shopId) {
  const { data, error } = await supabase.rpc('get_shop_team', { target_shop_id: shopId })
  if (error) throw error
  return data || []
}

export async function setEmployeeMembershipStatus(shopId, userId, status) {
  const { data, error } = await supabase.rpc('set_employee_membership_status', {
    target_shop_id: shopId,
    target_user_id: userId,
    target_status: status,
  })
  if (error) throw error
  return data
}
