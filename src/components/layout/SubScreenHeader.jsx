import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'

export default function SubScreenHeader({ title }) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          border: '1px solid var(--glass-border)',
          background: 'var(--glass-fill-soft)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Icon name="arrowLeft" size={16} color="var(--text-hi)" />
      </button>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 19,
          fontWeight: 700,
          color: 'var(--text-hi)',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h1>
    </div>
  )
}
