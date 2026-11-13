import { useParams } from 'react-router'

/** Read a numeric route param; returns null when missing or not an integer. */
export function useIdParam(name: string): number | null {
  const raw = useParams()[name]
  if (raw === undefined) return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** Narrow a DOM string to one of the allowed values. */
export function pick<T extends string>(value: string, allowed: readonly T[]): T | undefined {
  return allowed.find((a) => a === value)
}
