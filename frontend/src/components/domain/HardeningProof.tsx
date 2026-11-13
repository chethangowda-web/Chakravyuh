import { ArrowRight, Loader2, MessageCircleQuestion, ShieldCheck } from 'lucide-react'

import { cn } from '../../lib/cn'
import { pct } from '../../lib/format'
import { LANGUAGES } from '../../lib/languages'
import type { Generalization, Helpfulness } from '../../types/domain'
import { Card } from '../ui/Card'

function rateTone(before: number, after: number): string {
  if (after >= before - 0.05) return 'text-emerald-300'
  if (after >= before - 0.15) return 'text-amber-200'
  return 'text-red-300'
}

/** "Fix set 5 -> 0, unseen attacks 4 -> 0": did the patch generalise beyond what it was shown? */
export function GeneralizationCard({ g }: { g: Generalization }) {
  const fixFixed = g.fix_set_total - g.fix_set_still_vulnerable
  const heldFixed = g.heldout_total - g.heldout_still_vulnerable
  return (
    <Card
      title="Does the fix generalise?"
      description="Sarvam wrote the patch from the fix set only. The held-out attacks were never shown to it."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: 'Attacks the patch saw', total: g.fix_set_total, still: g.fix_set_still_vulnerable, fixed: fixFixed },
          { label: 'Unseen attacks (held out)', total: g.heldout_total, still: g.heldout_still_vulnerable, fixed: heldFixed },
        ].map((row) => (
          <div key={row.label} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{row.label}</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold tabular-nums">
              <span className="text-red-300">{row.total}</span>
              <ArrowRight className="size-4 text-zinc-600" aria-hidden />
              <span className={row.still === 0 ? 'text-emerald-300' : 'text-amber-200'}>{row.still}</span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              still succeeding{g.complete ? '' : ' (rerun in progress)'} · {row.total ? pct(row.fixed / row.total) : '—'} fixed
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

/** Over-refusal check: legitimate questions answered before vs after the fix. */
export function HelpfulnessCard({ before, after }: { before: Helpfulness | null; after: Helpfulness | null }) {
  const measuring = [before, after].some((h) => h !== null && (h.status === 'queued' || h.status === 'running'))
  const b = before?.answer_rate ?? null
  const a = after?.answer_rate ?? null
  return (
    <Card
      title="Still helpful? (over-refusal check)"
      description="A patch that refuses everything blocks every attack but is useless. These are the target's ordinary questions (its own list, or a built-in banking set), asked in the campaign's languages."
    >
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <MessageCircleQuestion className="size-5 text-accent-400" aria-hidden />
          <p className="text-2xl font-semibold tabular-nums">
            <span className="text-zinc-200">{b === null ? '…' : pct(b)}</span>
            <ArrowRight className="mx-2 inline size-4 text-zinc-600" aria-hidden />
            <span className={b !== null && a !== null ? rateTone(b, a) : 'text-zinc-400'}>{a === null ? '…' : pct(a)}</span>
          </p>
          <span className="text-xs text-zinc-500">legitimate questions answered, before → after</span>
        </div>
        {measuring && (
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> measuring…
          </span>
        )}
        {b !== null && a !== null && a >= b - 0.05 && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-300">
            <ShieldCheck className="size-4" aria-hidden /> Security up, helpfulness kept
          </span>
        )}
      </div>
      {after !== null && after.by_language.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {after.by_language.map((s) => {
            const prev = before?.by_language.find((p) => p.language === s.language)
            return (
              <span key={s.language} className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                {LANGUAGES[s.language].native}: {prev ? `${prev.answered}/${prev.total} → ` : ''}
                <span className={cn(prev && s.answered < prev.answered ? 'text-amber-200' : 'text-zinc-100')}>
                  {s.answered}/{s.total}
                </span>
              </span>
            )
          })}
        </div>
      )}
      {after?.items.some((i) => i.answered === false) && (
        <details className="mt-4 text-xs text-zinc-400">
          <summary className="cursor-pointer">Questions no longer answered</summary>
          <ul className="mt-2 space-y-2">
            {after.items.filter((i) => i.answered === false).map((i) => (
              <li key={`${i.language}-${i.question}`} className="rounded-md border border-zinc-800 p-2.5">
                <span className="text-zinc-200">[{LANGUAGES[i.language].short}] {i.question}</span>
                <span className="block text-zinc-500">{i.rationale}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  )
}
