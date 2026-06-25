export default function ContextualMessage({ stats, topProduct, topCustomer, lowStock }) {
  const hour = new Date().getHours()
  const { income, profit, unclassified } = stats

  function getMessage() {
    if (unclassified > 3) {
      return { emoji: '⚡', text: `You have ${unclassified} transactions waiting to be classified.`, color: '#FF6B5B' }
    }
    if (lowStock && lowStock.length > 0) {
      return { emoji: '📦', text: `${lowStock[0].name} is running low — only ${lowStock[0].stock_current} left.`, color: '#FFD98A' }
    }
    if (income > 0 && profit > 0) {
      const margin = Math.round((profit / income) * 100)
      return { emoji: '📈', text: `Your margin today is ${margin}%. ${margin > 25 ? 'Excellent work.' : 'Keep pushing.'}`, color: '#5FD97A' }
    }
    if (topProduct) {
      return { emoji: '🏆', text: `${topProduct.name} is your best seller right now.`, color: '#F0A93D' }
    }
    if (topCustomer) {
      return { emoji: '⭐', text: `${topCustomer.name} is your most loyal customer.`, color: '#5B9FF0' }
    }
    const defaults = [
      { emoji: '🚀', text: 'Ready for a great day. Start recording your sales.', color: '#F0A93D' },
      { emoji: '💡', text: 'Every transaction you record makes your business smarter.', color: '#5B9FF0' },
      { emoji: '🎯', text: 'Your data is building. Keep going.', color: '#5FD97A' },
    ]
    return defaults[new Date().getMinutes() % defaults.length]
  }

  const msg = getMessage()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '10px 14px',
      background: `${msg.color}12`,
      border: `1px solid ${msg.color}30`,
      borderRadius: 12,
      marginBottom: 14,
      animation: 'slideUp 0.5s ease-out',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{msg.emoji}</span>
      <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5 }}>
        {msg.text}
      </p>
    </div>
  )
}
