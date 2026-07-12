import { useEffect, useRef, useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import useAppStore from '../../store/useAppStore'
import { getShopProfile } from '../../lib/shop'

const DEFAULTS = {
  name: 'My Wines & Spirits',
  type: 'Wines & Spirits',
  phone: '+254 7XX XXX XXX',
  address: 'Nairobi, Kenya',
  city: 'Nairobi',
  currency: 'KES — Kenyan Shilling',
  timezone: 'Africa/Nairobi',
  logo: null,
}

function loadProfile(session) {
  return {
    ...DEFAULTS,
    name: session?.shopName || DEFAULTS.name,
    type: session?.shopType || DEFAULTS.type,
    phone: session?.phone || DEFAULTS.phone,
    address: session?.shopAddress || DEFAULTS.address,
    city: session?.shopCity || DEFAULTS.city,
    timezone: session?.shopTimezone || DEFAULTS.timezone,
    logo: session?.shopLogo || session?.photo || null,
  }
}

function FieldRow({ label, value, onChange, icon, color, placeholder }) {
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
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
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
  const session = useAppStore((s) => s.session)
  const updateShopProfile = useAppStore((s) => s.updateShopProfile)

  const fileInputRef = useRef(null)
  const [profile, setProfile] = useState(() => loadProfile(session))
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session?.shopId) return
    getShopProfile(session.shopId)
      .then((shop) => {
        setProfile({
          name: shop.name || DEFAULTS.name,
          type: shop.shop_type || DEFAULTS.type,
          phone: shop.phone || '',
          address: shop.address || '',
          city: shop.city || '',
          currency: shop.currency || 'KES',
          timezone: shop.timezone || DEFAULTS.timezone,
          logo: shop.logo_url || null,
        })
      })
      .catch((loadError) => {
        console.error('Load shop profile failed:', loadError)
        setError('Could not refresh the shop profile.')
      })
  }, [session?.shopId])

  function update(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))
    setSaved(false)
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Use a JPG, PNG or WebP logo smaller than 2 MB.')
      return
    }
    setLogoFile(file)
    setError('')

    const reader = new FileReader()

    reader.onload = () => {
      update('logo', reader.result)
    }

    reader.readAsDataURL(file)
  }

  async function save() {
    if (saving) return
    const cleanedProfile = {
      ...profile,
      name: profile.name?.trim() || DEFAULTS.name,
      type: profile.type?.trim() || DEFAULTS.type,
      phone: profile.phone?.trim() || '',
      address: profile.address?.trim() || '',
      city: profile.city?.trim() || '',
      currency: profile.currency?.trim() || DEFAULTS.currency,
      timezone: profile.timezone?.trim() || DEFAULTS.timezone,
      logo: profile.logo || null,
    }

    setSaving(true)
    setError('')
    try {
      const shop = await updateShopProfile(cleanedProfile, logoFile)
      setProfile({
        ...cleanedProfile,
        name: shop.name,
        type: shop.shop_type,
        phone: shop.phone || '',
        address: shop.address || '',
        city: shop.city || '',
        timezone: shop.timezone,
        currency: shop.currency,
        logo: shop.logo_url || null,
      })
      setLogoFile(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (saveError) {
      console.error('Save shop profile failed:', saveError)
      setError(saveError.message || 'Could not save the shop profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{
          width: 140,
          height: 140,
          top: -30,
          right: -20,
          background: 'rgba(240,169,61,0.16)',
        }}
      />

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
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: profile.logo ? 'transparent' : 'rgba(240,169,61,.18)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
              position: 'relative',
              cursor: 'pointer',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            {profile.logo ? (
              <img
                src={profile.logo}
                alt="Shop logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Icon name="store" size={28} color="#F0A93D" />
            )}

            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 24,
                height: 24,
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
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            style={{ display: 'none' }}
          />

          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-hi)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {profile.name}
          </p>

          <p style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>
            {profile.type}
          </p>

          <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>
            Tap logo to change photo
          </p>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-low)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          Shop details
        </p>

        <FieldRow
          label="Shop name"
          value={profile.name}
          onChange={(v) => update('name', v)}
          icon="store"
          color="#F0A93D"
          placeholder="Shop name"
        />

        <FieldRow
          label="Business type"
          value={profile.type}
          onChange={(v) => update('type', v)}
          icon="bag"
          color="#5FD97A"
          placeholder="Wines & Spirits"
        />

        <FieldRow
          label="Phone"
          value={profile.phone}
          onChange={(v) => update('phone', v)}
          icon="phone"
          color="#5B9FF0"
          placeholder="+254..."
        />

        <FieldRow
          label="Address"
          value={profile.address}
          onChange={(v) => update('address', v)}
          icon="pieChart"
          color="#7C5CFC"
          placeholder="Street, building, area"
        />

        <FieldRow
          label="City"
          value={profile.city}
          onChange={(v) => update('city', v)}
          icon="store"
          color="#FFB15B"
          placeholder="Nairobi"
        />

        <FieldRow
          label="Timezone"
          value={profile.timezone}
          onChange={(v) => update('timezone', v)}
          icon="globe"
          color="#4FC3F7"
          placeholder="Africa/Nairobi"
        />

        <button
          onClick={save}
          disabled={saving}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '13px',
            borderRadius: 12,
            border: 'none',
            cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            color: '#0F1117',
            background: saved ? '#5FD97A' : '#F0A93D',
            opacity: saving ? 0.65 : 1,
            transition: 'background .2s',
          }}
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
        {error && (
          <p style={{ margin: '10px 2px 0', fontSize: 11, color: '#FF6B5B', lineHeight: 1.45 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
