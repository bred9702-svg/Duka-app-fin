import { useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'

const FAQS = [
  {
    question: 'What is Duka?',
    answer:
      'Duka is a simple shop tracker that helps small business owners record sales, expenses, customer debts, inventory, and daily performance in one place.',
  },
  {
    question: 'How do I record a sale?',
    answer:
      'Use the New Sale screen to select the customer if needed, add the products sold, confirm the quantities, and save the sale. Duka will update your totals and stock information.',
  },
  {
    question: 'How do I track customer debts?',
    answer:
      'When a customer buys on credit, record it as a debt. Duka keeps the unpaid balance visible on the Debts and Customer screens until payments are recorded.',
  },
  {
    question: 'How do I record a debt payment?',
    answer:
      'Open the customer or debt details, enter the payment amount, and save it. Duka reduces the remaining balance and closes the debt once it is fully paid.',
  },
  {
    question: 'How does inventory stock update?',
    answer:
      'When you record product purchases, stock increases. When you record sales, stock decreases based on the quantities sold.',
  },
  {
    question: 'What does low stock mean?',
    answer:
      'Low stock means a product has reached the alert threshold you set in Business Preferences. This helps you know what may need restocking soon.',
  },
  {
    question: 'Can I change my business preferences?',
    answer:
      'Yes. Go to Me, then Business Preferences. You can update currency, tax settings, stock alerts, low stock threshold, and AI preferences.',
  },
  {
    question: 'Does Duka translate my product or customer names?',
    answer:
      'No. Duka only translates app labels. Your product names, customer names, shop name, and other business data stay exactly as you entered them.',
  },
]

function FAQItem({ item, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      style={{
        marginBottom: 8,
        borderRadius: 14,
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: 'rgba(240,169,61,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="helpCircle" size={14} color="#F0A93D" />
        </div>

        <p
          style={{
            flex: 1,
            margin: 0,
            fontSize: 13,
            fontWeight: 650,
            color: 'var(--text-hi)',
            lineHeight: 1.35,
          }}
        >
          {item.question}
        </p>

        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={15} color="var(--text-low)" />
      </button>

      {open && (
        <div
          style={{
            padding: '0 12px 13px 54px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--text-mid)',
              lineHeight: 1.55,
            }}
          >
            {item.answer}
          </p>
        </div>
      )}
    </div>
  )
}

export default function FAQScreen() {
  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="FAQ" />

        <p
          style={{
            margin: '0 0 14px',
            fontSize: 12,
            color: 'var(--text-low)',
            lineHeight: 1.5,
          }}
        >
          Quick answers to common questions about using Duka.
        </p>

        {FAQS.map((item, index) => (
          <FAQItem key={item.question} item={item} defaultOpen={index === 0} />
        ))}
      </div>
    </div>
  )
}
