export default function Card({ children, style = {}, onClick, glass = true }) {
  const base = glass
    ? {
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
      }
    : {
        background: 'var(--bg-surface)',
        border: '1px solid var(--line)',
      }
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: '12px 14px',
        cursor: onClick ? 'pointer' : 'default',
        ...base,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
