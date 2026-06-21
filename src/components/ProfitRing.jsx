import Icon from './ui/Icon'

export default function ProfitRing({ profit, income, marginPct }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, marginPct))
  const dashOffset = circumference * (1 - clamped / 100)
  const isPositive = profit >= 0

  return (
    <div
      style={{
        background:
          'radial-gradient(circle at 75% 20%, rgba(240,169,61,0.25), transparent 55%), linear-gradient(160deg, #2A2014 0%, #1A150D 100%)',
        border: `1px solid ${isPositive ? 'rgba(240,169,61,0.4)' : 'rgba(255,107,91,0.4)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: 16,
        boxShadow: `0 10px 28px -10px ${isPositive ? 'rgba(240,169,61,0.35)' : 'rgba(255,107,91,0.3)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        animation: 'slideUp 0.5s ease-out',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
        <svg viewBox="0 0 72 72" width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke={isPositive ? '#F0A93D' : '#FF6B5B'}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              filter: `drop-shadow(0 0 6px ${isPositive ? 'rgba(240,169,61,0.6)' : 'rgba(255,107,91,0.6)'})`,
              transition: 'stroke-dashoffset 0.8s ease-out',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 700,
              color: isPositive ? '#FFD98A' : '#FF6B5B',
            }}
          >
            {Math.round(clamped)}%
          </span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 10,
            color: '#FFD98A',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          Net profit
        </p>
        <p
          className="shimmer-text"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          {profit < 0 ? '-' : ''}
          {Math.abs(Math.round(profit)).toLocaleString()}
        </p>
        <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 6 }}>
          margin on income
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon
            name="trendingUp"
            size={12}
            color={isPositive ? '#5FD97A' : '#FF6B5B'}
            style={{ transform: isPositive ? 'none' : 'scaleY(-1)' }}
          />
          <span
            style={{
              fontSize: 9,
              color: isPositive ? '#5FD97A' : '#FF6B5B',
              fontWeight: 600,
            }}
          >
            {isPositive ? 'Looking good' : 'Costs exceed income'}
          </span>
        </div>
      </div>
    </div>
  )
}
