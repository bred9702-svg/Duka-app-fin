import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import useAppStore from '../../store/useAppStore'
import FadeIn from '../../components/animation/FadeIn'

export default function SignInScreen() {
  const navigate = useNavigate()
  const signIn = useAppStore((s) => s.signIn)

  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('owner')

  const canSubmit = phone.trim().length > 0

  function handleContinue() {
    if (!canSubmit) return
    signIn({ phone: phone.trim(), role })
    navigate('/')
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
            cursor: 'pointer', marginBottom: 24,
          }}
        >
          <Icon name="arrowLeft" size={16} color="var(--text-hi)" />
        </button>

        <FadeIn duration={280} y={12}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-low)', marginBottom: 24 }}>
            Sign in to continue to your shop
          </p>
        </FadeIn>

        <FadeIn delay={60} duration={280} y={12}>
          <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Phone Number</p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254 7XX XXX XXX"
            style={{
              width: '100%', background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
              borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)',
              fontFamily: 'inherit', outline: 'none', marginBottom: 14,
            }}
          />

          <button
            disabled
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px', borderRadius: 10, border: '1px solid var(--glass-border)',
              background: 'var(--faint-fill)', cursor: 'default', marginBottom: 20,
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

          <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Signing in as
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[
              { id: 'owner', label: 'Owner', icon: 'store' },
              { id: 'employee', label: 'Employee', icon: 'users' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px', borderRadius: 10, cursor: 'pointer',
                  background: role === r.id ? 'rgba(240,169,61,0.14)' : 'var(--glass-fill-soft)',
                  border: role === r.id ? '1.5px solid rgba(240,169,61,0.45)' : '1px solid var(--glass-border)',
                }}
              >
                <Icon name={r.icon} size={14} color={role === r.id ? '#F0A93D' : 'var(--text-low)'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: role === r.id ? '#F0A93D' : 'var(--text-low)' }}>
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={140} duration={280} y={10}>
          <button
            onClick={handleContinue}
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'var(--font-display)',
              fontSize: 14, fontWeight: 700, color: '#0F1117', background: '#F0A93D',
              opacity: canSubmit ? 1 : 0.4, transition: 'opacity 200ms ease',
            }}
          >
            Continue
          </button>
        </FadeIn>
      </div>
    </div>
  )
}
