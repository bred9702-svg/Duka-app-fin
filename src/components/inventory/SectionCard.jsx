import Card from '../ui/Card'

export default function SectionCard({
  children,
  height = 76,
}) {
  return (
    <Card
      style={{
        minHeight: height,
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
