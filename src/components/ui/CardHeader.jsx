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
          fontWeight: 600,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'var(--text-low)',
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
