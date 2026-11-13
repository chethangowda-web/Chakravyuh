import {
  Crosshair,
  FileSearch,
  FlaskConical,
  GitCompareArrows,
  LayoutDashboard,
  Mic,
  Plug,
  Radar,
  ShieldCheck,
} from 'lucide-react'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { useLocation } from 'react-router'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  /** Overrides the journey label derived from the URL. */
  eyebrow?: string
}

type Icon = ComponentType<SVGProps<SVGSVGElement>>

/** Where each page sits in the Test → Fix → Protect journey (longest prefix first). */
const SECTIONS: ReadonlyArray<{ prefix: string; eyebrow: string; icon: Icon }> = [
  { prefix: '/campaigns/new', eyebrow: '1 · Test & fix · New campaign', icon: Radar },
  { prefix: '/dashboard', eyebrow: 'Overview · Dashboard', icon: LayoutDashboard },
  { prefix: '/targets', eyebrow: '1 · Test & fix · Targets', icon: Crosshair },
  { prefix: '/studio', eyebrow: '1 · Test & fix · Attack Studio', icon: FlaskConical },
  { prefix: '/campaigns', eyebrow: '1 · Test & fix · Campaigns', icon: Radar },
  { prefix: '/findings', eyebrow: '1 · Test & fix · Evidence', icon: FileSearch },
  { prefix: '/regression', eyebrow: '1 · Test & fix · Proof of fix', icon: GitCompareArrows },
  { prefix: '/voice', eyebrow: '1 · Test & fix · Voice Lab', icon: Mic },
  { prefix: '/shield', eyebrow: '2 · Protect · Shield', icon: ShieldCheck },
  { prefix: '/integrations', eyebrow: 'Integrations', icon: Plug },
]

export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  const { pathname } = useLocation()
  const section = SECTIONS.find((s) => pathname.startsWith(s.prefix))
  const Icon = section?.icon
  const label = eyebrow ?? section?.eyebrow
  return (
    <div className="relative mb-7 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-6 py-5">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -right-16 -top-24 size-60 rounded-full bg-accent-500/10 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-500/15 ring-1 ring-accent-500/30 shadow-[0_0_28px_-6px_rgba(20,184,166,0.65)]">
              <Icon className="size-5 text-accent-300" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            {label && <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent-300/80">{label}</p>}
            <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-zinc-50">{title}</h1>
            {description !== undefined && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">{description}</p>}
          </div>
        </div>
        {actions}
      </div>
    </div>
  )
}
