import { useEffect, useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import Toggle from '../../components/ui/Toggle'
import useAppStore from '../../store/useAppStore'
import { getPaymentSettings, savePaymentSettings } from '../../lib/shop'

const METHODS = [
  { id: 'cash', label: 'Cash', icon: 'cash', color: '#5FD97A' },
  { id: 'mpesa', label: 'M-Pesa', icon: 'phone', color: '#F0A93D' },
  { id: 'card', label: 'Card', icon: 'userDollar', color: '#5B9FF0' },
  { id: 'bank', label: 'Bank Transfer', icon: 'barChart', color: '#7C5CFC' },
  { id: 'credit', label: 'Credit', icon: 'coins', color: '#FF6B5B' },
]

const DEFAULTS = { cash: true, mpesa: true, card: true, bank: false, credit: false }

export default function PaymentModeScreen() {
  const shopId = useAppStore((state) => state.session?.shopId)
  const [enabled, setEnabled] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!shopId) return
    let active = true
    getPaymentSettings(shopId)
      .then((settings) => {
        if (active) setEnabled({ ...DEFAULTS, ...settings })
      })
      .catch((loadError) => {
        console.error('Load payment settings failed:', loadError)
        if (active) setError('Could not load payment settings.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [shopId])

  async function toggle(id) {
    if (!shopId || savingId) return
    const next = { ...enabled, [id]: !enabled[id] }
    if (!Object.values(next).some(Boolean)) {
      setError('At least one payment method must remain enabled.')
      return
    }
    const previous = enabled
    setEnabled(next)
    setSavingId(id)
    setError('')
    try {
      const saved = await savePaymentSettings(shopId, next)
      setEnabled({ ...DEFAULTS, ...saved })
    } catch (saveError) {
      console.error('Save payment settings failed:', saveError)
      setEnabled(previous)
      setError('Could not save this change. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  const activeCount = Object.values(enabled).filter(Boolean).length

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Payment Mode" />

        {loading && <p style={{ fontSize: 10, color: 'var(--text-low)', marginBottom: 10 }}>Loading payment methods...</p>}
        {error && <p style={{ fontSize: 10, color: '#FF6B5B', marginBottom: 10 }}>{error}</p>}

        <p style={{ fontSize: 11, color: 'var(--text-low)', marginBottom: 14 }}>
          {activeCount} payment method{activeCount !== 1 ? 's' : ''} accepted at checkout
        </p>

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Payment methods
        </p>

        {METHODS.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px',
              borderRadius: 12,
              marginBottom: 8,
              background: enabled[m.id] ? `${m.color}12` : 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: enabled[m.id] ? `1px solid ${m.color}40` : '1px solid var(--glass-border)',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: `${m.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name={m.icon} size={14} color={m.color} />
            </div>

            <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>
              {m.label}
            </p>

            <Toggle checked={enabled[m.id]} onChange={() => toggle(m.id)} disabled={loading || Boolean(savingId)} />
          </div>
        ))}

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 8px' }}>
          M-Pesa settings
        </p>

        <div
          style={{
            padding: '12px',
            borderRadius: 12,
            background: 'var(--glass-fill-soft)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid var(--glass-border)',
            opacity: enabled.mpesa ? 1 : 0.4,
            pointerEvents: enabled.mpesa ? 'auto' : 'none',
          }}
        >
          <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 3, fontWeight: 500 }}>Till / Paybill number</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>Connected via Africa's Talking SMS</p>
        </div>
      </div>
    </div>
  )
}
