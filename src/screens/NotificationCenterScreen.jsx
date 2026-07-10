import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import useAppStore from '../store/useAppStore'

const TYPE_STYLES = {
  low_stock: { icon: 'package', color: '#F0A93D', label: 'Low Stock' },
  new_debt: { icon: 'userDollar', color: '#FF6B5B', label: 'New Debt' },
  debt_payment: { icon: 'cash', color: '#5FD97A', label: 'Debt Payment' },
  payment_received: { icon: 'circleCheck', color: '#5B9FF0', label: 'Payment Received' },
  sale: { icon: 'cash', color: '#5FD97A', label: 'Sale' },
  stock_purchase: { icon: 'package', color: '#F0A93D', label: 'Stock Purchase' },
  cash_out: { icon: 'cash', color: '#FF6B5B', label: 'Cash Out' },
  daily_summary: { icon: 'barChart', color: '#5B9FF0', label: 'Daily Summary' },
  weekly_summary: { icon: 'trendingUp', color: '#7C5CFC', label: 'Weekly Report' },
  default: { icon: 'bell', color: '#F0A93D', label: 'Notification' },
}

function formatNotificationDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('en-KE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}) {
  const style = TYPE_STYLES[notification.type] || TYPE_STYLES.default

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px',
        borderRadius: 14,
        marginBottom: 8,
        background: notification.read
          ? 'var(--glass-fill-soft)'
          : 'linear-gradient(160deg, rgba(240,169,61,0.11), rgba(255,255,255,0.03))',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: notification.read
          ? '1px solid var(--glass-border)'
          : '1px solid rgba(240,169,61,0.28)',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: `${style.color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={style.icon} size={15} color={style.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-hi)',
              flex: 1,
              minWidth: 0,
            }}
          >
            {notification.title || style.label}
          </p>

          {!notification.read && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#F0A93D',
                boxShadow: '0 0 12px rgba(240,169,61,0.55)',
                flexShrink: 0,
              }}
            />
          )}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: 'var(--text-mid)',
            lineHeight: 1.45,
          }}
        >
          {notification.message}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: 'var(--text-low)',
              flex: 1,
            }}
          >
            {formatNotificationDate(notification.createdAt)}
          </span>

          {!notification.read && (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              style={{
                border: '1px solid rgba(95,217,122,0.22)',
                background: 'rgba(95,217,122,0.10)',
                color: '#5FD97A',
                borderRadius: 999,
                padding: '5px 8px',
                fontSize: 9,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Mark read
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            style={{
              border: '1px solid rgba(255,107,91,0.22)',
              background: 'rgba(255,107,91,0.08)',
              color: '#FF6B5B',
              borderRadius: 999,
              padding: '5px 8px',
              fontSize: 9,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NotificationCenterScreen() {
  const notifications = useAppStore((s) => s.notifications)
  const markNotificationAsRead = useAppStore((s) => s.markNotificationAsRead)
  const markAllNotificationsAsRead = useAppStore((s) => s.markAllNotificationsAsRead)
  const deleteNotification = useAppStore((s) => s.deleteNotification)
  const clearAllNotifications = useAppStore((s) => s.clearAllNotifications)

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 100px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{
          width: 160,
          height: 160,
          top: -30,
          right: -30,
          background: 'rgba(240,169,61,0.16)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Notification Center" />

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: 'linear-gradient(160deg, rgba(240,169,61,0.10), rgba(255,255,255,0.03))',
            border: '1px solid rgba(240,169,61,0.22)',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(240,169,61,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="bell" size={17} color="#F0A93D" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-hi)',
                }}
              >
                {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
              </p>

              <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--text-low)' }}>
                All in-app notifications are stored here.
              </p>
            </div>
          </div>
        </div>

        {notifications.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              disabled={unreadCount === 0}
              style={{
                padding: '10px',
                borderRadius: 12,
                border: '1px solid rgba(95,217,122,0.22)',
                background: 'rgba(95,217,122,0.10)',
                color: '#5FD97A',
                fontSize: 11,
                fontWeight: 700,
                cursor: unreadCount === 0 ? 'default' : 'pointer',
                opacity: unreadCount === 0 ? 0.45 : 1,
              }}
            >
              Mark all read
            </button>

            <button
              type="button"
              onClick={clearAllNotifications}
              style={{
                padding: '10px',
                borderRadius: 12,
                border: '1px solid rgba(255,107,91,0.24)',
                background: 'rgba(255,107,91,0.09)',
                color: '#FF6B5B',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '34px 18px',
              borderRadius: 16,
              background: 'var(--glass-fill-soft)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'rgba(240,169,61,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Icon name="bell" size={22} color="#F0A93D" />
            </div>

            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-hi)',
              }}
            >
              No notifications yet
            </p>

            <p
              style={{
                margin: '5px 0 0',
                fontSize: 11,
                color: 'var(--text-low)',
                lineHeight: 1.5,
              }}
            >
              Important alerts and summaries will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={markNotificationAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>
    </div>
  )
}
