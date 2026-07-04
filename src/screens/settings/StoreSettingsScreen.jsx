import { useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import Toggle from '../../components/ui/Toggle'

const STORAGE_KEY = 'duka-store-settings'

const DEFAULTS = {
  tax: '16',
  currency: 'KES',
  receipt: true,
  stockAlerts: true,
  lowStockThreshold: '5',
  autoBackup: true,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function InputRow({ label, value, onChange, suffix, icon, color }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 12px',
        borderRadius: 12,
        marginBottom: 8,
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={14} color={color} />
      </div>
      <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 50,
          textAlign: 'right',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 13,
          fontWeight: 700,
          color: '#F0A93D',
          fontFamily: 'var(--font-display)',
        }}
      />
      {suffix && <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{suffix}</span>}
    </div>
  )
}

function ToggleRow({ label, sub, checked, onChange, icon, color }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 12px',
        borderRadius: 12,
        marginBottom: 8,
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={14} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>{label}</p>
        {sub && <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-low)' }}>{sub}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function StoreSettingsScreen() {
  const [settings, setSettings] = useState(loadSettings)

  function update(field, value) {
    const next = { ...settings, [field]: value }
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Store Settings" />

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          General
        </p>
        <InputRow label="Tax rate" value={settings.tax} onChange={(v) => update('tax', v)} suffix="%" icon="cash" color="#F0A93D" />
        <InputRow label="Currency" value={settings.currency} onChange={(v) => update('currency', v)} icon="coins" color="#5FD97A" />

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 8px' }}>
          Receipts &amp; Stock
        </p>
        <ToggleRow label="Auto-print receipt" sub="Print after every sale" checked={settings.receipt} onChange={(v) => update('receipt', v)} icon="receiptOff" color="#5B9FF0" />
        <ToggleRow label="Stock alerts" sub="Notify when stock is low" checked={settings.stockAlerts} onChange={(v) => update('stockAlerts', v)} icon="bell" color="#FF6B5B" />
        <InputRow label="Low stock threshold" value={settings.lowStockThreshold} onChange={(v) => update('lowStockThreshold', v)} suffix="units" icon="package" color="#7C5CFC" />

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 8px' }}>
          Data
        </p>
        <ToggleRow label="Auto backup" sub="Backup data daily" checked={settings.autoBackup} onChange={(v) => update('autoBackup', v)} icon="package" color="#4FC3F7" />
      </div>
    </div>
  )
}
