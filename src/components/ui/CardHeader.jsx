import { badgeToTagColor } from './Badge'

export default function CardHeader({
  title,
  badge,
  badgeVariant = 'gray',
}) {
  const color = badgeToTagColor(badgeVariant)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--text-low)',
          opacity: 0.85,
          lineHeight: 1,
        }}
      >
        {title}
      </p>

      {badge && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 7px',
            fontSize: 8,
            letterSpacing: '.02em',
            fontWeight: 600,
            background: `${color}1F`,
            color,
          }}
        >
          {badge}
        </div>
      )}
    </div>
  )
}
