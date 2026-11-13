import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

interface CardProps {
  title?: string | undefined
  description?: string | undefined
  actions?: ReactNode
  className?: string | undefined
  children: ReactNode
}

export function Card({ title, description, actions, className, children }: CardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-zinc-800/80 bg-linear-to-b from-zinc-900/80 to-zinc-900/40 shadow-lg shadow-black/25 ring-1 ring-inset ring-white/[0.03] transition-colors hover:border-zinc-700/80',
        className,
      )}
    >
      {(title !== undefined || actions !== undefined) && (
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800/70 px-5 py-4">
          <div>
            {title !== undefined && (
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <span className="h-3.5 w-0.5 rounded-full bg-accent-400" aria-hidden />
                {title}
              </h2>
            )}
            {description !== undefined && <p className="mt-0.5 pl-2.5 text-xs text-zinc-400">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}
