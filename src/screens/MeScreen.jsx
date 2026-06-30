import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Icon from '../components/ui/Icon'

const ITEMS = [
  {
    title: 'Profile',
    subtitle: 'Your personal information',
    icon: 'users',
    color: '#5B9FF0',
    path: '/profile',
  },
  {
    title: 'Appearance',
    subtitle: 'Theme and display',
    icon: 'settings',
    color: '#F0A93D',
    path: '/appearance',
  },
  {
    title: 'Shop',
    subtitle: 'Business information',
    icon: 'store',
    color: '#5FD97A',
    path: '/shop',
  },
  {
    title: 'Backup',
    subtitle: 'Protect your data',
    icon: 'package',
    color: '#7C5CFC',
    path: '/backup',
  },
  {
    title: 'Subscription',
    subtitle: 'Manage your plan',
    icon: 'cash',
    color: '#4FC3F7',
    path: '/subscription',
  },
  {
    title: 'Help',
    subtitle: 'Support & FAQ',
    icon: 'alertTriangle',
    color: '#FFB74D',
    path: '/help',
  },
  {
    title: 'About',
    subtitle: 'Version and information',
    icon: 'bell',
    color: '#90A4AE',
    path: '/about',
  },
]

export default function MeScreen() {
  const navigate = useNavigate()

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
          background: 'rgba(91,159,240,.16)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-hi)',
            marginBottom: 4,
          }}
        >
          Me
        </h1>

        <p
          style={{
            color: 'var(--text-low)',
            fontSize: 12,
            marginBottom: 22,
          }}
        >
          Manage your account and preferences.
        </p>

        <Card
          style={{
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'rgba(240,169,61,.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            👤
          </div>

          <div style={{ flex: 1 }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: 17,
                color: 'var(--text-hi)',
                marginBottom: 2,
              }}
            >
              Shop Owner
            </p>

            <p
              style={{
                fontSize: 12,
                color: 'var(--text-low)',
              }}
            >
              Duka Business
            </p>
          </div>
        </Card>

        {ITEMS.map((item) => (
          <Card
            key={item.title}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 10,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: `${item.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name={item.icon}
                size={18}
                color={item.color}
              />
            </div>

            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  color: 'var(--text-hi)',
                }}
              >
                {item.title}
              </p>

              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: 'var(--text-low)',
                }}
              >
                {item.subtitle}
              </p>
            </div>

            <Icon
              name="chevronRight"
              size={16}
              color="var(--text-low)"
            />
          </Card>
        ))}
      </div>
    </div>
  )
}
