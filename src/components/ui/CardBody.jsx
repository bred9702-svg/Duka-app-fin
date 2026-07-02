export default function CardBody({
  icon,
  value,
  subtitle,
  valueColor = 'var(--text-hi)',
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: 14,
          lineHeight: 1,
          opacity: 0.85,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: valueColor,
          lineHeight: 1.15,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 9,
          color: 'var(--text-low)',
          lineHeight: 1.2,
        }}
      >
        {subtitle}
      </div>
    </div>
  )
}
