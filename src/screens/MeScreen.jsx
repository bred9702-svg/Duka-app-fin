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
      { label: 'Employees', icon: 'users', color: '#4FC3F7', path: '/employees' },
      { label: 'Employee Performance', icon: 'barChart', color: '#7C5CFC', path: '/employee-performance' },
    ],
  },
  {
    title: 'Application',
    items: [
      { label: 'Notification Center', icon: 'bell', color: '#FF6B5B', path: '/notification-center' },
      { label: 'Notification Settings', icon: 'settings', color: '#F0A93D', path: '/notifications' },
      { label: 'Theme', icon: 'moon', color: '#7C5CFC', path: '/appearance' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help', icon: 'helpCircle', color: '#F0A93D', path: '/help' },
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

function getTrialDaysRemaining(session) {
  if (session?.subscriptionStatus !== 'trial' || !session?.trialEnd) return null
  const diffMs = new Date(session.trialEnd).getTime() - Date.now()
  if (Number.isNaN(diffMs)) return null
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
}

export default function MeScreen() {
  const navigate = useNavigate()
  const session = useAppStore((s) => s.session)
  const signOut = useAppStore((s) => s.signOut)
  const trialDaysRemaining = getTrialDaysRemaining(session)
  const visibleSections = session?.role === 'employee'
    ? SECTIONS.map((section) => section.title === 'Business'
      ? { ...section, items: [] }
      : section)
        .filter((section) => section.items.length > 0)
    : SECTIONS

  const shopName = session?.shopName || 'Shop Owner'
  const shopType = session?.shopType || 'Owner'
  const shopLogo = session?.shopLogo || session?.photo || null
  const shopCity = session?.shopCity || null

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
              background: shopLogo ? 'transparent' : 'rgba(240,169,61,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {shopLogo ? (
              <img
                src={shopLogo}
                alt="Shop logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Icon name="users" size={22} color="#F0A93D" />
            )}
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
              {shopName}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  padding: '2px 7px',
                  background: session?.role === 'employee' ? 'rgba(91,159,240,.14)' : 'rgba(240,169,61,.14)',
                  color: session?.role === 'employee' ? '#5B9FF0' : '#F0A93D',
                }}
              >
                {session?.role === 'employee' ? 'Employee' : 'Owner'}
              </span>

             <span style={{ fontSize: 11, color: 'var(--text-low)' }}>
                {shopCity ? `${shopType} · ${shopCity}` : shopType}
              </span>
            </div>

            {session?.role === 'employee' && (session?.name || session?.phone) && (
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-low)' }}>
                {[session?.name, session?.phone].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {trialDaysRemaining !== null && (
          <div
            style={{
              marginTop: 10,
              padding: '12px 14px',
              borderRadius: 14,
              background: 'linear-gradient(160deg, rgba(240,169,61,.16), rgba(255,255,255,.03))',
              border: '1px solid rgba(240,169,61,.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#F0A93D', margin: 0 }}>
                Pro Trial
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>
                {trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} remaining
              </p>
            </div>
            <Icon name="star" size={20} color="#F0A93D" />
          </div>
        )}

        {visibleSections.map((section) => (
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
            width: '100%',
            marginTop: 20,
            padding: '12px',
            borderRadius: 12,
            border: '1px solid rgba(255,107,91,0.25)',
            background: 'rgba(255,107,91,0.08)',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 600,
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
