import FadeIn from './FadeIn'

/**
 * AnimatedMessage — subtle fade + slide for chat bubbles
 * (Ask Duka AI). Smaller offset and shorter duration than the
 * default FadeIn, tuned for message-by-message reveal.
 */
export default function AnimatedMessage({ children, delay = 0, align = 'flex-start' }) {
  return (
    <FadeIn
      delay={delay}
      y={8}
      duration={220}
      style={{ display: 'flex', justifyContent: align, marginBottom: 8 }}
    >
      {children}
    </FadeIn>
  )
}
