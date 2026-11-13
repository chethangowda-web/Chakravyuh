import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { Hardening } from '../../types/domain'

/** Attacks that still succeed after each fix round — should fall towards zero. */
export function HardeningChart({ hardening, height = 220 }: { hardening: Hardening; height?: number }) {
  const first = hardening.steps[0]?.vulnerable ?? 0
  const data = hardening.steps.map((step) => {
    const ratio = first > 0 ? step.vulnerable / first : 0
    return {
      label: step.label,
      value: step.vulnerable,
      running: step.status === 'running' || step.status === 'queued',
      fill: ratio > 0.5 ? '#ef4444' : ratio > 0.15 ? '#f97316' : ratio > 0 ? '#fbbf24' : '#10b981',
    }
  })
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 22, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#27272a" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, color: '#e4e4e7', fontSize: 12 }}
          formatter={(value) => [String(value), 'Attacks still succeeding']}
        />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          maxBarSize={80}
          minPointSize={5}
          isAnimationActive={false}
          label={{ position: 'top', fill: '#e4e4e7', fontSize: 13, fontWeight: 600 }}
        >
          {data.map((d) => (
            <Cell key={d.label} fill={d.fill} fillOpacity={d.running ? 0.45 : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
