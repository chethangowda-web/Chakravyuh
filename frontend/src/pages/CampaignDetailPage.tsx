import { AudioLines, FileText, GitCompareArrows, Octagon, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { endpoints, type ResultFilters } from '../api/endpoints'
import {
  isActiveStatus,
  useCampaign,
  useCampaignLive,
  useCampaignMissions,
  useCampaignResults,
  useHardening,
  useVoiceComparison,
} from '../api/hooks/queries'
import { useAction } from '../api/hooks/useAction'
import { HardeningChart } from '../components/charts/HardeningChart'
import { StatusBadge } from '../components/domain/Badges'
import { FixPanel } from '../components/domain/FixPanel'
import { ChakravyuhFormation } from '../components/domain/ChakravyuhFormation'
import { LivePipeline } from '../components/domain/LivePipeline'
import { MissionCard } from '../components/domain/MissionTimeline'
import { ResultsTable } from '../components/domain/ResultsTable'
import { VoiceComparisonCard } from '../components/domain/VoiceComparisonCard'
import { Button, LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { Select } from '../components/ui/Form'
import { EmptyState, ProgressBar, StatTile } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { dateTime, duration } from '../lib/format'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../lib/labels'
import { LANGUAGES } from '../lib/languages'
import { pick, useIdParam } from '../lib/params'
import { SEVERITY_ORDER, SEVERITY_STYLES } from '../lib/severity'
import { useToast } from '../lib/toast'
import type { AttackCategory, LanguageCode, Severity, Verdict } from '../types/domain'

const PAGE = 25
const LANGS = Object.keys(LANGUAGES) as LanguageCode[]
const VERDICTS: readonly Verdict[] = ['vulnerable', 'inconclusive', 'safe', 'error']

export function CampaignDetailPage() {
  const campaignId = useIdParam('campaignId')
  if (campaignId === null) return <ErrorNotice error={{ name: 'ApiError', message: 'Invalid campaign id', status: 404, code: 'not_found', details: null }} />
  return <CampaignDetail campaignId={campaignId} />
}

function CampaignDetail({ campaignId }: { campaignId: number }) {
  const navigate = useNavigate()
  const toast = useToast()
  const campaign = useCampaign(campaignId)
  const active = isActiveStatus(campaign.data?.status)

  const [severity, setSeverity] = useState<Severity | ''>('')
  const [language, setLanguage] = useState<LanguageCode | ''>('')
  const [category, setCategory] = useState<AttackCategory | ''>('')
  const [verdict, setVerdict] = useState<Verdict | ''>('')
  const [offset, setOffset] = useState(0)

  const filters: ResultFilters = { offset, limit: PAGE }
  if (severity) filters.severity = severity
  if (language) filters.language = language
  if (category) filters.category = category
  if (verdict) filters.verdict = verdict
  const results = useCampaignResults(campaignId, filters, active, campaign.data?.status ?? 'loading')
  const missions = useCampaignMissions(campaignId, active, campaign.data?.status ?? 'loading')
  const live = useCampaignLive(campaignId, active, campaign.data?.status ?? 'loading')
  const hardening = useHardening(campaignId)
  const isVoiceReplay = campaign.data?.config.mode === 'voice_replay'
  const voiceCmp = useVoiceComparison(campaignId, isVoiceReplay && !active, campaign.data?.status ?? 'loading')
  const replay = useAction(endpoints.startVoiceReplay)

  const onVoiceReplay = async () => {
    const created = await replay.run(campaignId, { max_attacks: 10 })
    if (created) {
      toast.show('Replaying 10 attacks as speech (each also re-sent as text)', 'success')
      navigate(`/campaigns/${created.id}`)
    }
  }

  const cancel = useAction(endpoints.cancelCampaign)
  const regress = useAction(endpoints.createRegression)

  const resetPage = () => setOffset(0)

  const onRegression = async () => {
    const run = await regress.run(campaignId, { only_failed: true, trials: 3 })
    if (run) {
      toast.show('Regression started', 'success')
      navigate(`/regression/${run.id}`)
    }
  }

  if (campaign.loading) return <Skeleton className="h-96" />
  if (campaign.error && !campaign.data) return <ErrorNotice error={campaign.error} onRetry={campaign.reload} />
  const c = campaign.data
  if (!c) return null

  const failed = c.counts.vulnerable + c.counts.inconclusive
  const total = results.data?.total ?? 0

  return (
    <>
      <PageHeader
        title={c.name}
        description={`${c.target_name} · started ${c.started_at ? dateTime(c.started_at) : 'queued'} · ${duration(c.started_at, c.finished_at)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            {active && (
              <Button variant="danger" size="sm" icon={<Octagon className="size-3.5" aria-hidden />} loading={cancel.pending} onClick={() => void cancel.run(campaignId).then(campaign.reload)}>
                Cancel
              </Button>
            )}
            {c.latest_regression_id !== null && (
              <LinkButton size="sm" to={`/regression/${c.latest_regression_id}`} icon={<GitCompareArrows className="size-3.5" aria-hidden />}>
                Last regression
              </LinkButton>
            )}
            {!active && c.parent_campaign_id === null && (
              <Button size="sm" icon={<AudioLines className="size-3.5" aria-hidden />} loading={replay.pending} onClick={() => void onVoiceReplay()}>
                Replay as voice
              </Button>
            )}
            {!active && failed > 0 && c.parent_campaign_id === null && (
              <Button size="sm" icon={<RotateCw className="size-3.5" aria-hidden />} loading={regress.pending} onClick={() => void onRegression()}>
                Rerun failed (×3)
              </Button>
            )}
            <LinkButton size="sm" variant="primary" to={`/campaigns/${campaignId}/report`} icon={<FileText className="size-3.5" aria-hidden />}>
              Report
            </LinkButton>
          </div>
        }
      />
      {replay.error && <div className="mb-4"><ErrorNotice error={replay.error} /></div>}
      {isVoiceReplay && voiceCmp.data && (
        <div className="mb-6">
          <VoiceComparisonCard cmp={voiceCmp.data} />
        </div>
      )}
      {c.parent_campaign_id !== null && isVoiceReplay && (
        <p className="mb-4 text-sm text-zinc-400">
          Voice replay of{' '}
          <Link className="text-accent-400 hover:underline" to={`/campaigns/${c.parent_campaign_id}`}>
            campaign #{c.parent_campaign_id}
          </Link>
          : each attack was re-sent as text and spoken through Sarvam TTS → STT.
        </p>
      )}
      {c.parent_campaign_id !== null && !isVoiceReplay && (
        <p className="mb-4 text-sm text-zinc-400">
          Regression rerun of{' '}
          <Link className="text-accent-400 hover:underline" to={`/campaigns/${c.parent_campaign_id}`}>
            campaign #{c.parent_campaign_id}
          </Link>
          {c.regression_id !== null && (
            <>
              {' · '}
              <Link className="text-accent-400 hover:underline" to={`/regression/${c.regression_id}`}>
                before/after comparison
              </Link>
            </>
          )}
        </p>
      )}
      {c.error_message !== null && c.status === 'failed' && (
        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{c.error_message}</p>
      )}
      {regress.error && <div className="mb-4"><ErrorNotice error={regress.error} /></div>}

      {live.data && !active && c.completed_cases > 0 ? (
        <div className="mb-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="[&>div]:mb-0">
            <LivePipeline campaign={c} live={live.data} />
          </div>
          <Card title="This campaign’s Chakravyuh" description="Each ring is a language; gaps are attacks that got through.">
            <ChakravyuhFormation campaignId={c.id} />
          </Card>
        </div>
      ) : live.data ? (
        <LivePipeline campaign={c} live={live.data} />
      ) : (
        <Card className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-zinc-300">{active ? 'Attacking…' : 'Progress'}</span>
            <span className="font-mono text-zinc-400">
              {c.completed_cases}/{c.total_cases}
            </span>
          </div>
          <ProgressBar value={c.progress} />
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatTile label="Vulnerable" value={c.counts.vulnerable} tone={c.counts.vulnerable > 0 ? 'text-red-300' : undefined} />
        <StatTile label="Safe" value={c.counts.safe} tone="text-emerald-300" />
        <StatTile label="Needs review" value={c.counts.inconclusive} tone="text-amber-200" />
        <StatTile label="Errors" value={c.counts.errors} hint="Target or Sarvam failures" />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Severity</p>
          <ul className="mt-2 space-y-1">
            {SEVERITY_ORDER.filter((s) => s !== 'none').map((s) => (
              <li key={s} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className={`size-2 rounded-full ${SEVERITY_STYLES[s].dot}`} aria-hidden />
                  {SEVERITY_STYLES[s].label}
                </span>
                <span className="font-mono text-zinc-200">{c.counts.by_severity[s]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {c.config.mode === 'adaptive' && (
        <section className="mb-6 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Adaptive attacker missions</h2>
              <p className="text-xs text-zinc-500">
                Sarvam-105B read each reply and changed tactic, persona and script. Open a mission to watch it adapt.
              </p>
            </div>
            {missions.data && (
              <p className="text-sm text-zinc-300">
                <span className="font-semibold text-red-300">{missions.data.breached}</span> of {missions.data.total} breached
              </p>
            )}
          </div>
          {missions.data?.items.length === 0 && <p className="text-sm text-zinc-500">Waiting for the first mission to start…</p>}
          {missions.data?.items.map((m, index) => (
            <MissionCard key={m.mission_id} mission={m} defaultOpen={m.breached && index < 2} />
          ))}
        </section>
      )}

      {!isVoiceReplay && (
        <div className="mb-6">
          <FixPanel campaignId={campaignId} />
        </div>
      )}

      {!isVoiceReplay && hardening.data && hardening.data.steps.length > 1 && (
        <Card className="mb-6" title="Hardening timeline" description="Attacks that still succeed after each fix round">
          <HardeningChart hardening={hardening.data} />
        </Card>
      )}

      <Card
        title="Findings"
        description="Click a row for the full evidence. Sorted by severity."
      >
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Select aria-label="Severity" value={severity} onChange={(e) => { setSeverity(pick(e.target.value, SEVERITY_ORDER) ?? ''); resetPage() }}>
            <option value="">All severities</option>
            {SEVERITY_ORDER.map((s) => <option key={s} value={s}>{SEVERITY_STYLES[s].label}</option>)}
          </Select>
          <Select aria-label="Language" value={language} onChange={(e) => { setLanguage(pick(e.target.value, LANGS) ?? ''); resetPage() }}>
            <option value="">All languages</option>
            {LANGS.map((l) => <option key={l} value={l}>{LANGUAGES[l].label}</option>)}
          </Select>
          <Select aria-label="Category" value={category} onChange={(e) => { setCategory(pick(e.target.value, CATEGORY_ORDER) ?? ''); resetPage() }}>
            <option value="">All categories</option>
            {CATEGORY_ORDER.map((cat) => <option key={cat} value={cat}>{CATEGORY_LABELS[cat].label}</option>)}
          </Select>
          <Select aria-label="Verdict" value={verdict} onChange={(e) => { setVerdict(pick(e.target.value, VERDICTS) ?? ''); resetPage() }}>
            <option value="">All verdicts</option>
            {VERDICTS.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </div>
        {results.error && !results.data && <ErrorNotice error={results.error} onRetry={results.reload} />}
        {results.loading && <Skeleton className="h-64" />}
        {results.data && results.data.items.length === 0 && (
          <EmptyState icon={FileText} title={active ? 'Waiting for the first results…' : 'No results match these filters'} />
        )}
        {results.data && results.data.items.length > 0 && <ResultsTable items={results.data.items} />}
        {total > PAGE && (
          <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 text-xs text-zinc-500">
            <span>
              {offset + 1}–{Math.min(offset + PAGE, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</Button>
              <Button size="sm" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </>
  )
}
