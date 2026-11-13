import { ApiError, api, baseUrl, errorFromResponse, unwrap, unwrapVoid } from './client'
import type { components, paths } from './schema'

type S = components['schemas']

export type ResultFilters = NonNullable<paths['/api/v1/campaigns/{campaign_id}/results']['get']['parameters']['query']>

/**
 * Typed endpoint functions — one per backend operation. Components call these
 * (directly for actions, via hooks for queries) and never `fetch` themselves.
 */
export const endpoints = {
  // System
  getHealth: (signal: AbortSignal) => unwrap(api.GET('/api/v1/health', { signal })),
  getMetaEnums: (signal: AbortSignal) => unwrap(api.GET('/api/v1/meta/enums', { signal })),

  // Targets
  listTargets: (signal: AbortSignal) => unwrap(api.GET('/api/v1/targets', { signal })),
  getTarget: (targetId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/targets/{target_id}', { params: { path: { target_id: targetId } }, signal })),
  createTarget: (body: S['TargetCreate']) => unwrap(api.POST('/api/v1/targets', { body })),
  updateTarget: (targetId: number, body: S['TargetUpdate']) =>
    unwrap(api.PUT('/api/v1/targets/{target_id}', { params: { path: { target_id: targetId } }, body })),
  deleteTarget: (targetId: number) =>
    unwrapVoid(api.DELETE('/api/v1/targets/{target_id}', { params: { path: { target_id: targetId } } })),
  verifyTarget: (targetId: number) =>
    unwrap(api.POST('/api/v1/targets/{target_id}/verify', { params: { path: { target_id: targetId } } })),
  testTargetConnection: (targetId: number, body: S['TestConnectionRequest']) =>
    unwrap(
      api.POST('/api/v1/targets/{target_id}/test-connection', { params: { path: { target_id: targetId } }, body }),
    ),

  // Attacks
  listAttackTemplates: (signal: AbortSignal) => unwrap(api.GET('/api/v1/attacks/templates', { signal })),
  previewAttack: (body: S['AttackPreviewRequest']) => unwrap(api.POST('/api/v1/attacks/preview', { body })),
  generateParaphrases: (body: S['AttackGenerateRequest']) => unwrap(api.POST('/api/v1/attacks/generate', { body })),

  // Campaigns
  estimateCampaign: (body: S['CampaignEstimateRequest']) => unwrap(api.POST('/api/v1/campaigns/estimate', { body })),
  createCampaign: (body: S['CampaignCreate']) => unwrap(api.POST('/api/v1/campaigns', { body })),
  listCampaigns: (signal: AbortSignal) => unwrap(api.GET('/api/v1/campaigns', { signal })),
  getCampaign: (campaignId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/campaigns/{campaign_id}', { params: { path: { campaign_id: campaignId } }, signal })),
  getShieldOverview: (targetId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/shield/{target_id}', { params: { path: { target_id: targetId } }, signal })),
  protectTarget: (targetId: number) =>
    unwrap(api.POST('/api/v1/shield/{target_id}/protect', { params: { path: { target_id: targetId } } })),
  shieldChat: (targetId: number, message: string) =>
    unwrap(api.POST('/api/v1/shield/{target_id}/chat', { params: { path: { target_id: targetId } }, body: { message } })),
  runFalseBlockCheck: (targetId: number, languages: S['LanguageCode'][]) =>
    unwrap(
      api.POST('/api/v1/shield/{target_id}/false-block-check', { params: { path: { target_id: targetId } }, body: { languages } }),
    ),
  getCampaignLive: (campaignId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/campaigns/{campaign_id}/live', { params: { path: { campaign_id: campaignId } }, signal })),
  cancelCampaign: (campaignId: number) =>
    unwrap(api.POST('/api/v1/campaigns/{campaign_id}/cancel', { params: { path: { campaign_id: campaignId } } })),
  listCampaignResults: (campaignId: number, query: ResultFilters, signal: AbortSignal) =>
    unwrap(
      api.GET('/api/v1/campaigns/{campaign_id}/results', {
        params: { path: { campaign_id: campaignId }, query },
        signal,
      }),
    ),
  getResult: (resultId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/results/{result_id}', { params: { path: { result_id: resultId } }, signal })),
  getCampaignReport: (campaignId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/campaigns/{campaign_id}/report', { params: { path: { campaign_id: campaignId } }, signal })),

  // Adaptive attacker + auto-fix loop
  listCampaignMissions: (campaignId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/campaigns/{campaign_id}/missions', { params: { path: { campaign_id: campaignId } }, signal })),
  listCampaignFixes: (campaignId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/campaigns/{campaign_id}/fixes', { params: { path: { campaign_id: campaignId } }, signal })),
  proposeFix: (campaignId: number) =>
    unwrap(api.POST('/api/v1/campaigns/{campaign_id}/fixes', { params: { path: { campaign_id: campaignId } } })),
  applyFix: (fixId: number, body: S['FixApplyRequest']) =>
    unwrap(api.POST('/api/v1/fixes/{fix_id}/apply', { params: { path: { fix_id: fixId } }, body })),
  getFix: (fixId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/fixes/{fix_id}', { params: { path: { fix_id: fixId } }, signal })),
  startVoiceReplay: (campaignId: number, body: S['VoiceReplayRequest']) =>
    unwrap(api.POST('/api/v1/voice/replay/{campaign_id}', { params: { path: { campaign_id: campaignId } }, body })),
  getVoiceComparison: (campaignId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/voice/replay/{campaign_id}/comparison', { params: { path: { campaign_id: campaignId } }, signal })),
  getHardening: (campaignId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/campaigns/{campaign_id}/hardening', { params: { path: { campaign_id: campaignId } }, signal })),

  // Regression
  createRegression: (campaignId: number, body: S['RegressionCreate']) =>
    unwrap(
      api.POST('/api/v1/campaigns/{campaign_id}/regression', { params: { path: { campaign_id: campaignId } }, body }),
    ),
  getRegression: (regressionId: number, signal: AbortSignal) =>
    unwrap(api.GET('/api/v1/regression/{regression_id}', { params: { path: { regression_id: regressionId } }, signal })),

  // Dashboard
  getDashboardSummary: (campaignId: number | null, signal: AbortSignal) =>
    unwrap(
      api.GET('/api/v1/dashboard/summary', {
        params: { query: campaignId === null ? {} : { campaign_id: campaignId } },
        signal,
      }),
    ),

  // Voice
  synthesizeVoice: (body: S['SynthesizeRequest']) => unwrap(api.POST('/api/v1/voice/synthesize', { body })),
  runVoiceTest: (body: S['VoiceTestRequest']) => unwrap(api.POST('/api/v1/voice/test', { body })),
  /** Multipart upload — the one place that uses fetch directly, with the same typed errors. */
  uploadVoice: async (file: Blob, filename: string, language: S['LanguageCode'] | null): Promise<S['AudioAssetOut']> => {
    const form = new FormData()
    form.append('file', file, filename)
    if (language !== null) form.append('language', language)
    let response: Response
    try {
      response = await fetch(`${baseUrl}/api/v1/voice/upload`, { method: 'POST', body: form })
    } catch {
      throw new ApiError(0, 'network_error', 'Cannot reach the Chakravyuh API. Is the backend running?')
    }
    if (!response.ok) throw await errorFromResponse(response)
    return (await response.json()) as S['AudioAssetOut']
  },
  audioUrl: (audioId: string) => `${baseUrl}/api/v1/voice/audio/${encodeURIComponent(audioId)}`,
}
