import { Children, cloneElement, isValidElement } from 'react'
import FadeIn from './FadeIn'

/**
 * StaggerContainer — wraps a list of cards/rows and animates them
 * in sequence, top to bottom. Drop-in replacement for a plain
 * fragment/div wrapping .map() output.
 *
 * <StaggerContainer>
 *   {items.map(item => <Card key={item.id} {...item} />)}
 * </StaggerContainer>
 */
export default function StaggerContainer({
  children,
  step = 50,
  initialDelay = 0,
  y = 10,
  duration = 240,
}) {
  const items = Children.toArray(children).filter(isValidElement)

  return (
    <>
      {items.map((child, i) => (
        <FadeIn
          key={child.key ?? i}
          delay={initialDelay + i * step}
          y={y}
          duration={duration}
        >
          {child}
        </FadeIn>
      ))}
    </>
  )
}
