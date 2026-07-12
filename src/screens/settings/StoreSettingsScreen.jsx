import SubScreenHeader from '../../components/layout/SubScreenHeader'
import Icon from '../../components/ui/Icon'
import Toggle from '../../components/ui/Toggle'
import useAppStore, { DEFAULT_BUSINESS_PREFERENCES } from '../../store/useAppStore'

const CURRENCIES = [
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'TZS', label: 'TZS — Tanzanian Shilling' },
  { value: 'UGX', label: 'UGX — Ugandan Shilling' },
]

function SectionTitle({ children }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-low)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: '18px 0 8px',
      }}
    >
      {children}
    </p>
  )
}

function FieldShell({ icon, color, label, sub, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 12px',
        borderRadius: 12,
        marginBottom: 8,
        background: 'var(--glass-fill-soft)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={14} color={color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' }}>
          {label}
        </p>
        {sub && <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-low)' }}>{sub}</p>}
      </div>

      {children}
    </div>
  )
}

function InputRow({ label, value, onChange, suffix, icon, color, type = 'text' }) {
  return (
    <FieldShell icon={icon} color={color} label={label}>
      <input
        type={type}
        value={value}
        min={type === 'number' ? 0 : undefined}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 64,
          textAlign: 'right',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 13,
          fontWeight: 700,
          color: '#F0A93D',
          fontFamily: 'var(--font-display)',
        }}
      />
      {suffix && <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{suffix}</span>}
    </FieldShell>
  )
}

function SelectRow({ label, value, onChange, options, icon, color }) {
  return (
    <FieldShell icon={icon} color={color} label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          maxWidth: 150,
          background: 'rgba(255,255,255,.06)',
          border: '1px solid var(--glass-border)',
          outline: 'none',
          borderRadius: 10,
          padding: '7px 8px',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--text-hi)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

function ToggleRow({ label, sub, checked, onChange, icon, color }) {
  return (
    <FieldShell icon={icon} color={color} label={label} sub={sub}>
      <Toggle checked={checked} onChange={onChange} />
    </FieldShell>
  )
}

export default function StoreSettingsScreen() {
  const settings = useAppStore((s) => s.businessPreferences)
  const updateBusinessPreference = useAppStore((s) => s.updateBusinessPreference)
  const saving = useAppStore((s) => s.businessPreferencesSaving)
  const saveError = useAppStore((s) => s.businessPreferencesError)

  return (
    <div style={{ flex: 1, width: '100%', padding: '16px 14px 8px', position: 'relative' }}>
      <div
        className="bg-blob"
        style={{ width: 140, height: 140, top: -30, right: -20, background: 'rgba(240,169,61,0.16)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SubScreenHeader title="Business Preferences" />

        <p style={{ margin: '-4px 0 10px', minHeight: 14, fontSize: 10, color: saveError ? '#FF6B5B' : 'var(--text-low)' }}>
          {saveError || (saving ? 'Saving changes...' : 'Saved to your shop')}
        </p>

        <SectionTitle>Money</SectionTitle>
        <SelectRow
          label="Currency"
          value={settings.currency}
          onChange={(value) => updateBusinessPreference('currency', value)}
          options={CURRENCIES}
          icon="coins"
          color="#5FD97A"
        />
        <ToggleRow
          label="Enable Tax"
          sub="Add tax settings to your business preferences"
          checked={settings.taxEnabled}
          onChange={(value) => updateBusinessPreference('taxEnabled', value)}
          icon="cash"
          color="#F0A93D"
        />
        {settings.taxEnabled && (
          <InputRow
            label="Tax Rate"
            value={settings.taxRate}
            onChange={(value) => updateBusinessPreference('taxRate', value)}
            suffix="%"
            icon="cash"
            color="#F0A93D"
            type="number"
          />
        )}

        <SectionTitle>Stock</SectionTitle>
        <ToggleRow
          label="Stock Alerts"
          sub="Warn when a product is running low"
          checked={settings.stockAlerts}
          onChange={(value) => updateBusinessPreference('stockAlerts', value)}
          icon="bell"
          color="#FF6B5B"
        />
        <InputRow
          label="Low Stock Threshold"
          value={settings.lowStockThreshold}
          onChange={(value) => updateBusinessPreference('lowStockThreshold', value)}
          suffix="units"
          icon="package"
          color="#7C5CFC"
          type="number"
        />

        <SectionTitle>Duka AI</SectionTitle>
        <ToggleRow
          label="Daily AI Brief"
          sub="Show a short daily business brief"
          checked={settings.dailyAiBrief}
          onChange={(value) => updateBusinessPreference('dailyAiBrief', value)}
          icon="barChart"
          color="#4FC3F7"
        />
        <ToggleRow
          label="AI Recommendations"
          sub="Show recommendation cards in AI screens"
          checked={settings.aiRecommendations}
          onChange={(value) => updateBusinessPreference('aiRecommendations', value)}
          icon="star"
          color="#FFD166"
        />
      </div>
    </div>
  )
}
