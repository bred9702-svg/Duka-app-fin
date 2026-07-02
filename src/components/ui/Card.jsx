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

        background:
          'linear-gradient(180deg, rgba(28,28,28,.55) 0%, rgba(18,18,18,.62) 100%)',

        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',

        border: '1px solid rgba(255,255,255,.05)',

        borderRadius: radius.lg ?? UI.radius,

        padding: UI.cardPadding,

        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,.05),
          0 10px 30px rgba(0,0,0,.28)
        `,

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
            'linear-gradient(180deg, rgba(255,255,255,.035), transparent 40%)',
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
