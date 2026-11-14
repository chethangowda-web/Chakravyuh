import { Plus, Radar, Search, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { useCampaigns } from '../api/hooks/queries'
import { StatusBadge } from '../components/domain/Badges'
import { LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { EmptyState, ProgressBar } from '../components/ui/Feedback'
import { Input } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { cn } from '../lib/cn'
import { timeAgo } from '../lib/format'
import type { Campaign } from '../types/domain'

type Kind = 'library' | 'adaptive' | 'voice' | 'replay' | 'regression' | 'extension' | 'challenge'

const KINDS: Record<Kind, { label: string; className: string }> = {
  library: { label: 'Library', className: 'bg-zinc-800 text-zinc-300 ring-zinc-700' },
  adaptive: { label: 'Adaptive AI', className: 'bg-violet-500/15 text-violet-300 ring-violet-500/30' },
  voice: { label: 'Voice Lab', className: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
  replay: { label: 'Voice replay', className: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
  regression: { label: 'Regression', className: 'bg-amber-400/15 text-amber-200 ring-amber-400/30' },
  extension: { label: 'Extension', className: 'bg-accent-500/15 text-accent-300 ring-accent-500/30' },
  challenge: { label: 'Judge challenge', className: 'bg-rose-500/15 text-rose-300 ring-rose-500/30' },
}

function kindOf(c: Campaign): Kind {
  if (c.name.startsWith('Browser extension')) return 'extension'
  if (c.name.startsWith('Judge challenge')) return 'challenge'
  if (c.config.mode === 'voice_replay') return 'replay'
  if (c.parent_campaign_id !== null) return 'regression'
  if (c.name.startsWith('Voice ·')) return 'voice'
  return c.config.mode === 'adaptive' ? 'adaptive' : 'library'
}

/** Stored names can contain raw enum values ("harmful_content"); show them as words. */
const prettyName = (name: string) => name.replace(/_/g, ' ')

export function CampaignsPage() {
  const campaigns = useCampaigns()
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [query, setQuery] = useState('')

  const items = campaigns.data?.items ?? []
  const counts = items.reduce<Record<string, number>>((acc, c) => ({ ...acc, [kindOf(c)]: (acc[kindOf(c)] ?? 0) + 1 }), {})
  const q = query.trim().toLowerCase()
  const shown = items.filter(
    (c) => (kind === 'all' || kindOf(c) === kind) && (!q || `${c.name} ${c.target_name}`.toLowerCase().includes(q)),
  )

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Every red-team run against your targets, with live progress. Open one to see the evidence and fix it."
        actions={
          <LinkButton to="/campaigns/new" variant="primary" icon={<Plus className="size-4" aria-hidden />}>
            New campaign
          </LinkButton>
        }
      />
      {campaigns.loading && <Skeleton className="h-64" />}
      {campaigns.error && !campaigns.data && <ErrorNotice error={campaigns.error} onRetry={campaigns.reload} />}
      {campaigns.data && items.length === 0 && (
        <EmptyState
          icon={Radar}
          title="No campaigns yet"
          description="Launch your first multilingual attack campaign."
          action={<LinkButton to="/campaigns/new" variant="primary">New campaign</LinkButton>}
        />
      )}
      {items.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(['all', ...Object.keys(KINDS)] as const).map((k) => {
              const n = k === 'all' ? items.length : (counts[k] ?? 0)
              if (k !== 'all' && n === 0) return null
              const active = kind === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k as Kind | 'all')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs ring-1 ring-inset transition-colors',
                    active ? 'bg-accent-500/20 text-accent-200 ring-accent-500/50' : 'text-zinc-400 ring-zinc-700 hover:text-zinc-200',
                  )}
                >
                  {k === 'all' ? 'All' : KINDS[k as Kind].label} <span className="ml-1 text-zinc-500">{n}</span>
                </button>
              )
            })}
            <div className="relative ml-auto w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" aria-hidden />
              <Input aria-label="Search campaigns" placeholder="Search by name or target" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <Card>
            {shown.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">No campaigns match.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="py-2.5 pr-3 font-medium">Campaign</th>
                    <th className="py-2.5 pr-3 font-medium">Type</th>
                    <th className="py-2.5 pr-3 font-medium">Progress</th>
                    <th className="py-2.5 pr-3 text-right font-medium">Vulnerable</th>
                    <th className="py-2.5 pr-3 text-right font-medium">Safe</th>
                    <th className="py-2.5 pr-3 font-medium">Status</th>
                    <th className="py-2.5 text-right font-medium">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {shown.map((c) => {
                    const k = KINDS[kindOf(c)]
                    const shielded = c.target_name.endsWith('+ Shield')
                    return (
                      <tr key={c.id} className="hover:bg-zinc-800/30">
                        <td className="py-3 pr-3">
                          <Link to={`/campaigns/${c.id}`} className="font-medium text-zinc-100 hover:text-accent-300">
                            {prettyName(c.name)}
                          </Link>
                          <p className="flex items-center gap-1 text-xs text-zinc-500">
                            {shielded && <ShieldCheck className="size-3 text-accent-400" aria-label="behind Shield" />}
                            {c.target_name}
                          </p>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={cn('inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', k.className)}>{k.label}</span>
                        </td>
                        <td className="w-44 py-3 pr-3">
                          <ProgressBar value={c.progress} />
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {c.completed_cases}/{c.total_cases}
                          </p>
                        </td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums text-red-300">{c.counts.vulnerable}</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums text-emerald-300">{c.counts.safe}</td>
                        <td className="py-3 pr-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 text-right text-xs text-zinc-500">{timeAgo(c.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </>
  )
}
