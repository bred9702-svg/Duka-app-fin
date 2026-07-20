import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import { getStockPurchases } from '../lib/db'
import { fmtKES } from '../utils/formatters'

const PAGE_SIZE = 10

function purchaseDate(record) {
  return new Date(`${record.purchase_date || record.created_at}${record.purchase_date ? 'T12:00:00' : ''}`)
}

export default function StockPurchaseHistoryScreen() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customDate, setCustomDate] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getStockPurchases(500)
      .then(setRecords)
      .catch((loadError) => {
        console.error('Load stock purchase history failed:', loadError)
        setError('Could not load stock purchase history.')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return records.filter((record) => {
      const date = purchaseDate(record)
      let matchesDate = true
      if (dateFilter === 'today') matchesDate = date >= today
      if (dateFilter === '7days') {
        const start = new Date(today); start.setDate(start.getDate() - 6)
        matchesDate = date >= start
      }
      if (dateFilter === '30days') {
        const start = new Date(today); start.setDate(start.getDate() - 29)
        matchesDate = date >= start
      }
      if (dateFilter === 'custom' && customDate) matchesDate = record.purchase_date === customDate
      if (!matchesDate || !query) return matchesDate
      return [record.supplier, record.notes, ...(record.items || []).map((item) => item.product?.name)]
        .filter(Boolean).join(' ').toLowerCase().includes(query)
    })
  }, [records, search, dateFilter, customDate])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 40px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 190, height: 190, top: -55, right: -55, background: 'rgba(240,169,61,.17)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Stock Purchase History" />
        <div style={summaryCard}>
          <div style={summaryIcon}><Icon name="package" size={20} color="#F0A93D" /></div>
          <div><p style={eyebrow}>Recorded purchases</p><p style={summaryValue}>{records.length}</p></div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}><p style={eyebrow}>Total invested</p><p style={{ ...summaryValue, fontSize: 16 }}>{fmtKES(records.reduce((sum, record) => sum + Number(record.total_investment || 0), 0))} <small style={{ fontSize: 8, color: 'var(--text-low)' }}>KES</small></p></div>
        </div>

        <div style={filterPanel}>
          <div style={searchBox}><Icon name="search" size={14} color="var(--text-low)" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search product or supplier..." style={searchInput} /></div>
          <div style={chips}>{[['all','All'],['today','Today'],['7days','7 days'],['30days','30 days'],['custom','Choose date']].map(([value,label]) => <button key={value} type="button" onClick={() => { setDateFilter(value); setPage(1) }} style={{ ...chip, ...(dateFilter === value ? activeChip : {}) }}>{label}</button>)}</div>
          {dateFilter === 'custom' && <input type="date" value={customDate} onChange={(event) => { setCustomDate(event.target.value); setPage(1) }} style={dateInput} />}
          <p style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 8 }}>{filtered.length} purchase{filtered.length === 1 ? '' : 's'} found</p>
        </div>

        {loading && <div style={emptyCard}>Loading stock purchase history...</div>}
        {error && <div style={{ ...emptyCard, color: '#FF6B5B' }}>{error}</div>}
        {!loading && !error && visible.length === 0 && <div style={emptyCard}><Icon name="package" size={24} color="var(--text-low)" /><p style={{ marginTop: 10 }}>No stock purchases match these filters.</p></div>}

        {visible.map((record) => {
          const units = (record.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
          return <button key={record.id} type="button" onClick={() => navigate(`/inventory-purchase-history/${record.id}`)} style={recordCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={recordIcon}><Icon name="package" size={17} color="#F0A93D" /></div>
              <div style={{ minWidth: 0, flex: 1 }}><p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>{purchaseDate(record).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</p><p style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 2 }}>{record.supplier || 'Supplier not specified'} · {(record.items || []).length} products · {units} units</p></div>
              <div style={{ textAlign: 'right' }}><p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0A93D' }}>{fmtKES(record.total_investment)} KES</p><Icon name="chevronRight" size={13} color="var(--text-low)" /></div>
            </div>
            <p style={{ marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--glass-border)', fontSize: 10, color: 'var(--text-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(record.items || []).map((item) => `${item.product?.name || 'Product'} ×${item.quantity}`).join('  ·  ')}</p>
          </button>
        })}

        {filtered.length > PAGE_SIZE && <div style={pagination}><button disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} style={{ ...pageButton, opacity: safePage === 1 ? .35 : 1 }}>Previous</button><span style={{ fontSize: 9, color: 'var(--text-mid)' }}>{safePage} / {pages}</span><button disabled={safePage === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} style={{ ...pageButton, opacity: safePage === pages ? .35 : 1 }}>Next</button></div>}
      </div>
    </div>
  )
}

const eyebrow = { fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '.08em' }
const summaryCard = { display: 'flex', alignItems: 'center', gap: 10, padding: 13, marginBottom: 11, borderRadius: 15, background: 'linear-gradient(145deg,rgba(240,169,61,.12),rgba(255,255,255,.025))', border: '1px solid rgba(240,169,61,.22)' }
const summaryIcon = { width: 41, height: 41, borderRadius: 13, background: 'rgba(240,169,61,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const summaryValue = { fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-hi)', marginTop: 2 }
const filterPanel = { padding: 10, marginBottom: 12, borderRadius: 14, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)' }
const searchBox = { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--faint-fill)' }
const searchInput = { flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'var(--text-hi)', fontFamily: 'inherit', fontSize: 10 }
const chips = { display: 'flex', gap: 5, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }
const chip = { flexShrink: 0, padding: '7px 9px', borderRadius: 999, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-low)', fontSize: 8, fontWeight: 700, cursor: 'pointer' }
const activeChip = { border: '1px solid rgba(240,169,61,.45)', background: 'rgba(240,169,61,.12)', color: '#F0A93D' }
const dateInput = { width: '100%', marginTop: 8, padding: '9px 10px', borderRadius: 10, border: '1px solid rgba(240,169,61,.3)', background: 'var(--faint-fill)', color: 'var(--text-hi)', fontSize: 10, colorScheme: 'dark' }
const recordCard = { width: '100%', textAlign: 'left', padding: 13, marginBottom: 9, borderRadius: 15, border: '1px solid var(--glass-border)', background: 'linear-gradient(150deg,rgba(255,255,255,.045),rgba(255,255,255,.016))', color: 'inherit', cursor: 'pointer' }
const recordIcon = { width: 38, height: 38, borderRadius: 12, background: 'rgba(240,169,61,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const emptyCard = { padding: 36, textAlign: 'center', borderRadius: 15, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)', color: 'var(--text-low)', fontSize: 10 }
const pagination = { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginTop: 10 }
const pageButton = { padding: 9, borderRadius: 9, border: '1px solid var(--glass-border)', background: 'var(--faint-fill)', color: 'var(--text-hi)', fontSize: 9, fontWeight: 700, cursor: 'pointer' }
