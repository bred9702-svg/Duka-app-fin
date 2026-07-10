import { useState } from 'react'
import Icon from '../components/ui/Icon'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import useAppStore from '../store/useAppStore'
import {
  buildEmployeeInviteLink,
  createEmployeeInvite,
  getEmployeeInvites,
} from '../utils/employeeInvitations'

function InviteInfo({ label, value }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 8,
      }}
    >
      <p style={{ margin: 0, fontSize: 9, color: 'var(--text-low)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-hi)', fontWeight: 650, wordBreak: 'break-all' }}>
        {value}
      </p>
    </div>
  )
}

export default function EmployeesScreen() {
  const session = useAppStore((s) => s.session)
  const [invite, setInvite] = useState(() => getEmployeeInvites()[0] || null)
  const [copied, setCopied] = useState(false)

  function createInvite() {
    const nextInvite = createEmployeeInvite({
      shopName: session?.shopName,
      ownerName: session?.name,
    })

    setInvite(nextInvite)
    setCopied(false)
  }

  async function copyInvite() {
    if (!invite) return

    const link = invite.link || buildEmployeeInviteLink(invite.code)
    const text = `Join ${invite.shopName || 'my Duka shop'} using this invitation code: ${invite.code}\n${link}`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  async function shareInvite() {
    if (!invite || !navigator.share) return

    await navigator.share({
      title: 'Duka Employee Invitation',
      text: `Join ${invite.shopName || 'my Duka shop'} using invitation code ${invite.code}`,
      url: invite.link || buildEmployeeInviteLink(invite.code),
    })
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(91,159,240,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Employees" />

        <div
          style={{
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
            background: 'linear-gradient(160deg, rgba(91,159,240,.14), rgba(255,255,255,.03))',
            border: '1px solid rgba(91,159,240,.24)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                background: 'rgba(91,159,240,.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="users" size={20} color="#5B9FF0" />
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-hi)' }}>
                Invite your first employee
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-low)', lineHeight: 1.45 }}>
                Generate a code or link to share with an employee. Registration and permissions will be added later.
              </p>
            </div>
          </div>
        </div>

        {!invite ? (
          <div
            style={{
              padding: '24px 16px',
              borderRadius: 16,
              textAlign: 'center',
              background: 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <Icon name="users" size={30} color="#5B9FF0" />
            <p style={{ margin: '12px 0 4px', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>
              No employees invited yet
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5 }}>
              Tap below to create a unique invitation code for your shop.
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: 12,
              borderRadius: 16,
              background: 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <InviteInfo label="Shop" value={invite.shopName || 'Duka Shop'} />
            <InviteInfo label="Invitation code" value={invite.code} />
            <InviteInfo label="Invitation link" value={invite.link || buildEmployeeInviteLink(invite.code)} />

            <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--text-low)', lineHeight: 1.5 }}>
              This only creates an invitation. Employee registration, permissions, and analytics are not active yet.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={createInvite}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '12px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.35)',
            background: 'linear-gradient(135deg, #7DB7FF 0%, #5B9FF0 100%)',
            color: '#06121F',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Icon name="plus" size={15} color="#06121F" />
          {invite ? 'Generate New Invite' : 'Invite Employee'}
        </button>

        {invite && (
          <div style={{ display: 'grid', gridTemplateColumns: navigator.share ? '1fr 1fr' : '1fr', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={copyInvite}
              style={{
                padding: '11px',
                borderRadius: 12,
                border: '1px solid rgba(95,217,122,0.25)',
                background: 'rgba(95,217,122,0.08)',
                color: '#5FD97A',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                fontWeight: 650,
              }}
            >
              {copied ? 'Copied!' : 'Copy Invitation'}
            </button>

            {navigator.share && (
              <button
                type="button"
                onClick={shareInvite}
                style={{
                  padding: '11px',
                  borderRadius: 12,
                  border: '1px solid rgba(240,169,61,0.25)',
                  background: 'rgba(240,169,61,0.08)',
                  color: '#F0A93D',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  fontWeight: 650,
                }}
              >
                Share Invitation
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
