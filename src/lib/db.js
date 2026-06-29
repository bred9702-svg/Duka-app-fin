import { supabase } from './supabase'

// ── PRODUCTS ──────────────────────────────────────────────────

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('category')
    .order('name')
  if (error) throw error
  return data
}

export async function searchProducts(query) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .ilike('name', `%${query}%`)
    .order('name')
  if (error) throw error
  return data
}

export async function updateStock(productId, quantity) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock_current')
    .eq('id', productId)
    .single()
  if (fetchError) throw fetchError

  const newStock = product.stock_current - quantity
  const { error } = await supabase
    .from('products')
    .update({ stock_current: newStock })
    .eq('id', productId)
  if (error) throw error
  return newStock
}

// ── TRANSACTIONS ──────────────────────────────────────────────

export async function getTransactions(limit = 50) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      product:products(id, name, category, unit_price),
      customer:customers(id, name, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function addTransaction(txn) {
  const now = new Date()
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...txn,
      day_of_week: now.getDay(),
      hour_of_day: now.getHours(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

async function recalculateCustomerDebt(customerId) {
  const { data: activeDebts, error: debtError } = await supabase
    .from('transactions')
    .select('remaining_amount')
    .eq('customer_id', customerId)
    .eq('is_debt', true)
    .gt('remaining_amount', 0)
  if (debtError) throw debtError

  const totalOwed = (activeDebts || []).reduce(
    (sum, debt) => sum + (Number(debt.remaining_amount) || 0),
    0
  )

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .update({ total_owed: totalOwed })
    .eq('id', customerId)
    .select()
    .single()
  if (customerError) throw customerError
  return customer
}

export async function addDebtPayment(customerId, amount, paymentTransactionId = null) {
  const paymentAmount = Math.max(0, Number(amount) || 0)
  let unapplied = paymentAmount
  const updatedDebts = []
  const now = new Date().toISOString()

  const { data: debts, error: debtsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_debt', true)
    .gt('remaining_amount', 0)
    .order('created_at', { ascending: true })
  if (debtsError) throw debtsError

  for (const debt of debts || []) {
    if (unapplied <= 0) break

    const currentRemaining = Number(debt.remaining_amount) || 0
    const applied = Math.min(unapplied, currentRemaining)
    const remaining = Math.max(0, currentRemaining - applied)
    const original = Number(debt.original_amount ?? debt.total_price ?? debt.amount ?? currentRemaining) || 0
    const paid = Math.max(0, original - remaining)

    const { data: updatedDebt, error: updateError } = await supabase
      .from('transactions')
      .update({
        original_amount: original,
        paid_amount: paid,
        remaining_amount: remaining,
        debt_status: remaining === 0 ? 'closed' : 'active',
        closed_at: remaining === 0 ? now : null,
      })
      .eq('id', debt.id)
      .select()
      .single()
    if (updateError) throw updateError

    updatedDebts.push(updatedDebt)
    unapplied -= applied
  }

  if (paymentTransactionId) {
    const { error: paymentError } = await supabase
      .from('transactions')
      .update({
        classified: true,
        operation_type: 'debt_payment',
        customer_id: customerId,
        is_debt: false,
        remaining_amount: 0,
        paid_amount: paymentAmount - unapplied,
        debt_status: 'payment',
      })
      .eq('id', paymentTransactionId)
    if (paymentError) throw paymentError
  }

  const customer = await recalculateCustomerDebt(customerId)
  return { customer, debts: updatedDebts, unapplied }
}

export async function classifyTransaction(id, classification) {
  const { data: txn, error: txnError } = await supabase
    .from('transactions')
    .select('amount, direction')
    .eq('id', id)
    .single()
  if (txnError) throw txnError

  if (classification.type === 'debt_payment') {
    const result = await addDebtPayment(classification.customer_id, txn.amount, id)
    const { data: payment, error: paymentFetchError } = await supabase
      .from('transactions')
      .select()
      .eq('id', id)
      .single()
    if (paymentFetchError) throw paymentFetchError
    return { ...payment, debtUpdates: result.debts, customerUpdate: result.customer }
  }

  let profit = null
  let total_price = null
  let stock_after = null

  if (
    (classification.type === 'sale' || classification.type === 'debt') &&
    classification.product_id
  ) {
    const { data: product } = await supabase
      .from('products')
      .select('unit_price, cost_price, stock_current')
      .eq('id', classification.product_id)
      .single()

    if (product) {
      const qty = classification.quantity || 1
      total_price = product.unit_price * qty
      profit = (product.unit_price - product.cost_price) * qty
      stock_after = await updateStock(classification.product_id, qty)
    }
  }

  const debtOriginal = classification.type === 'debt' ? total_price ?? txn.amount : null

  const { data, error } = await supabase
    .from('transactions')
    .update({
      classified: true,
      operation_type: classification.type,
      product_id: classification.product_id || null,
      quantity: classification.quantity || null,
      expense_category: classification.category || null,
      customer_id: classification.customer_id || null,
      unit_price: classification.unit_price || null,
      total_price,
      profit,
      stock_after,
      is_debt: classification.type === 'debt',
      original_amount: debtOriginal,
      paid_amount: 0,
      remaining_amount: classification.type === 'debt' ? debtOriginal : 0,
      debt_status: classification.type === 'debt' ? 'active' : null,
      closed_at: null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  if (classification.type === 'debt' && classification.customer_id) {
    const customer = await recalculateCustomerDebt(classification.customer_id)
    return { ...data, customerUpdate: customer }
  }

  return data
}

// ── CUSTOMERS ─────────────────────────────────────────────────

export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('total_owed', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertCustomer(phone, name, mpesaName) {
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('customers')
      .update({
        visit_count: existing.visit_count + 1,
        last_seen: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name,
      phone,
      mpesa_name: mpesaName,
      visit_count: 1,
      last_seen: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function increaseDebt(customerId, amount) {
  const { data: customer } = await supabase
    .from('customers')
    .select('total_owed')
    .eq('id', customerId)
    .single()

  const { data, error } = await supabase
    .from('customers')
    .update({ total_owed: customer.total_owed + amount })
    .eq('id', customerId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addNewCustomer(name, phone) {
  const { data, error } = await supabase
    .from('customers')
    .insert({ name, phone, total_owed: 0, visit_count: 0 })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── ANALYTICS ─────────────────────────────────────────────────

export async function getTodayStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, direction, operation_type, profit, classified')
    .gte('created_at', today.toISOString())
  if (error) throw error

  // Revenus = uniquement les ventes classifiées (direction in, type sale)
  const income = data
    .filter(t => 
      t.direction === 'in' && 
      t.classified && 
      t.operation_type === 'sale'
    )
    .reduce((a, t) => a + t.amount, 0)

  // Dépenses = uniquement les sorties classifiées comme expense
  const expenses = data
    .filter(t => 
      t.direction === 'out' && 
      t.classified && 
      t.operation_type === 'expense'
    )
    .reduce((a, t) => a + t.amount, 0)

  // Profit = somme des profits calculés sur les ventes
  const profit = data
    .filter(t => t.profit !== null && t.operation_type === 'sale')
    .reduce((a, t) => a + (t.profit || 0), 0)

  // Non classifiées = toutes directions confondues
  const unclassified = data.filter(t => !t.classified).length

  return { income, expenses, profit, unclassified }
}

export async function getTopProducts(days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('transactions')
    .select('product_id, quantity, profit, product:products(name, category)')
    .eq('operation_type', 'sale')
    .gte('created_at', since.toISOString())
    .not('product_id', 'is', null)
  if (error) throw error
  return data
}

export async function getSalesByHour() {
  const { data, error } = await supabase
    .from('transactions')
    .select('hour_of_day, amount')
    .eq('operation_type', 'sale')
  if (error) throw error
  return data
}

export async function getSalesByDay() {
  const { data, error } = await supabase
    .from('transactions')
    .select('day_of_week, amount')
    .eq('operation_type', 'sale')
  if (error) throw error
  return data
}
