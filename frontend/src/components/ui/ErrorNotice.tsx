import { AlertTriangle, RotateCw } from 'lucide-react'

import type { ApiError } from '../../api/client'

interface ErrorNoticeProps {
  error: ApiError
  onRetry?: () => void
}

export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
      <div className="flex-1">
        <p className="font-medium text-red-200">{error.message}</p>
        <p className="mt-0.5 font-mono text-xs text-red-300/70">
          {error.code}
          {error.status > 0 && ` · HTTP ${error.status}`}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-400/30 px-2.5 py-1 text-xs text-red-200 hover:bg-red-500/10"
        >
          <RotateCw className="size-3.5" aria-hidden /> Retry
        </button>
      )}
    </div>
  )
}
