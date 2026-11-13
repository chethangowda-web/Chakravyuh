import { Plus, Radar } from 'lucide-react'
import { Link } from 'react-router'

import { useCampaigns } from '../api/hooks/queries'
import { StatusBadge } from '../components/domain/Badges'
import { LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { EmptyState, ProgressBar } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { timeAgo } from '../lib/format'

export function CampaignsPage() {
  const campaigns = useCampaigns()
  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Every red-team run against your targets, with live progress."
        actions={
          <LinkButton to="/campaigns/new" variant="primary" icon={<Plus className="size-4" aria-hidden />}>
            New campaign
          </LinkButton>
        }
      />
      {campaigns.loading && <Skeleton className="h-64" />}
      {campaigns.error && !campaigns.data && <ErrorNotice error={campaigns.error} onRetry={campaigns.reload} />}
      {campaigns.data && campaigns.data.items.length === 0 && (
        <EmptyState
          icon={Radar}
          title="No campaigns yet"
          description="Launch your first multilingual attack campaign."
          action={<LinkButton to="/campaigns/new" variant="primary">New campaign</LinkButton>}
        />
      )}
      {campaigns.data && campaigns.data.items.length > 0 && (
        <Card>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="py-2.5 pr-3 font-medium">Campaign</th>
                <th className="py-2.5 pr-3 font-medium">Progress</th>
                <th className="py-2.5 pr-3 text-right font-medium">Vulnerable</th>
                <th className="py-2.5 pr-3 text-right font-medium">Safe</th>
                <th className="py-2.5 pr-3 font-medium">Status</th>
                <th className="py-2.5 text-right font-medium">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {campaigns.data.items.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/30">
                  <td className="py-3 pr-3">
                    <Link to={`/campaigns/${c.id}`} className="font-medium text-zinc-100 hover:text-accent-300">
                      {c.name}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {c.target_name}
                      {c.parent_campaign_id !== null && ' · regression'}
                    </p>
                  </td>
                  <td className="w-48 py-3 pr-3">
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
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}
