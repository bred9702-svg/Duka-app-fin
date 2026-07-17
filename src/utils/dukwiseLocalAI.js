import { fmtKES } from './formatters'
import {
  getBestSeller,
  getDeadStock,
  getLowStock,
  getOutOfStock,
  getRestockSuggestions,
} from './inventoryEngine'

const DAY_MS = 24 * 60 * 60 * 1000

function amount(transaction) {
  return Number(transaction.total_price || transaction.amount || 0)
}

function timestamp(transaction, fallback = Date.now()) {
  const value = new Date(transaction.created_at || transaction.ts || fallback).getTime()
  return Number.isFinite(value) ? value : fallback
}

function sum(items, getter) {
  return items.reduce((total, item) => total + getter(item), 0)
}

function percentageDelta(current, previous) {
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : null
}

function normalizeQuestion(question) {
  return String(question || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function containsAny(question, terms) {
  return terms.some((term) => question.includes(term))
}

function productSalesMap(transactions) {
  const map = new Map()
  transactions.forEach((transaction) => {
    if (transaction.operation_type !== 'sale' || !transaction.product_id) return
    const current = map.get(transaction.product_id) || { units: 0, revenue: 0, profit: 0 }
    current.units += Number(transaction.quantity || 1)
    current.revenue += amount(transaction)
    current.profit += Number(transaction.profit || 0)
    map.set(transaction.product_id, current)
  })
  return map
}

function findActualBundle(products, bestSeller) {
  const mixerWords = ['tonic', 'soda', 'coke', 'cola', 'juice', 'water', 'energy', 'sprite', 'fanta']
  const spiritWords = ['gin', 'vodka', 'whisky', 'whiskey', 'rum', 'tequila', 'brandy', 'cognac']
  const wineWords = ['wine', 'red wine', 'white wine', 'rose', 'rosé', 'sparkling']
  const productText = (product) => `${product.name || ''} ${product.category || ''}`.toLowerCase()
  const mixers = products.filter((product) => mixerWords.some((word) => productText(product).includes(word)))
  const alcoholic = products.filter((product) => (
    spiritWords.some((word) => productText(product).includes(word))
    || wineWords.some((word) => productText(product).includes(word))
  ))
  const anchor = bestSeller && alcoholic.some((product) => product.id === bestSeller.id)
    ? bestSeller
    : alcoholic[0]
  if (!anchor) return null

  const anchorText = productText(anchor)
  let complement = mixers[0]
  if (anchorText.includes('gin')) complement = mixers.find((item) => productText(item).includes('tonic')) || complement
  if (anchorText.includes('vodka')) complement = mixers.find((item) => /juice|energy|soda/.test(productText(item))) || complement
  if (/whisky|whiskey|rum|brandy|cognac/.test(anchorText)) {
    complement = mixers.find((item) => /coke|cola|soda|water/.test(productText(item))) || complement
  }

  return complement ? { anchor, complement } : { anchor, complement: null }
}

function buildContext({ products = [], transactions = [], customers = [], now = Date.now() }) {
  const sales = transactions.filter((transaction) => transaction.operation_type === 'sale')
  const expenses = transactions.filter((transaction) => transaction.operation_type === 'expense')
  const currentSales = sales.filter((transaction) => timestamp(transaction, now) >= now - 7 * DAY_MS)
  const previousSales = sales.filter((transaction) => {
    const time = timestamp(transaction, now)
    return time >= now - 14 * DAY_MS && time < now - 7 * DAY_MS
  })
  const currentExpenses = expenses.filter((transaction) => timestamp(transaction, now) >= now - 7 * DAY_MS)
  const previousExpenses = expenses.filter((transaction) => {
    const time = timestamp(transaction, now)
    return time >= now - 14 * DAY_MS && time < now - 7 * DAY_MS
  })
  const recent30 = transactions.filter((transaction) => timestamp(transaction, now) >= now - 30 * DAY_MS)
  const currentRevenue = sum(currentSales, amount)
  const previousRevenue = sum(previousSales, amount)
  const currentProfit = sum(currentSales, (transaction) => Number(transaction.profit || 0))
  const previousProfit = sum(previousSales, (transaction) => Number(transaction.profit || 0))
  const currentExpenseTotal = sum(currentExpenses, amount)
  const previousExpenseTotal = sum(previousExpenses, amount)
  const revenueDelta = percentageDelta(currentRevenue, previousRevenue)
  const profitDelta = percentageDelta(currentProfit, previousProfit)
  const margin = currentRevenue > 0 ? Math.round((currentProfit / currentRevenue) * 100) : null
  const salesMap = productSalesMap(recent30)
  const bestSeller = getBestSeller(products, recent30)
  const deadStock = getDeadStock(products, recent30)
  const outOfStock = getOutOfStock(products)
  const lowStock = getLowStock(products)
  const restockSuggestions = getRestockSuggestions(products, recent30)
  const debtors = customers
    .filter((customer) => Number(customer.total_owed || 0) > 0)
    .sort((a, b) => Number(b.total_owed || 0) - Number(a.total_owed || 0))
  const totalDebt = sum(debtors, (customer) => Number(customer.total_owed || 0))
  const productMargins = products
    .filter((product) => Number(product.unit_price || 0) > 0)
    .map((product) => ({
      ...product,
      marginValue: Number(product.unit_price || 0) - Number(product.cost_price || 0),
      marginRate: Math.round(((Number(product.unit_price || 0) - Number(product.cost_price || 0)) / Number(product.unit_price || 1)) * 100),
      sales: salesMap.get(product.id) || { units: 0, revenue: 0, profit: 0 },
    }))
    .sort((a, b) => b.marginValue - a.marginValue)

  const expenseAverage = expenses.length ? sum(expenses, amount) / expenses.length : 0
  const unusualExpense = [...expenses]
    .filter((transaction) => expenseAverage > 0 && amount(transaction) >= expenseAverage * 2.5)
    .sort((a, b) => amount(b) - amount(a))[0] || null

  const weekendSales = sales.filter((transaction) => {
    const day = new Date(timestamp(transaction, now)).getDay()
    return day === 0 || day === 6
  })
  const weekdaySales = sales.filter((transaction) => {
    const day = new Date(timestamp(transaction, now)).getDay()
    return day !== 0 && day !== 6
  })
  const weekendAverage = weekendSales.length ? sum(weekendSales, amount) / weekendSales.length : null
  const weekdayAverage = weekdaySales.length ? sum(weekdaySales, amount) / weekdaySales.length : null

  return {
    products,
    transactions,
    customers,
    sales,
    currentRevenue,
    previousRevenue,
    currentProfit,
    previousProfit,
    currentExpenseTotal,
    previousExpenseTotal,
    revenueDelta,
    profitDelta,
    margin,
    bestSeller,
    deadStock,
    outOfStock,
    lowStock,
    restockSuggestions,
    debtors,
    totalDebt,
    productMargins,
    unusualExpense,
    weekendAverage,
    weekdayAverage,
    bundle: findActualBundle(products, bestSeller),
  }
}

function restockAnswer(context) {
  const { outOfStock, restockSuggestions, sales } = context
  if (!outOfStock.length && !restockSuggestions.length) {
    return 'Your recorded stock is currently above its alert levels. Nothing needs an urgent reorder.'
  }

  const rankedOut = [...outOfStock].sort((a, b) => {
    const soldA = sales.filter((item) => item.product_id === a.id).reduce((total, item) => total + Number(item.quantity || 1), 0)
    const soldB = sales.filter((item) => item.product_id === b.id).reduce((total, item) => total + Number(item.quantity || 1), 0)
    return soldB - soldA
  })
  if (rankedOut.length) {
    const product = rankedOut[0]
    const sold = sales.filter((item) => item.product_id === product.id).reduce((total, item) => total + Number(item.quantity || 1), 0)
    const target = Math.max(Number(product.stock_alert || 5) * 2, sold, 6)
    return `Restock ${product.name} first. It is out of stock${sold > 0 ? ` after ${sold} recorded unit(s) sold` : ''}. A practical first reorder is about ${Math.round(target)} units, then adjust it using the next seven days of sales.`
  }

  const top = restockSuggestions[0]
  return `Reorder ${top.name} first: about ${top.recommended} unit(s). It has ${top.stock_current ?? 0} left versus ${top.sold} recently recorded unit(s) sold.`
}

function profitAnswer(context) {
  const { currentRevenue, previousRevenue, currentProfit, previousProfit, currentExpenseTotal, previousExpenseTotal, revenueDelta, profitDelta, margin } = context
  if (currentRevenue === 0 && previousRevenue === 0) {
    return 'There is not enough recorded sales history to diagnose profit yet. Record sales with product and cost prices so Dukwise can separate revenue from profit.'
  }

  const reasons = []
  if (revenueDelta !== null && revenueDelta < 0) reasons.push(`sales fell ${Math.abs(revenueDelta)}%`)
  if (profitDelta !== null && profitDelta < revenueDelta) reasons.push('profit declined faster than sales, which points to a weaker product mix or margin')
  if (currentExpenseTotal > previousExpenseTotal) reasons.push(`expenses increased from ${fmtKES(previousExpenseTotal)} to ${fmtKES(currentExpenseTotal)} KES`)
  if (!reasons.length) reasons.push('the available data does not show a clear negative driver')

  return `Over the last 7 days, recorded sales were ${fmtKES(currentRevenue)} KES and recorded product profit was ${fmtKES(currentProfit)} KES${margin !== null ? ` (${margin}% margin)` : ''}. The previous 7 days had ${fmtKES(previousRevenue)} KES sales and ${fmtKES(previousProfit)} KES profit. Main reading: ${reasons.join('; ')}.`
}

function debtAnswer(context) {
  const { debtors, totalDebt } = context
  if (!debtors.length) return 'No customer currently has an outstanding balance in Dukwise.'
  const top = debtors[0]
  const concentration = totalDebt > 0 ? Math.round((Number(top.total_owed || 0) / totalDebt) * 100) : 0
  return `${top.name} should be contacted first: ${fmtKES(top.total_owed)} KES outstanding. Total customer debt is ${fmtKES(totalDebt)} KES, so this customer represents ${concentration}% of the money currently owed.`
}

function bundleAnswer(context) {
  const { bundle } = context
  if (!bundle) {
    return 'I cannot identify a reliable bundle from the current catalogue. Add clear product categories such as Gin, Whisky, Wine, Tonic, Soda or Juice, then Dukwise can match products already in your shop.'
  }
  if (bundle.complement) {
    return `Test a bundle with ${bundle.anchor.name} + ${bundle.complement.name}. Both products already exist in your catalogue, so start with a small basket discount while keeping the combined margin positive.`
  }
  return `${bundle.anchor.name} is a good bundle anchor, but no matching mixer is recorded in your catalogue. Consider stocking an appropriate mixer and test the pair without discounting below your cost.`
}

function weekendAnswer(context) {
  const { weekendAverage, weekdayAverage, bestSeller } = context
  if (weekendAverage === null) {
    return 'There are not enough recorded weekend sales to make a useful forecast yet. Keep logging sales; Dukwise will compare actual weekend and weekday baskets.'
  }
  const comparison = weekdayAverage
    ? ` Recorded weekend transactions average ${fmtKES(Math.round(weekendAverage))} KES versus ${fmtKES(Math.round(weekdayAverage))} KES on weekdays.`
    : ` Recorded weekend transactions average ${fmtKES(Math.round(weekendAverage))} KES.`
  return `${comparison}${bestSeller ? ` Protect the stock of ${bestSeller.name}, your strongest recorded seller, before the weekend.` : ''}`
}

function salesGrowthAnswer(context) {
  if (context.outOfStock.length) return `${restockAnswer(context)} Recovering missed availability is the clearest immediate sales opportunity.`
  if (context.deadStock.length) {
    const product = [...context.deadStock].sort((a, b) => Number(b.stock_current || 0) - Number(a.stock_current || 0))[0]
    return `Start with ${product.name}: ${product.stock_current || 0} unit(s) are tying up capital with no recorded sale in the last 30 days. Test a visible placement or a margin-safe bundle before using a heavy discount.`
  }
  if (context.bestSeller) return `Feature ${context.bestSeller.name} prominently and keep it available. Then offer one relevant mixer or premium alternative at checkout to increase basket value.`
  return 'Record more product-attributed sales first. Without product history, the safest action is consistent stock, clear pricing and one relevant mixer suggestion at checkout.'
}

function overviewAnswer(context) {
  const salesDirection = context.revenueDelta === null
    ? 'not yet comparable with the previous week'
    : context.revenueDelta >= 0 ? `up ${context.revenueDelta}%` : `down ${Math.abs(context.revenueDelta)}%`
  const stockMessage = context.outOfStock.length
    ? `${context.outOfStock.length} product(s) out of stock`
    : context.lowStock.length ? `${context.lowStock.length} product(s) running low` : 'stock alerts are clear'
  return `Your last 7 days show ${fmtKES(context.currentRevenue)} KES in recorded sales, ${salesDirection}. Current reading: ${stockMessage}, with ${fmtKES(context.totalDebt)} KES in outstanding customer debt. ${salesGrowthAnswer(context)}`
}

export function askLocalDukwiseAI({ question, products = [], transactions = [], customers = [] }) {
  const context = buildContext({ products, transactions, customers })
  const normalized = normalizeQuestion(question)
  let answer

  if (containsAny(normalized, ['restock', 'reorder', 'stock up', 'reappro', 'reapprovision', 'commander'])) answer = restockAnswer(context)
  else if (containsAny(normalized, ['profit', 'benefice', 'margin', 'marge'])) answer = profitAnswer(context)
  else if (containsAny(normalized, ['owes', 'debt', 'dette', 'doit le plus', 'recouvr'])) answer = debtAnswer(context)
  else if (containsAny(normalized, ['bundle', 'associer', 'combiner', 'mixer', 'cross-sell'])) answer = bundleAnswer(context)
  else if (containsAny(normalized, ['weekend', 'week-end', 'forecast', 'predict', 'prevision'])) answer = weekendAnswer(context)
  else if (containsAny(normalized, ['expense', 'depense', 'unusual', 'inhabituelle'])) {
    answer = context.unusualExpense
      ? `The largest unusual recorded expense is ${fmtKES(amount(context.unusualExpense))} KES, at least 2.5 times the average expense. Review its classification and business reason.`
      : 'No expense is currently at least 2.5 times your recorded average expense.'
  } else if (containsAny(normalized, ['slow', 'dead stock', 'underperform', 'ne vend', 'lent'])) {
    answer = context.deadStock.length
      ? `${context.deadStock[0].name} has stock but no recorded sale in the last 30 days. Test better placement or a margin-safe bundle before discounting it.`
      : 'No stocked product is currently classified as dead stock from the last 30 days of recorded sales.'
  } else if (containsAny(normalized, ['best seller', 'top product', 'selling fastest', 'meilleur', 'vend le plus'])) {
    answer = context.bestSeller
      ? `${context.bestSeller.name} is the strongest recorded seller with ${context.bestSeller.sold} unit(s) sold in the analysed period.`
      : 'There are not enough product-attributed sales to identify a best seller yet.'
  } else if (containsAny(normalized, ['increase sales', 'sell more', 'grow', 'augmenter', 'plus de vente'])) answer = salesGrowthAnswer(context)
  else answer = overviewAnswer(context)

  const recordedDataPoints = context.sales.length + context.products.length + context.customers.length
  return {
    answer,
    confidence: recordedDataPoints >= 30 ? 'High data coverage' : recordedDataPoints >= 10 ? 'Medium data coverage' : 'Limited data coverage',
    dataPoints: recordedDataPoints,
  }
}
