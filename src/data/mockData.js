const now = Date.now()
const min = 60000

export const INIT_CUSTOMERS = [
  {
    id: 'c1',
    name: 'James Otieno',
    phone: '+254712345678',
    totalOwed: 3200,
    payments: [
      { date: new Date(now - 3 * 86400000).toISOString(), amount: 500, txnId: 't5' },
    ],
  },
  {
    id: 'c2',
    name: 'Peter Mwangi',
    phone: '+254723456789',
    totalOwed: 1800,
    payments: [],
  },
  {
    id: 'c3',
    name: 'Alice Njeri',
    phone: '+254734567890',
    totalOwed: 3200,
    payments: [
      { date: new Date(now - 8 * 86400000).toISOString(), amount: 1000, txnId: 't6' },
    ],
  },
]

export const INIT_TRANSACTIONS = [
  {
    id: 't1',
    amount: 2000,
    source: 'mpesa',
    direction: 'in',
    ts: now - 8 * min,
    classified: false,
    classification: null,
  },
  {
    id: 't2',
    amount: 800,
    source: 'cash',
    direction: 'in',
    ts: now - 25 * min,
    classified: false,
    classification: null,
  },
  {
    id: 't3',
    amount: 3500,
    source: 'cash',
    direction: 'out',
    ts: now - 52 * min,
    classified: false,
    classification: null,
  },
  {
    id: 't4',
    amount: 1200,
    source: 'mpesa',
    direction: 'in',
    ts: now - 80 * min,
    classified: true,
    classification: {
      type: 'sale',
      productName: 'Tusker x4',
      quantity: '4',
      category: null,
      customerId: null,
    },
  },
  {
    id: 't5',
    amount: 500,
    source: 'cash',
    direction: 'in',
    ts: now - 100 * min,
    classified: true,
    classification: {
      type: 'debt',
      productName: null,
      quantity: null,
      category: null,
      customerId: 'c1',
    },
  },
  {
    id: 't6',
    amount: 3500,
    source: 'cash',
    direction: 'out',
    ts: now - 140 * min,
    classified: true,
    classification: {
      type: 'expense',
      productName: null,
      quantity: null,
      category: 'stock',
      customerId: null,
    },
  },
]

export const EXPENSE_CATEGORIES = [
  { id: 'stock', label: 'Stock', icon: 'package' },
  { id: 'rent', label: 'Rent', icon: 'home' },
  { id: 'salary', label: 'Salary', icon: 'user' },
  { id: 'change', label: 'Change', icon: 'coins' },
  { id: 'other', label: 'Other', icon: 'dots' },
]
