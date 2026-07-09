import { useEffect, useRef, useState } from 'react'

/**
 * useAnimatedCounter — counts smoothly from the current value to a
 * new target using requestAnimationFrame + ease-out cubic.
 * Re-triggers whenever `target` changes (e.g. period switch).
 */
export function useAnimatedCounter(target, { duration = 700 } = {}) {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()

    function step(now) {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (target - from) * eased
      setValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}
