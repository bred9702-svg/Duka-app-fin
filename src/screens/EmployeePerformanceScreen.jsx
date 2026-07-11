import { useState } from 'react'
import Icon from '../components/ui/Icon'
import SubScreenHeader from '../components/layout/SubScreenHeader'
import useAppStore from '../store/useAppStore'

function formatMoney(value) {
  return `KES ${Number(value || 0).toLocaleString()}`
}

function formatDate(value) {
  if (!value) return 'No activity yet'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No activity yet'

  return date.toLocaleString('en-KE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTransactionAmount(transaction) {
  return Number(transaction.total_price ?? transaction.amount ?? 0) || 0
}

function getEmployeeKey(transaction) {
  return (
    transaction.employee_id ||
    transaction.employeeId ||
    transaction.performed_by_user_id ||
    transaction.performedByUserId ||
    transaction.created_by ||
    transaction.createdBy ||
    transaction.user_id ||
    transaction.userId ||
    transaction.employee_name ||
    transaction.employeeName ||
    transaction.created_by_name ||
    transaction.createdByName ||
    transaction.user_name ||
    transaction.userName ||
    null
  )
}

function getEmployeeName(transaction, fallback) {
  return (
    transaction.employee_name ||
    transaction.employeeName ||
    transaction.created_by_name ||
    transaction.createdByName ||
    transaction.user_name ||
    transaction.userName ||
    transaction.employee?.name ||
    transaction.user?.name ||
    fallback
  )
}

function buildEmployeePerformance(transactions = []) {
  const employees = new Map()

  transactions.forEach((transaction) => {
    const employeeKey = getEmployeeKey(transaction)
    if (!employeeKey) return

    const employeeId = String(employeeKey)
    const existing = employees.get(employeeId) || {
      id: employeeId,
      name: getEmployeeName(transaction, `Employee ${employees.size + 1}`),
      totalSales: 0,
      revenueGenerated: 0,
      debtsCreated: 0,
      debtPaymentsCollected: 0,
      transactionCount: 0,
      lastActivity: null,
    }

    const amount = getTransactionAmount(transaction)
    const type = transaction.operation_type

    if (type === 'sale') {
      existing.totalSales += 1
      existing.revenueGenerated += amount
    }

    if (type === 'debt') {
      existing.debtsCreated += 1
    }

    if (type === 'debt_payment') {
      existing.debtPaymentsCollected += amount
    }

    existing.transactionCount += 1

    const activityDate = transaction.created_at || transaction.createdAt
    if (
      activityDate &&
      (!existing.lastActivity || new Date(activityDate).getTime() > new Date(existing.lastActivity).getTime())
    ) {
      existing.lastActivity = activityDate
    }

    employees.set(employeeId, existing)
  })

  return Array.from(employees.values()).sort((a, b) => {
    if (b.revenueGenerated !== a.revenueGenerated) return b.revenueGenerated - a.revenueGenerated
    if (b.totalSales !== a.totalSales) return b.totalSales - a.totalSales
    return b.transactionCount - a.transactionCount
  })
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: 14,
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            background: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={14} color={color} />
        </div>
        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-low)', fontWeight: 650 }}>
          {label}
        </p>
      </div>
      <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 750, color: 'var(--text-hi)' }}>
        {value}
      </p>
    </div>
  )
}

function EmployeeRankCard({ employee, rank, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '12px',
        borderRadius: 16,
        marginBottom: 10,
        cursor: 'pointer',
        background: rank === 1
          ? 'linear-gradient(160deg, rgba(240,169,61,.15), rgba(255,255,255,.03))'
          : 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: rank === 1 ? '1px solid rgba(240,169,61,.28)' : '1px solid var(--glass-border)',
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            background: rank === 1 ? 'rgba(240,169,61,.18)' : 'rgba(91,159,240,.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 800, color: rank === 1 ? '#F0A93D' : '#5B9FF0' }}>
            #{rank}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <p
              style={{
                flex: 1,
                minWidth: 0,
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 750,
                color: 'var(--text-hi)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {employee.name}
            </p>
            {rank === 1 && <Icon name="star" size={15} color="#F0A93D" />}
            <Icon
              name="chevronRight"
              size={14}
              color="var(--text-low)"
              style={{
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
                flexShrink: 0,
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <MiniStat label="Sales" value={employee.totalSales} />
            <MiniStat label="Revenue" value={formatMoney(employee.revenueGenerated)} />
          </div>

          {expanded && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <MiniStat label="Transactions" value={employee.transactionCount} />
              <MiniStat label="Debts" value={employee.debtsCreated} />
              <MiniStat label="Debt paid" value={formatMoney(employee.debtPaymentsCollected)} />
              <MiniStat label="Last activity" value={formatDate(employee.lastActivity)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div
      style={{
        padding: '8px',
        borderRadius: 10,
        background: 'rgba(255,255,255,.035)',
        border: '1px solid rgba(255,255,255,.05)',
      }}
    >
      <p style={{ margin: 0, fontSize: 8, color: 'var(--text-low)', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </p>
      <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-hi)', fontWeight: 700, wordBreak: 'break-word' }}>
        {value}
      </p>
    </div>
  )
}

export default function EmployeePerformanceScreen() {
  const transactions = useAppStore((s) => s.transactions)
  const employees = buildEmployeePerformance(transactions)
  const topEmployee = employees[0] || null
  const [expandedId, setExpandedId] = useState(null)

  const totalEmployeeSales = employees.reduce((sum, employee) => sum + employee.totalSales, 0)
  const totalEmployeeRevenue = employees.reduce((sum, employee) => sum + employee.revenueGenerated, 0)
  const totalEmployeeTransactions = employees.reduce((sum, employee) => sum + employee.transactionCount, 0)

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 100px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 150, height: 150, top: -30, right: -24, background: 'rgba(91,159,240,.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Employee Performance" />

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
              <Icon name="barChart" size={20} color="#5B9FF0" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 750, color: 'var(--text-hi)' }}>
                Team performance
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-low)', lineHeight: 1.45 }}>
                Built only from existing employee-attributed transaction data.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <StatCard icon="users" label="Employees" value={employees.length} color="#5B9FF0" />
          <StatCard icon="cash" label="Revenue" value={formatMoney(totalEmployeeRevenue)} color="#5FD97A" />
          <StatCard icon="bag" label="Sales" value={totalEmployeeSales} color="#F0A93D" />
          <StatCard icon="receiptOff" label="Transactions" value={totalEmployeeTransactions} color="#FF6B5B" />
        </div>

        {topEmployee && (
          <div
            style={{
              padding: 14,
              borderRadius: 16,
              marginBottom: 14,
              background: 'linear-gradient(160deg, rgba(240,169,61,.16), rgba(255,255,255,.03))',
              border: '1px solid rgba(240,169,61,.28)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: 'rgba(240,169,61,.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name="star" size={17} color="#F0A93D" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-low)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  Top-performing employee
                </p>
                <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--text-hi)', fontWeight: 750 }}>
                  {topEmployee.name}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-low)' }}>
                  {formatMoney(topEmployee.revenueGenerated)} revenue · {topEmployee.totalSales} sale{topEmployee.totalSales === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>
        )}

        <p
          style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 750,
            color: 'var(--text-hi)',
          }}
        >
          Ranking
        </p>

        {employees.length === 0 ? (
          <div
            style={{
              padding: '28px 16px',
              borderRadius: 16,
              textAlign: 'center',
              background: 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <Icon name="users" size={32} color="#5B9FF0" />
            <p style={{ margin: '12px 0 4px', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 750, color: 'var(--text-hi)' }}>
              No employee performance yet
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-low)', lineHeight: 1.5 }}>
              Existing transactions do not contain employee attribution yet. Once employee-attributed transactions exist, their performance will appear here.
            </p>
          </div>
        ) : (
          employees.map((employee, index) => (
            <EmployeeRankCard
              key={employee.id}
              employee={employee}
              rank={index + 1}
              expanded={expandedId === employee.id}
              onToggle={() => setExpandedId((current) => (current === employee.id ? null : employee.id))}
            />
          ))
        )}
      </div>
    </div>
  )
}
