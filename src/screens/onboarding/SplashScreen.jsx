import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'
import FadeIn from '../../components/animation/FadeIn'

export default function SplashScreen() {
  const navigate = useNavigate()
  const session = useAppStore((s) => s.session)

  useEffect(() => {
    const t = setTimeout(() => {
      if (session?.isOnboarded) {
        navigate('/', { replace: true })
      } else if (session && !session.isOnboarded) {
        navigate('/setup-inventory', { replace: true })
      } else {
        navigate('/welcome', { replace: true })
      }
    }, 1400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        flex: 1, width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18,
        background: 'var(--bg-deep)',
      }}
    >
      <FadeIn duration={400} y={8}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(160deg, #F0A93D, #C9861F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 30px -8px rgba(240,169,61,0.5)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#0F1117' }}>
              D
            </span>
          </div>

          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em' }}>
            Dukwise
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={200} duration={400} y={6}>
        <div
          style={{
            width: 120, height: 3, borderRadius: 999,
            background: 'var(--faint-fill)', overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '40%', height: '100%', borderRadius: 999,
              background: '#F0A93D',
              animation: 'splashLoad 1.1s ease-in-out infinite',
            }}
          />
        </div>
      </FadeIn>

      <style>{`
        @keyframes splashLoad {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  )
}
