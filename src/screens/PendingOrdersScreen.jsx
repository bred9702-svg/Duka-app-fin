import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import Icon from '../components/ui/Icon'
import { fmtKES } from '../utils/formatters'

const OPEN = new Set(['awaiting_payment', 'partially_paid', 'paid'])

export default function PendingOrdersScreen() {
  const navigate = useNavigate()
  const orders = useAppStore((s) => s.pendingOrders)
  const [tab, setTab] = useState('open')
  const visible = useMemo(() => orders.filter((o) => tab === 'open' ? OPEN.has(o.status) : !OPEN.has(o.status)), [orders, tab])

  return <div style={{ flex: 1, padding: '16px 14px 100px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-hi)' }}>Orders</h1>
        <p style={{ fontSize: 11, color: 'var(--text-low)' }}>{orders.filter((o) => OPEN.has(o.status)).length} open orders</p></div>
      <button onClick={() => navigate('/orders/new')} style={primary}><Icon name="plus" size={15} /> New order</button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
      {['open','history'].map((value) => <button key={value} onClick={() => setTab(value)} style={{ ...tabBtn, color: tab===value?'#F0A93D':'var(--text-low)', borderColor: tab===value?'rgba(240,169,61,.5)':'var(--glass-border)' }}>{value === 'open' ? 'Open' : 'History'}</button>)}
    </div>
    {visible.length === 0 ? <div style={empty}><Icon name="inbox" size={28} color="var(--text-low)" /><p>No {tab} orders</p></div> : visible.map((order) => {
      const balance = Number(order.total_amount)-Number(order.paid_amount)
      return <button key={order.id} onClick={() => navigate(`/orders/${order.id}`)} style={card}>
        <div style={{ display:'flex',justifyContent:'space-between',gap:8 }}><div><p style={title}>Order #{order.order_number}</p><p style={muted}>{order.customer?.name || 'Walk-in customer'} · {new Date(order.created_at).toLocaleString()}</p></div><span style={badge}>{order.status.replaceAll('_',' ')}</span></div>
        <p style={{ fontSize:11,color:'var(--text-mid)',margin:'9px 0' }}>{(order.items||[]).map((i)=>`${i.product_name} ×${i.quantity}`).join(', ')}</p>
        <div style={{display:'flex',justifyContent:'space-between'}}><strong style={{color:'#F0A93D'}}>{fmtKES(order.total_amount)} KES</strong>{OPEN.has(order.status)&&<span style={muted}>Balance: {fmtKES(balance)} KES</span>}</div>
      </button>
    })}
  </div>
}

const primary={border:0,borderRadius:11,padding:'10px 12px',background:'#F0A93D',color:'#17120a',fontWeight:700,display:'flex',gap:5,alignItems:'center',cursor:'pointer'}
const tabBtn={padding:10,borderRadius:10,border:'1px solid',background:'var(--glass-fill-soft)',fontWeight:700,textTransform:'capitalize'}
const card={width:'100%',textAlign:'left',padding:13,marginBottom:9,borderRadius:14,border:'1px solid var(--glass-border)',background:'var(--glass-fill-soft)',cursor:'pointer'}
const title={fontSize:13,fontWeight:700,color:'var(--text-hi)',margin:0}; const muted={fontSize:10,color:'var(--text-low)',margin:'3px 0 0'}
const badge={fontSize:9,color:'#F0A93D',textTransform:'capitalize'}; const empty={padding:40,textAlign:'center',color:'var(--text-low)'}
