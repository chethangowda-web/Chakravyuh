import { Check, FileText } from 'lucide-react'
import { Link } from 'react-router'

import { CATEGORY_LABELS, VERDICT_STYLES } from '../../lib/labels'
import { cn } from '../../lib/cn'
import type { Campaign, CampaignLive, LiveEvent } from '../../types/domain'
import { Spinner } from '../ui/Feedback'
import { LangBadge } from './Badges'

type StageState = 'done' | 'active' | 'pending'

interface Stage {
  title: string
  detail: string
  count: string
  state: StageState
  /** 0..1, or null when there is no fixed total (adaptive attempts) */
  fraction: number | null
}

function stages(c: Campaign, live: CampaignLive): Stage[] {
  const finished = !(live.status === 'queued' || live.status === 'running')
  const completed = live.status === 'completed'
  const adaptive = live.mode === 'adaptive'
  const planned = Math.max(live.planned, 0)
  const sent = live.analysed + live.errors + live.in_flight
  const decided = live.analysed + live.errors
  const state = (done: boolean, started: boolean): StageState => (done ? 'done' : started && !finished ? 'active' : 'pending')
  const frac = (n: number) => (adaptive || planned === 0 ? null : Math.min(1, n / planned))

  return [
    {
      title: adaptive ? 'Plan missions' : 'Plan attacks',
      detail: adaptive ? 'One mission per goal and language' : 'Attack library × languages × script styles',
      count: `${planned} ${adaptive ? 'missions' : 'attacks'}`,
      state: planned > 0 ? 'done' : 'active',
      fraction: planned > 0 ? 1 : 0,
    },
    {
      title: adaptive ? 'Attacker writes each attempt' : 'Translate & check language',
      detail: adaptive
        ? 'Sarvam-105B plans from the bot’s last reply · Sarvam Translate localizes · language ID checks'
        : 'Sarvam Translate → native / romanized / code-mixed · Sarvam language ID verifies',
      count: adaptive ? `${live.written} attempts` : `${live.written}/${planned}`,
      state: state(finished || (!adaptive && live.written >= planned && planned > 0), live.written > 0 || c.status === 'running'),
      fraction: frac(live.written),
    },
    {
      title: 'Attack the bot',
      detail: live.in_flight > 0 ? `${live.in_flight} waiting for the bot’s reply right now` : 'Each attack sent to your app over HTTP',
      count: adaptive ? `${sent} sent` : `${sent}/${planned}`,
      state: state(finished || (!adaptive && sent >= planned && live.in_flight === 0), sent > 0),
      fraction: frac(sent),
    },
    {
      title: 'Analyse replies',
      detail: `Rules decided ${live.decided_by_rules} · Sarvam judge decided ${live.decided_by_judge}${live.errors ? ` · ${live.errors} errors` : ''}`,
      count: adaptive ? `${decided} judged` : `${decided}/${planned}`,
      state: state(finished || (!adaptive && decided >= planned), decided > 0),
      fraction: frac(decided),
    },
    {
      title: 'Report ready',
      // Same numbers as the tiles below (an adaptive mission counts once, however many attempts it took).
      detail: completed
        ? `${c.counts.vulnerable} vulnerable · ${c.counts.safe} safe`
        : finished
          ? `Campaign ${live.status}`
          : `${c.counts.vulnerable} vulnerable so far`,
      count: completed ? 'Done' : finished ? '—' : '',
      state: completed ? 'done' : 'pending',
      fraction: completed ? 1 : 0,
    },
  ]
}

function StageIcon({ state, index }: { state: StageState; index: number }) {
  if (state === 'done')
    return (
      <span className="grid size-7 place-items-center rounded-full bg-accent-500/20 text-accent-300 ring-1 ring-accent-500/40">
        <Check className="size-4" aria-hidden />
      </span>
    )
  if (state === 'active')
    return (
      <span className="grid size-7 place-items-center rounded-full bg-accent-500/10 ring-1 ring-accent-400/60">
        <Spinner className="size-3.5 text-accent-300" />
      </span>
    )
  return (
    <span className="grid size-7 place-items-center rounded-full bg-zinc-900 font-mono text-xs text-zinc-500 ring-1 ring-zinc-700">
      {index + 1}
    </span>
  )
}

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
}

function FeedRow({ e }: { e: LiveEvent }) {
  const body = (
    <>
      <span className="w-16 shrink-0 font-mono text-[11px] text-zinc-500">{time(e.created_at)}</span>
      <LangBadge language={e.language} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-zinc-300" title={e.attack_excerpt}>
          {e.attack_excerpt}
        </span>
        <span className="text-[11px] text-zinc-500">
          {CATEGORY_LABELS[e.category].label}
          {e.turn !== null && ` · attempt ${e.turn}`}
        </span>
      </span>
      <span className="w-32 shrink-0 text-right text-xs">
        {e.stage === 'attacking' || e.verdict === null ? (
          <span className="inline-flex items-center gap-1.5 text-accent-300">
            <Spinner className="size-3" /> attacking…
          </span>
        ) : (
          <>
            <span className={cn('font-medium', VERDICT_STYLES[e.verdict].className)}>{VERDICT_STYLES[e.verdict].label}</span>
            {e.decided_by !== null && <span className="block text-[11px] text-zinc-500">by {e.decided_by === 'judge' ? 'Sarvam judge' : 'rules'}</span>}
          </>
        )}
      </span>
    </>
  )
  const row = 'flex items-center gap-3 rounded-md px-2 py-1.5'
  return e.result_id !== null ? (
    <li>
      <Link to={`/findings/${e.result_id}`} className={cn(row, 'hover:bg-zinc-800/60')}>
        {body}
      </Link>
    </li>
  ) : (
    <li className={cn(row, 'animate-pulse')}>{body}</li>
  )
}

/** The campaign as a live pipeline: how many attacks reached each step, plus the newest attacks as they happen. */
export function LivePipeline({ campaign, live }: { campaign: Campaign; live: CampaignLive }) {
  const list = stages(campaign, live)
  const running = live.status === 'queued' || live.status === 'running'
  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
        <p className="text-sm font-medium text-zinc-200">{running ? 'Live pipeline' : 'Pipeline'}</p>
        <span className="font-mono text-xs text-zinc-400">
          {campaign.completed_cases}/{campaign.total_cases} · {Math.round(campaign.progress * 100)}%
        </span>
      </div>
      <div className={cn('grid gap-0', running && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]')}>
        <ol className="space-y-1 p-5">
          {list.map((s, i) => (
            <li key={s.title} className="relative flex gap-3 pb-3 last:pb-0">
              {i < list.length - 1 && (
                <span
                  className={cn('absolute left-[13px] top-8 h-[calc(100%-1.75rem)] w-px', s.state === 'done' ? 'bg-accent-500/40' : 'bg-zinc-800')}
                  aria-hidden
                />
              )}
              <StageIcon state={s.state} index={i} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className={cn('text-sm', s.state === 'pending' ? 'text-zinc-500' : 'font-medium text-zinc-100')}>{s.title}</p>
                  <span className="shrink-0 font-mono text-xs text-zinc-400">{s.count}</span>
                </div>
                <p className="text-xs text-zinc-500">{s.detail}</p>
                {s.fraction !== null && s.state === 'active' && (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-accent-400 transition-all duration-700" style={{ width: `${Math.round(s.fraction * 100)}%` }} />
                  </div>
                )}
                {i === list.length - 1 && live.status === 'completed' && (
                  <Link to={`/campaigns/${campaign.id}/report`} className="mt-1 inline-flex items-center gap-1 text-xs text-accent-400 hover:underline">
                    <FileText className="size-3" aria-hidden /> Open report
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
        {running && (
          <div className="border-t border-zinc-800 p-3 lg:border-l lg:border-t-0">
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Live feed · newest first</p>
            {live.recent.length === 0 ? (
              <p className="flex items-center gap-2 px-2 py-6 text-xs text-zinc-500">
                <Spinner className="size-3" /> Preparing the first attacks…
              </p>
            ) : (
              <ul className="space-y-0.5">
                {live.recent.map((e) => (
                  <FeedRow key={`${e.test_case_id}-${e.result_id ?? 'p'}`} e={e} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
