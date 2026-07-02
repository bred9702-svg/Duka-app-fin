const VARIANTS = {
  warn: {
    background: 'rgba(240,169,61,.08)',
    color: '#F0A93D',
    border: '1px solid rgba(240,169,61,.16)',
  },

  ok: {
    background: 'rgba(95,217,122,.08)',
    color: '#5FD97A',
    border: '1px solid rgba(95,217,122,.16)',
  },

  info: {
    background: 'rgba(91,159,240,.08)',
    color: '#5B9FF0',
    border: '1px solid rgba(91,159,240,.16)',
  },

  red: {
    background: 'rgba(255,107,91,.08)',
    color: '#FF6B5B',
    border: '1px solid rgba(255,107,91,.16)',
  },

  gray: {
    background: 'rgba(255,255,255,.03)',
    color: 'var(--text-mid)',
    border: '1px solid rgba(255,255,255,.05)',
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

        minHeight: 17,

        padding: '0 7px',

        borderRadius: 999,

        fontSize: 8,

        fontWeight: 600,

        letterSpacing: '.04em',

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
