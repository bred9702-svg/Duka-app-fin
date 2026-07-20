import Icon from '../ui/Icon'

const fieldStyle = {
  width: '100%', minWidth: 0, padding: '9px 8px', borderRadius: 9,
  border: '1px solid var(--faint-border)', background: 'var(--faint-fill)',
  color: 'var(--text-hi)', fontFamily: 'var(--font-display)', fontSize: 12,
  fontWeight: 650, outline: 'none',
}

export default function CatalogBulkEditor({ items, onChange, onRemove }) {
  if (!items.length) return null

  return (
    <div style={{ display: 'grid', gap: 9 }}>
      {items.map((item) => (
        <div
          key={item.variantId}
          style={{
            padding: 11, borderRadius: 13,
            background: 'linear-gradient(155deg, rgba(240,169,61,.08), var(--glass-fill-soft))',
            border: '1px solid rgba(240,169,61,.20)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 31, height: 31, borderRadius: 9, background: 'rgba(240,169,61,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="package" size={15} color="#F0A93D" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hi)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productName}</p>
              <p style={{ fontSize: 9, color: '#F0A93D', marginTop: 2 }}>{item.formatLabel}</p>
            </div>
            <button type="button" onClick={() => onRemove(item.variantId)} aria-label={`Remove ${item.productName} ${item.formatLabel}`} style={{ border: 0, background: 'transparent', padding: 5, cursor: 'pointer' }}>
              <Icon name="trash" size={14} color="#FF6B5B" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '.72fr 1fr 1fr', gap: 6 }}>
            <label>
              <span style={{ display: 'block', fontSize: 8, color: 'var(--text-low)', marginBottom: 4 }}>Quantity</span>
              <input type="number" inputMode="numeric" min="0" value={item.quantity} placeholder="0" onChange={(e) => onChange(item.variantId, 'quantity', e.target.value)} style={fieldStyle} />
            </label>
            <label>
              <span style={{ display: 'block', fontSize: 8, color: 'var(--text-low)', marginBottom: 4 }}>Buying Price</span>
              <input type="number" inputMode="numeric" min="0" value={item.costPrice} placeholder="KES" onChange={(e) => onChange(item.variantId, 'costPrice', e.target.value)} style={{ ...fieldStyle, color: '#F0A93D' }} />
            </label>
            <label>
              <span style={{ display: 'block', fontSize: 8, color: 'var(--text-low)', marginBottom: 4 }}>Selling Price</span>
              <input type="number" inputMode="numeric" min="1" value={item.unitPrice} placeholder="KES" onChange={(e) => onChange(item.variantId, 'unitPrice', e.target.value)} style={{ ...fieldStyle, color: '#5FD97A' }} />
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}
