import Icon from '../ui/Icon'
import useAppStore from '../../store/useAppStore'
import SubScreenHeader from '../layout/SubScreenHeader'

/**
 * RequireOwner — frontend-only role gate. Wraps a screen and shows a
 * placeholder "Limited Access" view for Employee accounts instead of
 * the owner-only content. Real permission enforcement will move to
 * the backend once auth is implemented; this just proves the pattern.
 */
export default function RequireOwner({ title, children }) {
  const role = useAppStore((s) => s.session?.role)

  if (role === 'employee') {
    return (
      <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px' }}>
        <SubScreenHeader title={title || 'Restricted'} />

        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 20px', textAlign: 'center',
            background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
            borderRadius: 14,
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(91,159,240,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon name="shield" size={22} color="#5B9FF0" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 6 }}>
            Limited Access
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5 }}>
            This section is only available to the shop owner. Ask an owner for access if you need it.
          </p>
        </div>
      </div>
    )
  }

  return children
}
