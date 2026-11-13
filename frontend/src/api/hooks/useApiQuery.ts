import { useCallback, useEffect, useRef, useState } from 'react'

import { type ApiError, toApiError } from '../client'

export interface QueryOptions<T = unknown> {
  /**
   * Re-fetch every N ms (e.g. campaign progress). Omit to fetch once per key.
   * May be a function of the latest data, so polling can stop by itself (return undefined).
   */
  intervalMs?: number | undefined | ((data: T | undefined) => number | undefined)
}

export interface QueryState<T> {
  data: T | undefined
  error: ApiError | undefined
  /** True only for the first load of a key (no data yet) — polling does not flicker the UI. */
  loading: boolean
  /** True whenever a request is in flight. */
  fetching: boolean
  reload: () => void
}

interface Settled<T> {
  /** The key the data/error belong to — data from a previous key is never shown. */
  key: string
  /** Which request (key + nonce) produced this state. */
  requestId: string
  data: T | undefined
  error: ApiError | undefined
}

/**
 * Minimal data-fetching hook. `key` identifies the request: when it changes, the
 * previous request is aborted and a new one starts. In-flight state is derived, not stored.
 */
export function useApiQuery<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: QueryOptions<T> = {},
): QueryState<T> {
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  const [nonce, setNonce] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const requestId = `${key}#${nonce}`

  useEffect(() => {
    const controller = new AbortController()
    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSettled({ key, requestId, data, error: undefined })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setSettled((prev) => ({
          key,
          requestId,
          data: prev?.key === key ? prev.data : undefined,
          error: toApiError(cause),
        }))
      })
    return () => controller.abort()
  }, [key, requestId])

  const current = settled?.key === key ? settled : null
  const interval =
    typeof options.intervalMs === 'function' ? options.intervalMs(current?.data) : options.intervalMs
  useEffect(() => {
    if (interval === undefined) return undefined
    const id = window.setInterval(() => setNonce((n) => n + 1), interval)
    return () => window.clearInterval(id)
  }, [interval])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  const fetching = current?.requestId !== requestId
  return {
    data: current?.data,
    error: current?.error,
    loading: fetching && current === null,
    fetching,
    reload,
  }
}
