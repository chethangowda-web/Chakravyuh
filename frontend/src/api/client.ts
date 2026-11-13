import createClient from 'openapi-fetch'

import type { components, paths } from './schema'

type ErrorResponse = components['schemas']['ErrorResponse']

export const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

/** The only way the frontend talks to the backend. Paths, params and bodies are type-checked. */
export const api = createClient<paths>({ baseUrl })

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown> | null

  constructor(status: number, code: string, message: string, details: Record<string, unknown> | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false
  const inner: unknown = value.error
  return typeof inner === 'object' && inner !== null && 'code' in inner && 'message' in inner
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof Error) return new ApiError(0, 'client_error', error.message)
  return new ApiError(0, 'client_error', 'Unexpected error')
}

interface FetchResult<T> {
  data?: T
  error?: unknown
  response: Response
}

/** Resolve an openapi-fetch call to its data, or throw a typed ApiError. */
export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>
  try {
    result = await request
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError(0, 'network_error', 'Cannot reach the Chakravyuh API. Is the backend running?')
  }

  const { data, error, response } = result
  if (error !== undefined) {
    if (isErrorResponse(error)) {
      throw new ApiError(response.status, error.error.code, error.error.message, error.error.details ?? null)
    }
    throw new ApiError(response.status, 'http_error', `Request failed with status ${response.status}`)
  }
  if (data === undefined) {
    throw new ApiError(response.status, 'empty_response', 'The API returned no data')
  }
  return data
}

/** For endpoints that return 204 No Content. */
export async function unwrapVoid(request: Promise<FetchResult<unknown>>): Promise<void> {
  let result: FetchResult<unknown>
  try {
    result = await request
  } catch {
    throw new ApiError(0, 'network_error', 'Cannot reach the Chakravyuh API. Is the backend running?')
  }
  if (result.error !== undefined) {
    const { error, response } = result
    if (isErrorResponse(error)) {
      throw new ApiError(response.status, error.error.code, error.error.message, error.error.details ?? null)
    }
    throw new ApiError(response.status, 'http_error', `Request failed with status ${response.status}`)
  }
}

/** Parse an error body from a raw fetch Response (used for multipart uploads). */
export async function errorFromResponse(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json()
    if (isErrorResponse(body)) {
      return new ApiError(response.status, body.error.code, body.error.message, body.error.details ?? null)
    }
  } catch {
    // fall through
  }
  return new ApiError(response.status, 'http_error', `Request failed with status ${response.status}`)
}
