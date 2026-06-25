import Card from './Card'
import Icon from './Icon'

const THEMES = {
  green: {
    color: '#5FD97A',
    background:
      'radial-gradient(circle at top right, rgba(95,217,122,.18), transparent 70%), rgba(95,217,122,.05)',
    border: 'rgba(95,217,122,.18)',
  },

  red: {
    color: '#FF6B5B',
    background:
      'radial-gradient(circle at top right, rgba(255,107,91,.18), transparent 70%), rgba(255,107,91,.05)',
    border: 'rgba(255,107,91,.18)',
  },

  amber: {
    color: '#F0A93D',
    background:
      'radial-gradient(circle at top right, rgba(240,169,61,.18), transparent 70%), rgba(240,169,61,.05)',
    border: 'rgba(240,169,61,.18)',
  },

  blue: {
    color: '#5B9FF0',
    background:
      'radial-gradient(circle at top right, rgba(91,159,240,.18), transparent 70%), rgba(91,159,240,.05)',
    border: 'rgba(91,159,240,.18)',
  },

  default: {
    color: 'var(--text-hi)',
    background: 'transparent',
    border: 'var(--glass-border)',
  },
}

export default function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'default',
  delay = 0,
}) {
  const theme = THEMES[color] || THEMES.default

  return (
    <Card
      style={{
        position: 'relative',
        overflow: 'hidden',

        padding: '14px',

        background: theme.background,

        border: `1px solid ${theme.border}`,

        boxShadow:
          '0 10px 30px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.10)',

        animation: 'slideUp .45s ease-out backwards',

        animationDelay: `${delay}s`,
      }}
    >
      {icon && (
        <div
          style={{
            position: 'absolute',

            right: -18,

            bottom: -18,

            opacity: .05,

            transform: 'rotate(-8deg)',

            pointerEvents: 'none',
          }}
        >
          <Icon
            name={icon}
            size={72}
            color={theme.color}
          />
        </div>
      )}

      <p
        style={{
          fontSize: 10,

          letterSpacing: '.12em',

          textTransform: 'uppercase',

          color: 'var(--text-low)',

          opacity: .75,

          marginBottom: 6,

          fontWeight: 600,

          position: 'relative',

          zIndex: 2,
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontFamily: 'var(--font-display)',

          fontSize: 21,

          fontWeight: 800,

          letterSpacing: '-.04em',

          color: theme.color,

          marginBottom: 8,

          position: 'relative',

          zIndex: 2,
        }}
      >
        {value}
      </p>

      {sub && (
        <div
          style={{
            display: 'flex',

            alignItems: 'center',

            gap: 6,

            position: 'relative',

            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 6,

              height: 6,

              borderRadius: '50%',

              background: theme.color,
            }}
          />

          <span
            style={{
              fontSize: 10,

              color: 'var(--text-low)',
            }}
          >
            {sub}
          </span>
        </div>
      )}
    </Card>
  )
}
