import { useEffect, useState } from 'react'

/**
 * AnimatedProgress — a progress/dominance bar that fills smoothly
 * from 0 to `value` (0-100) on mount or whenever value changes.
 *
 * <AnimatedProgress value={72} color="#F0A93D" />
 */
export default function AnimatedProgress({
  value,
  height = 6,
  color = '#F0A93D',
  trackColor = 'rgba(255,255,255,0.06)',
  duration = 700,
  delay = 0,
  style = {},
}) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setWidth(0)
    const t = setTimeout(() => {
      requestAnimationFrame(() => setWidth(value))
    }, delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return (
    <div
      style={{
        height,
        background: trackColor,
        borderRadius: height / 2,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: color,
          borderRadius: height / 2,
          transition: `width ${duration}ms cubic-bezier(0.22,1,0.36,1)`,
        }}
      />
    </div>
  )
}
