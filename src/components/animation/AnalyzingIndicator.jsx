import { useEffect, useState } from 'react'
import Icon from '../ui/Icon'

const DEFAULT_STEPS = ['Sales', 'Inventory', 'Customers', 'Expenses']

/**
 * AnalyzingIndicator — shown briefly in the chat while Duka AI
 * "thinks", before revealing its response. Ticks off each data
 * source in sequence, then calls onDone after a short hold.
 * Total run time lands around 700-800ms end to end.
 */
export default function AnalyzingIndicator({
  steps = DEFAULT_STEPS,
  stepInterval = 120,
  holdAfter = 300,
  onDone,
}) {
  const [checked, setChecked] = useState(0)

  useEffect(() => {
    if (checked < steps.length) {
      const t = setTimeout(() => setChecked((c) => c + 1), stepInterval)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => onDone?.(), holdAfter)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked])

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        maxWidth: '85%',
        background: 'var(--glass-fill-soft)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 6 }}>
        Analyzing your business...
      </p>

      {steps.map((s, i) => (
        <div
          key={s}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 3,
            opacity: i < checked ? 1 : 0.35,
            transition: 'opacity 200ms ease',
          }}
        >
          <span style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {i < checked ? (
              <Icon name="check" size={11} color="#5FD97A" />
            ) : (
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-low)' }} />
            )}
          </span>
          <span style={{ fontSize: 11, color: i < checked ? 'var(--text-hi)' : 'var(--text-low)' }}>
            {s}
          </span>
        </div>
      ))}
    </div>
  )
}
