export default function ProgressBar({
  value = 0,
  color = '#5FD97A',
}) {
  return (
    <div
      style={{
        width: '100%',
        height: 8,
        borderRadius: 999,
        overflow: 'hidden',
        background: 'rgba(255,255,255,.08)',
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          background: color,
          transition: '.3s',
        }}
      />
    </div>
  )
}
