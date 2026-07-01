import Card from '../ui/Card'

export default function SectionCard({
  title,
  children,
  height = 170,
}) {
  return (
    <Card
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        padding: 14,
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 10,
          fontSize: 10,
          color: 'var(--text-low)',
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
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {children}
      </div>
    </Card>
  )
}
