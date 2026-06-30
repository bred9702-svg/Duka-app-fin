import Card from '../ui/Card'

export default function SectionCard({
  title,
  children,
  height = 220,
}) {
  return (
    <Card
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-low)',
          marginBottom: 14,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          fontWeight: 600,
        }}
      >
        {title}
      </p>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        {children}
      </div>
    </Card>
  )
}
