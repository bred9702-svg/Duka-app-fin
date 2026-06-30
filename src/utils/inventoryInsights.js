import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
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
]

export default function InsightsScreen() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        padding: '16px 14px 24px',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-hi)',
          marginBottom: 4,
        }}
      >
        Insights
      </h1>

      <p
        style={{
          color: 'var(--text-low)',
          fontSize: 12,
          marginBottom: 22,
        }}
      >
        Grow your business with intelligent insights.
      </p>

      {ITEMS.map(item => (
        <Card
          key={item.title}
          onClick={() => navigate(item.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 12,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
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
                fontWeight: 700,
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
  )
}
