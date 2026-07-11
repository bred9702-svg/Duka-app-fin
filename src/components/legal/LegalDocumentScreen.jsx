import SubScreenHeader from '../layout/SubScreenHeader'

function Block({ block }) {
  if (block.type === 'list') {
    return (
      <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-mid)' }}>
        {block.items.map((item) => (
          <li key={item} style={{ marginBottom: 7, fontSize: 12, lineHeight: 1.65 }}>
            {item}
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === 'subtitle') {
    return (
      <h3 style={{ margin: '16px 0 6px', fontSize: 13, fontWeight: 700, color: 'var(--text-hi)' }}>
        {block.text}
      </h3>
    )
  }

  return (
    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.7 }}>
      {block.text}
    </p>
  )
}

export default function LegalDocumentScreen({ title, updatedAt, intro, sections }) {
  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 28px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 160, height: 160, top: -40, right: -30, background: 'rgba(91,159,240,.13)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title={title} />

        <div
          style={{
            padding: '13px 14px',
            marginBottom: 12,
            borderRadius: 14,
            background: 'var(--glass-fill-soft)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <p style={{ margin: 0, fontSize: 10, fontWeight: 650, color: '#5B9FF0', textTransform: 'uppercase', letterSpacing: '.07em' }}>
            Last updated
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-hi)' }}>{updatedAt}</p>
          {intro && <p style={{ margin: '9px 0 0', fontSize: 12, lineHeight: 1.65, color: 'var(--text-mid)' }}>{intro}</p>}
        </div>

        {sections.map((section) => (
          <section
            key={section.title}
            style={{
              padding: '14px',
              marginBottom: 10,
              borderRadius: 14,
              background: 'var(--glass-fill-soft)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-hi)', lineHeight: 1.4 }}>
              {section.title}
            </h2>
            {section.blocks.map((block, index) => <Block key={`${section.title}-${index}`} block={block} />)}
          </section>
        ))}
      </div>
    </div>
  )
}
