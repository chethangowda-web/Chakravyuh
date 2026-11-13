import { AlertTriangle, AudioLines, Keyboard } from 'lucide-react'
import { Link } from 'react-router'

import { pct } from '../../lib/format'
import { LANGUAGES } from '../../lib/languages'
import type { VoiceComparison } from '../../types/domain'
import { Card } from '../ui/Card'

/** The same attacks as typed text vs spoken audio (Sarvam TTS -> STT -> bot), paired one by one. */
export function VoiceComparisonCard({ cmp }: { cmp: VoiceComparison }) {
  const n = cmp.pairs || 1
  const delta = cmp.voice_succeeded - cmp.text_succeeded
  return (
    <Card
      title="Text vs voice: same attacks, two channels"
      description="Each attack was sent as text and spoken through Sarvam TTS → Sarvam STT → the bot, then judged the same way."
    >
      {cmp.text_baseline === 'original' && (
        <p className="mb-4 flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Older replay: text verdicts come from the original campaign (judged earlier), so this comparison is not like-for-like.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-500">
            <Keyboard className="size-3.5" aria-hidden /> Typed
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-100">
            {cmp.text_succeeded}/{cmp.pairs}
          </p>
          <p className="text-xs text-zinc-500">{pct(cmp.text_succeeded / n)} succeeded</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-zinc-500">
            <AudioLines className="size-3.5" aria-hidden /> Spoken
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-100">
            {cmp.voice_succeeded}/{cmp.pairs}
          </p>
          <p className="text-xs text-zinc-500">{pct(cmp.voice_succeeded / n)} succeeded</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Voice − text</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-100">
            {delta > 0 ? '+' : ''}
            {delta}
          </p>
          <p className="text-xs text-zinc-500">
            {cmp.voice_only} only as voice · {cmp.text_only} only as text
            {cmp.mean_transcript_drift !== null && ` · ${pct(cmp.mean_transcript_drift)} avg transcript drift`}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-zinc-400">
        {Math.abs(delta) <= Math.max(1, Math.round(cmp.pairs * 0.1))
          ? 'Spoken attacks work about as well as typed ones: the speech layer passes the attack through intact, so a voice bot inherits every weakness of its text bot.'
          : delta > 0
            ? 'Spoken attacks succeeded more often than typed ones: transcription changes the attack in ways the bot handles worse.'
            : 'Spoken attacks succeeded less often than typed ones: transcription blunts some attacks — but do not rely on that as a defence.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {cmp.by_language.map((l) => (
          <span key={l.language} className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
            {LANGUAGES[l.language].native}: text {l.text_succeeded}/{l.pairs} · voice {l.voice_succeeded}/{l.pairs}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Compared against <Link className="text-accent-400 hover:underline" to={`/campaigns/${cmp.base_campaign_id}`}>campaign #{cmp.base_campaign_id}</Link>.
        Attacks that depend on an exact injected code are excluded (digits are often transcribed as words).
      </p>
    </Card>
  )
}
