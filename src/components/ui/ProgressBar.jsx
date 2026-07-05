export default function ProgressBar({
  value = 0,
  color = '#5FD97A',
  height = 6,
}) {
  const progress = Math.max(0, Math.min(100, value))

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 999,
        overflow: 'hidden',
        background: 'var(--faint-fill)',
        border: '1px solid var(--faint-border)',
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          borderRadius: 999,

          background: color,

          boxShadow: `0 0 12px ${color}55`,

          transition:
            'width .45s ease',
        }}
      />
    </div>
  )
}
