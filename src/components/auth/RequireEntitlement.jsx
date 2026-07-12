import { useNavigate } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'
import Icon from '../ui/Icon'

export default function RequireEntitlement({ feature, title, children }) {
  const navigate = useNavigate()
  const session = useAppStore((state) => state.session)

  if (session?.entitlements?.[feature] === true) return children

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 24px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 150, height: 150, top: -35, right: -25, background: 'rgba(240,169,61,.18)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          style={{ width: 36, height: 36, borderRadius: 11, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Icon name="chevronLeft" size={18} color="var(--text-hi)" />
        </button>

        <div style={{ marginTop: 32, padding: '30px 18px', borderRadius: 20, textAlign: 'center', background: 'linear-gradient(160deg, rgba(240,169,61,.16), rgba(255,255,255,.03))', border: '1px solid rgba(240,169,61,.30)' }}>
          <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: 18, background: 'rgba(240,169,61,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="star" size={26} color="#F0A93D" />
          </div>
          <p style={{ margin: '16px 0 5px', fontSize: 10, fontWeight: 750, color: '#F0A93D', textTransform: 'uppercase', letterSpacing: '.10em' }}>Duka Pro</p>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text-hi)' }}>{title}</h1>
          <p style={{ margin: '10px auto 0', maxWidth: 310, fontSize: 12, lineHeight: 1.65, color: 'var(--text-low)' }}>
            Unlock deeper analysis, intelligent recommendations and advanced tools to understand and grow your shop.
          </p>
          <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 13, background: 'rgba(240,169,61,.10)', color: '#F0A93D', fontSize: 13, fontWeight: 750 }}>
            KES {Number(session?.subscriptionAmountKes || 2999).toLocaleString()} / month
          </div>
        </div>
      </div>
    </div>
  )
}
