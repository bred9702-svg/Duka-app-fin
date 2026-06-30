import Card from './Card'

export default function MetricCard({
  title,
  value,
  subtitle,
  color = '#F0A93D',
  icon,
  footer,
}) {
  return (
    <Card
      style={{
        height: 170,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: 'var(--text-low)',
            fontWeight: 600,
          }}
        >
          {title}
        </p>

        {icon && (
          <span
            style={{
              fontSize: 20,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 38,
            color,
            lineHeight: 1,
          }}
        >
          {value}
        </h2>

        {subtitle && (
          <p
            style={{
              marginTop: 8,
              color: 'var(--text-hi)',
              fontWeight: 600,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {footer && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'var(--text-low)',
          }}
        >
          {footer}
        </p>
      )}
    </Card>
  )
}
