export default function EmptyState({
  title,
  description,
  icon = '📦',
}) {
  return (
    <div
      style={{
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 42,
          marginBottom: 12,
        }}
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <p
        style={{
          color: 'var(--text-low)',
        }}
      >
        {description}
      </p>
    </div>
  )
}
