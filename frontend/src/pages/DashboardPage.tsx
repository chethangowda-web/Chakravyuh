import { Activity, Bug, Radar, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'

import { useDashboard } from '../api/hooks/queries'
import { StatusBadge } from '../components/domain/Badges'
import { CategoryHeatmap, LanguageGapChart, SeverityDonut, VariantBars } from '../components/charts/Charts'
import { ConfirmationBar } from '../components/domain/ConfirmationBar'
import { LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { EmptyState, ProgressBar, StatTile } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { pct, timeAgo } from '../lib/format'

export function DashboardPage() {
  const dash = useDashboard(null)

  if (dash.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }
  if (dash.error && !dash.data) return <ErrorNotice error={dash.error} onRetry={dash.reload} />
  const data = dash.data
  if (!data) return null

  const b = data.breakdown
  const empty = b.total_tests === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Every attack across your campaigns, by language, severity and attack type. Regression reruns and voice replays are not double counted."
        actions={
          <LinkButton to="/campaigns/new" variant="primary">
            New campaign
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Tests executed" value={b.total_tests} hint={`${data.total_campaigns} campaigns`} />
        <StatTile
          label="Vulnerabilities"
          value={b.total_vulnerabilities}
          tone={b.total_vulnerabilities > 0 ? 'text-red-300' : undefined}
          hint={empty ? 'Run a campaign' : `${pct(b.total_tests ? b.total_vulnerabilities / b.total_tests : 0)} attack success`}
        />
        <StatTile
          label="Critical findings"
          value={b.severity_distribution.critical}
          tone={b.severity_distribution.critical > 0 ? 'text-red-300' : undefined}
          hint="Secrets / PII / prompt leaks"
        />
        <StatTile label="Pass rate" value={empty ? '—' : pct(b.pass_rate)} tone="text-emerald-300" hint="Attacks safely refused" />
      </div>

      {!empty && <ConfirmationBar confirmed={b.vulnerabilities_confirmed} likely={b.vulnerabilities_likely} />}

      {empty ? (
        <EmptyState
          icon={Radar}
          title="No campaigns yet"
          description="Register a target and run a campaign to see the Language Security Gap, severity distribution and heatmap here."
          action={<LinkButton to="/targets/new" variant="primary">Register a target</LinkButton>}
        />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            <Card
              className="lg:col-span-3"
              title="Language Security Gap"
              description="Attack success rate per language, across all campaigns (lower is better)"
            >
              <LanguageGapChart breakdown={b} />
            </Card>
            <Card className="lg:col-span-2" title="Severity distribution">
              <SeverityDonut breakdown={b} />
              <div className="mt-6 border-t border-zinc-800 pt-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">By script variant</p>
                <VariantBars breakdown={b} />
              </div>
            </Card>
          </div>
          <Card title="Attack success by language × category" description="Darker red means more attacks got through">
            <CategoryHeatmap breakdown={b} />
          </Card>
        </>
      )}

      <Card
        title="Recent campaigns"
        actions={
          <Link to="/campaigns" className="text-xs text-accent-400 hover:underline">
            View all
          </Link>
        }
      >
        {data.recent_campaigns.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing here yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {data.recent_campaigns.map((c) => (
              <li key={c.id}>
                <Link to={`/campaigns/${c.id}`} className="flex items-center gap-4 py-3 hover:bg-zinc-800/30">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{c.name}</p>
                    <p className="text-xs text-zinc-500">
                      {c.target_name} · {timeAgo(c.created_at)}
                    </p>
                  </div>
                  <div className="hidden w-40 sm:block">
                    <ProgressBar value={c.progress} />
                  </div>
                  <span className="flex w-24 items-center gap-1.5 text-xs text-zinc-400">
                    {c.counts.vulnerable > 0 ? (
                      <Bug className="size-3.5 text-red-400" aria-hidden />
                    ) : (
                      <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden />
                    )}
                    {c.counts.vulnerable} vuln
                  </span>
                  <StatusBadge status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="flex items-center gap-1.5 px-1 text-xs text-zinc-600">
        <Activity className="size-3.5" aria-hidden /> Refreshes every 5 seconds · regression reruns are excluded from
        the totals
      </p>
    </div>
  )
}
