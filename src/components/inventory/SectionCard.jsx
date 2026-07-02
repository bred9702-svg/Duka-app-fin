import Card from '../ui/Card'

export default function SectionCard({
  children,
  height = 96,
}) {
  return (
    <Card
      style={{
        height,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {children}
    </Card>
  )
}
