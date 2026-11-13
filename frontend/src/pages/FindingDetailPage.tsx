import { ArrowLeft, Bot, Gavel, Lightbulb, ScanSearch, ShieldAlert, ShieldCheck, ShieldQuestion, UserRound } from 'lucide-react'
import { Link } from 'react-router'

import { endpoints } from '../api/endpoints'
import { useResult } from '../api/hooks/queries'
import { CategoryText, LangBadge, VariantBadge, VerdictText, VoiceBadge } from '../components/domain/Badges'
import { DetectorList, HighlightedText } from '../components/domain/Evidence'
import { SeverityBadge } from '../components/domain/SeverityBadge'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { Skeleton } from '../components/ui/Skeleton'
import { cn } from '../lib/cn'
import { pct } from '../lib/format'
import { LANGUAGES } from '../lib/languages'
import { CATEGORY_LABELS, tacticLabel } from '../lib/labels'
import { useIdParam } from '../lib/params'
import type { ResultDetail } from '../types/domain'

export function FindingDetailPage() {
  const resultId = useIdParam('resultId')
  if (resultId === null) return <ErrorNotice error={{ name: 'ApiError', message: 'Invalid finding id', status: 404, code: 'not_found', details: null }} />
  return <FindingDetail resultId={resultId} />
}

function FindingDetail({ resultId }: { resultId: number }) {
  const query = useResult(resultId)
  if (query.loading) return <Skeleton className="h-96" />
  if (query.error) return <ErrorNotice error={query.error} onRetry={query.reload} />
  const r = query.data
  if (!r) return null

  const spans = r.detector_hits.filter((h) => h.fired && h.detector !== 'refusal').flatMap((h) => h.spans)

  return (
    <>
      <Link to={`/campaigns/${r.campaign_id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="size-4" aria-hidden /> Back to campaign
      </Link>
      <VerdictHero r={r} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SeverityBadge severity={r.severity} />
        <VerdictText verdict={r.verdict} confidence={r.confidence} />
        <LangBadge language={r.language} native />
        <VariantBadge variant={r.variant} />
        <CategoryText category={r.category} />
        {r.modality === 'voice' && <VoiceBadge />}
        <span className="text-xs text-zinc-500">{r.technique}</span>
        {r.trial > 1 && <Badge>trial {r.trial}</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {r.modality === 'voice' && r.audio_id !== null && (
            <Card title="Spoken attack" description="Audio → Sarvam speech-to-text → target LLM">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={endpoints.audioUrl(r.audio_id)} className="w-full" />
              <p className="mt-3 text-xs text-zinc-500">Transcript heard by the pipeline</p>
              <p className="text-[15px] text-zinc-100">{r.transcript}</p>
              {r.transcript_drift !== null && (
                <p className="mt-2 text-xs text-zinc-500">Drift from intended text: {pct(r.transcript_drift)}</p>
              )}
            </Card>
          )}
          <Card title="Evidence" description="The exact conversation, with what leaked highlighted in red.">
            <div className="space-y-5">
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-500/15 ring-1 ring-violet-500/30">
                  <UserRound className="size-4 text-violet-300" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    Attacker · {LANGUAGES[r.language].native}
                  </p>
                  <div className="rounded-2xl rounded-tl-sm border border-violet-500/25 bg-violet-500/[0.07] px-4 py-3 text-[15px] leading-relaxed text-zinc-100">
                    {r.attack_text}
                  </div>
                  {r.english_gloss !== null && r.english_gloss !== r.attack_text && (
                    <p className="mt-2 text-sm text-zinc-400">
                      <span className="text-zinc-500">In English: </span>
                      {r.english_gloss}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-row-reverse gap-3">
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full ring-1',
                    r.verdict === 'vulnerable' ? 'bg-red-500/15 ring-red-500/40' : 'bg-zinc-800 ring-zinc-700',
                  )}
                >
                  <Bot className={cn('size-4', r.verdict === 'vulnerable' ? 'text-red-300' : 'text-zinc-300')} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500">Your chatbot replied</p>
                  <div
                    className={cn(
                      'rounded-2xl rounded-tr-sm border px-4 py-3 text-[15px] leading-relaxed text-zinc-100',
                      r.verdict === 'vulnerable' ? 'border-red-500/35 bg-red-500/[0.06]' : 'border-zinc-700 bg-zinc-900/70',
                    )}
                  >
                    {r.extracted_reply === null ? (
                      <span className="text-zinc-500">No reply was extracted ({r.judge_rationale ?? 'error'}).</span>
                    ) : (
                      <HighlightedText text={r.extracted_reply} spans={spans} />
                    )}
                  </div>
                </div>
              </div>
              <details className="text-xs text-zinc-500">
                <summary className="cursor-pointer">Raw HTTP response{r.http_status !== null && ` (HTTP ${r.http_status})`}</summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-400">{r.raw_response}</pre>
              </details>
            </div>
          </Card>
          {r.remediation !== null && (
            <Card>
              <div className="flex gap-3">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">How to fix</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-300">{r.remediation}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Detectors" description="Deterministic checks run first; the model judge only when they cannot decide.">
            <DetectorList hits={r.detector_hits} />
          </Card>
          {r.attacker_note !== null && (
            <Card title="Why the attacker tried this" description={r.tactic !== null ? `Tactic: ${tacticLabel(r.tactic)}${r.turn !== null ? ` · turn ${r.turn}` : ''}` : undefined}>
              <p className="text-sm italic leading-relaxed text-zinc-300">{r.attacker_note}</p>
            </Card>
          )}
          {r.judge_rationale !== null && (
            <Card title="Assessment">
              <p className="text-sm leading-relaxed text-zinc-300">{r.judge_rationale}</p>
            </Card>
          )}
          <Card title="Attack metadata">
            <dl className="space-y-2.5 text-xs">
              <Row label="Mutations" value={r.mutation_chain.length ? r.mutation_chain.join(' → ') : 'none (original)'} />
              <Row label="Language ID" value={r.detected_language !== null ? `${r.detected_language} · ${r.detected_script ?? '?'}` : '—'} />
              <Row label="Marker" value={r.marker_token ?? '—'} mono />
              <Row label="Latency" value={r.latency_ms !== null ? `${r.latency_ms} ms` : '—'} mono />
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={mono ? 'font-mono text-zinc-300' : 'text-right text-zinc-300'}>{value}</dd>
    </div>
  )
}


function VerdictHero({ r }: { r: ResultDetail }) {
  const fired = r.detector_hits.filter((h) => h.fired && h.detector !== 'refusal' && h.evidence)
  const kind = r.verdict === 'vulnerable' ? 'leak' : r.verdict === 'safe' ? 'held' : 'review'
  const style = {
    leak: {
      box: 'border-red-500/40 from-red-500/[0.16] via-red-500/[0.05]',
      icon: ShieldAlert,
      iconBox: 'bg-red-500/20 ring-red-500/40 text-red-300',
      title: 'Leak found',
      titleTone: 'text-red-200',
    },
    held: {
      box: 'border-emerald-500/35 from-emerald-500/[0.12] via-emerald-500/[0.04]',
      icon: ShieldCheck,
      iconBox: 'bg-emerald-500/20 ring-emerald-500/40 text-emerald-300',
      title: 'The bot held',
      titleTone: 'text-emerald-200',
    },
    review: {
      box: 'border-amber-400/35 from-amber-400/[0.12] via-amber-400/[0.04]',
      icon: ShieldQuestion,
      iconBox: 'bg-amber-400/20 ring-amber-400/40 text-amber-200',
      title: r.verdict === 'error' ? 'Could not test' : 'Needs review',
      titleTone: 'text-amber-100',
    },
  }[kind]
  const Icon = style.icon
  const proof =
    r.confidence === 'confirmed'
      ? { icon: ScanSearch, text: 'Proven by a deterministic rule' }
      : r.confidence === 'likely'
        ? { icon: Gavel, text: 'Decided by the Sarvam-105B judge (quoted evidence)' }
        : null
  return (
    <div className={cn('relative mb-5 overflow-hidden rounded-2xl border bg-linear-to-r to-transparent px-6 py-5', style.box)}>
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative flex flex-wrap items-center gap-5">
        <span className={cn('grid size-14 place-items-center rounded-2xl ring-1', style.iconBox)}>
          <Icon className="size-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            {CATEGORY_LABELS[r.category].label} · {LANGUAGES[r.language].label}
            {r.severity !== 'none' ? ` · ${r.severity}` : ''}
          </p>
          <h1 className={cn('mt-1 text-3xl font-semibold tracking-tight', style.titleTone)}>{style.title}</h1>
          {proof && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-400">
              <proof.icon className="size-4" aria-hidden /> {proof.text}
            </p>
          )}
        </div>
        {fired.length > 0 && (
          <ul className="flex max-w-md flex-wrap justify-end gap-2">
            {fired.map((h) => (
              <li key={h.detector} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-100">
                {h.evidence}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
