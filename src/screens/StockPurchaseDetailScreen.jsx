import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import { getStockPurchaseById } from '../lib/db'
import { fmtKES } from '../utils/formatters'

export default function StockPurchaseDetailScreen() {
  const { id } = useParams()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getStockPurchaseById(id)
      .then((result) => result ? setRecord(result) : setError('This stock purchase was not found.'))
      .catch((loadError) => { console.error('Load stock purchase failed:', loadError); setError('Could not load this stock purchase.') })
      .finally(() => setLoading(false))
  }, [id])

  if (loading || error || !record) return <div style={page}><SubScreenHeader title="Stock Purchase Details" /><div style={empty}>{loading ? 'Loading purchase...' : error}</div></div>

  const date = new Date(`${record.purchase_date || record.created_at}${record.purchase_date ? 'T12:00:00' : ''}`)
  const totalUnits = (record.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const margin = Number(record.expected_revenue) > 0 ? Math.round(Number(record.expected_profit) / Number(record.expected_revenue) * 100) : 0

  return <div style={page}>
    <div className="bg-blob" style={{ width: 190, height: 190, top: -55, right: -55, background: 'rgba(240,169,61,.17)' }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <SubScreenHeader title="Stock Purchase Details" />
      <div style={hero}>
        <div style={heroIcon}><Icon name="package" size={21} color="#F0A93D" /></div>
        <div style={{ flex: 1 }}><p style={label}>Purchase date</p><p style={heroTitle}>{date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><p style={muted}>{record.supplier || 'Supplier not specified'} · {totalUnits} units</p></div>
      </div>

      <p style={sectionTitle}>Products</p>
      <div style={card}>
        {(record.items || []).map((item, index) => {
          const lineCost = Number(item.purchase_price) * Number(item.quantity)
          return <div key={item.id} style={{ padding: '12px 0', borderTop: index ? '1px solid var(--glass-border)' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={productIcon}><Icon name="bottle" size={15} color="#F0A93D" /></div><div style={{ minWidth: 0, flex: 1 }}><p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hi)' }}>{item.product?.name || 'Product'}</p><p style={muted}>{item.product?.category || 'Uncategorised'}</p></div><p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#F0A93D' }}>{fmtKES(lineCost)} KES</p></div>
            <div style={lineGrid}><Metric label="Quantity" value={item.quantity} /><Metric label="Buying price" value={`${fmtKES(item.purchase_price)} KES`} /><Metric label="Selling price" value={`${fmtKES(item.unit_price)} KES`} /><Metric label="Stock before" value={item.stock_before} /><Metric label="Stock after" value={item.stock_after} color="#5FD97A" /></div>
          </div>
        })}
      </div>

      <p style={sectionTitle}>Purchase Summary</p>
      <div style={summaryGrid}><Summary label="Total invested" value={record.total_investment} color="#F0A93D" /><Summary label="Expected revenue" value={record.expected_revenue} /><Summary label="Expected profit" value={record.expected_profit} color="#5FD97A" /><Summary label="Expected margin" value={margin} suffix="%" /></div>
      {record.notes && <><p style={sectionTitle}>Notes</p><div style={{ ...card, fontSize: 10, color: 'var(--text-mid)', lineHeight: 1.5 }}>{record.notes}</div></>}
    </div>
  </div>
}

function Metric({ label, value, color = 'var(--text-hi)' }) { return <div><p style={labelStyle}>{label}</p><p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color }}>{value}</p></div> }
function Summary({ label, value, color = 'var(--text-hi)', suffix = ' KES' }) { return <div style={summaryBox}><p style={labelStyle}>{label}</p><p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color }}>{fmtKES(value)}{suffix}</p></div> }
const page = { flex: 1, width: '100%', padding: '16px 14px 40px', position: 'relative' }
const hero = { display: 'flex', gap: 11, alignItems: 'center', padding: 14, borderRadius: 16, background: 'linear-gradient(145deg,rgba(240,169,61,.13),rgba(255,255,255,.025))', border: '1px solid rgba(240,169,61,.23)' }
const heroIcon = { width: 43, height: 43, borderRadius: 14, background: 'rgba(240,169,61,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const heroTitle = { fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', marginTop: 2 }
const label = { fontSize: 8, color: '#F0A93D', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }
const muted = { fontSize: 9, color: 'var(--text-low)', marginTop: 2 }
const sectionTitle = { fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '.09em', margin: '17px 0 8px' }
const card = { padding: '0 13px', borderRadius: 15, border: '1px solid var(--glass-border)', background: 'linear-gradient(150deg,rgba(255,255,255,.045),rgba(255,255,255,.016))' }
const productIcon = { width: 34, height: 34, borderRadius: 10, background: 'rgba(240,169,61,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const lineGrid = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 9, marginTop: 10, padding: 9, borderRadius: 10, background: 'var(--faint-fill)' }
const labelStyle = { fontSize: 7, color: 'var(--text-low)', marginBottom: 3, textTransform: 'uppercase' }
const summaryGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }
const summaryBox = { padding: 11, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)' }
const empty = { marginTop: 20, padding: 35, borderRadius: 15, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)', textAlign: 'center', color: 'var(--text-low)', fontSize: 10 }
