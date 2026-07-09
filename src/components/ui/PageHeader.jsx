export default function PageHeader({
  title,
  subtitle,
  right,
}) {
  return (
    <div
      style={{
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--text-hi)',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              marginTop: 6,
              color: 'var(--text-low)',
              fontSize: 13,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {right}
    </div>
  )
}
