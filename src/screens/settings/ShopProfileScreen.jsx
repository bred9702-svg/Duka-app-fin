import { useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'

const STORAGE_KEY = 'duka-shop-profile'

const DEFAULTS = {
  name: 'My Wines & Spirits',
  type: 'Wines & Spirits',
  phone: '+254 7XX XXX XXX',
  address: 'Nairobi, Kenya',
  currency: 'KES — Kenyan Shilling',
  timezone: 'Africa/Nairobi',
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function FieldRow({ label, value, onChange, icon, color }) {
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
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={14} color={color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 9, color: 'var(--text-low)', fontWeight: 500 }}>
          {label}
        </p>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-hi)',
            padding: '2px 0 0',
            fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  )
}

export default function ShopProfileScreen() {
  const [profile, setProfile] = useState(loadProfile)
  const [saved, setSaved] = useState(false)

  function update(field, value) {
    const next = { ...profile, [field]: value }
    setProfile(next)
    setSaved(false)
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Shop Profile" />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 14px',
            borderRadius: 14,
            marginBottom: 16,
            background: 'var(--glass-fill-soft)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(240,169,61,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
              position: 'relative',
            }}
          >
            <Icon name="store" size={26} color="#F0A93D" />
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#F0A93D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-deep)',
              }}
            >
              <Icon name="edit" size={11} color="#0F1117" />
            </div>
          </div>

          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-hi)' }}>
            {profile.name}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>
            {profile.type}
          </p>
        </div>

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Shop details
        </p>

        <FieldRow label="Shop name" value={profile.name} onChange={(v) => update('name', v)} icon="store" color="#F0A93D" />
        <FieldRow label="Business type" value={profile.type} onChange={(v) => update('type', v)} icon="bag" color="#5FD97A" />
        <FieldRow label="Phone" value={profile.phone} onChange={(v) => update('phone', v)} icon="phone" color="#5B9FF0" />
        <FieldRow label="Address" value={profile.address} onChange={(v) => update('address', v)} icon="pieChart" color="#7C5CFC" />
        <FieldRow label="Currency" value={profile.currency} onChange={(v) => update('currency', v)} icon="cash" color="#FFD166" />
        <FieldRow label="Timezone" value={profile.timezone} onChange={(v) => update('timezone', v)} icon="globe" color="#4FC3F7" />

        <button
          onClick={save}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '13px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            color: '#0F1117',
            background: saved ? '#5FD97A' : '#F0A93D',
            transition: 'background .2s',
          }}
        >
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
