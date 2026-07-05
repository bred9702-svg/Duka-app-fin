import { UI, radius } from '../../theme'

export default function Card({
  children,
  style = {},
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',

        background: 'var(--card-elevated-bg)',

        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',

        border: '1px solid var(--card-elevated-border)',

        borderRadius: radius.lg ?? UI.radius,

        padding: UI.cardPadding,

        boxShadow: 'var(--card-shadow)',

        transition:
          'all .25s cubic-bezier(.4,0,.2,1)',

        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, var(--card-inner-highlight), transparent 40%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  )
}
