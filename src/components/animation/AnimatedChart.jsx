import { useEffect, useRef, useState } from 'react'

/**
 * AnimatedLinePath — an SVG <path> that draws itself progressively
 * using stroke-dashoffset (GPU-friendly, no layout thrash).
 * Drop-in replacement for a plain <path> in a line/area chart.
 *
 * <svg><AnimatedLinePath d={linePath} stroke="#F0A93D" /></svg>
 */
export function AnimatedLinePath({
  d,
  stroke,
  strokeWidth = 2.2,
  duration = 700,
  delay = 0,
  ...rest
}) {
  const ref = useRef(null)
  const [length, setLength] = useState(0)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const len = ref.current.getTotalLength()
    setLength(len)
    setDrawn(false)
    const t = setTimeout(() => {
      requestAnimationFrame(() => setDrawn(true))
    }, delay)
    return () => clearTimeout(t)
  }, [d, delay])

  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: length,
        strokeDashoffset: drawn ? 0 : length,
        transition: `stroke-dashoffset ${duration}ms cubic-bezier(0.22,1,0.36,1)`,
      }}
      {...rest}
    />
  )
}

/**
 * AnimatedBar — a single bar chart column that grows from the
 * bottom using transform: scaleY (composited, GPU-friendly).
 * The wrapper div carries the final height; only the transform
 * animates, so no layout thrash occurs.
 *
 * <AnimatedBar heightPct={64} color="#F0A93D" delay={i * 40} />
 */
export function AnimatedBar({
  heightPct,
  color,
  delay = 0,
  duration = 550,
  style = {},
  ...rest
}) {
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    setGrown(false)
    const t = setTimeout(() => {
      requestAnimationFrame(() => setGrown(true))
    }, delay)
    return () => clearTimeout(t)
  }, [heightPct, delay])

  return (
    <div
      {...rest}
      style={{
        width: '100%',
        height: `${Math.max(heightPct, 4)}%`,
        transform: grown ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'bottom',
        transition: `transform ${duration}ms cubic-bezier(0.22,1,0.36,1)`,
        background: color,
        borderRadius: '4px 4px 0 0',
        ...style,
      }}
    />
  )
}
