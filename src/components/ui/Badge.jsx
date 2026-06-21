const VARIANTS = {
  warn: { background: 'rgba(240,169,61,0.18)', color: '#FFD98A' },
  ok: { background: 'rgba(95,217,122,0.16)', color: '#5FD97A' },
  info: { background: 'rgba(91,159,240,0.16)', color: '#5B9FF0' },
  red: { background: 'rgba(255,107,91,0.16)', color: '#FF6B5B' },
  gray: { background: 'rgba(255,255,255,0.08)', color: 'var(--text-mid)' },
}

export default function Badge({ children, variant = 'gray' }) {
  const style = VARIANTS[variant] || VARIANTS.gray
  return (
    <span
      style={{
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 8,
        display: 'inline-block',
        fontWeight: 600,
        fontFamily: 'var(--font-display)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
