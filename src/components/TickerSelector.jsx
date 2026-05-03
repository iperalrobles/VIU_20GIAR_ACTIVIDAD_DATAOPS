import { AVAILABLE_TICKERS } from '../services/mockData'
import './TickerSelector.css'

export default function TickerSelector({ selected, onChange }) {
  return (
    <div className="ticker-selector">
      <label htmlFor="ticker">Ticker</label>
      <select
        id="ticker"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {AVAILABLE_TICKERS.map((ticker) => (
          <option key={ticker} value={ticker}>
            {ticker}
          </option>
        ))}
      </select>
    </div>
  )
}
