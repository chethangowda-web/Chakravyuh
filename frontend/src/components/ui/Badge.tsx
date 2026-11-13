import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-zinc-800 text-zinc-300 ring-zinc-700',
  accent: 'bg-accent-500/15 text-accent-300 ring-accent-500/30',
  success: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  warning: 'bg-amber-400/15 text-amber-200 ring-amber-400/30',
  danger: 'bg-red-500/15 text-red-300 ring-red-500/30',
}

interface BadgeProps {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
