import { useEffect, useState } from 'react'

/**
 * FadeIn — the base primitive of the animation system.
 * Fades + slides content in on mount using only opacity/transform
 * (GPU-friendly, no layout thrash).
 *
 * Used directly for screen transitions, and internally by
 * StaggerContainer and AnimatedMessage.
 */
export default function FadeIn({
  children,
  delay = 0,
  duration = 240,
  y = 12,
  style = {},
  as: Tag = 'div',
  ...rest
}) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <Tag
      {...rest}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1), transform ${duration}ms cubic-bezier(0.22,1,0.36,1)`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}
