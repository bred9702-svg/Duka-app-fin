import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

export default function BackButton({ to, onClick }) {
  const navigate = useNavigate()
  function handleClick() {
    if (onClick) onClick()
    else if (to) navigate(to)
    else navigate(-1)
  }
  return (
    <button
      onClick={handleClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-mid)',
        fontSize: 13,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 0 10px',
      }}
    >
      <Icon name="arrowLeft" size={16} />
      Back
    </button>
  )
}
