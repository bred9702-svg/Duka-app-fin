import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import useAppStore from '../../store/useAppStore'
import FadeIn from '../../components/animation/FadeIn'

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
          borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)',
          fontFamily: 'inherit', outline: 'none',
        }}
      />
    </div>
  )
}

export default function OwnerRegistrationScreen() {
  const navigate = useNavigate()
  const registerOwner = useAppStore((s) => s.registerOwner)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')

  const canSubmit = name.trim() && phone.trim() && shopName.trim()

  async function handleSubmit() {
    if (!canSubmit) return
    await registerOwner({ name: name.trim(), phone: phone.trim(), shopName: shopName.trim(), shopAddress: shopAddress.trim() })
    navigate('/setup-inventory')
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '20px 20px 32px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 180, height: 180, top: -40, right: -40, background: 'rgba(240,169,61,0.14)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 32, height: 32, borderRadius: 10, border: '1px solid var(--glass-border)',
            background: 'var(--glass-fill-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginBottom: 16,
          }}
        >
          <Icon name="arrowLeft" size={16} color="var(--text-hi)" />
        </button>

        <FadeIn duration={280} y={12}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-low)', marginBottom: 20 }}>
            Set up your shop on Duka in a minute
          </p>
        </FadeIn>

        <FadeIn delay={60} duration={280} y={12}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--faint-fill)', border: '1px solid var(--faint-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', cursor: 'pointer',
              }}
            >
              <Icon name="users" size={26} color="var(--text-low)" />
              <div
                style={{
                  position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%',
                  background: '#F0A93D', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--bg-deep)',
                }}
              >
                <Icon name="edit" size={11} color="#0F1117" />
              </div>
            </div>
          </div>

          <Field label="Full Name" value={name} onChange={setName} placeholder="e.g. Bred Mwepu" />
          <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+254 7XX XXX XXX" type="tel" />

          <button
            disabled
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px', borderRadius: 10, border: '1px solid var(--glass-border)',
              background: 'var(--faint-fill)', cursor: 'default', marginBottom: 16,
              fontSize: 12, fontWeight: 600, color: 'var(--text-low)', opacity: 0.6,
            }}
          >
            <Icon name="circleCheck" size={14} color="var(--text-low)" />
            Continue with Google
            <span style={{
              marginLeft: 4, fontSize: 8, fontWeight: 700, padding: '2px 6px',
              background: 'var(--glass-fill-soft)', color: 'var(--text-low)', letterSpacing: '.03em',
            }}>
              COMING SOON
            </span>
          </button>

          <div style={{ height: 1, background: 'var(--glass-border)', marginBottom: 16 }} />

          <Field label="Shop Name" value={shopName} onChange={setShopName} placeholder="e.g. Bred's Wines & Spirits" />
          <Field label="Shop Address" value={shopAddress} onChange={setShopAddress} placeholder="e.g. Nairobi, Kenya" />
        </FadeIn>

        <FadeIn delay={140} duration={280} y={10}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: '100%', marginTop: 8, padding: '14px', borderRadius: 12, border: 'none',
              cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'var(--font-display)',
              fontSize: 14, fontWeight: 700, color: '#0F1117', background: '#F0A93D',
              opacity: canSubmit ? 1 : 0.4, transition: 'opacity 200ms ease',
            }}
          >
            Create Account
          </button>
        </FadeIn>
      </div>
    </div>
  )
}
