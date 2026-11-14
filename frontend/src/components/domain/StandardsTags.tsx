import { Landmark, ScrollText } from 'lucide-react'

import { DPDP_NOTE, OWASP_URL, owaspFor } from '../../lib/standards'
import type { AttackCategory } from '../../types/domain'

/** OWASP LLM Top 10 label and (when personal data may be involved) a DPDP Act note for one finding. */
export function StandardsTags({ category, personalData }: { category: AttackCategory; personalData: boolean }) {
  const owasp = owaspFor(category)
  if (owasp === null && !personalData) return null
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
      <span className="text-zinc-500">Maps to</span>
      {owasp !== null && (
        <a
          href={OWASP_URL}
          target="_blank"
          rel="noreferrer"
          title="OWASP Top 10 for LLM Applications (2025)"
          className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-violet-200 hover:border-violet-400/60"
        >
          <ScrollText className="size-3.5" aria-hidden />
          OWASP {owasp.code} · {owasp.name}
        </a>
      )}
      {personalData && (
        <span
          title={DPDP_NOTE}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-amber-100"
        >
          <Landmark className="size-3.5" aria-hidden />
          Possible DPDP Act §8(5) concern: personal data in reply
        </span>
      )}
    </div>
  )
}
