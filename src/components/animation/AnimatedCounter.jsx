import { useAnimatedCounter } from '../../hooks/useAnimatedCounter'

/**
 * AnimatedCounter — counts a number smoothly from 0 (or its previous
 * value) to `value` over ~700ms. Use for any KPI: Business Score,
 * Revenue, Profit, Expenses, Inventory Health, etc.
 *
 * <AnimatedCounter value={92} />
 * <AnimatedCounter value={21900} format={fmtKES} suffix=" KES" />
 */
export default function AnimatedCounter({
  value,
  duration = 700,
  decimals = 0,
  format,
  prefix = '',
  suffix = '',
  style,
}) {
  const animated = useAnimatedCounter(value, { duration })
  const rounded = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated)
  const display = format ? format(rounded) : rounded.toLocaleString()

  return (
    <span style={style}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
