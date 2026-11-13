import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cn } from '../../lib/cn'
import { pct } from '../../lib/format'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../../lib/labels'
import { LANGUAGES, VARIANT_LABELS } from '../../lib/languages'
import { SEVERITY_ORDER, SEVERITY_STYLES } from '../../lib/severity'
import type { DashboardSummary, LanguageCode } from '../../types/domain'

type Breakdown = DashboardSummary['breakdown']

const AXIS = { fill: '#71717a', fontSize: 12 }
const TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: 8,
  color: '#e4e4e7',
  fontSize: 12,
}

function rateColor(rate: number): string {
  if (rate >= 0.6) return '#ef4444'
  if (rate >= 0.35) return '#f97316'
  if (rate >= 0.15) return '#fbbf24'
  if (rate > 0) return '#38bdf8'
  return '#10b981'
}

/** The headline chart: attack success rate per language. */
export function LanguageGapChart({ breakdown, height = 260 }: { breakdown: Breakdown; height?: number }) {
  const data = breakdown.by_language.map((s) => ({
    name: LANGUAGES[s.language].label,
    native: LANGUAGES[s.language].native,
    rate: Math.round(s.vulnerability_rate * 1000) / 10,
    label: `${s.vulnerable}/${s.total}`,
    fill: rateColor(s.vulnerability_rate),
  }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#27272a" vertical={false} />
        <XAxis dataKey="native" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, _name, item) => [`${String(value)}% (${String(item.payload.label)})`, 'Attack success']}
          labelFormatter={(_label, items) => String(items[0]?.payload.name ?? '')}
        />
        <Bar
          dataKey="rate"
          radius={[6, 6, 0, 0]}
          maxBarSize={64}
          isAnimationActive={false}
          label={{ position: 'top', fill: '#d4d4d8', fontSize: 12, formatter: (v: unknown) => `${String(v)}%` }}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SeverityDonut({ breakdown }: { breakdown: Breakdown }) {
  const data = SEVERITY_ORDER.map((s) => ({
    key: s,
    name: SEVERITY_STYLES[s].label,
    value: breakdown.severity_distribution[s],
    fill: SEVERITY_STYLES[s].hex,
  })).filter((d) => d.value > 0)
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-semibold tabular-nums">{total}</p>
            <p className="text-[11px] text-zinc-500">results</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {SEVERITY_ORDER.map((s) => (
          <li key={s} className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: SEVERITY_STYLES[s].hex }} aria-hidden />
            <span className="w-16 text-zinc-300">{SEVERITY_STYLES[s].label}</span>
            <span className="font-mono tabular-nums text-zinc-400">{breakdown.severity_distribution[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Language × category grid of attack success rates. */
export function CategoryHeatmap({ breakdown }: { breakdown: Breakdown }) {
  const languages = breakdown.by_language.map((s) => s.language)
  const categories = CATEGORY_ORDER.filter((c) => breakdown.by_category.some((s) => s.category === c))
  const cell = (lang: LanguageCode, cat: string) =>
    breakdown.heatmap.find((h) => h.language === lang && h.category === cat)
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th />
            {languages.map((l) => (
              <th key={l} className="px-1 pb-1 text-center font-medium text-zinc-300">
                {LANGUAGES[l].native}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat}>
              <th className="whitespace-nowrap pr-2 text-left font-normal text-zinc-400">{CATEGORY_LABELS[cat].short}</th>
              {languages.map((lang) => {
                const c = cell(lang, cat)
                const rate = c?.vulnerability_rate ?? 0
                return (
                  <td
                    key={lang}
                    title={c ? `${c.vulnerable}/${c.total} vulnerable` : 'Not tested'}
                    className={cn('h-10 rounded-md text-center font-mono tabular-nums', c ? 'text-zinc-50' : 'text-zinc-700')}
                    style={c ? { backgroundColor: `${rateColor(rate)}${Math.round(40 + rate * 160).toString(16).padStart(2, '0')}` } : undefined}
                  >
                    {c ? pct(rate) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function VariantBars({ breakdown }: { breakdown: Breakdown }) {
  return (
    <ul className="space-y-3">
      {breakdown.by_variant.map((v) => (
        <li key={v.variant}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-zinc-300">{VARIANT_LABELS[v.variant]}</span>
            <span className="font-mono text-zinc-400">
              {pct(v.vulnerability_rate)} · {v.vulnerable}/{v.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full"
              style={{ width: `${v.vulnerability_rate * 100}%`, backgroundColor: rateColor(v.vulnerability_rate) }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
