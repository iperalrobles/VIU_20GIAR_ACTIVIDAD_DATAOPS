import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function VolumeChart({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="chart-card">
      <h3>Volumen de operaciones</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(d) => d.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
          />
          <Tooltip
            formatter={(value) => [value.toLocaleString(), 'Volumen']}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Bar dataKey="volume" fill="var(--accent)" opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
