import { Check, Copy, GitCompareArrows, Loader2, Sparkles, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { endpoints } from '../../api/endpoints'
import { isActiveStatus, useCampaign, useCampaignFixes, useTarget } from '../../api/hooks/queries'
import { useAction } from '../../api/hooks/useAction'
import { useToast } from '../../lib/toast'
import type { FixProposal } from '../../types/domain'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ErrorNotice } from '../ui/ErrorNotice'
import { Skeleton } from '../ui/Skeleton'
import { PromptDiff } from './PromptDiff'

/**
 * Auto-fix loop: Sarvam proposes a prompt patch from this campaign's successful attacks;
 * apply it (webhook or by hand) and a regression run proves whether it worked.
 */
export function FixPanel({ campaignId }: { campaignId: number }) {
  const navigate = useNavigate()
  const toast = useToast()
  const campaign = useCampaign(campaignId)
  const target = useTarget(campaign.data?.target_id ?? null)
  const [refresh, setRefresh] = useState(0)
  const fixes = useCampaignFixes(campaignId, refresh)
  const propose = useAction(endpoints.proposeFix)
  const apply = useAction(endpoints.applyFix)
  const [copied, setCopied] = useState(false)

  const c = campaign.data
  if (!c) return campaign.loading ? <Skeleton className="h-32" /> : null
  const failing = c.counts.vulnerable
  const finished = !isActiveStatus(c.status)
  if (!finished || failing === 0) return null

  const latest = fixes.data?.items[0]
  const pending: FixProposal | undefined = latest && !latest.applied ? latest : undefined
  const baselineStatus = pending?.helpfulness_before?.status
  const baselineRunning = baselineStatus === 'queued' || baselineStatus === 'running'
  const webhook = target.data?.fix_webhook_url ?? null

  const onPropose = async () => {
    const fix = await propose.run(campaignId)
    if (fix) {
      setRefresh((n) => n + 1)
      toast.show('Sarvam wrote a fix — review it below', 'success')
    }
  }

  const onApply = async (fix: FixProposal, via: 'webhook' | 'manual') => {
    const applied = await apply.run(fix.id, { via, trials: 1 })
    if (applied?.regression_id != null) {
      toast.show('Fix applied — re-running the attacks that worked', 'success')
      navigate(`/regression/${applied.regression_id}`)
    } else if (applied) {
      setRefresh((n) => n + 1)
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.show('Copy failed — select the text manually', 'error')
    }
  }

  return (
    <Card
      title="Auto-fix with Sarvam"
      description={`${failing} attack${failing === 1 ? '' : 's'} succeeded. Sarvam-105B can patch the system prompt; a regression run then proves whether the patch works.`}
      actions={
        !pending && (
          <Button variant="primary" icon={<Sparkles className="size-4" aria-hidden />} loading={propose.pending} onClick={() => void onPropose()}>
            {latest ? 'Suggest another fix' : 'Suggest a fix'}
          </Button>
        )
      }
    >
      {propose.error && <div className="mb-4"><ErrorNotice error={propose.error} /></div>}
      {apply.error && <div className="mb-4"><ErrorNotice error={apply.error} /></div>}

      {!pending && !propose.pending && (
        <p className="text-sm text-zinc-400">
          {latest ? (
            <>
              Last fix was applied.{' '}
              {latest.regression_id !== null && (
                <Link to={`/regression/${latest.regression_id}`} className="text-accent-400 hover:underline">
                  See its result
                </Link>
              )}
            </>
          ) : (
            'No fix proposed yet. The patch is built from the attacks that worked, in every language they used.'
          )}
        </p>
      )}
      {propose.pending && <Skeleton className="h-40" />}

      {pending && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="size-4 text-accent-400" aria-hidden />
              <p className="text-sm font-semibold text-zinc-100">Proposed patch</p>
              <Badge>written from {pending.fix_set_size} of {pending.failures_considered} successful attacks</Badge>
              {pending.heldout_set_size > 0 && (
                <Badge tone="accent">{pending.heldout_set_size} held out to test generalization</Badge>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{pending.summary}</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-zinc-400">
              {pending.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </div>

          {pending.revised_prompt !== null ? (
            <PromptDiff before={pending.previous_prompt ?? ''} after={pending.revised_prompt} />
          ) : (
            <div>
              <p className="mb-2 text-xs text-zinc-500">No stored prompt to compare — append these rules to your system prompt:</p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
                {pending.addendum}
              </pre>
            </div>
          )}

          {baselineRunning && (
            <p className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Measuring how many legitimate questions the bot answers before the patch (over-refusal baseline)…
            </p>
          )}
          {pending.helpfulness_before?.answer_rate != null && (
            <p className="text-xs text-zinc-400">
              Baseline: the bot answers {Math.round(pending.helpfulness_before.answer_rate * 100)}% of legitimate questions.
              After applying, the same questions are asked again.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-4">
            {webhook !== null && (
              <Button variant="primary" icon={<GitCompareArrows className="size-4" aria-hidden />} loading={apply.pending} disabled={baselineRunning} onClick={() => void onApply(pending, 'webhook')}>
                Apply to target &amp; verify
              </Button>
            )}
            <Button
              variant={webhook === null ? 'primary' : 'secondary'}
              loading={apply.pending && webhook === null}
              disabled={baselineRunning}
              onClick={() => void onApply(pending, 'manual')}
            >
              I applied it myself — verify
            </Button>
            <Button
              variant="ghost"
              icon={copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              onClick={() => void copy(pending.revised_prompt ?? pending.addendum ?? '')}
            >
              {copied ? 'Copied' : 'Copy patch'}
            </Button>
            {webhook === null && (
              <span className="text-xs text-zinc-500">Set a fix webhook on the target to apply patches in one click.</span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
