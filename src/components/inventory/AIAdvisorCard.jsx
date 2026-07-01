import { useEffect, useState } from 'react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

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
    <Card
      style={{
        marginBottom: 16,
        padding: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 10,
            color: 'var(--text-low)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            fontWeight: 600,
          }}
        >
          Duka AI
        </p>

        <Badge variant="info">
          LIVE
        </Badge>
      </div>

      {!current ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'var(--text-low)',
          }}
        >
          No recommendation available.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {current.icon}
          </div>

          <div style={{ flex: 1 }}>
            <h4
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-hi)',
              }}
            >
              {current.title}
            </h4>

            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11,
                lineHeight: 1.45,
                color: 'var(--text-mid)',
              }}
            >
              {current.message}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
