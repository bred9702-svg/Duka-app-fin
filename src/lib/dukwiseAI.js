import { supabase } from './supabase'

const MAX_HISTORY_MESSAGES = 6

export async function askDukwiseAI({ shopId, question, history = [] }) {
  if (!shopId) throw new Error('No active shop was found.')

  const normalizedQuestion = String(question || '').trim()
  if (normalizedQuestion.length < 2) throw new Error('Please enter a question.')

  const safeHistory = history
    .filter((message) => message?.role === 'user' || message?.role === 'assistant')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').slice(0, 1200),
    }))

  const { data, error } = await supabase.functions.invoke('dukwise-ai', {
    body: {
      shop_id: shopId,
      question: normalizedQuestion,
      history: safeHistory,
    },
  })

  if (error) {
    let message = 'Dukwise AI is temporarily unavailable. Please try again.'
    try {
      const payload = await error.context?.json()
      if (payload?.error) message = payload.error
    } catch {
      // Keep the safe fallback when the Edge Function returned no JSON body.
    }
    throw new Error(message)
  }

  if (!data?.answer) {
    throw new Error('Dukwise AI returned an empty response. Please try again.')
  }

  return data
}
