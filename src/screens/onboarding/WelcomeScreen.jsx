import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import FadeIn from '../../components/animation/FadeIn'
import dukwiseLogo from '../../../assets/branding/dukwise-logo-master.png'

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
          <img
            src={dukwiseLogo}
            alt="Dukwise"
            draggable={false}
            style={{
              display: 'block', width: 64, height: 64,
              objectFit: 'contain', marginBottom: 20,
            }}
          />

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 10 }}>
            Your business, understood.
          </h1>

          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.5 }}>
            Dukwise is an AI manager for your shop. It learns from your own sales, stock, and customers, then tells you exactly what to do next, every day.
          </p>
        </FadeIn>

        <FadeIn delay={120} duration={320} y={14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
            {[
              { icon: 'brain', text: 'Decisions based on your real numbers, not guesses' },
              { icon: 'bell', text: 'Daily guidance on what to restock, chase, or fix' },
              { icon: 'trendingUp', text: 'Gets sharper the more your shop runs' },
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
          Start 15-day free trial
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-low)', marginBottom: 12 }}>
          No card required
        </p>

        <button
          onClick={() => navigate('/sign-in?mode=join')}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            border: '1px solid rgba(91,159,240,0.34)', background: 'rgba(91,159,240,0.1)',
            cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            color: '#7DB7FF', marginBottom: 10,
          }}
        >
          Join a Shop
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
