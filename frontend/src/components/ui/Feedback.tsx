import { Loader2 } from 'lucide-react'
import type { ComponentType, ReactNode, SVGProps } from 'react'

import { cn } from '../../lib/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-4 animate-spin text-zinc-500', className)} aria-label="Loading" />
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-zinc-800', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-accent-600 to-accent-400 transition-[width] duration-500"
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  )
}

interface EmptyStateProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-zinc-800 px-6 py-14 text-center">
      <Icon className="size-6 text-zinc-600" aria-hidden />
      <p className="mt-3 text-sm font-medium text-zinc-300">{title}</p>
      {description !== undefined && <p className="mt-1 max-w-md text-xs text-zinc-500">{description}</p>}
      {action !== undefined && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: string | undefined
  tone?: string | undefined
}

export function StatTile({ label, value, hint, tone }: StatTileProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums text-zinc-100', tone)}>{value}</p>
      {hint !== undefined && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}
