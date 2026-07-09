import SectionCard from './SectionCard'
import Badge from '../ui/Badge'

const COLORS = {
  green: '#5FD97A',
  gold: '#F0A93D',
  orange: '#F0A93D',
  red: '#FF6B5B',
  blue: '#5B9FF0',
}

export default function MiniInsightCard({
  title,
  badge,
  badgeVariant = 'gray',
  icon,
  value,
  subtitle,
  color = 'green',
}) {
  return (
    <SectionCard
      title={title}
      height={90}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          {icon}
        </div>

        <Badge variant={badgeVariant}>
          {badge}
        </Badge>
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-hi)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 3,
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 10,
          color: COLORS[color],
          fontWeight: 500,
        }}
      >
        {subtitle}
      </div>
    </SectionCard>
  )
}
