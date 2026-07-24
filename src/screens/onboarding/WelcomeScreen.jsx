import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import FadeIn from '../../components/animation/FadeIn'
import dukwiseLogo from '../../../assets/branding/dukwise-logo-master.png'

export default function WelcomeScreen() {
  const navigate = useNavigate()

  const benefits = [
    { icon: 'package', text: "Know what to restock and what isn't moving" },
    { icon: 'barChart', text: 'See your real profit, debts, and best performers' },
    { icon: 'brain', text: "Get daily AI guidance based on your shop's real numbers" },
  ]

  const accessOptions = [
    {
      icon: 'users',
      title: 'Join a Shop',
      description: 'Use an invitation code from your shop owner.',
      color: '#7DB7FF',
      border: 'rgba(91,159,240,0.34)',
      background: 'rgba(91,159,240,0.1)',
      path: '/sign-in?mode=join',
    },
    {
      icon: 'store',
      title: 'Sign In',
      description: 'Continue managing your existing shop.',
      color: 'var(--text-hi)',
      border: 'var(--glass-border)',
      background: 'var(--glass-fill-soft)',
      path: '/sign-in',
    },
  ]

  return (
    <div
      style={{
        flex: 1, width: '100%', padding: '38px 24px 28px',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-deep)', position: 'relative',
        overflowX: 'hidden', overflowY: 'auto', minHeight: 0,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: '0 0 auto', height: '38%',
          background: 'linear-gradient(180deg, rgba(240,169,61,0.42) 0%, rgba(112,69,22,0.24) 42%, rgba(15,17,23,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <FadeIn duration={320} y={14}>
          <img
            src={dukwiseLogo}
            alt="Dukwise"
            draggable={false}
            style={{
              display: 'block', width: 64, height: 64,
              objectFit: 'contain', margin: '0 auto 18px',
            }}
          />

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 10, textAlign: 'center' }}>
            Run your shop with answers, not guesses.
          </h1>

          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.55, textAlign: 'center', maxWidth: 320, margin: '0 auto' }}>
            Dukwise turns your sales, stock, debts, customers, and employees into clear decisions you can act on every day.
          </p>
        </FadeIn>

        <FadeIn delay={120} duration={320} y={14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
            {benefits.map((f) => (
              <div key={f.text} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(240,169,61,.16)', border: '1px solid rgba(240,169,61,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={f.icon} size={14} color="#F0A93D" />
                </div>
                <span style={{ fontSize: 11.5, lineHeight: 1.35, color: 'var(--text-mid)', maxWidth: 270 }}>{f.text}</span>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {accessOptions.map((option) => (
            <button
              key={option.title}
              onClick={() => navigate(option.path)}
              style={{
                minWidth: 0, minHeight: 112, padding: '14px 10px', borderRadius: 14,
                border: `1px solid ${option.border}`, background: option.background,
                cursor: 'pointer', color: option.color, textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              <Icon name={option.icon} size={19} color={option.color} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
                {option.title}
              </span>
              <span style={{ fontSize: 9.5, lineHeight: 1.35, color: 'var(--text-low)', fontWeight: 500 }}>
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </FadeIn>
    </div>
  )
}
