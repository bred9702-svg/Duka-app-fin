import { useNavigate } from 'react-router-dom'
import ScreenContainer from '../components/layout/ScreenContainer'
import Icon from '../components/ui/Icon'

const ITEMS = [
  {
    title: 'Dashboard',
    subtitle: 'Business overview',
    icon: 'barChart',
    color: '#5B9FF0',
    path: '/analytics',
  },
  {
    title: 'Inventory Intelligence',
    subtitle: 'AI inventory analysis',
    icon: 'package',
    color: '#5FD97A',
    path: '/inventory',
  },
  {
    title: 'Financial Analysis',
    subtitle: 'Income, expenses & profit',
    icon: 'cash',
    color: '#F0A93D',
    path: '/finance',
  },
  {
    title: 'Business Trends',
    subtitle: 'Growth and performance',
    icon: 'trendingUp',
    color: '#7C5CFC',
    path: '/trends',
  },
  {
    title: 'AI Advisor',
    subtitle: 'Recommendations for your shop',
    icon: 'bell',
    color: '#FF6B5B',
    path: '/advisor',
  },
  {
    title: 'Dukwise AI',
    subtitle: 'Quick rule-based business insights',
    icon: 'star',
    color: '#F0A93D',
    path: '/duka-ai',
  },
]

export default function InsightsScreen() {
  const navigate = useNavigate()

  return (
    <ScreenContainer>
      <div
        className="bg-blob"
        style={{
          width: 130,
          height: 130,
          top: -30,
          right: -30,
          background: 'rgba(240,169,61,0.2)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 21,
              fontWeight: 700,
              color: 'var(--text-hi)',
              letterSpacing: '-0.02em',
            }}
          >
            Insights
          </h1>
        </div>

        <div>
          {ITEMS.map((item, i) => (
            <div
              key={item.title}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 11px',
                marginBottom: 6,
                borderRadius: 12,
                cursor: 'pointer',
                background: 'var(--glass-fill-soft)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid var(--glass-border)',
                animation: 'slideUp .35s ease-out backwards',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 34,
                  alignSelf: 'center',
                  borderRadius: 999,
                  background: item.color,
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: `${item.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={item.icon}
                  size={14}
                  color={item.color}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '-.01em',
                    color: 'var(--text-hi)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    marginTop: 2,
                    fontSize: 8,
                    opacity: 0.65,
                    color: 'var(--text-low)',
                  }}
                >
                  {item.subtitle}
                </div>
              </div>

              <Icon
                name="chevronRight"
                size={16}
                color="var(--text-low)"
              />
            </div>
          ))}
        </div>
      </div>
    </ScreenContainer>
  )
}
