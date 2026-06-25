import Card from './Card'
import Icon from './Icon'

const COLORS = {
  green: {
    text: '#5FD97A',
    bg: 'rgba(95,217,122,0.08)',
    border: 'rgba(95,217,122,0.18)',
  },
  red: {
    text: '#FF6B5B',
    bg: 'rgba(255,107,91,0.08)',
    border: 'rgba(255,107,91,0.18)',
  },
  amber: {
    text: '#F0A93D',
    bg: 'rgba(240,169,61,0.08)',
    border: 'rgba(240,169,61,0.18)',
  },
  blue: {
    text: '#5B9FF0',
    bg: 'rgba(91,159,240,0.08)',
    border: 'rgba(91,159,240,0.18)',
  },
  default: {
    text: 'var(--text-hi)',
    bg: 'transparent',
    border: 'var(--glass-border)',
  },
}

export default function StatCard({
  label,
  value,
  sub,
  color = 'default',
  icon,
  delay = 0,
}) {
  const theme = COLORS[color] || COLORS.default

  return (
    <Card
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '12px',
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        animation: 'slideUp .45s ease-out backwards',
        animationDelay: `${delay}s`,
      }}
    >
      {icon && (
        <div
          style={{
            position: 'absolute',
            right: -8,
            bottom: -8,
            opacity: 0.08,
            pointerEvents: 'none',
          }}
        >
          <Icon
            name={icon}
            size={56}
            color={theme.text}
          />
        </div>
      )}

      <p
        style={{
          fontSize: 9,
          color: 'var(--text-low)',
          marginBottom: 4,
          fontWeight: 500,
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
          letterSpacing: '-0.02em',
          color: theme.text,
          marginBottom: 2,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {value}
      </p>

      {sub && (
        <p
          style={{
            fontSize: 9,
            color: 'var(--text-low)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {sub}
        </p>
      )}
    </Card>
  )
}
