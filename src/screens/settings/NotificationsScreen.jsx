import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'

const SETTINGS = [
  {
    key: 'lowStockAlerts',
    title: 'Low Stock Alerts',
    description: 'Get notified when product stock is running low.',
    icon: 'box',
    color: '#F0A93D',
  },
  {
    key: 'newDebtAlerts',
    title: 'New Debt Alerts',
    description: 'Get notified when a new customer debt is recorded.',
    icon: 'creditCard',
    color: '#5B9FF0',
  },
  {
    key: 'debtPaymentAlerts',
    title: 'Debt Payment Alerts',
    description: 'Get notified when a customer debt payment is recorded.',
    icon: 'circleCheck',
    color: '#5FD97A',
  },
  {
    key: 'dailySummary',
    title: 'Daily Summary',
    description: 'Receive a daily summary of sales, expenses, and profit.',
    icon: 'calendar',
    color: '#B88CFF',
  },
  {
    key: 'weeklySummary',
    title: 'Weekly Summary',
    description: 'Receive a weekly business performance summary.',
    icon: 'barChart',
    color: '#FFB15B',
  },
]

function GlassCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 8,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 46,
        height: 26,
        borderRadius: 999,
        border: checked ? '1px solid rgba(95,217,122,0.55)' : '1px solid var(--glass-border)',
        background: checked ? 'rgba(95,217,122,0.22)' : 'rgba(255,255,255,0.06)',
        padding: 3,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        transition: 'all 180ms ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: checked ? '#5FD97A' : 'rgba(255,255,255,0.45)',
          boxShadow: checked ? '0 0 14px rgba(95,217,122,0.35)' : 'none',
          transition: 'all 180ms ease',
          display: 'block',
        }}
      />
    </button>
  )
}

export default function NotificationSettingsScreen() {
  const notificationSettings = useAppStore((s) => s.notificationSettings)
  const updateNotificationSetting = useAppStore((s) => s.updateNotificationSetting)

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 100px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{
          width: 190,
          height: 190,
          top: -40,
          right: -40,
          background: 'rgba(240,169,61,0.16)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Notification Settings" />

        <GlassCard
          style={{
            background: 'linear-gradient(160deg, rgba(240,169,61,0.10), rgba(255,255,255,0.03))',
            border: '1px solid rgba(240,169,61,0.20)',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(240,169,61,0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="bell" size={17} color="#F0A93D" />
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-hi)',
                }}
              >
                Choose what you want to hear about
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 11,
                  color: 'var(--text-mid)',
                  lineHeight: 1.5,
                }}
              >
                These settings are saved now, but real push notifications will be added later.
              </p>
            </div>
          </div>
        </GlassCard>

        {SETTINGS.map((setting) => {
          const checked = notificationSettings?.[setting.key] ?? true

          return (
            <GlassCard key={setting.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: `${setting.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={setting.icon} size={16} color={setting.color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-hi)',
                    }}
                  >
                    {setting.title}
                  </p>
                  <p
                    style={{
                      margin: '3px 0 0',
                      fontSize: 10,
                      color: 'var(--text-low)',
                      lineHeight: 1.4,
                    }}
                  >
                    {setting.description}
                  </p>
                </div>

                <Toggle
                  checked={checked}
                  onChange={(value) => updateNotificationSetting(setting.key, value)}
                />
              </div>
            </GlassCard>
          )
        })}

        <p
          style={{
            margin: '14px 4px 0',
            fontSize: 10,
            color: 'var(--text-low)',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          Notification delivery is not active yet. This screen only saves your preferences.
        </p>
      </div>
    </div>
  )
}
