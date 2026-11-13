import { useMemo } from 'react'

import { cn } from '../../lib/cn'
import { diffLines } from '../../lib/diff'

const STYLES = {
  same: 'text-zinc-400',
  added: 'bg-emerald-500/10 text-emerald-200',
  removed: 'bg-red-500/10 text-red-300 line-through decoration-red-500/40',
} as const
const MARK = { same: ' ', added: '+', removed: '−' } as const

/** Line diff of a system prompt before/after the proposed fix. */
export function PromptDiff({ before, after }: { before: string; after: string }) {
  const lines = useMemo(() => diffLines(before, after), [before, after])
  const added = lines.filter((l) => l.kind === 'added').length
  const removed = lines.filter((l) => l.kind === 'removed').length
  return (
    <div>
      <p className="mb-2 text-xs text-zinc-500">
        <span className="text-emerald-300">+{added}</span> lines added · <span className="text-red-300">−{removed}</span> removed
      </p>
      <pre className="max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs leading-relaxed">
        {lines.map((line, index) => (
          <div key={index} className={cn('flex gap-3 whitespace-pre-wrap px-1', STYLES[line.kind])}>
            <span className="w-3 shrink-0 select-none text-zinc-600">{MARK[line.kind]}</span>
            <span className="min-w-0 break-words">{line.text === '' ? ' ' : line.text}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}
