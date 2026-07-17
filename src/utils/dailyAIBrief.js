import { fmtKES } from './formatters'
import { getBestSeller, getLowStock, getOutOfStock } from './inventoryEngine'
import { getJoinedEmployees } from './employeeInvitations'

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function getTransactionTime(transaction, fallback = Date.now()) {
  return new Date(transaction.created_at || transaction.ts || fallback).getTime()
}

function isToday(transaction, now = new Date()) {
  const date = new Date(getTransactionTime(transaction, now.getTime()))

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function getTransactionAmount(transaction) {
  return Number(transaction.total_price || transaction.amount || 0)
}

function getSaleAmount(transaction) {
  return Number(transaction.total_price || transaction.amount || 0)
}

function getExpenseAmount(transaction) {
  return Number(transaction.amount || transaction.total_price || 0)
}

function getCustomerDebt(customer) {
  return Number(customer.total_owed || customer.totalOwed || 0)
}

function getTransactionEmployeeId(transaction) {
  return (
    transaction.employee_id ||
    transaction.employeeId ||
    transaction.performed_by_user_id ||
    transaction.performedByUserId ||
    null
  )
}

function getTransactionEmployeeName(transaction, fallback = 'Employee') {
  return (
    transaction.employee_name ||
    transaction.employeeName ||
    transaction.employee?.name ||
    transaction.performed_by_user_name ||
    transaction.performedByUserName ||
    fallback
  )
}

function buildEmployeePerformance(transactions = [], joinedEmployees = []) {
  const employees = new Map()

  joinedEmployees.forEach((employee, index) => {
    const employeeId = String(
      employee.employeeId ||
        employee.employee_id ||
        employee.phone ||
        employee.name ||
        `employee-${index + 1}`
    )

    employees.set(employeeId, {
      id: employeeId,
      name: employee.name || employee.employeeName || `Employee ${index + 1}`,
      salesCount: 0,
      revenue: 0,
      debtPayments: 0,
    })
  })

  transactions.forEach((transaction) => {
    const employeeKey = getTransactionEmployeeId(transaction)
    if (!employeeKey) return

    const employeeId = String(employeeKey)
    const existing = employees.get(employeeId) || {
      id: employeeId,
      name: getTransactionEmployeeName(transaction, `Employee ${employees.size + 1}`),
      salesCount: 0,
      revenue: 0,
      debtPayments: 0,
    }

    if (transaction.operation_type === 'sale') {
      existing.salesCount += 1
      existing.revenue += getSaleAmount(transaction)
    }

    if (transaction.operation_type === 'debt_payment') {
      existing.debtPayments += getTransactionAmount(transaction)
    }

    employees.set(employeeId, existing)
  })

  return Array.from(employees.values()).sort((a, b) => {
    if (b.revenue !== a.revenue) return b.revenue - a.revenue
    return b.salesCount - a.salesCount
  })
}

function summarizeBestSeller(bestSeller) {
  if (!bestSeller) {
    return {
      label: 'No sales yet',
      detail: 'Log product sales to identify today’s best seller.',
    }
  }

  return {
    label: bestSeller.name,
    detail: `${bestSeller.sold} unit(s) sold.`,
  }
}

function summarizeLowStock(products = []) {
  if (!products.length) {
    return {
      count: 0,
      label: 'No low-stock products',
      detail: 'Stock levels look healthy right now.',
      products: [],
    }
  }

  const visibleProducts = products.slice(0, 3)
  const names = visibleProducts.map((product) => product.name).join(', ')
  const remaining = products.length - visibleProducts.length

  return {
    count: products.length,
    label: `${products.length} product(s) need attention`,
    detail: `${names}${remaining > 0 ? ` and ${remaining} more` : ''}.`,
    products,
  }
}

function summarizeOutstandingDebts(customers = []) {
  const debtors = customers
    .map((customer) => ({
      ...customer,
      debt: getCustomerDebt(customer),
    }))
    .filter((customer) => customer.debt > 0)
    .sort((a, b) => b.debt - a.debt)

  const total = debtors.reduce((sum, customer) => sum + customer.debt, 0)
  const topDebtor = debtors[0] || null

  if (!topDebtor) {
    return {
      total,
      count: 0,
      label: 'No outstanding debts',
      detail: 'All customer debts are cleared.',
      topDebtor: null,
    }
  }

  return {
    total,
    count: debtors.length,
    label: `${fmtKES(total)} KES outstanding`,
    detail: `${topDebtor.name || 'Top customer'} owes ${fmtKES(topDebtor.debt)} KES.`,
    topDebtor,
  }
}

function summarizeEmployeePerformance(employeePerformance = []) {
  if (!employeePerformance.length) {
    return {
      exists: false,
      label: 'No employee data yet',
      detail: 'Employee performance will appear once employee-attributed transactions exist.',
      topEmployee: null,
    }
  }

  const topEmployee = employeePerformance[0]

  return {
    exists: true,
    label: topEmployee.name,
    detail:
      topEmployee.salesCount > 0
        ? `${topEmployee.salesCount} sale(s), ${fmtKES(topEmployee.revenue)} KES revenue.`
        : 'No employee-attributed sales today yet.',
    topEmployee,
  }
}

function getPriorityRecommendation({
  todaySales,
  todayExpenses,
  estimatedProfit,
  outOfStock,
  lowStock,
  outstandingDebts,
  bestSeller,
}) {
  if (outOfStock.length > 0) {
    return {
      title: `Restock ${outOfStock[0].name} today`,
      detail: 'This product is out of stock, so it may be costing you sales.',
      tone: 'urgent',
    }
  }

  if (lowStock.length > 0) {
    return {
      title: `Reorder ${lowStock[0].name}`,
      detail: 'Stock is running low. Reordering today can prevent missed sales.',
      tone: 'warning',
    }
  }

  if (outstandingDebts.topDebtor) {
    return {
      title: `Follow up with ${outstandingDebts.topDebtor.name}`,
      detail: `${fmtKES(outstandingDebts.topDebtor.debt)} KES is outstanding from this customer.`,
      tone: 'info',
    }
  }

  if (todaySales <= 0) {
    return {
      title: 'Record your first sale today',
      detail: 'No sales are logged yet today. Start by recording each sale as it happens.',
      tone: 'info',
    }
  }

  if (estimatedProfit < 0) {
    return {
      title: 'Review today’s expenses',
      detail: 'Expenses are higher than sales today. Check whether any cost can be delayed or reduced.',
      tone: 'warning',
    }
  }

  if (bestSeller) {
    return {
      title: `Promote ${bestSeller.name}`,
      detail: 'It is your strongest product. Keep it visible to maintain momentum.',
      tone: 'positive',
    }
  }

  return {
    title: 'Keep tracking today’s activity',
    detail: 'Your business looks steady. Continue recording sales, expenses, stock, and debts.',
    tone: 'positive',
  }
}

function createDailyBrief({ products = [], transactions = [], customers = [], now = new Date() }) {
  const todayTransactions = transactions.filter((transaction) => isToday(transaction, now))

  const todaySalesTransactions = todayTransactions.filter(
    (transaction) => transaction.operation_type === 'sale'
  )

  const todayExpenseTransactions = todayTransactions.filter(
    (transaction) => transaction.operation_type === 'expense'
  )

  const todaySales = todaySalesTransactions.reduce(
    (sum, transaction) => sum + getSaleAmount(transaction),
    0
  )

  const todayExpenses = todayExpenseTransactions.reduce(
    (sum, transaction) => sum + getExpenseAmount(transaction),
    0
  )

  const recordedProfit = todaySalesTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.profit || 0),
    0
  )

  const hasRecordedProfit = todaySalesTransactions.some(
    (transaction) => transaction.profit !== null && transaction.profit !== undefined
  )
  const estimatedProfit = hasRecordedProfit ? recordedProfit : todaySales - todayExpenses

  const bestSeller = getBestSeller(products, todaySalesTransactions)
  const lowStock = getLowStock(products)
  const outOfStock = getOutOfStock(products)
  const stockAlerts = [...outOfStock, ...lowStock.filter((product) => !outOfStock.includes(product))]

  const joinedEmployees = getJoinedEmployees()
  const employeePerformance = buildEmployeePerformance(todayTransactions, joinedEmployees)

  const bestSellerSummary = summarizeBestSeller(bestSeller)
  const lowStockSummary = summarizeLowStock(stockAlerts)
  const outstandingDebts = summarizeOutstandingDebts(customers)
  const employeeSummary = summarizeEmployeePerformance(employeePerformance)

  const recommendation = getPriorityRecommendation({
    todaySales,
    todayExpenses,
    estimatedProfit,
    outOfStock,
    lowStock,
    outstandingDebts,
    bestSeller,
  })

  return {
    id: `daily-ai-brief-${getTodayKey(now)}`,
    date: getTodayKey(now),
    generatedAt: now.toISOString(),
    todaySales,
    todayExpenses,
    estimatedProfit,
    bestSellingProduct: bestSellerSummary,
    lowStockProducts: lowStockSummary,
    outstandingDebts,
    employeePerformance: employeeSummary,
    recommendation,
  }
}

export function getDailyAIBrief({ products = [], transactions = [], customers = [], now = new Date() }) {
  return createDailyBrief({
    products,
    transactions,
    customers,
    now,
  })
}
