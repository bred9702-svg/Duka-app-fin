import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import useAppStore from '../../store/useAppStore'
import FadeIn from '../../components/animation/FadeIn'
import { normalizeInviteCode, previewEmployeeInvitation } from '../../lib/invitations'

export default function SignInScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const signIn = useAppStore((s) => s.signIn)
  const registerEmployee = useAppStore((s) => s.registerEmployee)

  const inviteFromLink = normalizeInviteCode(searchParams.get('invite') || '')
  const startsInJoinMode = searchParams.get('mode') === 'join' || Boolean(inviteFromLink)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState(startsInJoinMode ? 'employee' : 'owner')
  const [inviteCode, setInviteCode] = useState(inviteFromLink)
  const [inviteError, setInviteError] = useState('')
  const [validatedInvite, setValidatedInvite] = useState(null)
  const [employeeName, setEmployeeName] = useState('')
  const [employeePhone, setEmployeePhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  const shouldCheckEmail = searchParams.get('checkEmail') === '1'
  const emailConfirmed = searchParams.get('confirmed') === '1'
  const isJoinMode = role === 'employee'
  const isConfirmedJoin = isJoinMode && emailConfirmed
  const isCreatingEmployeeProfile = isJoinMode && Boolean(validatedInvite)
  const canSubmit = isCreatingEmployeeProfile
    ? isConfirmedJoin
      ? email.trim().length > 0 && password.length >= 8 && !submitting
      : employeeName.trim().length > 0 && employeePhone.trim().length > 0 && email.trim().length > 0 && password.length >= 8 && password === confirmPassword && !submitting
    : isJoinMode
      ? inviteCode.trim().length > 0
      : email.trim().length > 0 && password.length >= 8 && !submitting

  async function handleContinue() {
    if (!canSubmit) return
    setAuthError('')

    if (isJoinMode) {
      if (!validatedInvite) {
        try {
          const invite = await previewEmployeeInvitation(inviteCode)
          setValidatedInvite(invite)
          setInviteError('')
        } catch {
          setInviteError('Invalid invitation code. Ask the shop owner to send a new invite.')
        }
        return
      }

      const normalizedCode = normalizeInviteCode(validatedInvite.code || inviteCode)
      setSubmitting(true)
      try {
        if (isConfirmedJoin) {
          await signIn({ email: email.trim(), password, role: 'employee', inviteCode: normalizedCode })
          navigate('/', { replace: true })
        } else {
          await registerEmployee({ name: employeeName.trim(), email: email.trim(), phone: employeePhone.trim(), password, inviteCode: normalizedCode })
          navigate(`/sign-in?mode=join&invite=${encodeURIComponent(normalizedCode)}&checkEmail=1`, { replace: true })
        }
      } catch (error) {
        setAuthError(error?.message || 'Unable to continue right now.')
        setSubmitting(false)
      }
      return
    }

    setSubmitting(true)
    try {
      const result = await signIn({ email: email.trim(), password, role })
      navigate(result?.session?.isOnboarded === false ? '/setup-inventory' : '/', { replace: true })
    } catch (error) {
      setAuthError(error?.message || 'Unable to sign in right now.')
      setSubmitting(false)
    }
  }

  function updateInviteCode(value) {
    setInviteCode(value)
    setInviteError('')
    setValidatedInvite(null)
  }

  function switchRole(nextRole) {
    setRole(nextRole)
    setInviteError('')
    setValidatedInvite(null)
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '20px 20px 32px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 180, height: 180, top: -40, right: -40, background: 'rgba(240,169,61,0.14)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 32, height: 32, borderRadius: 10, border: '1px solid var(--glass-border)',
            background: 'var(--glass-fill-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginBottom: 24,
          }}
        >
          <Icon name="arrowLeft" size={16} color="var(--text-hi)" />
        </button>

        <FadeIn duration={280} y={12}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {isCreatingEmployeeProfile ? 'Create your profile' : isJoinMode ? 'Join a shop' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-low)', marginBottom: 24 }}>
            {isCreatingEmployeeProfile
              ? `Tell ${validatedInvite?.shopName || 'the shop'} who is joining`
              : isJoinMode
                ? 'Enter the invitation code shared by the shop owner'
                : 'Sign in to continue to your shop'}
          </p>
        </FadeIn>

        <FadeIn delay={60} duration={280} y={12}>
          {!isJoinMode && (
            <>
              {shouldCheckEmail && (
                <div style={{ padding: '11px 12px', borderRadius: 12, background: 'rgba(91,159,240,.1)', border: '1px solid rgba(91,159,240,.28)', marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#7DB7FF', lineHeight: 1.5 }}>
                    Check your email to confirm your Duka account before signing in.
                  </p>
                </div>
              )}
              {emailConfirmed && (
                <div style={{ padding: '11px 12px', borderRadius: 12, background: 'rgba(95,217,122,.08)', border: '1px solid rgba(95,217,122,.24)', marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#5FD97A', lineHeight: 1.5 }}>
                    Email confirmed. Sign in to finish setting up your shop.
                  </p>
                </div>
              )}

              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Email Address</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: '100%', background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
                  borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)',
                  fontFamily: 'inherit', outline: 'none', marginBottom: 14,
                }}
              />

              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Password</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                style={{
                  width: '100%', background: 'var(--glass-fill-soft)', border: authError ? '1px solid rgba(255,107,91,.55)' : '1px solid var(--glass-border)',
                  borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)',
                  fontFamily: 'inherit', outline: 'none', marginBottom: authError ? 6 : 14,
                }}
              />

              {authError && (
                <p style={{ margin: '0 0 12px', fontSize: 11, color: '#FF6B5B', lineHeight: 1.45 }}>
                  {authError}
                </p>
              )}

              <p style={{ margin: '0 0 14px', fontSize: 10, color: 'var(--text-low)' }}>
                Forgot your password? Contact Duka support on WhatsApp.
              </p>
            </>
          )}

          {isJoinMode && !validatedInvite && (
            <>
              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Invitation Code</p>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => updateInviteCode(e.target.value)}
                placeholder="DUKA-XXXXXX"
                autoCapitalize="characters"
                style={{
                  width: '100%', background: 'var(--glass-fill-soft)', border: inviteError ? '1px solid rgba(255,107,91,0.55)' : '1px solid var(--glass-border)',
                  borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)',
                  fontFamily: 'var(--font-display)', outline: 'none', marginBottom: inviteError ? 6 : 14,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}
              />
              {inviteError && (
                <p style={{ margin: '0 0 14px', fontSize: 11, color: '#FF6B5B', lineHeight: 1.45 }}>
                  {inviteError}
                </p>
              )}
            </>
          )}

          {isCreatingEmployeeProfile && (
            <>
              <div
                style={{
                  padding: '11px 12px',
                  borderRadius: 12,
                  background: 'rgba(95,217,122,0.08)',
                  border: '1px solid rgba(95,217,122,0.22)',
                  marginBottom: 14,
                }}
              >
                <p style={{ margin: 0, fontSize: 10, color: '#5FD97A', fontWeight: 700 }}>
                  Invitation accepted
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-low)' }}>
                  Joining {validatedInvite?.shopName || 'Duka Shop'} as an employee.
                </p>
              </div>

              {!isConfirmedJoin && <><p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Full Name</p><input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Your full name"
                style={{
                  width: '100%', background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
                  borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)',
                  fontFamily: 'inherit', outline: 'none', marginBottom: 14,
                }}
              /></>}

              {!isConfirmedJoin && <><p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Phone Number</p>
              <input
                type="tel"
                value={employeePhone}
                onChange={(e) => setEmployeePhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                style={{
                  width: '100%', background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)',
                  borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)',
                  fontFamily: 'inherit', outline: 'none', marginBottom: 14,
                }}
              /></>}

              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Email Address</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={{ width: '100%', background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)', fontFamily: 'inherit', outline: 'none', marginBottom: 14 }} />
              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 5, fontWeight: 500 }}>Password</p>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={isConfirmedJoin ? 'current-password' : 'new-password'} style={{ width: '100%', background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)', fontFamily: 'inherit', outline: 'none', marginBottom: 14 }} />
              {!isConfirmedJoin && <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" autoComplete="new-password" style={{ width: '100%', background: 'var(--glass-fill-soft)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '11px 12px', fontSize: 13, color: 'var(--text-hi)', fontFamily: 'inherit', outline: 'none', marginBottom: 14 }} />}
              {authError && <p style={{ margin: '0 0 12px', fontSize: 11, color: '#FF6B5B' }}>{authError}</p>}
            </>
          )}

          {!isJoinMode && (
            <button
              disabled
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px', borderRadius: 10, border: '1px solid var(--glass-border)',
                background: 'var(--faint-fill)', cursor: 'default', marginBottom: 20,
                fontSize: 12, fontWeight: 600, color: 'var(--text-low)', opacity: 0.6,
              }}
            >
              <Icon name="circleCheck" size={14} color="var(--text-low)" />
              Continue with Google
              <span style={{
                marginLeft: 4, fontSize: 8, fontWeight: 700, padding: '2px 6px',
                background: 'var(--glass-fill-soft)', color: 'var(--text-low)', letterSpacing: '.03em',
              }}>
                COMING SOON
              </span>
            </button>
          )}

          {!isCreatingEmployeeProfile && (
            <>
              <p style={{ fontSize: 9, color: 'var(--text-low)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {isJoinMode ? 'Joining as' : 'Signing in as'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {[
                  { id: 'owner', label: 'Owner', icon: 'store' },
                  { id: 'employee', label: 'Employee', icon: 'users' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => switchRole(r.id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', borderRadius: 10, cursor: 'pointer',
                      background: role === r.id ? 'rgba(240,169,61,0.14)' : 'var(--glass-fill-soft)',
                      border: role === r.id ? '1.5px solid rgba(240,169,61,0.45)' : '1px solid var(--glass-border)',
                    }}
                  >
                    <Icon name={r.icon} size={14} color={role === r.id ? '#F0A93D' : 'var(--text-low)'} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: role === r.id ? '#F0A93D' : 'var(--text-low)' }}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </FadeIn>

        <FadeIn delay={140} duration={280} y={10}>
          <button
            onClick={handleContinue}
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'var(--font-display)',
              fontSize: 14, fontWeight: 700, color: '#0F1117', background: '#F0A93D',
              opacity: canSubmit ? 1 : 0.4, transition: 'opacity 200ms ease',
            }}
          >
            {isCreatingEmployeeProfile ? (submitting ? 'Please wait...' : isConfirmedJoin ? 'Join Shop' : 'Create Employee Account') : isJoinMode ? 'Continue' : submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </FadeIn>
      </div>
    </div>
  )
}
