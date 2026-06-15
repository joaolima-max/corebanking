'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface DataPoint {
  label: string
  value: number
  volume?: number
}

interface BarChartComponentProps {
  data: DataPoint[]
  title?: string
}

export default function BarChartComponent({ data, title }: BarChartComponentProps) {
  const chartData = data.map((d) => ({ name: d.label, value: d.value, volume: d.volume }))

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
      {title && <p className="text-sm font-semibold text-slate-700 mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="value" fill="#00B37E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
