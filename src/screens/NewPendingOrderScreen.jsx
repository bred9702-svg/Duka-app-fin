import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import Icon from '../components/ui/Icon'
import { fmtKES } from '../utils/formatters'

export default function NewPendingOrderScreen(){
  const navigate=useNavigate(); const products=useAppStore((s)=>s.products); const customers=useAppStore((s)=>s.customers)
  const create=useAppStore((s)=>s.createPendingOrder); const [query,setQuery]=useState(''); const [cart,setCart]=useState([])
  const [customerId,setCustomerId]=useState(null); const [saving,setSaving]=useState(false); const [error,setError]=useState(null)
  const matches=useMemo(()=>{const q=query.toLowerCase();return q?products.filter((p)=>(p.stock_current-(p.reserved_stock||0))>0&&!cart.some((i)=>i.productId===p.id)&&p.name.toLowerCase().includes(q)).slice(0,8):[]},[query,products,cart])
  const total=cart.reduce((a,i)=>a+i.unitPrice*i.quantity,0)
  const add=(p)=>{cart.push({productId:p.id,name:p.name,unitPrice:p.unit_price,quantity:1,available:p.stock_current-(p.reserved_stock||0)});setCart([...cart]);setQuery('')}
  const qty=(id,d)=>setCart(cart.map((i)=>i.productId===id?{...i,quantity:Math.max(1,Math.min(i.available,i.quantity+d))}:i))
  async function save(){setSaving(true);setError(null);try{const order=await create({items:cart.map(({productId,quantity})=>({productId,quantity})),customerId});navigate(`/orders/${order.id}`,{replace:true})}catch(e){setError(e.message)}finally{setSaving(false)}}
  return <div style={{flex:1,padding:'16px 14px 40px'}}><SubScreenHeader title="New Order" />
    <p style={label}>Customer</p><select value={customerId||''} onChange={(e)=>setCustomerId(e.target.value||null)} style={input}><option value="">Walk-in customer</option>{customers.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <p style={label}>Products</p><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search products..." style={input}/>
    {matches.map((p)=><button key={p.id} onClick={()=>add(p)} style={row}><span>{p.name}</span><span>{fmtKES(p.unit_price)} · {p.stock_current-(p.reserved_stock||0)} available</span></button>)}
    <div style={{marginTop:12}}>{cart.map((i)=><div key={i.productId} style={item}><div><strong>{i.name}</strong><p>{fmtKES(i.unitPrice*i.quantity)} KES</p></div><div style={{display:'flex',alignItems:'center',gap:9}}><button onClick={()=>qty(i.productId,-1)} style={qbtn}>−</button><b>{i.quantity}</b><button onClick={()=>qty(i.productId,1)} style={qbtn}>+</button><button onClick={()=>setCart(cart.filter((x)=>x.productId!==i.productId))} style={qbtn}><Icon name="x" size={13}/></button></div></div>)}</div>
    <div style={{...item,marginTop:14}}><strong>Order total</strong><strong style={{color:'#F0A93D'}}>{fmtKES(total)} KES</strong></div>
    {error&&<p style={{color:'#FF6B5B',fontSize:11}}>{error}</p>}<button onClick={save} disabled={!cart.length||saving} style={{...saveBtn,opacity:cart.length&&!saving?1:.4}}>{saving?'Creating...':'Create pending order'}</button>
  </div>
}
const label={fontSize:10,color:'var(--text-low)',textTransform:'uppercase',margin:'14px 0 6px'};const input={width:'100%',padding:11,borderRadius:11,border:'1px solid var(--glass-border)',background:'var(--glass-fill-soft)',color:'var(--text-hi)'}
const row={width:'100%',padding:10,border:0,borderBottom:'1px solid var(--glass-border)',background:'var(--card-elevated-bg)',color:'var(--text-hi)',display:'flex',justifyContent:'space-between',fontSize:11}
const item={padding:12,borderRadius:12,border:'1px solid var(--glass-border)',background:'var(--glass-fill-soft)',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,color:'var(--text-hi)'}
const qbtn={width:27,height:27,borderRadius:8,border:'1px solid var(--glass-border)',background:'var(--faint-fill)',color:'var(--text-hi)'};const saveBtn={width:'100%',padding:13,border:0,borderRadius:12,background:'#F0A93D',fontWeight:700,marginTop:12}
