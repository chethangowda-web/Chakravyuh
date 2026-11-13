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
    <section className={cn('rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-sm shadow-black/20', className)}>
      {(title !== undefined || actions !== undefined) && (
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800/80 px-5 py-4">
          <div>
            {title !== undefined && <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>}
            {description !== undefined && <p className="mt-0.5 text-xs text-zinc-400">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}
