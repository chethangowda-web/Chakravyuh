import { useNavigate } from 'react-router'

import { truncate } from '../../lib/format'
import { tacticLabel } from '../../lib/labels'
import type { ResultSummary } from '../../types/domain'
import { CategoryText, LangBadge, VariantBadge, VerdictText, VoiceBadge } from './Badges'
import { SeverityBadge } from './SeverityBadge'

export function ResultsTable({ items }: { items: readonly ResultSummary[] }) {
  const navigate = useNavigate()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="py-2.5 pr-3 font-medium">Severity</th>
            <th className="py-2.5 pr-3 font-medium">Language</th>
            <th className="py-2.5 pr-3 font-medium">Category</th>
            <th className="py-2.5 pr-3 font-medium">Attack</th>
            <th className="py-2.5 pr-3 font-medium">Verdict</th>
            <th className="py-2.5 text-right font-medium">Latency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/70">
          {items.map((r) => (
            <tr
              key={r.id}
              tabIndex={0}
              onClick={() => navigate(`/findings/${r.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/findings/${r.id}`)
              }}
              className="cursor-pointer align-top transition-colors hover:bg-zinc-800/40 focus:bg-zinc-800/40 focus:outline-none"
            >
              <td className="py-3 pr-3">
                <SeverityBadge severity={r.severity} />
              </td>
              <td className="py-3 pr-3">
                <div className="flex flex-col items-start gap-1">
                  <LangBadge language={r.language} />
                  <VariantBadge variant={r.variant} />
                </div>
              </td>
              <td className="py-3 pr-3">
                <CategoryText category={r.category} />
                {r.modality === 'voice' && (
                  <div className="mt-1">
                    <VoiceBadge />
                  </div>
                )}
                {r.trial > 1 && <div className="mt-1 text-[11px] text-zinc-500">trial {r.trial}</div>}
              </td>
              <td className="max-w-md py-3 pr-3 text-zinc-300">
                {truncate(r.attack_text, 140)}
                {r.turn !== null && (
                  <span className="mt-1 block text-[11px] text-zinc-500">
                    Turn {r.turn} · {tacticLabel(r.tactic)}
                  </span>
                )}
              </td>
              <td className="py-3 pr-3">
                <VerdictText verdict={r.verdict} confidence={r.confidence} />
              </td>
              <td className="py-3 text-right font-mono text-xs text-zinc-500">
                {r.latency_ms !== null ? `${r.latency_ms} ms` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
