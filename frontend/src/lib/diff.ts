export type DiffKind = 'same' | 'added' | 'removed'

export interface DiffLine {
  kind: DiffKind
  text: string
}

/** Line-level diff (longest common subsequence). Prompts are tens of lines, so O(n·m) is fine. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n')
  const b = after.split('\n')
  const rows = a.length + 1
  const cols = b.length + 1
  const table: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0))
  const at = (i: number, j: number): number => table[i]?.[j] ?? 0

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = table[i]
      if (row === undefined) continue
      row[j] = a[i] === b[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1))
    }
  }

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    const left = a[i] ?? ''
    const right = b[j] ?? ''
    if (left === right) {
      out.push({ kind: 'same', text: left })
      i++
      j++
    } else if (at(i + 1, j) >= at(i, j + 1)) {
      out.push({ kind: 'removed', text: left })
      i++
    } else {
      out.push({ kind: 'added', text: right })
      j++
    }
  }
  while (i < a.length) out.push({ kind: 'removed', text: a[i++] ?? '' })
  while (j < b.length) out.push({ kind: 'added', text: b[j++] ?? '' })
  return out
}
