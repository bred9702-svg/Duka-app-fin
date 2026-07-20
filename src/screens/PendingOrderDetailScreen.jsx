import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import FadeIn from '../components/animation/FadeIn'
import Avatar from '../components/ui/Avatar'
import { fmtKES } from '../utils/formatters'

const STATUS = {
  awaiting_payment: ['Awaiting payment', '#F0A93D'], partially_paid: ['Partially paid', '#5B9FF0'],
  paid: ['Ready to complete', '#5FD97A'], completed: ['Completed', '#5FD97A'],
  converted_to_debt: ['Converted to debt', '#FFB85C'], cancelled: ['Cancelled', '#94A3B8'],
}

export default function PendingOrderDetailScreen() {
  const { id } = useParams(); const navigate = useNavigate()
  const order = useAppStore((s) => s.pendingOrders.find((o) => o.id === id)); const customers = useAppStore((s) => s.customers)
  const record = useAppStore((s) => s.recordPendingOrderPayment); const finalize = useAppStore((s) => s.finalizePendingOrder)
  const convert = useAppStore((s) => s.convertPendingOrderToDebt); const cancel = useAppStore((s) => s.cancelPendingOrder)
  const [amount, setAmount] = useState(''); const [method, setMethod] = useState('cash')
  const [customerId, setCustomerId] = useState(order?.customer_id || ''); const [busy, setBusy] = useState(false); const [error, setError] = useState(null)
  if (!order) return <div style={{ padding: 24, color: 'var(--text-low)' }}>Order not found.</div>
  const balance = Number(order.total_amount) - Number(order.paid_amount); const open = ['awaiting_payment', 'partially_paid', 'paid'].includes(order.status)
  const [statusLabel, statusColor] = STATUS[order.status] || STATUS.cancelled
  const progress = Math.min(100, Number(order.paid_amount) / Number(order.total_amount) * 100 || 0)
  async function act(fn) { setBusy(true); setError(null); try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) } }

  return <div style={{ flex: 1, width: '100%', padding: '16px 14px 42px', position: 'relative' }}>
    <div className="bg-blob" style={{ width: 190, height: 190, top: -70, right: -60, background: `${statusColor}20` }} />
    <div style={{ position: 'relative', zIndex: 1 }}><SubScreenHeader title={`Order #${order.order_number}`} />
      <FadeIn duration={280} y={10}>
        <div style={{ ...hero, borderColor: `${statusColor}42` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {order.customer ? <Avatar name={order.customer.name} color="blue" size={40} /> : <div style={walkIn}><Icon name="users" size={18} color="#F0A93D" /></div>}
              <div><p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>{order.customer?.name || 'Walk-in customer'}</p><p style={muted}>Created {new Date(order.created_at).toLocaleString()}</p></div>
            </div>
            <span style={{ padding: '6px 8px', borderRadius: 999, background: `${statusColor}18`, color: statusColor, fontSize: 8, fontWeight: 700 }}>{statusLabel}</span>
          </div>
          <div style={{ marginTop: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={muted}>Payment progress</span><span style={{ fontSize: 9, color: statusColor, fontWeight: 700 }}>{Math.round(progress)}%</span></div><div style={track}><div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: progress === 100 ? '#5FD97A' : 'linear-gradient(90deg,#F0A93D,#FFD98A)' }} /></div></div>
        </div>
      </FadeIn>

      <SectionTitle>Products</SectionTitle>
      <div style={glassCard}>{(order.items || []).map((item, index) => <div key={item.id} style={{ ...line, borderBottom: index < order.items.length - 1 ? '1px solid var(--glass-border)' : 0 }}><div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><div style={productIcon}><Icon name="bottle" size={15} color="#F0A93D" /></div><div><p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hi)' }}>{item.product_name}</p><p style={muted}>{fmtKES(item.unit_price)} KES × {item.quantity}</p></div></div><b style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-hi)' }}>{fmtKES(item.unit_price * item.quantity)} KES</b></div>)}</div>

      <SectionTitle>Payment summary</SectionTitle>
      <div style={summaryCard}><Metric label="Order total" value={order.total_amount} color="var(--text-hi)" /><Metric label="Paid" value={order.paid_amount} color="#5FD97A" /><Metric label="Balance" value={balance} color="#F0A93D" /></div>

      {(order.payments || []).length > 0 && <><SectionTitle>Payment history</SectionTitle><div style={glassCard}>{order.payments.map((payment, index) => <div key={payment.id} style={{ ...line, borderBottom: index < order.payments.length - 1 ? '1px solid var(--glass-border)' : 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ ...productIcon, background: 'rgba(95,217,122,.10)' }}><Icon name={payment.method === 'mpesa' ? 'phone' : 'cash'} size={14} color="#5FD97A" /></div><div><p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hi)', textTransform: 'capitalize' }}>{payment.method}</p><p style={muted}>{new Date(payment.created_at).toLocaleString()}</p></div></div><b style={{ color: '#5FD97A', fontSize: 11 }}>+{fmtKES(payment.amount)} KES</b></div>)}</div></>}

      {open && order.status !== 'paid' && <ActionCard icon="cash" title="Record payment" subtitle={`${fmtKES(balance)} KES remaining`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 105px', gap: 7 }}><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Up to ${fmtKES(balance)}`} style={input} /><div style={methodToggle}>{['cash', 'mpesa'].map((value) => <button key={value} onClick={() => setMethod(value)} style={{ ...methodButton, ...(method === value ? selectedMethod : {}) }}>{value === 'cash' ? 'Cash' : 'M-Pesa'}</button>)}</div></div>
        <button disabled={busy || Number(amount) <= 0} onClick={() => act(async () => { await record({ orderId: id, amount: Number(amount), method }); setAmount('') })} style={primary}>{busy ? 'Recording...' : 'Record payment'}</button>
      </ActionCard>}

      {order.status === 'paid' && <div style={completeCard}><div style={completeIcon}><Icon name="circleCheck" size={22} color="#5FD97A" /></div><div style={{ flex: 1 }}><p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>Payment complete</p><p style={muted}>Finalize this order and deduct reserved stock.</p></div><button disabled={busy} onClick={() => act(async () => { await finalize(id); navigate('/orders') })} style={completeButton}>Complete sale</button></div>}

      {['awaiting_payment', 'partially_paid'].includes(order.status) && <ActionCard icon="userDollar" title="Convert balance to debt" subtitle="A saved customer is required">
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} style={input}><option value="">Select customer...</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select>
        <button disabled={busy || !customerId} onClick={() => act(async () => { await convert(id, customerId); navigate('/orders') })} style={debtButton}>Convert {fmtKES(balance)} KES to debt</button>
      </ActionCard>}

      {order.status === 'awaiting_payment' && Number(order.paid_amount) === 0 && <button disabled={busy} onClick={() => act(async () => { await cancel(id, 'Cancelled by shop'); navigate('/orders') })} style={cancelButton}><Icon name="x" size={14} color="#FF6B5B" /> Cancel this order</button>}
      {error && <div style={errorBox}><Icon name="alertTriangle" size={14} color="#FF6B5B" /><p>{error}</p></div>}
    </div>
  </div>
}

function SectionTitle({ children }) { return <p style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, color: 'var(--text-low)', textTransform: 'uppercase', letterSpacing: '.09em', margin: '15px 0 7px' }}>{children}</p> }
function Metric({ label, value, color }) { return <div><p style={{ fontSize: 8, color: 'var(--text-low)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</p><p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color }}>{fmtKES(value)}<span style={{ fontSize: 8, marginLeft: 2 }}>KES</span></p></div> }
function ActionCard({ icon, title, subtitle, children }) { return <div style={actionCard}><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}><div style={productIcon}><Icon name={icon} size={15} color="#F0A93D" /></div><div><p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-hi)' }}>{title}</p><p style={muted}>{subtitle}</p></div></div>{children}</div> }
const hero = { padding: 13, borderRadius: 16, border: '1px solid', background: 'linear-gradient(150deg,rgba(255,255,255,.05),rgba(255,255,255,.018))', boxShadow: '0 14px 30px rgba(0,0,0,.14)' }
const walkIn = { width: 40, height: 40, borderRadius: 13, background: 'rgba(240,169,61,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const muted = { fontSize: 9, color: 'var(--text-low)', marginTop: 2 }; const track = { height: 5, borderRadius: 999, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }
const glassCard = { padding: '2px 12px', borderRadius: 14, border: '1px solid var(--glass-border)', background: 'linear-gradient(150deg,rgba(255,255,255,.04),rgba(255,255,255,.015))' }
const line = { minHeight: 52, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }
const productIcon = { width: 32, height: 32, borderRadius: 10, background: 'rgba(240,169,61,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const summaryCard = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, padding: 13, borderRadius: 14, border: '1px solid rgba(240,169,61,.18)', background: 'linear-gradient(145deg,rgba(240,169,61,.08),rgba(255,255,255,.018))' }
const actionCard = { padding: 13, marginTop: 11, borderRadius: 15, border: '1px solid var(--glass-border)', background: 'linear-gradient(150deg,rgba(255,255,255,.045),rgba(255,255,255,.015))' }
const input = { width: '100%', padding: '10px 11px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--faint-fill)', color: 'var(--text-hi)', fontSize: 11, outline: 0 }
const methodToggle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 2, border: '1px solid var(--glass-border)', borderRadius: 10, background: 'rgba(255,255,255,.02)' }
const methodButton = { padding: 7, border: 0, borderRadius: 7, background: 'transparent', color: 'var(--text-low)', fontSize: 8, fontWeight: 700 }; const selectedMethod = { background: 'rgba(240,169,61,.14)', color: '#F0A93D' }
const primary = { width: '100%', padding: 11, marginTop: 8, border: '1px solid rgba(255,255,255,.3)', borderRadius: 10, background: 'linear-gradient(135deg,#FFC56B,#F0A93D)', color: '#211506', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700 }
const debtButton = { ...primary, background: 'linear-gradient(135deg,#FFCB85,#E99A3C)' }
const completeCard = { display: 'flex', alignItems: 'center', gap: 9, padding: 12, marginTop: 12, borderRadius: 15, border: '1px solid rgba(95,217,122,.25)', background: 'linear-gradient(145deg,rgba(95,217,122,.10),rgba(255,255,255,.018))' }
const completeIcon = { width: 40, height: 40, borderRadius: 13, background: 'rgba(95,217,122,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center' }; const completeButton = { padding: '9px 10px', border: 0, borderRadius: 9, background: '#5FD97A', color: '#102016', fontSize: 9, fontWeight: 700 }
const cancelButton = { width: '100%', padding: 11, marginTop: 12, borderRadius: 11, border: '1px solid rgba(255,107,91,.24)', background: 'rgba(255,107,91,.06)', color: '#FF6B5B', fontSize: 10, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }
const errorBox = { display: 'flex', alignItems: 'center', gap: 7, marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(255,107,91,.09)', border: '1px solid rgba(255,107,91,.25)', color: '#FF6B5B', fontSize: 10 }
