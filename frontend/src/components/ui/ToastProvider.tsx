import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'

import { cn } from '../../lib/cn'
import { ToastContext, type ToastTone } from '../../lib/toast'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

const ICONS = { success: CheckCircle2, error: XCircle, info: Info } as const
const TONES: Record<ToastTone, string> = {
  success: 'border-emerald-500/30 text-emerald-200',
  error: 'border-red-500/30 text-red-200',
  info: 'border-zinc-700 text-zinc-200',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4500)
  }, [])

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2" aria-live="polite">
        {items.map((t) => {
          const Icon = ICONS[t.tone]
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-zinc-900/95 px-3.5 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur',
                TONES[t.tone],
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
