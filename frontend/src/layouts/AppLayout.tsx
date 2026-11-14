import { Crosshair, FlaskConical, House, LayoutDashboard, Mic, Plug, Plus, Radar, ShieldCheck, Swords } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'

import { BackendStatus } from '../components/domain/BackendStatus'
import { JourneyBar } from '../components/domain/JourneyBar'
import { cn } from '../lib/cn'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  end?: boolean
}

const NAV_SECTIONS: ReadonlyArray<{ title: string; items: readonly NavItem[] }> = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Home', icon: House, end: true },
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/challenge', label: 'Break the Chakravyuh', icon: Swords },
    ],
  },
  {
    title: '1 · Test & fix',
    items: [
      { to: '/targets', label: 'Targets', icon: Crosshair },
      { to: '/studio', label: 'Attack Studio', icon: FlaskConical },
      { to: '/campaigns', label: 'Campaigns', icon: Radar },
      { to: '/voice', label: 'Voice Lab', icon: Mic },
    ],
  },
  { title: '2 · Protect', items: [{ to: '/shield', label: 'Shield', icon: ShieldCheck }] },
  { title: 'Integrations', items: [{ to: '/integrations', label: 'Extension & CI', icon: Plug }] },
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
                          ? 'bg-linear-to-r from-accent-500/15 to-transparent font-medium text-zinc-50 shadow-[inset_2px_0_0_#2dd4bf]'
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
    <header className="no-print sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-zinc-800/80 bg-zinc-950/80 px-8 backdrop-blur">
      <JourneyBar />
      <div className="flex-1" />
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
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-screen">
      <div
        className="no-print pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.07),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.05),transparent_45%)]"
        aria-hidden
      />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-8">
          {/* keyed by path: each page fades in on navigation */}
          <div key={pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
