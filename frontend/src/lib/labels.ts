import type {
  AttackCategory,
  AttackWrapper,
  CampaignStatus,
  Confidence,
  DetectorName,
  RegressionOutcome,
  Verdict,
} from '../types/domain'

export const CATEGORY_LABELS: Record<AttackCategory, { label: string; short: string }> = {
  prompt_injection: { label: 'Prompt injection', short: 'Injection' },
  jailbreak: { label: 'Jailbreak', short: 'Jailbreak' },
  instruction_override: { label: 'Instruction override', short: 'Override' },
  system_prompt_extraction: { label: 'System prompt extraction', short: 'Prompt leak' },
  sensitive_data_leak: { label: 'Sensitive data leak', short: 'Data leak' },
  harmful_content: { label: 'Harmful content (scams, bias, misinformation)', short: 'Harmful' },
}

export const CATEGORY_ORDER: readonly AttackCategory[] = [
  'prompt_injection',
  'instruction_override',
  'jailbreak',
  'system_prompt_extraction',
  'sensitive_data_leak',
  'harmful_content',
]

/** `staff_impersonation` -> `Staff impersonation`; `library:jb-dan` -> `Seed library`. */
export function tacticLabel(tactic: string | null): string {
  if (tactic === null) return 'Unknown tactic'
  if (tactic.startsWith('library:')) return 'Seed library (fallback)'
  const text = tactic.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const WRAPPER_LABELS: Record<AttackWrapper, string> = {
  script_switch: 'Script switch',
  roleplay_wrap: 'Role-play frame',
  translation_wrap: 'Translation frame',
}

export const STATUS_STYLES: Record<CampaignStatus, { label: string; className: string; pulse: boolean }> = {
  queued: { label: 'Queued', className: 'bg-zinc-800 text-zinc-300 ring-zinc-700', pulse: true },
  running: { label: 'Running', className: 'bg-accent-500/15 text-accent-300 ring-accent-500/30', pulse: true },
  completed: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30', pulse: false },
  failed: { label: 'Failed', className: 'bg-red-500/15 text-red-300 ring-red-500/30', pulse: false },
  cancelled: { label: 'Cancelled', className: 'bg-zinc-800 text-zinc-400 ring-zinc-700', pulse: false },
}

export const VERDICT_STYLES: Record<Verdict, { label: string; className: string }> = {
  vulnerable: { label: 'Vulnerable', className: 'text-red-300' },
  safe: { label: 'Safe', className: 'text-emerald-300' },
  inconclusive: { label: 'Needs review', className: 'text-amber-200' },
  error: { label: 'Error', className: 'text-zinc-400' },
}

export const CONFIDENCE_LABELS: Record<Confidence, { label: string; hint: string }> = {
  confirmed: { label: 'Confirmed', hint: 'A deterministic check proved it' },
  likely: { label: 'Likely', hint: 'Assessed by the Sarvam-105B judge' },
}

export const DETECTOR_LABELS: Record<DetectorName, { label: string; description: string }> = {
  canary: { label: 'Canary secret', description: 'A secret planted in the app appeared in the reply' },
  marker: { label: 'Injection marker', description: 'The code embedded in the attack was output, so the injected instruction ran' },
  pii: { label: 'Personal data', description: 'PAN, Aadhaar, mobile, account or key patterns not supplied by the attacker' },
  prompt_leak: { label: 'System prompt overlap', description: 'Verbatim 5-word sequences from the system prompt' },
  refusal: { label: 'Refusal', description: 'Multilingual refusal phrases (negative signal)' },
  judge: { label: 'Sarvam judge', description: 'sarvam-105b with structured output and a quoted-evidence check' },
}

export const OUTCOME_STYLES: Record<RegressionOutcome, { label: string; className: string }> = {
  fixed: { label: 'Fixed', className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  still_vulnerable: { label: 'Still vulnerable', className: 'bg-red-500/15 text-red-300 ring-red-500/30' },
  flaky: { label: 'Flaky', className: 'bg-amber-400/15 text-amber-200 ring-amber-400/30' },
  new_vulnerability: { label: 'New vulnerability', className: 'bg-orange-500/15 text-orange-300 ring-orange-500/30' },
}
