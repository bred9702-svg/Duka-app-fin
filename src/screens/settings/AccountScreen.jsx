import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import useAppStore from '../../store/useAppStore'
import { requestAccountDeletion } from '../../lib/account'

export default function AccountScreen() {
  const navigate = useNavigate()
  const signOut = useAppStore((state) => state.signOut)
  const role = useAppStore((state) => state.session?.role)
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const confirmed = confirmation.trim().toUpperCase() === 'DELETE MY ACCOUNT'

  async function deleteAccount() {
    if (!confirmed || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await requestAccountDeletion(confirmation)
      await signOut()
      navigate('/splash', { replace: true })
    } catch (deleteError) {
      console.error('Delete account failed:', deleteError)
      setError(deleteError.message || 'Could not request account deletion.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 24px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 150, height: 150, top: -35, right: -25, background: 'rgba(255,107,91,.14)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Account" />

        <div style={{ padding: '18px 16px', borderRadius: 16, background: 'rgba(255,107,91,.08)', border: '1px solid rgba(255,107,91,.24)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,107,91,.14)', marginBottom: 12 }}>
            <Icon name="shield" size={20} color="#FF6B5B" />
          </div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--text-hi)' }}>Delete Dukwise account</h1>
          <p style={{ margin: '9px 0 0', fontSize: 11, lineHeight: 1.6, color: 'var(--text-mid)' }}>
            Access is disabled immediately. You have 30 days to request recovery through Dukwise Support after identity verification.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 11, lineHeight: 1.6, color: 'var(--text-mid)' }}>
            {role === 'owner'
              ? 'Deleting an Owner account also deactivates the shop and employee access.'
              : 'Deleting an Employee account never deletes the Owner’s shop.'}
          </p>
        </div>

        <p style={{ margin: '18px 0 7px', fontSize: 10, color: 'var(--text-low)' }}>
          Type DELETE MY ACCOUNT to confirm
        </p>
        <input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: 12, border: '1px solid var(--glass-border)', outline: 'none', background: 'var(--glass-fill-soft)', color: 'var(--text-hi)', fontSize: 12 }}
        />

        {error && <p style={{ margin: '9px 0 0', fontSize: 10, color: '#FF6B5B' }}>{error}</p>}

        <button
          type="button"
          disabled={!confirmed || submitting}
          onClick={deleteAccount}
          style={{ width: '100%', marginTop: 14, padding: '13px', border: 'none', borderRadius: 12, background: '#FF6B5B', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, cursor: confirmed && !submitting ? 'pointer' : 'not-allowed', opacity: confirmed && !submitting ? 1 : 0.45 }}
        >
          {submitting ? 'Deleting account...' : 'Delete my account'}
        </button>
      </div>
    </div>
  )
}
