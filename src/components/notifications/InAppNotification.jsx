import { useEffect } from 'react'
import Icon from '../ui/Icon'
import useAppStore from '../../store/useAppStore'

const TYPE_STYLES = {
  low_stock: {
    icon: 'package',
    color: '#F0A93D',
    background: 'rgba(240,169,61,0.14)',
    border: 'rgba(240,169,61,0.32)',
  },
  new_debt: {
    icon: 'userDollar',
    color: '#FF6B5B',
    background: 'rgba(255,107,91,0.14)',
    border: 'rgba(255,107,91,0.32)',
  },
  debt_payment: {
    icon: 'cash',
    color: '#5FD97A',
    background: 'rgba(95,217,122,0.14)',
    border: 'rgba(95,217,122,0.32)',
  },
  payment_received: {
    icon: 'circleCheck',
    color: '#5B9FF0',
    background: 'rgba(91,159,240,0.14)',
    border: 'rgba(91,159,240,0.32)',
  },
  default: {
    icon: 'bell',
    color: '#F0A93D',
    background: 'rgba(240,169,61,0.14)',
    border: 'rgba(240,169,61,0.32)',
  },
}

export default function InAppNotification() {
  const notifications = useAppStore((s) => s.inAppNotifications || [])
  const dismissInAppNotification = useAppStore((s) => s.dismissInAppNotification)

  const notification = notifications[0]

  useEffect(() => {
    if (!notification) return undefined

    const timeout = setTimeout(() => {
      dismissInAppNotification(notification.id)
    }, 4200)

    return () => clearTimeout(timeout)
  }, [notification, dismissInAppNotification])

  if (!notification) return null

  const style = TYPE_STYLES[notification.type] || TYPE_STYLES.default

  return (
    <div
      style={{
        position: 'fixed',
        left: 14,
        right: 14,
        top: 14,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 430,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '12px 12px',
          borderRadius: 14,
          background: style.background,
          border: `1px solid ${style.border}`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `${style.color}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name={style.icon} size={16} color={style.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-hi)',
              lineHeight: 1.25,
            }}
          >
            {notification.title}
          </p>

          <p
            style={{
              margin: '4px 0 0',
              fontSize: 11,
              color: 'var(--text-mid)',
              lineHeight: 1.45,
            }}
          >
            {notification.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => dismissInAppNotification(notification.id)}
          aria-label="Dismiss notification"
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon name="x" size={12} color="var(--text-low)" />
        </button>
      </div>
    </div>
  )
}
