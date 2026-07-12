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

export async function addProduct({ name, category, costPrice, unitPrice, stockCurrent = 0, stockAlert = 5 }) {
  const { data, error } = await supabase.rpc('create_shop_product', {
    product_name: name,
    product_category: category,
    product_cost_price: costPrice,
    product_unit_price: unitPrice,
    opening_stock: stockCurrent,
    low_stock_alert: stockAlert,
  })
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
  const { data, error } = await supabase.rpc('record_cash_transaction', {
    transaction_amount: txn.amount,
    transaction_source: txn.source,
    transaction_direction: txn.direction,
    sender_name: txn.mpesa_sender_name || null,
    sender_phone: txn.mpesa_sender_phone || null,
    external_reference: txn.mpesa_reference || null,
  })
  if (error) throw error
  return data
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

export async function addNewCustomer(name, phone) {
  const { data, error } = await supabase.rpc('create_shop_customer', {
    customer_name: name,
    customer_phone: phone || null,
    customer_mpesa_name: null,
  })
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
