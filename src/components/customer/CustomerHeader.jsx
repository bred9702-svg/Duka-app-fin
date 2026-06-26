import Avatar from '../ui/Avatar'
import Icon from '../ui/Icon'

export default function CustomerHeader({ customer }) {
  if (!customer) return null

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',

        padding: 22,

        marginBottom: 16,

        borderRadius: 20,

        background:
          'linear-gradient(135deg, rgba(91,159,240,.12), rgba(240,169,61,.08))',

        border: '1px solid rgba(255,255,255,.10)',

        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',

        boxShadow:
          '0 18px 40px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.08)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 170,
          height: 170,
          borderRadius: '50%',
          right: -60,
          top: -60,
          background: 'rgba(255,255,255,.04)',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Avatar
          name={customer.name}
          color="blue"
          size={60}
        />

        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-hi)',
              margin: 0,
            }}
          >
            {customer.name}
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
            }}
          >
            <Icon
              name="phone"
              size={14}
              color="var(--text-low)"
            />

            <span
              style={{
                fontSize: 13,
                color: 'var(--text-mid)',
              }}
            >
              {customer.phone || 'No phone number'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 6,
            }}
          >
            <Icon
              name="calendar"
              size={14}
              color="var(--text-low)"
            />

            <span
              style={{
                fontSize: 13,
                color: 'var(--text-mid)',
              }}
            >
              Customer since {customer.created_at?.slice(0,10) || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
