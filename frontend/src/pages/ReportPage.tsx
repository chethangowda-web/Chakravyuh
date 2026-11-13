import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'

import { useCampaignReport } from '../api/hooks/queries'
import { CategoryHeatmap, LanguageGapChart, SeverityDonut } from '../components/charts/Charts'
import { LangBadge } from '../components/domain/Badges'
import { ConfirmationBar } from '../components/domain/ConfirmationBar'
import { SeverityBadge } from '../components/domain/SeverityBadge'
import { Button } from '../components/ui/Button'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { Skeleton } from '../components/ui/Skeleton'
import { dateTime, pct, truncate } from '../lib/format'
import { useIdParam } from '../lib/params'

export function ReportPage() {
  const campaignId = useIdParam('campaignId')
  if (campaignId === null) return <ErrorNotice error={{ name: 'ApiError', message: 'Invalid campaign id', status: 404, code: 'not_found', details: null }} />
  return <Report campaignId={campaignId} />
}

function Report({ campaignId }: { campaignId: number }) {
  const query = useCampaignReport(campaignId)
  if (query.loading) return <Skeleton className="h-96" />
  if (query.error) return <ErrorNotice error={query.error} onRetry={query.reload} />
  const r = query.data
  if (!r) return null
  const b = r.breakdown

  return (
    <article className="mx-auto max-w-4xl space-y-8 print:max-w-none">
      <div className="no-print flex items-center justify-between">
        <Link to={`/campaigns/${campaignId}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="size-4" aria-hidden /> Back to campaign
        </Link>
        <Button variant="primary" icon={<Printer className="size-4" aria-hidden />} onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <header className="border-b border-zinc-800 pb-6 print:border-zinc-300">
        <p className="flex items-center gap-2 text-sm font-medium text-accent-400">
          <ShieldCheck className="size-4" aria-hidden /> Chakravyuh security report
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{r.campaign.name}</h1>
        <p className="mt-1 text-sm text-zinc-400 print:text-zinc-600">
          Target: {r.target.name} · {r.target.base_url} · generated {dateTime(r.generated_at)}
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Executive summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Tests run" value={String(b.total_tests)} />
          <Metric label="Vulnerabilities" value={String(b.total_vulnerabilities)} />
          <Metric label="Critical" value={String(b.severity_distribution.critical)} />
          <Metric label="Pass rate" value={pct(b.pass_rate)} />
        </div>
        <div className="mt-5">
          <ConfirmationBar confirmed={b.vulnerabilities_confirmed} likely={b.vulnerabilities_likely} />
        </div>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-300 print:text-zinc-800">
          {r.recommendations.map((rec) => <li key={rec}>{rec}</li>)}
        </ul>
      </section>

      <section className="break-inside-avoid">
        <h2 className="mb-1 text-lg font-semibold">Language Security Gap</h2>
        <p className="mb-3 text-sm text-zinc-400 print:text-zinc-600">Share of attacks that succeeded, per language.</p>
        <LanguageGapChart breakdown={b} height={240} />
      </section>

      <section className="grid gap-8 sm:grid-cols-2">
        <div className="break-inside-avoid">
          <h2 className="mb-3 text-lg font-semibold">Severity distribution</h2>
          <SeverityDonut breakdown={b} />
        </div>
        <div className="break-inside-avoid">
          <h2 className="mb-3 text-lg font-semibold">Language × category</h2>
          <CategoryHeatmap breakdown={b} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Top findings</h2>
        {r.top_findings.length === 0 && <p className="text-sm text-zinc-400">No vulnerabilities were confirmed in this run.</p>}
        <ol className="space-y-5">
          {r.top_findings.map((f, i) => (
            <li key={f.id} className="break-inside-avoid rounded-lg border border-zinc-800 p-4 print:border-zinc-300">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-zinc-500">#{i + 1}</span>
                <SeverityBadge severity={f.severity} />
                <LangBadge language={f.language} native />
                <span className="text-xs text-zinc-400">{f.technique}</span>
              </div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Attack</p>
              <p className="mb-2 text-sm text-zinc-200 print:text-zinc-900">{truncate(f.attack_text, 300)}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Response</p>
              <p className="mb-2 whitespace-pre-wrap text-sm text-zinc-200 print:text-zinc-900">{truncate(f.extracted_reply ?? '', 400)}</p>
              {f.remediation !== null && <p className="text-xs text-amber-200 print:text-amber-800">Fix: {f.remediation}</p>}
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-zinc-800 pt-4 text-xs text-zinc-500 print:border-zinc-300">
        Generated by Chakravyuh using Sarvam AI. Findings marked “confirmed” were proven by deterministic checks;
        “likely” findings were assessed by a model judge and should be reviewed by a human.
      </footer>
    </article>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 p-4 print:border-zinc-300">
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}
