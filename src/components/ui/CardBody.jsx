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
          fontSize: 13,
          fontWeight: 600,
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
          color: 'var(--text-low)',
          lineHeight: 1.2,
        }}
      >
        {subtitle}
      </div>
    </div>
  )
}
