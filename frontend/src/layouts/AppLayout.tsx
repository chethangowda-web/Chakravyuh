import { Crosshair, FlaskConical, LayoutDashboard, Mic, Plus, Radar, ShieldCheck } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { BackendStatus } from '../components/domain/BackendStatus'
import { cn } from '../lib/cn'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  end?: boolean
}

const NAV_SECTIONS: ReadonlyArray<{ title: string; items: readonly NavItem[] }> = [
  { title: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    title: 'Red team',
    items: [
      { to: '/targets', label: 'Targets', icon: Crosshair },
      { to: '/studio', label: 'Attack Studio', icon: FlaskConical },
      { to: '/campaigns', label: 'Campaigns', icon: Radar },
      { to: '/voice', label: 'Voice Lab', icon: Mic },
      { to: '/shield', label: 'Shield', icon: ShieldCheck },
    ],
  },
]

function Sidebar() {
  return (
    <aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-950">
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-8 place-items-center rounded-lg bg-accent-500/15 ring-1 ring-accent-500/30">
          <ShieldCheck className="size-4.5 text-accent-400" aria-hidden />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          Chakra<span className="text-accent-400">vyuh</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-6 px-3 py-2" aria-label="Main">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end ?? false}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-zinc-800/80 font-medium text-zinc-50'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
                      )
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-800/80 px-5 py-4 text-xs text-zinc-500">
        Powered by <span className="font-medium text-zinc-300">Sarvam AI</span>
      </div>
    </aside>
  )
}

function Topbar() {
  return (
    <header className="no-print sticky top-0 z-10 flex h-14 items-center justify-end gap-3 border-b border-zinc-800/80 bg-zinc-950/80 px-8 backdrop-blur">
      <BackendStatus />
      <Link
        to="/campaigns/new"
        className="inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-accent-400"
      >
        <Plus className="size-4" aria-hidden /> New campaign
      </Link>
    </header>
  )
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
