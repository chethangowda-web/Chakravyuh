import type { Severity } from '../types/domain'

interface SeverityStyle {
  label: string
  /** Tailwind classes for a badge */
  badge: string
  /** Tailwind class for a small dot */
  dot: string
  /** Hex for charts */
  hex: string
}

/** `Record<Severity, …>` makes this exhaustive: a new backend severity fails the typecheck here. */
export const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  critical: { label: 'Critical', badge: 'bg-red-500/15 text-red-300 ring-red-500/30', dot: 'bg-red-500', hex: '#ef4444' },
  high: { label: 'High', badge: 'bg-orange-500/15 text-orange-300 ring-orange-500/30', dot: 'bg-orange-500', hex: '#f97316' },
  medium: { label: 'Medium', badge: 'bg-amber-400/15 text-amber-200 ring-amber-400/30', dot: 'bg-amber-400', hex: '#fbbf24' },
  low: { label: 'Low', badge: 'bg-sky-400/15 text-sky-200 ring-sky-400/30', dot: 'bg-sky-400', hex: '#38bdf8' },
  none: { label: 'Safe', badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30', dot: 'bg-emerald-500', hex: '#10b981' },
}

export const SEVERITY_ORDER: readonly Severity[] = ['critical', 'high', 'medium', 'low', 'none']
