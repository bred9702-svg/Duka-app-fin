import { UI, colors, radius, shadows } from '../../theme'

export default function Card({
  children,
  style = {},
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg ?? UI.radius,
        padding: UI.cardPadding,
        boxShadow: shadows.card,
        transition:
          'transform .18s ease, box-shadow .18s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
