import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import Icon from '../components/ui/Icon'
import FadeIn from '../components/animation/FadeIn'
import StaggerContainer from '../components/animation/StaggerContainer'
import { fmtKES } from '../utils/formatters'

const OPEN = new Set(['awaiting_payment', 'partially_paid', 'paid'])
const PAGE_SIZE = 10
const STATUS = {
  awaiting_payment: { label: 'Awaiting payment', color: '#F0A93D', bg: 'rgba(240,169,61,.12)' },
  partially_paid: { label: 'Partially paid', color: '#5B9FF0', bg: 'rgba(91,159,240,.12)' },
  paid: { label: 'Ready to complete', color: '#5FD97A', bg: 'rgba(95,217,122,.12)' },
  completed: { label: 'Completed', color: '#5FD97A', bg: 'rgba(95,217,122,.12)' },
  converted_to_debt: { label: 'Converted to debt', color: '#FFB85C', bg: 'rgba(255,184,92,.12)' },
  cancelled: { label: 'Cancelled', color: '#94A3B8', bg: 'rgba(148,163,184,.10)' },
}

export default function PendingOrdersScreen() {
  const navigate = useNavigate()
  const orders = useAppStore((s) => s.pendingOrders)
  const [tab, setTab] = useState('open')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customDate, setCustomDate] = useState('')
  const [page, setPage] = useState(1)
  const openCount = orders.filter((o) => OPEN.has(o.status)).length
  const outstanding = orders.filter((o) => OPEN.has(o.status)).reduce((sum, o) => sum + Number(o.total_amount) - Number(o.paid_amount), 0)
  const historyOrders = useMemo(() => orders.filter((order) => !OPEN.has(order.status)), [orders])
  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/^order\s*#?\s*/, '')
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const selectedDate = customDate ? new Date(`${customDate}T00:00:00`) : null

    return historyOrders.filter((order) => {
      const created = new Date(order.created_at)
      let matchesDate = true
      if (dateFilter === 'today') matchesDate = created >= todayStart
      if (dateFilter === 'yesterday') {
        const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
        matchesDate = created >= yesterdayStart && created < todayStart
      }
      if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(todayStart); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        matchesDate = created >= sevenDaysAgo
      }
      if (dateFilter === 'custom' && selectedDate) {
        const nextDate = new Date(selectedDate); nextDate.setDate(nextDate.getDate() + 1)
        matchesDate = created >= selectedDate && created < nextDate
      }

      if (!matchesDate || !query) return matchesDate
      const searchable = [
        String(order.order_number || ''),
        order.customer?.name,
        ...(order.items || []).map((item) => item.product_name),
      ].filter(Boolean).join(' ').toLowerCase()
      return searchable.includes(query)
    })
  }, [historyOrders, search, dateFilter, customDate])
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visible = tab === 'open'
    ? orders.filter((order) => OPEN.has(order.status))
    : filteredHistory.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 100px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 180, height: 180, top: -60, right: -50, background: 'rgba(240,169,61,.18)' }} />
      <div className="bg-blob" style={{ width: 130, height: 130, top: 280, left: -60, background: 'rgba(91,159,240,.08)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <FadeIn duration={280} y={10}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <p style={eyebrow}>Sales workspace</p>
              <h1 style={pageTitle}>Pending Orders</h1>
              <p style={subtitle}>{openCount ? `${openCount} order${openCount > 1 ? 's' : ''} waiting` : 'Everything is settled'}</p>
            </div>
            <button onClick={() => navigate('/orders/new')} style={newButton}>
              <Icon name="plus" size={15} color="#211506" /> New order
            </button>
          </div>
        </FadeIn>

        {openCount > 0 && (
          <FadeIn delay={50} duration={280} y={10}>
            <div style={heroCard}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(240,169,61,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="receiptOff" size={20} color="#F0A93D" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 9, color: '#FFD98A', textTransform: 'uppercase', letterSpacing: '.09em', fontWeight: 700 }}>Outstanding balance</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', marginTop: 2 }}>{fmtKES(outstanding)} <span style={{ fontSize: 11, color: 'var(--text-low)' }}>KES</span></p>
              </div>
              <span style={{ fontSize: 10, color: '#F0A93D' }}>{openCount} open</span>
            </div>
          </FadeIn>
        )}

        <div style={tabsWrap}>
          {[['open', `Open${openCount ? ` · ${openCount}` : ''}`], ['history', 'History']].map(([value, label]) => (
            <button key={value} onClick={() => { setTab(value); setPage(1) }} style={{ ...tabButton, ...(tab === value ? activeTab : {}) }}>{label}</button>
          ))}
        </div>

        {tab === 'history' && <div style={filterPanel}>
          <div style={searchBox}><Icon name="search" size={14} color="var(--text-low)" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search order, customer or product..." style={searchInput} /></div>
          <div style={filterChips}>{[
            ['all', 'All'], ['today', 'Today'], ['yesterday', 'Yesterday'], ['7days', 'Last 7 days'], ['custom', 'Choose date'],
          ].map(([value, label]) => <button key={value} onClick={() => { setDateFilter(value); setPage(1) }} style={{ ...filterChip, ...(dateFilter === value ? activeFilterChip : {}) }}>{label}</button>)}</div>
          {dateFilter === 'custom' && <input type="date" value={customDate} onChange={(event) => { setCustomDate(event.target.value); setPage(1) }} style={dateInput} />}
          <p style={{ fontSize: 9, color: 'var(--text-low)', marginTop: 8 }}>{filteredHistory.length} receipt{filteredHistory.length === 1 ? '' : 's'} found</p>
        </div>}

        {visible.length === 0 ? (
          <FadeIn duration={300} y={8}>
            <div style={emptyCard}>
              <div style={emptyIcon}><Icon name={tab === 'open' ? 'circleCheck' : 'receiptOff'} size={25} color={tab === 'open' ? '#5FD97A' : 'var(--text-low)'} /></div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)', marginTop: 12 }}>{tab === 'open' ? 'No pending orders' : 'No order history yet'}</p>
              <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 4 }}>{tab === 'open' ? 'New customer orders will appear here.' : 'Completed, debt and cancelled orders stay here.'}</p>
              {tab === 'open' && <button onClick={() => navigate('/orders/new')} style={{ ...newButton, marginTop: 16 }}>Create first order</button>}
            </div>
          </FadeIn>
        ) : (
          <>
            <StaggerContainer step={55}>
              {visible.map((order) => {
              const balance = Number(order.total_amount) - Number(order.paid_amount)
              const status = STATUS[order.status] || STATUS.cancelled
              const progress = Math.min(100, Number(order.paid_amount) / Number(order.total_amount) * 100 || 0)
              return (
                <button key={order.id} onClick={() => navigate(`/orders/${order.id}`)} style={orderCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: status.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={order.status === 'completed' ? 'circleCheck' : 'bottle'} size={17} color={status.color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>Order #{order.order_number}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer?.name || 'Walk-in customer'} · {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span style={{ padding: '5px 7px', borderRadius: 999, fontSize: 8, fontWeight: 700, color: status.color, background: status.bg, whiteSpace: 'nowrap' }}>{status.label}</span>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-mid)', margin: '11px 0 9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(order.items || []).map((i) => `${i.product_name} ×${i.quantity}`).join('  ·  ')}</p>
                  {OPEN.has(order.status) && <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,.06)', overflow: 'hidden', marginBottom: 9 }}><div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#5FD97A' : 'linear-gradient(90deg,#F0A93D,#FFD98A)', borderRadius: 999 }} /></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div><p style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase' }}>Order total</p><p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F0A93D' }}>{fmtKES(order.total_amount)} KES</p></div>
                    {OPEN.has(order.status) ? <p style={{ fontSize: 10, color: balance ? 'var(--text-mid)' : '#5FD97A' }}>{balance ? `${fmtKES(balance)} KES remaining` : 'Fully paid'}</p> : <Icon name="chevronRight" size={15} color="var(--text-low)" />}
                  </div>
                </button>
              )
              })}
            </StaggerContainer>
            {tab === 'history' && filteredHistory.length > PAGE_SIZE && <div style={pagination}>
              <button disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} style={{ ...pageButton, opacity: safePage === 1 ? .35 : 1 }}><Icon name="arrowLeft" size={13} /> Previous</button>
              <div style={{ textAlign: 'center' }}><p style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--text-hi)' }}>{safePage} / {totalPages}</p><p style={{ fontSize: 8, color: 'var(--text-low)', marginTop: 2 }}>{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length}</p></div>
              <button disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} style={{ ...pageButton, opacity: safePage === totalPages ? .35 : 1 }}>Next <Icon name="chevronRight" size={13} /></button>
            </div>}
          </>
        )}
      </div>
    </div>
  )
}

const eyebrow = { fontSize: 9, color: '#F0A93D', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 3 }
const pageTitle = { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-.02em' }
const subtitle = { fontSize: 10, color: 'var(--text-low)', marginTop: 3 }
const newButton = { border: '1px solid rgba(255,255,255,.35)', borderRadius: 12, padding: '10px 12px', background: 'linear-gradient(135deg,#FFC56B,#F0A93D)', color: '#211506', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 9px 24px -10px rgba(240,169,61,.7)' }
const heroCard = { display: 'flex', alignItems: 'center', gap: 11, padding: 13, marginBottom: 12, borderRadius: 15, background: 'linear-gradient(145deg,rgba(240,169,61,.12),rgba(255,255,255,.025))', border: '1px solid rgba(240,169,61,.22)', boxShadow: '0 14px 30px rgba(0,0,0,.13)' }
const tabsWrap = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, padding: 4, marginBottom: 12, borderRadius: 13, background: 'rgba(255,255,255,.025)', border: '1px solid var(--glass-border)' }
const tabButton = { padding: '9px 6px', borderRadius: 9, border: '1px solid transparent', background: 'transparent', color: 'var(--text-low)', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }
const activeTab = { background: 'rgba(240,169,61,.11)', border: '1px solid rgba(240,169,61,.25)', color: '#F0A93D', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }
const emptyCard = { minHeight: 260, padding: '52px 20px', textAlign: 'center', borderRadius: 16, background: 'linear-gradient(160deg,rgba(255,255,255,.035),rgba(255,255,255,.012))', border: '1px solid var(--glass-border)' }
const emptyIcon = { width: 54, height: 54, margin: '0 auto', borderRadius: 17, background: 'rgba(255,255,255,.035)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const orderCard = { width: '100%', textAlign: 'left', padding: 13, marginBottom: 9, borderRadius: 15, border: '1px solid var(--glass-border)', background: 'linear-gradient(150deg,rgba(255,255,255,.045),rgba(255,255,255,.016))', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 10px 25px rgba(0,0,0,.12)', cursor: 'pointer' }
const filterPanel = { padding: 10, marginBottom: 12, borderRadius: 14, border: '1px solid var(--glass-border)', background: 'linear-gradient(150deg,rgba(255,255,255,.04),rgba(255,255,255,.014))' }
const searchBox = { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 10px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--faint-fill)' }
const searchInput = { flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'var(--text-hi)', fontFamily: 'inherit', fontSize: 10 }
const filterChips = { display: 'flex', gap: 5, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }
const filterChip = { flexShrink: 0, padding: '7px 9px', borderRadius: 999, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-low)', fontSize: 8, fontWeight: 700, cursor: 'pointer' }
const activeFilterChip = { border: '1px solid rgba(240,169,61,.45)', background: 'rgba(240,169,61,.12)', color: '#F0A93D' }
const dateInput = { width: '100%', marginTop: 8, padding: '9px 10px', borderRadius: 10, border: '1px solid rgba(240,169,61,.3)', background: 'var(--faint-fill)', color: 'var(--text-hi)', fontFamily: 'inherit', fontSize: 10, colorScheme: 'dark' }
const pagination = { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, marginTop: 10, padding: 9, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)' }
const pageButton = { padding: 8, borderRadius: 9, border: '1px solid var(--glass-border)', background: 'var(--faint-fill)', color: 'var(--text-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 8, fontWeight: 700, cursor: 'pointer' }
