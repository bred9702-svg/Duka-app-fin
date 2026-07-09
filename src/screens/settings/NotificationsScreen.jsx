import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import Toggle from '../../components/ui/Toggle'
import useAppStore from '../../store/useAppStore'

const ITEMS = [
  {
    id: 'lowStockAlerts',
    label: 'Low Stock Alerts',
    sub: 'When a product is running low',
    icon: 'package',
    color: '#F0A93D',
  },
  {
    id: 'newDebtAlerts',
    label: 'New Debt Alerts',
    sub: 'When a customer owes you money',
    icon: 'userDollar',
    color: '#FF6B5B',
  },
  {
    id: 'debtPaymentAlerts',
    label: 'Debt Payment Alerts',
    sub: 'When a debt payment is received',
    icon: 'cash',
    color: '#5FD97A',
  },
  {
    id: 'dailySummary',
    label: 'Daily Summary',
    sub: 'Recap of the day, every evening',
    icon: 'barChart',
    color: '#5B9FF0',
  },
  {
    id: 'weeklySummary',
    label: 'Weekly Summary',
    sub: 'Performance recap every Monday',
    icon: 'trendingUp',
    color: '#7C5CFC',
  },
]

export default function NotificationsScreen() {
  const notificationSettings = useAppStore((s) => s.notificationSettings)
  const updateNotificationSetting = useAppStore((s) => s.updateNotificationSetting)

  function toggle(id) {
    updateNotificationSetting(id, !notificationSettings[id])
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{
          width: 140,
          height: 140,
          top: -30,
          right: -20,
          background: 'rgba(240,169,61,0.16)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Notifications" />

        {ITEMS.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px',
              borderRadius: 12,
              marginBottom: 8,
              background: 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid var(--glass-border)',
            }}
          >
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
              <Icon name={item.icon} size={14} color={item.color} />
            </div>

            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-hi)',
                }}
              >
                {item.label}
              </p>

              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 10,
                  color: 'var(--text-low)',
                }}
              >
                {item.sub}
              </p>
            </div>

            <Toggle
              checked={Boolean(notificationSettings[item.id])}
              onChange={() => toggle(item.id)}
            />
          </div>
        ))}

        <p
          style={{
            margin: '14px 4px 0',
            fontSize: 10,
            color: 'var(--text-low)',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          Notification delivery is not active yet. These preferences are saved for future notifications.
        </p>
      </div>
    </div>
  )
}
