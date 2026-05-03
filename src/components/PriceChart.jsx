import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import './PriceChart.css'

export default function PriceChart({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="chart-card">
      <h3>Precio de cierre</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(d) => d.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value) => [`$${value.toFixed(2)}`, 'Precio']}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="var(--accent)"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
