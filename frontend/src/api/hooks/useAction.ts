import { useCallback, useEffect, useRef, useState } from 'react'

import { type ApiError, toApiError } from '../client'

export interface ActionState<A extends unknown[], R> {
  /** Runs the action; resolves to the result, or undefined if it failed (error is set). */
  run: (...args: A) => Promise<R | undefined>
  pending: boolean
  error: ApiError | undefined
  /** Result of the last successful run. */
  data: R | undefined
  reset: () => void
}

/** Wraps a mutating API call with pending/error/data state. */
export function useAction<A extends unknown[], R>(action: (...args: A) => Promise<R>): ActionState<A, R> {
  const actionRef = useRef(action)
  useEffect(() => {
    actionRef.current = action
  }, [action])

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | undefined>(undefined)
  const [data, setData] = useState<R | undefined>(undefined)

  const run = useCallback(async (...args: A): Promise<R | undefined> => {
    setPending(true)
    setError(undefined)
    try {
      const result = await actionRef.current(...args)
      setData(result)
      return result
    } catch (cause: unknown) {
      setError(toApiError(cause))
      return undefined
    } finally {
      setPending(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(undefined)
    setData(undefined)
  }, [])
  return { run, pending, error, data, reset }
}
