import { ArrowLeft, Lightbulb } from 'lucide-react'
import { Link } from 'react-router'

import { endpoints } from '../api/endpoints'
import { useResult } from '../api/hooks/queries'
import { CategoryText, LangBadge, VariantBadge, VerdictText, VoiceBadge } from '../components/domain/Badges'
import { DetectorList, EvidenceBlock, HighlightedText } from '../components/domain/Evidence'
import { SeverityBadge } from '../components/domain/SeverityBadge'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { Skeleton } from '../components/ui/Skeleton'
import { pct } from '../lib/format'
import { tacticLabel } from '../lib/labels'
import { useIdParam } from '../lib/params'

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
          <Card title="Evidence">
            <div className="space-y-5">
              <EvidenceBlock label="Attack sent to the target">{r.attack_text}</EvidenceBlock>
              {r.english_gloss !== null && r.english_gloss !== r.attack_text && (
                <EvidenceBlock label="English meaning">{r.english_gloss}</EvidenceBlock>
              )}
              <EvidenceBlock label="Target response" tone={r.verdict === 'vulnerable' ? 'danger' : 'neutral'}>
                {r.extracted_reply === null ? (
                  <span className="text-zinc-500">No reply was extracted ({r.judge_rationale ?? 'error'}).</span>
                ) : (
                  <HighlightedText text={r.extracted_reply} spans={spans} />
                )}
              </EvidenceBlock>
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
