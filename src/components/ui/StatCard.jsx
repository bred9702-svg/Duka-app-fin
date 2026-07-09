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
        padding: '12px',
        background: theme.background,
        border: `1px solid ${theme.border}`,
        boxShadow: 'var(--card-shadow)',
        animation: 'slideUp .45s ease-out backwards',
        animationDelay: `${delay}s`,
      }}
    >
      {icon && (
        <div
          style={{
            position: 'absolute',
            right: -14,
            bottom: -14,
            opacity: 0.05,
            transform: 'rotate(-8deg)',
            pointerEvents: 'none',
          }}
        >
          <Icon
            name={icon}
            size={60}
            color={theme.color}
          />
        </div>
      )}

      <p
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: 'var(--text-low)',
          opacity: 0.85,
          marginBottom: 5,
          letterSpacing: '-0.01em',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '-0.015em',
          color: theme.color,
          marginBottom: 8,
          position: 'relative',
          zIndex: 2,
          lineHeight: 1.15,
        }}
      >
        {value}
      </p>

      {sub && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: theme.color,
              opacity: 0.9,
            }}
          />

          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: 'var(--text-low)',
              opacity: 0.7,
              letterSpacing: '-0.01em',
            }}
          >
            {sub}
          </span>
        </div>
      )}
    </Card>
  )
}
