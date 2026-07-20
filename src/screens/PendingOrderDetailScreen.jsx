import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import { fmtKES } from '../utils/formatters'

export default function PendingOrderDetailScreen(){
  const {id}=useParams();const navigate=useNavigate();const order=useAppStore((s)=>s.pendingOrders.find((o)=>o.id===id));const customers=useAppStore((s)=>s.customers)
  const record=useAppStore((s)=>s.recordPendingOrderPayment);const finalize=useAppStore((s)=>s.finalizePendingOrder);const convert=useAppStore((s)=>s.convertPendingOrderToDebt);const cancel=useAppStore((s)=>s.cancelPendingOrder)
  const [amount,setAmount]=useState('');const [method,setMethod]=useState('cash');const [customerId,setCustomerId]=useState(order?.customer_id||'');const [busy,setBusy]=useState(false);const [error,setError]=useState(null)
  if(!order)return <div style={{padding:20}}>Order not found.</div>;const balance=Number(order.total_amount)-Number(order.paid_amount);const open=['awaiting_payment','partially_paid','paid'].includes(order.status)
  async function act(fn){setBusy(true);setError(null);try{await fn()}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <div style={{flex:1,padding:'16px 14px 50px'}}><SubScreenHeader title={`Order #${order.order_number}`} />
    <div style={card}><p style={status}>{order.status.replaceAll('_',' ')}</p><h2>{order.customer?.name||'Walk-in customer'}</h2><p style={muted}>Created {new Date(order.created_at).toLocaleString()}</p></div>
    <div style={card}>{(order.items||[]).map((i)=><div key={i.id} style={line}><span>{i.product_name} ×{i.quantity}</span><b>{fmtKES(i.unit_price*i.quantity)} KES</b></div>)}</div>
    <div style={card}><div style={line}><span>Total</span><b>{fmtKES(order.total_amount)} KES</b></div><div style={line}><span>Paid</span><b style={{color:'#5FD97A'}}>{fmtKES(order.paid_amount)} KES</b></div><div style={line}><span>Balance</span><b style={{color:'#F0A93D'}}>{fmtKES(balance)} KES</b></div></div>
    {open&&order.status!=='paid'&&<div style={card}><p style={label}>Record payment</p><div style={{display:'grid',gridTemplateColumns:'1fr 110px',gap:8}}><input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder={`${balance}`} style={input}/><select value={method} onChange={(e)=>setMethod(e.target.value)} style={input}><option value="cash">Cash</option><option value="mpesa">M-Pesa</option></select></div><button disabled={busy||Number(amount)<=0} onClick={()=>act(async()=>{await record({orderId:id,amount:Number(amount),method});setAmount('')})} style={primary}>Record payment</button></div>}
    {order.status==='paid'&&<button disabled={busy} onClick={()=>act(async()=>{await finalize(id);navigate('/orders')})} style={primary}>Complete sale</button>}
    {['awaiting_payment','partially_paid'].includes(order.status)&&<div style={card}><p style={label}>Convert remaining balance to debt</p><select value={customerId} onChange={(e)=>setCustomerId(e.target.value)} style={input}><option value="">Select customer...</option>{customers.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button disabled={busy||!customerId} onClick={()=>act(async()=>{await convert(id,customerId);navigate('/orders')})} style={danger}>Convert to debt</button></div>}
    {order.status==='awaiting_payment'&&Number(order.paid_amount)===0&&<button disabled={busy} onClick={()=>act(async()=>{await cancel(id,'Cancelled by shop');navigate('/orders')})} style={ghost}>Cancel order</button>}
    {error&&<p style={{color:'#FF6B5B',fontSize:11}}>{error}</p>}
  </div>
}
const card={padding:13,borderRadius:14,border:'1px solid var(--glass-border)',background:'var(--glass-fill-soft)',marginBottom:10,color:'var(--text-hi)'};const line={display:'flex',justifyContent:'space-between',gap:10,padding:'6px 0',fontSize:12};const muted={fontSize:10,color:'var(--text-low)'};const status={fontSize:10,textTransform:'capitalize',color:'#F0A93D'};const label={fontSize:11,fontWeight:700};const input={width:'100%',padding:10,borderRadius:10,border:'1px solid var(--glass-border)',background:'var(--faint-fill)',color:'var(--text-hi)'}
const primary={width:'100%',padding:12,border:0,borderRadius:11,background:'#F0A93D',fontWeight:700,marginTop:9};const danger={...primary,background:'#FF6B5B'};const ghost={...primary,background:'transparent',border:'1px solid #FF6B5B',color:'#FF6B5B'}
