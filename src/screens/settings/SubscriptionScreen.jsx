import { useEffect, useMemo, useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import useAppStore from '../../store/useAppStore'
import {
  SUBSCRIPTION_PAYMENT,
  buildPaymentWhatsAppUrl,
  getLatestPaymentRequest,
  submitPaymentRequest,
} from '../../lib/subscriptions'

const FEATURES = [
  ['Core sales, stock, customers and debts', true, true],
  ['Last 30 days of transaction history', true, true],
  ['Full transaction history', false, true],
  ['Advanced analytics and reports', false, true],
  ['Employees and performance', false, true],
  ['Dukwise AI insights and smart alerts', false, true],
]

function formatDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function daysRemaining(value) {
  if (!value) return null
  const diff = new Date(value).getTime() - Date.now()
  if (Number.isNaN(diff)) return null
  return Math.max(0, Math.ceil(diff / 86400000))
}

export default function SubscriptionScreen() {
  const session = useAppStore((state) => state.session)
  const [reference, setReference] = useState('')
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const trialDays = daysRemaining(session?.trialEnd)
  const isActive = session?.subscriptionStatus === 'active'
  const isTrial = session?.subscriptionStatus === 'trial' && trialDays > 0
  const planLabel = isActive ? 'Dukwise Pro' : isTrial ? 'Pro Trial' : 'Dukwise Free'
  const accessEnd = isActive ? session?.currentPeriodEnd : isTrial ? session?.trialEnd : null
  const normalizedReference = reference.trim().toUpperCase()
  const validReference = /^[A-Z0-9-]{6,40}$/.test(normalizedReference)

  useEffect(() => {
    let active = true
    async function loadRequest() {
      if (!session?.shopId) return
      try {
        const latest = await getLatestPaymentRequest(session.shopId)
        if (!active) return
        setRequest(latest)
        if (latest?.status === 'pending') setReference(latest.mpesa_reference)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Could not load payment status.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadRequest()
    return () => { active = false }
  }, [session?.shopId])

  const whatsappUrl = useMemo(() => buildPaymentWhatsAppUrl({
    shopName: session?.shopName,
    ownerName: session?.name,
    reference: normalizedReference || request?.mpesa_reference,
  }), [session?.shopName, session?.name, normalizedReference, request?.mpesa_reference])

  async function confirmPayment() {
    if (!validReference || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const saved = await submitPaymentRequest(session.shopId, normalizedReference)
      setRequest(saved)
      setReference(saved.mpesa_reference)
    } catch (submitError) {
      setError(submitError.message || 'Could not submit the payment reference.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 28px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 170, height: 170, top: -45, right: -35, background: 'rgba(240,169,61,.14)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Subscription" />

        <div style={{ padding: 16, borderRadius: 17, background: 'linear-gradient(155deg, rgba(240,169,61,.17), var(--glass-fill-soft))', border: '1px solid rgba(240,169,61,.28)' }}>
          <p style={{ margin: 0, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: '#F0A93D', fontWeight: 700 }}>Current plan</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 7 }}>
            <div>
              <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 21, color: 'var(--text-hi)' }}>{planLabel}</h1>
              <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-low)' }}>
                {isTrial ? `${trialDays} day${trialDays === 1 ? '' : 's'} remaining` : accessEnd ? `Access until ${formatDate(accessEnd)}` : 'Core business tools remain available'}
              </p>
            </div>
            <Icon name="star" size={25} color="#F0A93D" />
          </div>
        </div>

        <p style={{ margin: '20px 0 9px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-low)' }}>Plans</p>
        <div style={{ overflow: 'hidden', borderRadius: 15, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 48px', gap: 8, padding: '11px 12px', borderBottom: '1px solid var(--glass-border)', fontSize: 10, color: 'var(--text-low)' }}>
            <span>Feature</span><strong>Free</strong><strong style={{ color: '#F0A93D' }}>Pro</strong>
          </div>
          {FEATURES.map(([label, free, pro]) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 48px 48px', gap: 8, padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,.04)', alignItems: 'center' }}>
              <span style={{ fontSize: 10, lineHeight: 1.4, color: 'var(--text-mid)' }}>{label}</span>
              <Icon name={free ? 'check' : 'minus'} size={13} color={free ? '#5FD97A' : 'var(--text-low)'} />
              <Icon name={pro ? 'check' : 'minus'} size={13} color={pro ? '#F0A93D' : 'var(--text-low)'} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, padding: 16, borderRadius: 17, background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-hi)' }}>Pay with M-Pesa</p>
              <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--text-low)' }}>Manual verification · no automatic renewal</p>
            </div>
            <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, color: '#F0A93D' }}>KES 2,999</p>
          </div>

          <div style={{ marginTop: 14, padding: '12px 13px', borderRadius: 13, background: 'rgba(240,169,61,.09)', border: '1px solid rgba(240,169,61,.18)' }}>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-low)' }}>Send to</p>
            <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text-hi)' }}>{SUBSCRIPTION_PAYMENT.mpesaPhone}</p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#F0A93D' }}>{SUBSCRIPTION_PAYMENT.mpesaRecipient}</p>
          </div>

          <ol style={{ margin: '13px 0 0', paddingLeft: 18, fontSize: 10, lineHeight: 1.7, color: 'var(--text-mid)' }}>
            <li>Send exactly KES 2,999 to the number above.</li>
            <li>Keep the M-Pesa confirmation message.</li>
            <li>Enter its transaction code below and submit.</li>
          </ol>

          {request?.status === 'pending' && (
            <div style={{ marginTop: 13, padding: '10px 12px', borderRadius: 12, background: 'rgba(91,159,240,.10)', border: '1px solid rgba(91,159,240,.22)' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#5B9FF0' }}>Pending verification</p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--text-low)' }}>Reference {request.mpesa_reference} · submitted {formatDate(request.requested_at)}</p>
            </div>
          )}
          {request?.status === 'rejected' && (
            <div style={{ marginTop: 13, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,107,91,.09)', border: '1px solid rgba(255,107,91,.22)' }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#FF6B5B' }}>Payment could not be verified</p>
              {request.rejection_reason && <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--text-low)' }}>{request.rejection_reason}</p>}
            </div>
          )}

          <label style={{ display: 'block', marginTop: 13, fontSize: 10, color: 'var(--text-low)' }}>M-Pesa transaction code</label>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
            placeholder="e.g. TGX7K2ABCD"
            maxLength={40}
            autoCapitalize="characters"
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '12px', borderRadius: 12, border: '1px solid var(--glass-border)', outline: 'none', background: 'var(--bg-deep)', color: 'var(--text-hi)', fontSize: 13, letterSpacing: '.05em' }}
          />
          {error && <p style={{ margin: '7px 0 0', fontSize: 10, color: '#FF6B5B' }}>{error}</p>}

          <button type="button" disabled={!validReference || submitting || loading} onClick={confirmPayment} style={{ width: '100%', marginTop: 11, padding: '12px', border: 'none', borderRadius: 12, background: '#F0A93D', color: '#15110A', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 750, cursor: validReference && !submitting ? 'pointer' : 'not-allowed', opacity: validReference && !submitting && !loading ? 1 : .45 }}>
            {submitting ? 'Submitting...' : request?.status === 'pending' ? 'Update payment reference' : 'I have paid'}
          </button>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 9, padding: '11px', borderRadius: 12, border: '1px solid rgba(95,217,122,.28)', background: 'rgba(95,217,122,.08)', color: '#5FD97A', textAlign: 'center', textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700 }}>
            Send confirmation on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
