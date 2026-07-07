import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import FadeIn from '../../components/animation/FadeIn'

export default function WelcomeScreen() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        flex: 1, width: '100%', padding: '40px 24px 32px',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-deep)', position: 'relative',
      }}
    >
      <div className="bg-blob" style={{ width: 220, height: 220, top: -50, right: -50, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <FadeIn duration={320} y={14}>
          <div
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(160deg, #F0A93D, #C9861F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#0F1117' }}>
              D
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 10 }}>
            Run your shop smarter
          </h1>

          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.5 }}>
            Duka tracks your sales, inventory, and profit in real time — with an AI advisor built for Wine &amp; Spirits retailers.
          </p>
        </FadeIn>

        <FadeIn delay={120} duration={320} y={14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
            {[
              { icon: 'barChart', text: 'Real-time sales & profit tracking' },
              { icon: 'package', text: 'Smart inventory & restock alerts' },
              { icon: 'bell', text: 'An AI advisor that knows your business' },
            ].map((f) => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(240,169,61,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={f.icon} size={14} color="#F0A93D" />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-mid)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={200} duration={320} y={10} style={{ position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate('/register')}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            color: '#0F1117', background: '#F0A93D', marginBottom: 10,
          }}
        >
          Get Started
        </button>

        <button
          onClick={() => navigate('/sign-in')}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)',
            cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            color: 'var(--text-hi)',
          }}
        >
          Sign In
        </button>
      </FadeIn>
    </div>
  )
}
