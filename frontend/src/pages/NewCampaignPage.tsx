import { AlertTriangle, Brain, Library, Rocket } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { endpoints } from '../api/endpoints'
import { useApiQuery } from '../api/hooks/useApiQuery'
import { useAction } from '../api/hooks/useAction'
import { useTargets } from '../api/hooks/queries'
import { Button, LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { ChipGroup, Field, Input, Select } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { cn } from '../lib/cn'
import { CATEGORY_LABELS, CATEGORY_ORDER, WRAPPER_LABELS } from '../lib/labels'
import { LANGUAGES, VARIANT_LABELS } from '../lib/languages'
import type { AttackCategory, AttackMode, AttackWrapper, CampaignConfig, LanguageCode, ScriptVariant } from '../types/domain'

const LANGS = Object.keys(LANGUAGES) as LanguageCode[]
const VARIANTS = Object.keys(VARIANT_LABELS) as ScriptVariant[]
const WRAPPERS = Object.keys(WRAPPER_LABELS) as AttackWrapper[]

const MODES: ReadonlyArray<{ value: AttackMode; title: string; icon: typeof Brain; text: string; badge?: string }> = [
  {
    value: 'adaptive',
    title: 'Adaptive AI attacker',
    icon: Brain,
    badge: 'New',
    text: 'Sarvam-105B plays the attacker. It reads how your bot refused and changes tactic, persona and script until it breaks through, or gives up.',
  },
  {
    value: 'static',
    title: 'Attack library',
    icon: Library,
    text: '20 curated attacks, each localized by Sarvam Translate into native, romanized and code-mixed forms. Broad and repeatable.',
  },
]

export function NewCampaignPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const targets = useTargets()
  const create = useAction(endpoints.createCampaign)

  const [targetChoice, setTargetChoice] = useState(params.get('target') ?? '')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<AttackMode>('adaptive')
  const [maxTurns, setMaxTurns] = useState(4)
  const [categories, setCategories] = useState<AttackCategory[]>(['sensitive_data_leak', 'system_prompt_extraction', 'instruction_override'])
  const [languages, setLanguages] = useState<LanguageCode[]>(['en-IN', 'hi-IN', 'kn-IN'])
  const [variants, setVariants] = useState<ScriptVariant[]>(['native', 'code_mixed'])
  const [wrappers, setWrappers] = useState<AttackWrapper[]>([])
  const [useJudge, setUseJudge] = useState(true)

  const adaptive = mode === 'adaptive'
  const items = targets.data?.items ?? []
  const target = items.find((t) => String(t.id) === targetChoice) ?? items.find((t) => t.verification_status === 'verified') ?? items[0]
  const config: CampaignConfig = {
    mode,
    max_turns: maxTurns,
    categories,
    languages,
    variants: adaptive ? ['native'] : variants,
    wrappers: adaptive ? [] : wrappers,
    use_judge: useJudge,
    max_cases: 300,
  }
  const configJson = JSON.stringify(config)
  const targetId = target?.id ?? null
  const ready = targetId !== null && categories.length > 0 && languages.length > 0 && (adaptive || variants.length > 0)

  const estimateFetcher = useCallback(
    () =>
      ready
        ? endpoints.estimateCampaign({ target_id: targetId, config: JSON.parse(configJson) as CampaignConfig })
        : Promise.resolve(null),
    [ready, targetId, configJson],
  )
  const estimate = useApiQuery(`estimate:${targetId ?? 'none'}:${ready}:${configJson}`, estimateFetcher)

  const launch = async () => {
    if (targetId === null) return
    const campaign = await create.run({
      target_id: targetId,
      name: name.trim() || `${target?.name ?? 'Target'} · ${adaptive ? 'adaptive' : 'library'} · ${new Date().toLocaleDateString('en-IN')}`,
      config,
    })
    if (campaign) navigate(`/campaigns/${campaign.id}`)
  }

  const unverified = target !== undefined && target.verification_status !== 'verified'
  const est = estimate.data
  const unit = adaptive ? 'Missions' : 'Tests'

  return (
    <>
      <PageHeader title="New campaign" description="Choose what to attack, in which languages, and how." />
      {targets.loading && <Skeleton className="h-96" />}
      {targets.error && <ErrorNotice error={targets.error} onRetry={targets.reload} />}
      {targets.data && items.length === 0 && (
        <Card>
          <p className="text-sm text-zinc-400">You need a target first.</p>
          <LinkButton to="/targets/new" variant="primary" className="mt-3">Register a target</LinkButton>
        </Card>
      )}
      {targets.data && items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card title="1 · Attack mode">
              <div className="grid gap-3 sm:grid-cols-2">
                {MODES.map((m) => {
                  const Icon = m.icon
                  const on = mode === m.value
                  return (
                    <button
                      key={m.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setMode(m.value)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-colors',
                        on ? 'border-accent-500/60 bg-accent-500/10' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('size-5', on ? 'text-accent-300' : 'text-zinc-500')} aria-hidden />
                        <span className="text-sm font-semibold text-zinc-100">{m.title}</span>
                        {m.badge !== undefined && (
                          <span className="rounded bg-accent-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-300">{m.badge}</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{m.text}</p>
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card title="2 · Target">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Target" htmlFor="target">
                  <Select id="target" value={String(target?.id ?? '')} onChange={(e) => setTargetChoice(e.target.value)}>
                    {items.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.verification_status === 'verified' ? '' : ' (unverified)'}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Campaign name" htmlFor="name">
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Baseline multilingual scan" />
                </Field>
              </div>
              {unverified && (
                <p className="mt-3 flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden />
                  This target is not verified yet. Verify ownership on its page before launching.
                </p>
              )}
            </Card>

            <Card title="3 · Attack goals" description={adaptive ? 'Each goal in each language becomes one mission.' : undefined}>
              <ChipGroup
                options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c].label }))}
                selected={categories}
                onChange={setCategories}
              />
              {adaptive && (
                <div className="mt-5 max-w-xs">
                  <Field label="Attempts per mission" htmlFor="turns" hint="A mission stops at its first successful attack.">
                    <Select id="turns" value={String(maxTurns)} onChange={(e) => setMaxTurns(Number(e.target.value))}>
                      {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} attempts</option>)}
                    </Select>
                  </Field>
                </div>
              )}
            </Card>

            <Card
              title={adaptive ? '4 · Languages' : '4 · Languages and script variants'}
              description={adaptive ? 'The attacker chooses native, romanized or code-mixed style itself, and Sarvam Translate renders it.' : 'English is always tested natively as the baseline for the Language Security Gap.'}
            >
              <div className="space-y-5">
                <ChipGroup options={LANGS.map((l) => ({ value: l, label: LANGUAGES[l].native }))} selected={languages} onChange={setLanguages} />
                {!adaptive && (
                  <ChipGroup options={VARIANTS.map((v) => ({ value: v, label: VARIANT_LABELS[v] }))} selected={variants} onChange={setVariants} />
                )}
              </div>
            </Card>

            <Card title="5 · Advanced">
              <div className="space-y-4">
                {!adaptive && (
                  <Field label="Wrappers (each adds one extra test per attack and language)" htmlFor="wrappers">
                    <ChipGroup options={WRAPPERS.map((w) => ({ value: w, label: WRAPPER_LABELS[w] }))} selected={wrappers} onChange={setWrappers} />
                  </Field>
                )}
                <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-300">
                  <input type="checkbox" className="mt-1 size-4 accent-teal-500" checked={useJudge} onChange={(e) => setUseJudge(e.target.checked)} />
                  <span>
                    Use the Sarvam-105B judge for responses the deterministic checks cannot decide
                    <span className="block text-xs text-zinc-500">Costs credits; findings it decides are labelled “likely”.</span>
                  </span>
                </label>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <Card title="Review">
                {estimate.loading && <Skeleton className="h-28" />}
                {estimate.error && <ErrorNotice error={estimate.error} onRetry={estimate.reload} />}
                {est && (
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between"><dt className="text-zinc-400">{unit}</dt><dd className="font-mono text-lg font-semibold text-zinc-100">{est.total_cases}</dd></div>
                    <div className="flex justify-between"><dt className="text-zinc-400">{adaptive ? 'Target calls (max)' : 'Target calls'}</dt><dd className="font-mono text-zinc-200">{est.estimated_target_calls}</dd></div>
                    <div className="flex justify-between"><dt className="text-zinc-400">Sarvam calls (max)</dt><dd className="font-mono text-zinc-200">~{est.estimated_sarvam_calls}</dd></div>
                    {!adaptive && <p className="text-[11px] text-zinc-500">Repeat translations are cached and cost nothing.</p>}
                    {est.warnings.map((w) => (
                      <p key={w} className="rounded-md border border-amber-400/30 bg-amber-400/5 px-2.5 py-2 text-xs text-amber-200">{w}</p>
                    ))}
                  </dl>
                )}
                {est === null && !estimate.loading && <p className="text-sm text-zinc-500">Select at least one option in each step.</p>}
                {create.error && <div className="mt-3"><ErrorNotice error={create.error} /></div>}
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  icon={<Rocket className="size-4" aria-hidden />}
                  loading={create.pending}
                  disabled={!ready || unverified || (est?.total_cases ?? 0) === 0}
                  onClick={() => void launch()}
                >
                  Launch campaign
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
