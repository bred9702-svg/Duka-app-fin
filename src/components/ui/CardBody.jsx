export default function CardBody({
  value,
  subtitle,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        flex: 1,
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '-0.015em',
          color: 'var(--text-hi)',
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
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'var(--text-low)',
          opacity: 0.7,
          lineHeight: 1.2,
        }}
      >
        {subtitle}
      </div>
    </div>
  )
}
