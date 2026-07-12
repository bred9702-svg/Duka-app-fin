import { supabase } from './supabase'

function pickAttribution(source = {}) {
  return {
    performed_by_user_id: source.performedByUserId || null,
    employee_id: source.employeeId || null,
    employee_name: source.employeeName || null,
    shop_id: source.shopId || null,
  }
}

// Applies an attribution-tagged update to a transaction. If the attribution
// columns aren't available yet (migration not applied), retries the same
// update without attribution instead of blocking the whole operation.
async function updateTransactionSafe(transactionId, basePayload, attribution, { select = true } = {}) {
  let query = supabase
    .from('transactions')
    .update({ ...basePayload, ...pickAttribution(attribution) })
    .eq('id', transactionId)
  if (select) query = query.select().single()
  const { data, error } = await query
  if (!error) return data

  console.error('Update transaction with attribution failed, retrying without attribution:', error)
  let retryQuery = supabase.from('transactions').update(basePayload).eq('id', transactionId)
  if (select) retryQuery = retryQuery.select().single()
  const retry = await retryQuery
  if (retry.error) throw retry.error
  return retry.data
}

// ── EMPLOYEES ─────────────────────────────────────────────────

export async function upsertEmployee({ employeeId, shopId, name, phone, inviteCode }) {
  if (!employeeId || !shopId) return null
  const { data, error } = await supabase
    .from('employees')
    .upsert(
      {
        employee_id: employeeId,
        shop_id: shopId,
        name: name || null,
        phone: phone || null,
        invite_code: inviteCode || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'employee_id' }
    )
    .select()
    .single()
  if (error) {
    console.error('Upsert employee failed:', error)
    return null
  }
  return data
}

export async function getEmployees(shopId) {
  if (!shopId) return []
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('shop_id', shopId)
    .order('joined_at', { ascending: false })
  if (error) {
    console.error('Get employees failed:', error)
    return []
  }
  return data || []
}

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

export async function addProduct({ name, category, costPrice, unitPrice, stockCurrent = 0, stockAlert = 5 }) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      category,
      cost_price: costPrice,
      unit_price: unitPrice,
      stock_current: stockCurrent,
      stock_alert: stockAlert,
      active: true,
    })
    .select()
    .single()
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

export async function addStock(productId, quantity) {
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('stock_current')
    .eq('id', productId)
    .single()
  if (fetchError) throw fetchError

  const newStock = (product.stock_current || 0) + quantity
  const { error } = await supabase
    .from('products')
    .update({ stock_current: newStock })
    .eq('id', productId)
  if (error) throw error
  return newStock
}

export async function updateProductPrice(productId, unitPrice) {
  const { error } = await supabase
    .from('products')
    .update({ unit_price: unitPrice })
    .eq('id', productId)
  if (error) throw error
  return unitPrice
}

export async function recordStockPurchase({
  items,
  supplier = null,
  purchaseDate = null,
  notes = null,
  linkedTransactionId = null,
}) {
  const { data, error } = await supabase.rpc('record_stock_purchase_atomic', {
    purchase_items: items,
    supplier_name: supplier || null,
    purchased_on: purchaseDate || new Date().toISOString().slice(0, 10),
    purchase_notes: notes || null,
    target_transaction_id: linkedTransactionId,
  })
  if (error) throw error
  return data
}

export async function completeSalePayment(transactionId, { items, grandTotal, totalProfit, customerId = null, ...attribution }) {
  const { data, error } = await supabase.rpc('finalize_sale_atomic', {
    target_transaction_id: transactionId,
    sale_items: items,
    target_customer_id: customerId,
  })
  if (error) throw error
  return data
}

export async function createDebtSale({ items, customerId }) {
  const { data, error } = await supabase.rpc('create_debt_sale_atomic', {
    sale_items: items,
    target_customer_id: customerId,
  })
  if (error) throw error
  return data
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

export async function addTransaction(txn, attribution = {}) {
  const now = new Date()
  const basePayload = {
    ...txn,
    day_of_week: now.getDay(),
    hour_of_day: now.getHours(),
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...basePayload, ...pickAttribution(attribution) })
    .select()
    .single()

  if (!error) return data

  // If the attribution columns aren't available yet (e.g. migration not
  // applied), never let that block Cash In / Cash Out — retry without
  // attribution so the transaction still gets recorded.
  console.error('Add transaction with attribution failed, retrying without attribution:', error)
  const retry = await supabase
    .from('transactions')
    .insert(basePayload)
    .select()
    .single()
  if (retry.error) throw retry.error
  return retry.data
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

export async function addDebtPayment(customerId, amount, paymentTransactionId = null, attribution = {}) {
  const { data, error } = await supabase.rpc('apply_debt_payment_atomic', {
    target_customer_id: customerId,
    payment_amount: Math.max(0, Number(amount) || 0),
    payment_transaction_id: paymentTransactionId,
  })
  if (error) throw error
  return data
}

export async function classifyTransaction(id, classification) {
  if (classification.type === 'debt_payment') {
    const { data: txn, error: txnError } = await supabase
      .from('transactions').select('amount').eq('id', id).single()
    if (txnError) throw txnError
    const result = await addDebtPayment(classification.customer_id, txn.amount, id)
    return {
      ...(result.paymentTransaction || {}),
      debtUpdates: result.debts || [],
      customerUpdate: result.customer,
    }
  }
  const { data, error } = await supabase.rpc('classify_transaction_atomic', {
    target_transaction_id: id,
    classification_type: classification.type,
    target_product_id: classification.product_id || null,
    requested_quantity: classification.quantity || null,
    expense_category_value: classification.category || null,
    target_customer_id: classification.customer_id || null,
  })
  if (error) throw error
  return {
    ...data.transaction,
    productUpdate: data.product,
    customerUpdate: data.customer,
  }
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
