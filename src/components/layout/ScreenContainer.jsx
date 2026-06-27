export default function ScreenContainer({ children }) {
  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        padding: '16px 14px 8px',
        position: 'relative',
      }}
    >
      {children}
    </div>
  )
}
