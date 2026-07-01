export default function IconBadge({
  icon: Icon,
  color = '#F0A93D',
  background,
  size = 38,
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          background ?? `${color}18`,
      }}
    >
      <Icon
        size={20}
        color={color}
        strokeWidth={2.3}
      />
    </div>
  )
}
