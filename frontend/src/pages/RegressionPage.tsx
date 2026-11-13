import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import { useFix, useHardening, useRegression } from '../api/hooks/queries'
import { HardeningChart } from '../components/charts/HardeningChart'
import { LangBadge, OutcomeBadge, VariantBadge } from '../components/domain/Badges'
import { FixPanel } from '../components/domain/FixPanel'
import { GeneralizationCard, HelpfulnessCard } from '../components/domain/HardeningProof'
import type { Generalization } from '../types/domain'
import { SeverityBadge } from '../components/domain/SeverityBadge'
import { LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { ProgressBar, StatTile } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { pct, truncate } from '../lib/format'
import { CATEGORY_LABELS } from '../lib/labels'
import { useIdParam } from '../lib/params'

export function RegressionPage() {
  const regressionId = useIdParam('regressionId')
  if (regressionId === null) return <ErrorNotice error={{ name: 'ApiError', message: 'Invalid regression id', status: 404, code: 'not_found', details: null }} />
  return <Regression regressionId={regressionId} />
}

function ProofCards({ fixId, generalization }: { fixId: number | null; generalization: Generalization | null }) {
  const fix = useFix(fixId)
  if (fixId === null) return null
  return (
    <div className="mb-6 grid gap-6 lg:grid-cols-2">
      {generalization !== null && <GeneralizationCard g={generalization} />}
      {fix.data && (fix.data.helpfulness_before !== null || fix.data.helpfulness_after !== null) && (
        <HelpfulnessCard before={fix.data.helpfulness_before} after={fix.data.helpfulness_after} />
      )}
    </div>
  )
}

function HardeningCard({ campaignId }: { campaignId: number }) {
  const hardening = useHardening(campaignId)
  if (!hardening.data || hardening.data.steps.length < 2) return null
  return (
    <Card className="mb-6" title="Hardening timeline" description="Attacks that still succeed after each fix round — the goal is zero">
      <HardeningChart hardening={hardening.data} />
    </Card>
  )
}

function Regression({ regressionId }: { regressionId: number }) {
  const query = useRegression(regressionId)
  if (query.loading) return <Skeleton className="h-96" />
  if (query.error && !query.data) return <ErrorNotice error={query.error} onRetry={query.reload} />
  const r = query.data
  if (!r) return null

  const done = r.summary.fixed + r.summary.still_vulnerable + r.summary.flaky + r.summary.new_vulnerability
  const progress = r.cases.length ? done / r.cases.length : 0
  const running = r.status === 'queued' || r.status === 'running'
  const total = r.cases.length || 1
  const fixRate = done ? r.summary.fixed / done : 0

  return (
    <>
      <PageHeader
        title="Regression comparison"
        description={`Same attacks, same wording — re-run ${r.trials}× against the target's current version.`}
        actions={
          <div className="flex gap-2">
            <LinkButton size="sm" to={`/campaigns/${r.base_campaign_id}`}>Before: #{r.base_campaign_id}</LinkButton>
            <LinkButton size="sm" variant="primary" to={`/campaigns/${r.new_campaign_id}`}>After: #{r.new_campaign_id}</LinkButton>
          </div>
        }
      />
      {running && (
        <Card className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-zinc-300">Re-running attacks…</span>
            <span className="font-mono text-zinc-400">{done}/{r.cases.length}</span>
          </div>
          <ProgressBar value={progress} />
        </Card>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatTile label="Fixed" value={r.summary.fixed} tone="text-emerald-300" hint={done ? `${pct(fixRate)} of reruns` : undefined} />
        <StatTile label="Still vulnerable" value={r.summary.still_vulnerable} tone={r.summary.still_vulnerable > 0 ? 'text-red-300' : undefined} />
        <StatTile label="Flaky" value={r.summary.flaky} tone="text-amber-200" hint="Mixed across trials" />
        <StatTile label="New issues" value={r.summary.new_vulnerability} tone={r.summary.new_vulnerability > 0 ? 'text-orange-300' : undefined} />
        <StatTile label="Attacks rerun" value={r.cases.length} />
      </div>
      <div className="mb-6 flex h-3 overflow-hidden rounded-full bg-zinc-800" aria-hidden>
        <div className="bg-emerald-500" style={{ width: `${(r.summary.fixed / total) * 100}%` }} />
        <div className="bg-amber-400" style={{ width: `${(r.summary.flaky / total) * 100}%` }} />
        <div className="bg-red-500" style={{ width: `${(r.summary.still_vulnerable / total) * 100}%` }} />
        <div className="bg-orange-500" style={{ width: `${(r.summary.new_vulnerability / total) * 100}%` }} />
      </div>

      {r.fix_summary !== null && (
        <Card className="mb-6" title="Fix being verified" description="Written by Sarvam-105B from the attacks that worked">
          <p className="text-sm leading-relaxed text-zinc-300">{r.fix_summary}</p>
        </Card>
      )}
      <ProofCards fixId={r.fix_id} generalization={r.generalization} />
      <HardeningCard campaignId={r.new_campaign_id} />
      {!running && (
        <div className="mb-6">
          <FixPanel campaignId={r.new_campaign_id} />
        </div>
      )}

      <Card title="Per-attack results">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="py-2.5 pr-3 font-medium">Outcome</th>
                <th className="py-2.5 pr-3 font-medium">Before → after</th>
                <th className="py-2.5 pr-3 font-medium">Trials failed</th>
                <th className="py-2.5 pr-3 font-medium">Language</th>
                <th className="py-2.5 pr-3 font-medium">Category</th>
                <th className="py-2.5 font-medium">Attack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {[...r.cases]
                .sort((a, b) => Number(b.outcome === 'still_vulnerable') - Number(a.outcome === 'still_vulnerable'))
                .map((c) => (
                  <tr key={`${c.base_test_case_id}`} className="align-top">
                    <td className="py-3 pr-3">
                      <OutcomeBadge outcome={c.outcome} />
                      {c.split === 'heldout' && <span className="mt-1 block text-[11px] text-accent-300">unseen by the patch</span>}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={c.before_severity} />
                        <ArrowRight className="size-3.5 text-zinc-600" aria-hidden />
                        {c.after_severity !== null ? <SeverityBadge severity={c.after_severity} /> : <span className="text-xs text-zinc-600">…</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-zinc-400">{c.vulnerable_trials}/{c.trials}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-col items-start gap-1">
                        <LangBadge language={c.language} />
                        <VariantBadge variant={c.variant} />
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-xs text-zinc-300">{CATEGORY_LABELS[c.category].label}</td>
                    <td className="max-w-sm py-3 text-zinc-400">{truncate(c.attack_text, 110)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 text-xs text-zinc-500">
        Back to <Link to="/campaigns" className="text-accent-400 hover:underline">all campaigns</Link>. Results compare the
        original verdict with the worst of {r.trials} reruns.
      </p>
    </>
  )
}
