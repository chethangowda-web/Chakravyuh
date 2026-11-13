import { Mic } from 'lucide-react'

import { cn } from '../../lib/cn'
import { CATEGORY_LABELS, CONFIDENCE_LABELS, OUTCOME_STYLES, STATUS_STYLES, VERDICT_STYLES } from '../../lib/labels'
import { LANGUAGES, VARIANT_LABELS } from '../../lib/languages'
import type {
  AttackCategory,
  CampaignStatus,
  Confidence,
  LanguageCode,
  RegressionOutcome,
  ScriptVariant,
  Verdict,
} from '../../types/domain'

const pill = 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset'

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className={cn(pill, s.className)}>
      {s.pulse && <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden />}
      {s.label}
    </span>
  )
}

export function LangBadge({ language, native = false }: { language: LanguageCode; native?: boolean }) {
  const meta = LANGUAGES[language]
  return (
    <span
      className={cn(pill, 'bg-zinc-900 text-zinc-200 ring-zinc-700')}
      title={meta.label}
      style={{ boxShadow: `inset 3px 0 0 ${meta.hex}` }}
    >
      {native ? meta.native : meta.short}
    </span>
  )
}

export function VariantBadge({ variant }: { variant: ScriptVariant }) {
  return <span className="text-xs text-zinc-400">{VARIANT_LABELS[variant]}</span>
}

export function CategoryText({ category }: { category: AttackCategory }) {
  return <span className="text-xs text-zinc-300">{CATEGORY_LABELS[category].label}</span>
}

export function VerdictText({ verdict, confidence }: { verdict: Verdict; confidence: Confidence | null }) {
  return (
    <span className={cn('text-xs font-medium', VERDICT_STYLES[verdict].className)}>
      {VERDICT_STYLES[verdict].label}
      {confidence !== null && (
        <span className="ml-1 font-normal text-zinc-500" title={CONFIDENCE_LABELS[confidence].hint}>
          · {CONFIDENCE_LABELS[confidence].label.toLowerCase()}
        </span>
      )}
    </span>
  )
}

export function OutcomeBadge({ outcome }: { outcome: RegressionOutcome | null }) {
  if (outcome === null) return <span className={cn(pill, 'bg-zinc-800 text-zinc-400 ring-zinc-700')}>Pending</span>
  const s = OUTCOME_STYLES[outcome]
  return <span className={cn(pill, s.className)}>{s.label}</span>
}

export function VoiceBadge() {
  return (
    <span className={cn(pill, 'bg-violet-500/15 text-violet-300 ring-violet-500/30')}>
      <Mic className="size-3" aria-hidden /> Voice
    </span>
  )
}
