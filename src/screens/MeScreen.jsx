import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'

const SECTIONS = [
  {
    title: 'Business',
    items: [
      { label: 'Shop Profile', icon: 'store', color: '#5FD97A', path: '/shop' },
      { label: 'Payment Mode', icon: 'cash', color: '#F0A93D', path: '/payment-mode' },
      { label: 'Business Preferences', icon: 'settings', color: '#5B9FF0', path: '/business-preferences' },
    ],
  },
  {
    title: 'Application',
    items: [
      { label: 'Notification', icon: 'bell', color: '#FF6B5B', path: '/notifications' },
      { label: 'Theme', icon: 'moon', color: '#7C5CFC', path: '/appearance' },
      { label: 'Language', icon: 'globe', color: '#4FC3F7', path: '/language' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help', icon: 'helpCircle', color: '#F0A93D', path: '/help' },
      { label: 'Privacy', icon: 'shield', color: '#5B9FF0', path: '/privacy' },
      { label: 'Rate Duka', icon: 'star', color: '#FFD166', path: '/rate' },
    ],
  },
]

function SectionTitle({ children }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-low)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: '18px 0 8px',
      }}
    >
      {children}
    </p>
  )
}

function Row({ item, onClick, isFirst, isLast }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 12px',
        cursor: 'pointer',
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderLeft: '1px solid var(--glass-border)',
        borderRight: '1px solid var(--glass-border)',
        borderTop: isFirst ? '1px solid var(--glass-border)' : 'none',
        borderBottom: isLast
          ? '1px solid var(--glass-border)'
          : '1px solid rgba(255,255,255,.04)',
        borderTopLeftRadius: isFirst ? 14 : 0,
        borderTopRightRadius: isFirst ? 14 : 0,
        borderBottomLeftRadius: isLast ? 14 : 0,
        borderBottomRightRadius: isLast ? 14 : 0,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${item.color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={item.icon} size={14} color={item.color} />
      </div>

      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-hi)',
        }}
      >
        {item.label}
      </p>

      <Icon name="chevronRight" size={15} color="var(--text-low)" />
    </div>
  )
}

function getSubscriptionStatus(session) {
  if (!session) {
    return null
  }

  if (session.subscriptionStatus === 'active') {
    return {
      title: 'Pro Active',
      detail: 'Your subscription is active',
      color: '#5FD97A',
      bg: 'linear-gradient(160deg, rgba(95,217,122,.16), rgba(255,255,255,.03))',
      border: '1px solid rgba(95,217,122,.28)',
    }
  }

  if (session.subscriptionStatus === 'expired') {
    return {
      title: 'Trial Expired',
      detail: 'Your trial has ended. Upgrade to continue.',
      color: '#FF6B5B',
      bg: 'linear-gradient(160deg, rgba(255,107,91,.16), rgba(255,255,255,.03))',
      border: '1px solid rgba(255,107,91,.28)',
    }
  }

  const diffMs = session.trialEnd
    ? new Date(session.trialEnd).getTime() - Date.now()
    : 15 * 24 * 60 * 60 * 1000

  const daysRemaining = Number.isNaN(diffMs)
    ? 15
    : Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))

  return {
    title: 'Pro Trial',
    detail: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`,
    color: '#F0A93D',
    bg: 'linear-gradient(160deg, rgba(240,169,61,.16), rgba(255,255,255,.03))',
    border: '1px solid rgba(240,169,61,.28)',
  }
}

export default function MeScreen() {
  const navigate = useNavigate()
  const session = useAppStore((s) => s.session)
  const signOut = useAppStore((s) => s.signOut)
  const refreshSubscriptionStatus = useAppStore((s) => s.refreshSubscriptionStatus)

  const currentSession = refreshSubscriptionStatus?.() || session
  const subscription = getSubscriptionStatus(currentSession)

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        padding: '16px 14px 20px',
        position: 'relative',
      }}
    >
      <div
        className="bg-blob"
        style={{
          width: 140,
          height: 140,
          top: -30,
          right: -20,
          background: 'rgba(91,159,240,.14)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 21,
            fontWeight: 700,
            color: 'var(--text-hi)',
            letterSpacing: '-0.02em',
            marginBottom: 14,
          }}
        >
          Me
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px',
            borderRadius: 14,
            background: 'var(--glass-fill-soft)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'rgba(240,169,61,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="users" size={22} color="#F0A93D" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-hi)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentSession?.name || 'Shop Owner'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  padding: '2px 7px',
                  background: currentSession?.role === 'employee' ? 'rgba(91,159,240,.14)' : 'rgba(240,169,61,.14)',
                  color: currentSession?.role === 'employee' ? '#5B9FF0' : '#F0A93D',
                }}
              >
                {currentSession?.role === 'employee' ? 'Employee' : 'Owner'}
              </span>
              {currentSession?.shopName && (
                <span style={{ fontSize: 11, color: 'var(--text-low)' }}>
                  {currentSession.shopName}
                </span>
              )}
            </div>
          </div>
        </div>

        {subscription && (
          <div
            style={{
              marginTop: 10,
              padding: '12px 14px',
              borderRadius: 14,
              background: subscription.bg,
              border: subscription.border,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: subscription.color, margin: 0 }}>
                {subscription.title}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>
                {subscription.detail}
              </p>
            </div>
            <Icon name="star" size={20} color={subscription.color} />
          </div>
        )}

        {SECTIONS.map((section) => (
          <div key={section.title}>
            <SectionTitle>{section.title}</SectionTitle>

            <div>
              {section.items.map((item, i) => (
                <Row
                  key={item.label}
                  item={item}
                  onClick={() => navigate(item.path)}
                  isFirst={i === 0}
                  isLast={i === section.items.length - 1}
                />
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            signOut()
            navigate('/splash')
          }}
          style={{
            width: '100%', marginTop: 20, padding: '12px', borderRadius: 12,
            border: '1px solid rgba(255,107,91,0.25)', background: 'rgba(255,107,91,0.08)',
            cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
            color: '#FF6B5B',
          }}
        >
          Sign Out
        </button>

        <p
          style={{
            textAlign: 'center',
            fontSize: 10,
            color: 'var(--text-low)',
            opacity: 0.6,
            marginTop: 14,
          }}
        >
          Version 1.0.0
        </p>
      </div>
    </div>
  )
}
