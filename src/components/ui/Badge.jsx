const VARIANTS = {
  warn: {
    background: 'rgba(240,169,61,.12)',
    color: '#F0A93D',
    border: '1px solid rgba(240,169,61,.22)',
  },

  ok: {
    background: 'rgba(95,217,122,.12)',
    color: '#5FD97A',
    border: '1px solid rgba(95,217,122,.22)',
  },

  info: {
    background: 'rgba(91,159,240,.12)',
    color: '#5B9FF0',
    border: '1px solid rgba(91,159,240,.22)',
  },

  red: {
    background: 'rgba(255,107,91,.12)',
    color: '#FF6B5B',
    border: '1px solid rgba(255,107,91,.22)',
  },

  gray: {
    background: 'rgba(255,255,255,.04)',
    color: 'var(--text-mid)',
    border: '1px solid rgba(255,255,255,.06)',
  },
}

export default function Badge({
  children,
  variant = 'gray',
}) {
  const style =
    VARIANTS[variant] || VARIANTS.gray

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',

        minHeight: 22,

        padding: '0 10px',

        borderRadius: 999,

        fontSize: 9,

        fontWeight: 700,

        letterSpacing: '.05em',

        textTransform: 'uppercase',

        fontFamily: 'var(--font-display)',

        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',

        ...style,
      }}
    >
      {children}
    </span>
  )
}
