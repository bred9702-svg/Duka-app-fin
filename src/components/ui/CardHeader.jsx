import Badge from './Badge'

export default function CardHeader({
  title,
  badge,
  badgeVariant = 'gray',
}) {
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
        <Badge variant={badgeVariant}>
          {badge}
        </Badge>
      )}
    </div>
  )
}
