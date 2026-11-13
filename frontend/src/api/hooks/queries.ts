import { useCallback } from 'react'

import type { CampaignStatus } from '../../types/domain'
import { type ResultFilters, endpoints } from '../endpoints'
import { useApiQuery } from './useApiQuery'

const ACTIVE_POLL_MS = 1500

export function isActiveStatus(status: CampaignStatus | undefined): boolean {
  return status === 'queued' || status === 'running'
}

export function useTargets() {
  return useApiQuery('targets', endpoints.listTargets)
}

export function useTarget(targetId: number | null) {
  const fetcher = useCallback(
    (signal: AbortSignal) => (targetId === null ? Promise.resolve(null) : endpoints.getTarget(targetId, signal)),
    [targetId],
  )
  return useApiQuery(`target:${targetId ?? 'none'}`, fetcher)
}

export function useAttackTemplates() {
  return useApiQuery('attack-templates', endpoints.listAttackTemplates)
}

/** Polls while any campaign is queued/running. */
export function useCampaigns() {
  const fetcher = useCallback((signal: AbortSignal) => endpoints.listCampaigns(signal), [])
  return useApiQuery('campaigns', fetcher, {
    intervalMs: (data) => (data?.items.some((c) => isActiveStatus(c.status)) ? 3000 : undefined),
  })
}

/** Polls every 1.5 s until the campaign finishes. */
export function useCampaign(campaignId: number) {
  const fetcher = useCallback((signal: AbortSignal) => endpoints.getCampaign(campaignId, signal), [campaignId])
  return useApiQuery(`campaign:${campaignId}`, fetcher, {
    intervalMs: (data) => (data === undefined || isActiveStatus(data.status) ? ACTIVE_POLL_MS : undefined),
  })
}

/** `statusTag` forces one last refetch when the campaign status changes. */
export function useCampaignResults(campaignId: number, filters: ResultFilters, active: boolean, statusTag: string) {
  const filtersJson = JSON.stringify(filters) // compare filters by value, not identity
  const fetcher = useCallback(
    (signal: AbortSignal) =>
      endpoints.listCampaignResults(campaignId, JSON.parse(filtersJson) as ResultFilters, signal),
    [campaignId, filtersJson],
  )
  return useApiQuery(`results:${campaignId}:${filtersJson}:${statusTag}`, fetcher, {
    intervalMs: active ? ACTIVE_POLL_MS * 2 : undefined,
  })
}

export function useResult(resultId: number) {
  const fetcher = useCallback((signal: AbortSignal) => endpoints.getResult(resultId, signal), [resultId])
  return useApiQuery(`result:${resultId}`, fetcher)
}

/** Dashboard refreshes every 5 s so numbers move while a campaign runs. */
export function useDashboard(campaignId: number | null) {
  const fetcher = useCallback(
    (signal: AbortSignal) => endpoints.getDashboardSummary(campaignId, signal),
    [campaignId],
  )
  return useApiQuery(`dashboard:${campaignId ?? 'all'}`, fetcher, { intervalMs: 5000 })
}

export function useRegression(regressionId: number) {
  const fetcher = useCallback((signal: AbortSignal) => endpoints.getRegression(regressionId, signal), [regressionId])
  return useApiQuery(`regression:${regressionId}`, fetcher, {
    intervalMs: (data) => (data === undefined || isActiveStatus(data.status) ? ACTIVE_POLL_MS * 2 : undefined),
  })
}

/** Live pipeline counts + feed: polls every 1.5 s while running, one last fetch when the status changes. */
export function useCampaignLive(campaignId: number, active: boolean, statusTag: string) {
  const fetcher = useCallback((signal: AbortSignal) => endpoints.getCampaignLive(campaignId, signal), [campaignId])
  return useApiQuery(`live:${campaignId}:${statusTag}`, fetcher, { intervalMs: active ? ACTIVE_POLL_MS : undefined })
}

/** Adaptive missions refresh while the campaign is running. */
export function useCampaignMissions(campaignId: number, active: boolean, statusTag: string) {
  const fetcher = useCallback((signal: AbortSignal) => endpoints.listCampaignMissions(campaignId, signal), [campaignId])
  return useApiQuery(`missions:${campaignId}:${statusTag}`, fetcher, { intervalMs: active ? ACTIVE_POLL_MS * 2 : undefined })
}

/** Keeps polling while a fix's helpfulness checks are still being measured. */
export function useCampaignFixes(campaignId: number, refreshTag: number) {
  const fetcher = useCallback((signal: AbortSignal) => endpoints.listCampaignFixes(campaignId, signal), [campaignId])
  return useApiQuery(`fixes:${campaignId}:${refreshTag}`, fetcher, {
    intervalMs: (data) =>
      data?.items.some((f) =>
        [f.helpfulness_before, f.helpfulness_after].some((h) => h !== null && isActiveStatus(h.status)),
      )
        ? 3000
        : undefined,
  })
}

export function useFix(fixId: number | null) {
  const fetcher = useCallback(
    (signal: AbortSignal) => (fixId === null ? Promise.resolve(null) : endpoints.getFix(fixId, signal)),
    [fixId],
  )
  return useApiQuery(`fix:${fixId ?? 'none'}`, fetcher, {
    intervalMs: (data) =>
      data && [data.helpfulness_before, data.helpfulness_after].some((h) => h !== null && isActiveStatus(h.status))
        ? 3000
        : undefined,
  })
}

export function useVoiceComparison(campaignId: number, enabled: boolean, statusTag: string) {
  const fetcher = useCallback(
    (signal: AbortSignal) => (enabled ? endpoints.getVoiceComparison(campaignId, signal) : Promise.resolve(null)),
    [campaignId, enabled],
  )
  return useApiQuery(`voice-comparison:${campaignId}:${enabled}:${statusTag}`, fetcher)
}

/** The hardening timeline; keeps refreshing while a rerun is in progress. */
export function useHardening(campaignId: number) {
  const fetcher = useCallback((signal: AbortSignal) => endpoints.getHardening(campaignId, signal), [campaignId])
  return useApiQuery(`hardening:${campaignId}`, fetcher, {
    intervalMs: (data) => (data?.steps.some((s) => isActiveStatus(s.status)) ? ACTIVE_POLL_MS * 2 : undefined),
  })
}

export function useCampaignReport(campaignId: number) {
  const fetcher = useCallback((signal: AbortSignal) => endpoints.getCampaignReport(campaignId, signal), [campaignId])
  return useApiQuery(`report:${campaignId}`, fetcher)
}
