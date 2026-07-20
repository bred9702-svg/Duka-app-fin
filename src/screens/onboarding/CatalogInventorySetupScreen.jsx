import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import GlassCard from '../../components/ui/Card'
import CatalogBulkEditor from '../../components/inventory/CatalogBulkEditor'
import useAppStore from '../../store/useAppStore'

function formatVariant(variant) {
  const value = Number(variant.volumeValue)
  const size = Number.isInteger(value) ? value : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  return `${size}${variant.volumeUnit}${variant.packageType === 'Bottle' ? '' : ` · ${variant.packageType}`}`
}

export default function CatalogInventorySetupScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const catalogProducts = useAppStore((s) => s.catalogProducts)
  const catalogLoading = useAppStore((s) => s.catalogLoading)
  const searchCatalog = useAppStore((s) => s.searchCatalog)
  const addOpeningStockFromCatalog = useAppStore((s) => s.addOpeningStockFromCatalog)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)

  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [selected, setSelected] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      searchCatalog(query).catch(() => setError('Could not load the Dukwise Catalog. Check your connection and try again.'))
    }, query ? 260 : 0)
    return () => clearTimeout(timer)
  }, [query, searchCatalog])

  const selectedItems = useMemo(() => Object.values(selected), [selected])
  const completeItems = selectedItems.filter((item) =>
    Number(item.quantity) >= 0 && Number(item.costPrice) >= 0 && Number(item.unitPrice) > 0
  )
  const canSave = selectedItems.length > 0 && completeItems.length === selectedItems.length && !saving

  function toggleVariant(product, variant) {
    setSelected((current) => {
      if (current[variant.id]) {
        const next = { ...current }
        delete next[variant.id]
        return next
      }
      return {
        ...current,
        [variant.id]: {
          variantId: variant.id,
          productName: product.name,
          brand: product.brand,
          formatLabel: formatVariant(variant),
          quantity: '', costPrice: '', unitPrice: '',
        },
      }
    })
  }

  function updateItem(variantId, field, value) {
    setSelected((current) => ({
      ...current,
      [variantId]: { ...current[variantId], [field]: value },
    }))
  }

  function removeItem(variantId) {
    setSelected((current) => {
      const next = { ...current }
      delete next[variantId]
      return next
    })
  }

  async function saveOpeningStock() {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      await addOpeningStockFromCatalog(completeItems.map((item) => ({
        catalogVariantId: item.variantId,
        quantity: Number(item.quantity),
        costPrice: Number(item.costPrice),
        unitPrice: Number(item.unitPrice),
        stockAlert: 5,
      })))
      if (location.state?.fromOnboarding) completeOnboarding()
      navigate('/', { replace: true })
    } catch (saveError) {
      console.error('Catalog opening inventory failed:', saveError)
      setError(saveError?.message?.includes('already in this shop')
        ? 'One selected format is already in your stock. Remove it and try again.'
        : 'Could not add these products. Nothing was changed; please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '18px 16px 110px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 190, height: 190, top: -45, right: -55, background: 'rgba(240,169,61,.13)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
          <button type="button" onClick={() => navigate(-1)} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="arrowLeft" size={16} color="var(--text-hi)" />
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 750, color: 'var(--text-hi)', letterSpacing: '-.02em' }}>Add existing stock</h1>
            <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>No Cash Out or expense will be recorded</p>
          </div>
        </div>

        <div style={{ position: 'relative', marginTop: 17, marginBottom: 10 }}>
          <Icon name="search" size={15} color="var(--text-low)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product or brand..." style={{ width: '100%', padding: '11px 36px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)', color: 'var(--text-hi)', fontSize: 12, outline: 'none' }} />
          {query && <button type="button" onClick={() => setQuery('')} style={{ position: 'absolute', right: 7, top: 6, width: 29, height: 29, border: 0, background: 'transparent', cursor: 'pointer', transform: 'rotate(45deg)' }}><Icon name="plus" size={14} color="var(--text-low)" /></button>}
        </div>

        <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 9 }}>
          Tap a product once, then select every format your shop carries.
        </p>

        <div style={{ display: 'grid', gap: 8 }}>
          {catalogProducts.map((product) => {
            const isOpen = expanded === product.id
            const selectedCount = product.variants.filter((variant) => selected[variant.id]).length
            return (
              <GlassCard key={product.id} style={{ padding: 0, overflow: 'hidden' }}>
                <button type="button" onClick={() => setExpanded(isOpen ? null : product.id)} style={{ width: '100%', border: 0, background: 'transparent', padding: 12, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: selectedCount ? 'rgba(95,217,122,.14)' : 'rgba(240,169,61,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="package" size={16} color={selectedCount ? '#5FD97A' : '#F0A93D'} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{product.name}</p>
                    <p style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{product.brand} · {product.category}{selectedCount ? ` · ${selectedCount} selected` : ''}</p>
                  </div>
                  <Icon name="chevronDown" size={15} color="var(--text-low)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }} />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 11px 11px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--glass-border)' }}>
                    {product.variants.map((variant) => {
                      const active = Boolean(selected[variant.id])
                      return <button key={variant.id} type="button" onClick={() => toggleVariant(product, variant)} style={{ marginTop: 9, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', background: active ? 'rgba(95,217,122,.13)' : 'var(--faint-fill)', border: active ? '1px solid rgba(95,217,122,.42)' : '1px solid var(--faint-border)', color: active ? '#5FD97A' : 'var(--text-mid)', fontSize: 10, fontWeight: 650 }}>{active ? '✓ ' : ''}{formatVariant(variant)}</button>
                    })}
                  </div>
                )}
              </GlassCard>
            )
          })}
        </div>

        {catalogLoading && <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-low)', padding: 18 }}>Searching catalog...</p>}
        {!catalogLoading && catalogProducts.length === 0 && <GlassCard style={{ textAlign: 'center', padding: 22 }}><p style={{ fontSize: 11, color: 'var(--text-low)' }}>No catalog product found. You can still create a custom product from Inventory.</p></GlassCard>}

        {selectedItems.length > 0 && (
          <section style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 750, color: 'var(--text-hi)', letterSpacing: '.08em' }}>SELECTED FORMATS</p>
              <span style={{ fontSize: 10, color: '#F0A93D' }}>{selectedItems.length}</span>
            </div>
            <CatalogBulkEditor items={selectedItems} onChange={updateItem} onRemove={removeItem} />
          </section>
        )}

        {error && <div style={{ marginTop: 12, borderRadius: 10, padding: 10, background: 'rgba(255,107,91,.10)', border: '1px solid rgba(255,107,91,.25)', color: '#FF6B5B', fontSize: 10 }}>{error}</div>}
      </div>

      <div style={{ position: 'fixed', zIndex: 12, left: '50%', bottom: 0, transform: 'translateX(-50%)', width: 'min(100%, 393px)', padding: '10px 16px 18px', background: 'linear-gradient(180deg, transparent, var(--bg-deep) 24%)' }}>
        <button type="button" disabled={!canSave} onClick={saveOpeningStock} style={{ width: '100%', padding: 13, borderRadius: 12, border: 0, background: '#F0A93D', color: '#0F1117', opacity: canSave ? 1 : .38, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 750, cursor: canSave ? 'pointer' : 'default' }}>
          {saving ? 'Adding products...' : `Add selected products${selectedItems.length ? ` (${selectedItems.length})` : ''}`}
        </button>
      </div>
    </div>
  )
}
