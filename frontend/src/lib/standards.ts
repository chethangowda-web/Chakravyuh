import type { AttackCategory, ResultDetail } from '../types/domain'

/**
 * Maps Chakravyuh attack categories to the OWASP Top 10 for LLM Applications (2025 edition), and flags findings
 * that may touch personal data under India's DPDP Act, 2023.
 *
 * Deliberately conservative: a category with no clean OWASP entry is labelled as such, and the DPDP note says
 * "possible" and is indicative, not legal advice.
 */

export const OWASP_URL = 'https://genai.owasp.org/llm-top-10/'

export interface OwaspRef {
  code: string
  name: string
}

const OWASP: Record<AttackCategory, OwaspRef | null> = {
  prompt_injection: { code: 'LLM01', name: 'Prompt Injection' },
  jailbreak: { code: 'LLM01', name: 'Prompt Injection (jailbreaking)' },
  instruction_override: { code: 'LLM01', name: 'Prompt Injection' },
  system_prompt_extraction: { code: 'LLM07', name: 'System Prompt Leakage' },
  sensitive_data_leak: { code: 'LLM02', name: 'Sensitive Information Disclosure' },
  harmful_content: null, // content safety: not a clean fit for any OWASP LLM Top 10 entry
}

export function owaspFor(category: AttackCategory): OwaspRef | null {
  return OWASP[category]
}

export const DPDP_NOTE =
  'Possible DPDP Act, 2023 concern: personal data (Aadhaar, PAN, mobile or account numbers) appeared in a reply. ' +
  'Section 8(5) requires reasonable security safeguards against personal data breaches. Indicative only, not legal advice.'

/** A finding may touch personal data when the Indian-PII detector fired on the reply. */
export function mayExposePersonalData(hits: ResultDetail['detector_hits']): boolean {
  return hits.some((h) => h.detector === 'pii' && h.fired)
}
