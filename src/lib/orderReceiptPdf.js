import { jsPDF } from 'jspdf'

const STATUS_LABELS = {
  awaiting_payment: 'Awaiting payment',
  partially_paid: 'Partially paid',
  paid: 'Paid - awaiting completion',
  completed: 'Completed',
  converted_to_debt: 'Converted to debt',
  cancelled: 'Cancelled',
}

function money(value) {
  return `${Number(value || 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })} KES`
}

function receiptFilename(order) {
  return `Dukwise-Order-${order.order_number || order.id}.pdf`
}

function addPageHeader(doc, shopName, orderNumber, continued = false) {
  doc.setFillColor(20, 22, 29)
  doc.rect(0, 0, 210, 34, 'F')
  doc.setTextColor(240, 169, 61)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('DUKWISE', 16, 15)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text(shopName || 'Dukwise Shop', 16, 23)
  doc.setFontSize(9)
  doc.text(`ORDER #${orderNumber}${continued ? ' - CONTINUED' : ''}`, 194, 17, { align: 'right' })
}

export function createOrderReceiptPdf(order, shopName) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageBottom = 278
  let y = 45

  function ensureSpace(required = 18) {
    if (y + required <= pageBottom) return
    doc.addPage()
    addPageHeader(doc, shopName, order.order_number, true)
    y = 43
  }

  function divider() {
    doc.setDrawColor(220, 220, 220)
    doc.line(16, y, 194, y)
    y += 7
  }

  function labelValue(label, value, color = [35, 39, 47]) {
    ensureSpace(10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(110, 116, 128)
    doc.text(label.toUpperCase(), 16, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...color)
    doc.text(String(value), 194, y, { align: 'right' })
    y += 7
  }

  addPageHeader(doc, shopName, order.order_number)
  doc.setTextColor(35, 39, 47)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Sales Receipt', 16, y)
  y += 10

  labelValue('Date', new Date(order.created_at).toLocaleString('en-KE'))
  labelValue('Customer', order.customer?.name || 'Walk-in customer')
  if (order.customer?.phone) labelValue('Phone', order.customer.phone)
  labelValue('Sold by', order.seller_name || 'Shop team member')
  if (order.seller_role) labelValue('Seller role', order.seller_role === 'owner' ? 'Owner' : 'Employee')
  labelValue('Status', STATUS_LABELS[order.status] || order.status)
  y += 2
  divider()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(35, 39, 47)
  doc.text('PRODUCTS', 16, y)
  y += 7

  ;(order.items || []).forEach((item) => {
    ensureSpace(18)
    doc.setFillColor(247, 247, 248)
    doc.roundedRect(16, y - 4, 178, 14, 2, 2, 'F')
    doc.setTextColor(35, 39, 47)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    const name = doc.splitTextToSize(item.product_name, 105)[0]
    doc.text(name, 20, y + 1)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 106, 118)
    doc.text(`${money(item.unit_price)} x ${item.quantity}`, 20, y + 7)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(35, 39, 47)
    doc.text(money(Number(item.unit_price) * Number(item.quantity)), 190, y + 3, { align: 'right' })
    y += 18
  })

  ensureSpace(35)
  divider()
  labelValue('Order total', money(order.total_amount))
  labelValue('Paid', money(order.paid_amount), [32, 151, 82])
  const balance = Number(order.total_amount) - Number(order.paid_amount)
  labelValue('Balance', money(balance), balance > 0 ? [218, 139, 28] : [32, 151, 82])

  if ((order.payments || []).length) {
    y += 4
    ensureSpace(18)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(35, 39, 47)
    doc.text('PAYMENT HISTORY', 16, y)
    y += 8
    order.payments.forEach((payment) => {
      ensureSpace(12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(75, 81, 92)
      doc.text(`${payment.method === 'mpesa' ? 'M-Pesa' : 'Cash'} - ${new Date(payment.created_at).toLocaleString('en-KE')}`, 16, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(32, 151, 82)
      doc.text(`+${money(payment.amount)}`, 194, y, { align: 'right' })
      y += 8
    })
  }

  if (order.status === 'converted_to_debt') {
    ensureSpace(18)
    y += 3
    doc.setFillColor(255, 246, 231)
    doc.roundedRect(16, y - 4, 178, 15, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(176, 104, 22)
    doc.text(`Outstanding balance converted to customer debt: ${money(balance)}`, 20, y + 4)
    y += 18
  }

  ensureSpace(20)
  y += 8
  divider()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 126, 136)
  doc.text('Generated securely by Dukwise. Keep this receipt for your records.', 105, y, { align: 'center' })
  return doc
}

export function downloadOrderReceipt(order, shopName) {
  createOrderReceiptPdf(order, shopName).save(receiptFilename(order))
}

export async function shareOrPrintOrderReceipt(order, shopName) {
  const doc = createOrderReceiptPdf(order, shopName)
  const blob = doc.output('blob')
  const file = new File([blob], receiptFilename(order), { type: 'application/pdf' })

  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    await navigator.share({ title: `Order #${order.order_number}`, text: 'Dukwise sales receipt', files: [file] })
    return 'shared'
  }

  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  if (!opened) {
    doc.save(receiptFilename(order))
    return 'downloaded'
  }
  return 'opened'
}
