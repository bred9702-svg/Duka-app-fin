import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import useAppStore from '../../store/useAppStore'
import FadeIn from '../../components/animation/FadeIn'
import StaggerContainer from '../../components/animation/StaggerContainer'

export default function InitialInventorySetupScreen() {
  const navigate = useNavigate()
  const session = useAppStore((s) => s.session)

  function goToDukwiseCatalog() {
    navigate('/catalog-inventory', { state: { fromOnboarding: true } })
  }


  return (
    <div style={{ flex: 1, width: '100%', padding: '20px 20px 32px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 200, height: 200, top: -40, right: -40, background: 'rgba(240,169,61,0.14)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <FadeIn duration={280} y={12}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#F0A93D', marginBottom: 6 }}>
            Almost there, {session?.name?.split(' ')[0] || 'there'}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Set up your inventory
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-low)', lineHeight: 1.5, marginBottom: 22 }}>
            Dukwise needs your first products to start tracking sales, profit, and stock. You can always add more later.
          </p>
        </FadeIn>

        <StaggerContainer step={70}>
          <div
            onClick={goToDukwiseCatalog}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
              borderRadius: 14, marginBottom: 10, cursor: 'pointer',
              background: 'linear-gradient(160deg, rgba(95,217,122,0.10), rgba(255,255,255,0.02))',
              border: '1px solid rgba(95,217,122,0.24)',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(95,217,122,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="search" size={19} color="#5FD97A" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>Add existing stock from Dukwise Catalog</p>
              <p style={{ fontSize: 10, color: 'var(--text-low)', marginTop: 2 }}>Select products, formats, prices and quantities quickly</p>
            </div>
            <Icon name="chevronRight" size={16} color="var(--text-low)" />
          </div>

        </StaggerContainer>

        <FadeIn delay={220} duration={280} y={10}>
          <p style={{ marginTop: 12, padding: '11px 12px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass-fill-soft)', fontSize: 10, lineHeight: 1.5, color: 'var(--text-low)', textAlign: 'center' }}>
            Add at least one stocked format to enter your dashboard. Your existing stock does not create a Cash Out or expense.
          </p>
        </FadeIn>
      </div>
    </div>
  )
}
