import { useState } from 'react'
import Icon from '../ui/Icon'
import useAppStore from '../../store/useAppStore'
import { PRODUCT_CATEGORIES } from '../../data/mockData'

const UNITS = ['Bottle', 'Can', 'Case', 'Crate', 'Piece']

/**
 * CreateProductSheet — reusable "+ Create New Product" flow. Used by any
 * screen with a product search (Inventory Investment, New Sale, ...).
 * Saves straight to the shop's product catalog in the store, which every
 * screen reads from — so a new product is instantly available everywhere.
 */
export default function CreateProductSheet({ initialName = '', onCreated, onClose }) {
  const createProduct = useAppStore((s) => s.createProduct)

  const [name, setName] = useState(initialName)
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0].id)
  const [costPrice, setCostPrice] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [unit, setUnit] = useState(UNITS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const canSave = name.trim() && Number(costPrice) > 0 && Number(unitPrice) > 0

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)
    setError(null)
    try {
      // Unit isn't its own catalog column yet — folded into the name for
      // now (matches how the rest of the catalog is named, e.g. "Tusker
      // Cider 500ml"), so nothing here depends on an unconfirmed schema.
      const finalName = name.trim().toLowerCase().includes(unit.toLowerCase())
        ? name.trim()
        : `${name.trim()} (${unit})`

      const saved = await createProduct({
        name: finalName,
        category,
        costPrice: Number(costPrice),
        unitPrice: Number(unitPrice),
      })
      onCreated(saved)
    } catch (err) {
      console.error('Create product failed:', err)
      setError('Could not save this product. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 361,
          background: 'var(--card-elevated-bg)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--card-elevated-border)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          padding: '16px 16px 24px',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-hi)' }}>
            New Product
          </p>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: '1px solid var(--glass-border)',
              background: 'var(--glass-fill-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon name="plus" size={14} color="var(--text-low)" style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Product Name</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Konyagi 250ml"
          style={{
            width: '100%', background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
            borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text-hi)',
            fontFamily: 'inherit', outline: 'none', marginBottom: 12,
          }}
        />

        <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Category</p>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
          {PRODUCT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                flexShrink: 0, padding: '7px 11px', borderRadius: 999, cursor: 'pointer',
                fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                background: category === c.id ? 'rgba(240,169,61,0.16)' : 'var(--glass-fill-soft)',
                border: category === c.id ? '1px solid rgba(240,169,61,0.4)' : '1px solid var(--glass-border)',
                color: category === c.id ? '#F0A93D' : 'var(--text-low)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Purchase Price</p>
            <input
              type="number" inputMode="decimal"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0"
              style={{
                width: '100%', background: 'var(--faint-fill)', border: '1px solid var(--faint-border)',
                borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#F0A93D',
                fontFamily: 'var(--font-display)', outline: 'none',
              }}
            />
          </div>
          <div>
            <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Selling Price</p>
            <input
              type="number" inputMode="decimal"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0"
              style={{
                width: '100%', background: 'var(--faint-fill)', border: '1px solid var(--faint-border)',
                borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#5FD97A',
                fontFamily: 'var(--font-display)', outline: 'none',
              }}
            />
          </div>
        </div>

        <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Unit</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {UNITS.map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 9, cursor: 'pointer',
                fontSize: 10, fontWeight: 600,
                background: unit === u ? 'rgba(240,169,61,0.16)' : 'var(--glass-fill-soft)',
                border: unit === u ? '1px solid rgba(240,169,61,0.4)' : '1px solid var(--glass-border)',
                color: unit === u ? '#F0A93D' : 'var(--text-low)',
              }}
            >
              {u}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,107,91,0.10)', border: '1px solid rgba(255,107,91,0.3)',
            borderRadius: 10, padding: '9px 11px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="alertTriangle" size={13} color="#FF6B5B" />
            <p style={{ fontSize: 10, color: '#FF6B5B', margin: 0 }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none',
            cursor: canSave ? 'pointer' : 'default', fontFamily: 'var(--font-display)',
            fontSize: 13, fontWeight: 700, color: '#0F1117', background: '#F0A93D',
            opacity: canSave ? 1 : 0.4, transition: 'opacity 200ms ease',
          }}
        >
          {saving ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </div>
  )
}
