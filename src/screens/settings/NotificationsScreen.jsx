import { useEffect, useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import Toggle from '../../components/ui/Toggle'
import useAppStore from '../../store/useAppStore'
import {
  disablePushNotifications,
  getPushCapability,
  requestAndRegisterPushNotifications,
} from '../../lib/pushNotifications'

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
  {
    id: 'trialAlerts',
    label: 'Trial & Subscription',
    sub: 'Trial reminders and subscription expiry',
    icon: 'sparkles',
    color: '#F0A93D',
  },
  {
    id: 'paymentReviewAlerts',
    label: 'M-Pesa Payment Review',
    sub: 'When a Pro payment is accepted or rejected',
    icon: 'cash',
    color: '#5FD97A',
  },
  {
    id: 'employeeActivityAlerts',
    label: 'Employee Activity',
    sub: 'Important operations recorded by employees',
    icon: 'users',
    color: '#5B9FF0',
  },
]

export default function NotificationsScreen() {
  const notificationSettings = useAppStore((s) => s.notificationSettings)
  const updateNotificationSetting = useAppStore((s) => s.updateNotificationSetting)
  const session = useAppStore((s) => s.session)
  const [capability, setCapability] = useState({ supported: false, permission: 'prompt', platform: 'web', active: false })
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getPushCapability().then(setCapability).catch(() => {})
  }, [])

  function toggle(id) {
    updateNotificationSetting(id, !notificationSettings[id])
  }

  async function enableNotifications() {
    setWorking(true)
    setMessage('')
    try {
      const result = await requestAndRegisterPushNotifications(session)
      setCapability(result)
      setMessage('Notifications are active on this device.')
    } catch (error) {
      setMessage(error.message || 'Unable to activate notifications on this device.')
      setCapability(await getPushCapability())
    } finally {
      setWorking(false)
    }
  }

  async function disableNotifications() {
    setWorking(true)
    setMessage('')
    try {
      await disablePushNotifications(session)
      setCapability(await getPushCapability())
      setMessage('This device will no longer receive Dukwise notifications.')
    } catch (error) {
      setMessage(error.message || 'Unable to disable notifications on this device.')
    } finally {
      setWorking(false)
    }
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

        <div
          style={{
            padding: 12,
            borderRadius: 14,
            marginBottom: 12,
            background: 'var(--glass-fill-soft)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>
            Device notifications
          </p>
          <p style={{ margin: '4px 0 10px', fontSize: 10, color: 'var(--text-low)', lineHeight: 1.5 }}>
            {capability.supported
              ? capability.active
                ? `Active on this ${capability.platform === 'android' ? 'Android device' : 'device'}.`
                : capability.permission === 'granted'
                  ? 'Permission is granted, but this device is not registered with Dukwise.'
                  : 'Permission is required before Dukwise can notify you.'
              : 'Push notifications are not supported in this browser. On iPhone, install Dukwise on the Home Screen first.'}
          </p>

          {capability.supported && !capability.active && (
            <button
              type="button"
              onClick={enableNotifications}
              disabled={working || capability.permission === 'denied'}
              style={{ width: '100%', padding: 10, borderRadius: 11, border: 0, background: '#F0A93D', color: '#171006', fontWeight: 700 }}
            >
              {working ? 'Please wait...' : capability.permission === 'denied' ? 'Permission Blocked in Device Settings' : 'Enable Notifications'}
            </button>
          )}

          {capability.supported && capability.active && (
            <button
              type="button"
              onClick={disableNotifications}
              disabled={working}
              style={{ width: '100%', padding: 10, borderRadius: 11, border: '1px solid rgba(255,107,91,.28)', background: 'rgba(255,107,91,.08)', color: '#FF6B5B', fontWeight: 650 }}
            >
              {working ? 'Please wait...' : 'Disable on This Device'}
            </button>
          )}

          {message && <p style={{ margin: '9px 0 0', fontSize: 10, color: 'var(--text-low)', lineHeight: 1.45 }}>{message}</p>}
        </div>

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
          Alerts are delivered only when enabled on this device. You can change these preferences at any time.
        </p>
      </div>
    </div>
  )
}
