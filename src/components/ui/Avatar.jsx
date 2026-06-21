import { initials } from '../../utils/formatters'

const COLOR_MAP = {
  amber: { bg: 'rgba(240,169,61,0.2)', fg: '#FFD98A' },
  green: { bg: 'rgba(95,217,122,0.18)', fg: '#5FD97A' },
  red: { bg: 'rgba(255,107,91,0.18)', fg: '#FF6B5B' },
  blue: { bg: 'rgba(91,159,240,0.18)', fg: '#5B9FF0' },
  purple: { bg: 'rgba(180,140,240,0.18)', fg: '#C7A8F5' },
}

export default function Avatar({ name, color = 'amber', size = 36 }) {
  const { bg, fg } = COLOR_MAP[color] || COLOR_MAP.amber
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.33,
        fontWeight: 600,
        fontFamily: 'var(--font-display)',
        flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {initials(name)}
    </div>
  )
}
