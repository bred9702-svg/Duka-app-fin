import Card from '../ui/Card'
import Icon from '../ui/Icon'

const COLORS = {
  success: '#4ADE80',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#60A5FA',
}

export default function SmartInventoryAlerts({ alerts = [] }) {
  if (!alerts.length) return null

  return (
    <div style={{ marginBottom: 22 }}>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-low)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          marginBottom: 12,
        }}
      >
        Smart Alerts
      </p>

      {alerts.map((alert) => {
        const color = COLORS[alert.type] || COLORS.info

        return (
          <Card
            key={alert.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: `${color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon
                name={alert.icon}
                size={18}
                color={color}
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
                {alert.title}
              </p>

              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: 'var(--text-low)',
                  lineHeight: 1.45,
                }}
              >
                {alert.message}
              </p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
