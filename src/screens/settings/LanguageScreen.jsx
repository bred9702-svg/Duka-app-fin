import { useState } from 'react'
import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'

const STORAGE_KEY = 'duka-language'

const LANGUAGES = [
  { id: 'en', flag: '🇬🇧', label: 'English' },
  { id: 'fr', flag: '🇫🇷', label: 'Français' },
  { id: 'sw', flag: '🇸🇼', label: 'Kiswahili' },
]

export default function LanguageScreen() {
  const [selected, setSelected] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'en'
  )

  function select(id) {
    setSelected(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div className="bg-blob" style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Language" />

        {LANGUAGES.map((lang) => (
          <div
            key={lang.id}
            onClick={() => select(lang.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '13px 12px',
              borderRadius: 14,
              marginBottom: 8,
              cursor: 'pointer',
              background: selected === lang.id ? 'rgba(240,169,61,0.12)' : 'var(--glass-fill-soft)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: selected === lang.id ? '1.5px solid rgba(240,169,61,0.5)' : '1px solid var(--glass-border)',
            }}
          >
            <span style={{ fontSize: 22 }}>{lang.flag}</span>
            <p style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 600, color: selected === lang.id ? '#F0A93D' : 'var(--text-hi)' }}>
              {lang.label}
            </p>
            {selected === lang.id && <Icon name="circleCheck" size={18} color="#F0A93D" />}
          </div>
        ))}
      </div>
    </div>
  )
}
