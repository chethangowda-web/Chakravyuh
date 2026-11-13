import { Gavel, ScanSearch } from 'lucide-react'

import { pct } from '../../lib/format'

interface ConfirmationBarProps {
  confirmed: number
  likely: number
}

/** How findings were decided: deterministic proof vs the model judge (answers the self-grading objection). */
export function ConfirmationBar({ confirmed, likely }: ConfirmationBarProps) {
  const total = confirmed + likely
  if (total === 0) return null
  const share = confirmed / total
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-zinc-100">How the {total} findings were confirmed</span>
        <span className="text-xs text-zinc-500">The AI judge only decides what the rules cannot, and must quote its evidence</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-zinc-800" role="img" aria-label={`${pct(share)} proven by rules`}>
        <div className="bg-emerald-500" style={{ width: `${share * 100}%` }} />
        <div className="bg-sky-400" style={{ width: `${(1 - share) * 100}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-emerald-300">
          <ScanSearch className="size-3.5" aria-hidden /> {pct(share)} proven by deterministic checks ({confirmed}) — leaked secret,
          PII pattern, executed injection code, prompt overlap
        </span>
        <span className="flex items-center gap-1.5 text-sky-300">
          <Gavel className="size-3.5" aria-hidden /> {pct(1 - share)} decided by the Sarvam-105B judge ({likely})
        </span>
      </div>
    </div>
  )
}
