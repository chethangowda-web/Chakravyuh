import { CheckCircle2, CircleDashed, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'
import { DETECTOR_LABELS } from '../../lib/labels'
import type { ResultDetail } from '../../types/domain'

type Hit = ResultDetail['detector_hits'][number]
type Span = Hit['spans'][number]

/** Renders text with evidence spans highlighted (spans may overlap; they are merged). */
export function HighlightedText({ text, spans }: { text: string; spans: readonly Span[] }) {
  const merged: Span[] = []
  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1)
    if (last !== undefined && span.start <= last.end) last.end = Math.max(last.end, span.end)
    else merged.push({ start: span.start, end: span.end })
  }
  const parts: ReactNode[] = []
  let cursor = 0
  merged.forEach((span, i) => {
    const start = Math.min(Math.max(span.start, cursor), text.length)
    const end = Math.min(span.end, text.length)
    if (start > cursor) parts.push(text.slice(cursor, start))
    if (end > start) {
      parts.push(
        <mark key={i} className="rounded bg-red-500/25 px-0.5 text-red-100 ring-1 ring-red-500/40">
          {text.slice(start, end)}
        </mark>,
      )
    }
    cursor = Math.max(cursor, end)
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}

export function EvidenceBlock({ label, children, tone = 'neutral' }: { label: string; children: ReactNode; tone?: 'neutral' | 'danger' }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <div
        className={cn(
          'whitespace-pre-wrap break-words rounded-lg border bg-zinc-950 p-4 text-[15px] leading-relaxed text-zinc-200',
          tone === 'danger' ? 'border-red-500/30' : 'border-zinc-800',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function DetectorList({ hits }: { hits: readonly Hit[] }) {
  return (
    <ul className="divide-y divide-zinc-800">
      {hits.map((hit) => {
        const meta = DETECTOR_LABELS[hit.detector]
        const isRefusal = hit.detector === 'refusal'
        return (
          <li key={hit.detector} className="flex items-start gap-3 py-3">
            {hit.fired ? (
              isRefusal ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
              ) : (
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
              )
            ) : (
              <CircleDashed className="mt-0.5 size-4 shrink-0 text-zinc-600" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('text-sm font-medium', hit.fired ? 'text-zinc-100' : 'text-zinc-500')}>{meta.label}</p>
                {hit.score !== null && (
                  <span className="font-mono text-xs text-zinc-500">
                    {hit.detector === 'prompt_leak' || hit.detector === 'judge' ? hit.score.toFixed(2) : hit.score}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">{hit.evidence ?? meta.description}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
