export default function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 24,
        borderRadius: 999,
        border: 'none',
        padding: 2,
        cursor: 'pointer',
        background: checked ? '#F0A93D' : 'var(--line)',
        transition: 'background .18s',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px var(--shadow)',
        }}
      />
    </button>
  )
}
