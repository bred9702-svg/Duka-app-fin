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
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(240,169,61,0.20)',
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
          color: 'var(--text-low)',
        }}
      >
        DUKA AI
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
            {current.title}
          </p>

          <p
            style={{
              margin: '3px 0 0',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-hi)',
            }}
          >
            {current.message}
          </p>
        </>
      )}
    </div>
  )
}
