import { Brain, CheckCircle2, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { Link } from 'react-router'

import { cn } from '../../lib/cn'
import { CATEGORY_LABELS, tacticLabel } from '../../lib/labels'
import { VARIANT_LABELS } from '../../lib/languages'
import type { Mission, MissionTurn } from '../../types/domain'
import { LangBadge } from './Badges'

const DOT: Record<MissionTurn['verdict'], string> = {
  vulnerable: 'border-red-500 bg-red-500/20 text-red-300',
  safe: 'border-emerald-500 bg-emerald-500/15 text-emerald-300',
  inconclusive: 'border-amber-400 bg-amber-400/15 text-amber-200',
  error: 'border-zinc-600 bg-zinc-800 text-zinc-400',
}

function Turn({ turn, last }: { turn: MissionTurn; last: boolean }) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!last && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-zinc-800" aria-hidden />}
      <span className={cn('z-10 grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold', DOT[turn.verdict])}>
        {turn.turn}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-medium text-zinc-200">{tacticLabel(turn.tactic)}</span>
          <span className="text-zinc-500">{VARIANT_LABELS[turn.variant]}</span>
          <span
            className={cn(
              'font-medium',
              turn.verdict === 'vulnerable' ? 'text-red-300' : turn.verdict === 'safe' ? 'text-emerald-300' : 'text-amber-200',
            )}
          >
            {turn.verdict === 'vulnerable' ? 'Breached' : turn.verdict === 'safe' ? 'Held' : turn.verdict === 'inconclusive' ? 'Needs review' : 'Error'}
          </span>
          <Link to={`/findings/${turn.result_id}`} className="ml-auto text-accent-400 hover:underline">
            Evidence
          </Link>
        </div>
        {turn.attacker_note !== null && (
          <p className="flex gap-1.5 text-xs italic text-zinc-500">
            <Brain className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {turn.attacker_note}
          </p>
        )}
        <p className="whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm leading-relaxed text-zinc-100">
          {turn.attack_text}
        </p>
        {turn.english_meaning !== null && <p className="text-xs text-zinc-500">In English: {turn.english_meaning}</p>}
        {turn.reply_excerpt !== null && (
          <p
            className={cn(
              'whitespace-pre-wrap rounded-lg border p-3 text-sm leading-relaxed',
              turn.verdict === 'vulnerable' ? 'border-red-500/30 bg-red-500/5 text-zinc-200' : 'border-zinc-800 text-zinc-400',
            )}
          >
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-zinc-500">Bot replied</span>
            {turn.reply_excerpt}
          </p>
        )}
      </div>
    </li>
  )
}

export function MissionCard({ mission, defaultOpen }: { mission: Mission; defaultOpen: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-zinc-800 bg-zinc-900/60">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4">
        {mission.breached ? (
          <ShieldAlert className="size-5 shrink-0 text-red-400" aria-hidden />
        ) : mission.turns.some((t) => t.verdict === 'inconclusive') ? (
          <ShieldQuestion className="size-5 shrink-0 text-amber-300" aria-hidden />
        ) : (
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100">{CATEGORY_LABELS[mission.category].label}</p>
          <p className="truncate text-xs text-zinc-500">{mission.goal}</p>
        </div>
        <LangBadge language={mission.language} native />
        <span className={cn('text-xs font-medium', mission.breached ? 'text-red-300' : 'text-emerald-300')}>
          {mission.breached
            ? `Breached in ${mission.turns_used} ${mission.turns_used === 1 ? 'turn' : 'turns'} · ${tacticLabel(mission.winning_tactic)}`
            : `Held for ${mission.turns_used} ${mission.turns_used === 1 ? 'turn' : 'turns'}`}
        </span>
      </summary>
      <ol className="border-t border-zinc-800 px-5 py-5">
        {mission.turns.map((turn, index) => (
          <Turn key={turn.result_id} turn={turn} last={index === mission.turns.length - 1} />
        ))}
      </ol>
    </details>
  )
}
