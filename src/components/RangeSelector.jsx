import './RangeSelector.css'

const RANGES = [
  { label: '1S', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1A', days: 365 },
]

export default function RangeSelector({ selected, onChange }) {
  return (
    <div className="range-selector">
      {RANGES.map(({ label, days }) => (
        <button
          key={days}
          className={`range-btn ${selected === days ? 'active' : ''}`}
          onClick={() => onChange(days)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
