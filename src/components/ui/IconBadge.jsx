export default function IconBadge({
  icon: Icon,
  color = '#F0A93D',
  background,
  size = 30,
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
          background ?? `${color}14`,
      }}
    >
      <Icon
        size={10}
        color={color}
        strokeWidth={2.3}
      />
    </div>
  )
}
