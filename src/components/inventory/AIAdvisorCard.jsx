import { useEffect, useState } from 'react'

export default function AIAdvisorCard({
  insights = [],
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (insights.length <= 1) return

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % insights.length)
    }, 30000)

    return () => clearInterval(timer)
  }, [insights])

  const current =
    insights.length > 0 ? insights[index] : null

  return (
    <div
      style={{
        background: 'rgba(91,159,240,0.08)',
        border: '1px solid rgba(91,159,240,0.25)',
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 16,
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 3,
          fontSize: 9,
          fontWeight: 600,
          color: '#5B9FF0',
        }}
      >
        🤖 DUKA AI
      </p>

      {!current ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-hi)',
          }}
        >
          No recommendation available.
        </p>
      ) : (
        <>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-hi)',
            }}
          >
            {current.icon} {current.title}
          </p>

          <p
            style={{
              margin: '3px 0 0',
              fontSize: 10,
              lineHeight: 1.4,
              color: '#5B9FF0',
            }}
          >
            {current.message}
          </p>
        </>
      )}
    </div>
  )
}
