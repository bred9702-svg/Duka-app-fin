import Icon from './Icon'

const VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, #FFC56B 0%, #F0A93D 100%)',
    color: '#2A1A05',
    border: '1px solid rgba(255,255,255,0.4)',
    boxShadow: '0 8px 24px -6px rgba(240,169,61,0.5), inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  danger: {
    background: 'linear-gradient(135deg, #FF8C7E 0%, #FF6B5B 100%)',
    color: '#3A0F08',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 8px 24px -6px rgba(255,107,91,0.45), inset 0 1px 0 rgba(255,255,255,0.4)',
  },
  amber: {
    background: 'linear-gradient(135deg, #FFC56B 0%, #F0A93D 100%)',
    color: '#2A1A05',
    border: '1px solid rgba(255,255,255,0.4)',
    boxShadow: '0 8px 24px -6px rgba(240,169,61,0.5), inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  ghost: {
    background: 'var(--glass-fill-soft)',
    color: 'var(--text-hi)',
    border: '1px solid var(--glass-border)',
  },
}

export default function Button({
  children,
  variant = 'primary',
  onClick,
  disabled,
  icon,
  style = {},
}) {
  const base = {
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'opacity .15s, transform .1s',
    opacity: disabled ? 0.45 : 1,
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...(VARIANTS[variant] || VARIANTS.primary), ...style }}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  )
}
