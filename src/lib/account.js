import { supabase } from './supabase'

export async function requestAccountDeletion(confirmation) {
  const { data, error } = await supabase.rpc('request_account_deletion', {
    confirmation_text: confirmation,
  })
  if (error) throw error
  return data
}
