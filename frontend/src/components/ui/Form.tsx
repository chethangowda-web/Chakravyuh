import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

import { cn } from '../../lib/cn'

const control =
  'w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 disabled:opacity-60'

interface FieldProps {
  label: string
  htmlFor: string
  hint?: ReactNode
  error?: string | undefined
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-zinc-300">
        {label}
      </label>
      {children}
      {error !== undefined ? (
        <p className="text-xs text-red-300">{error}</p>
      ) : (
        hint !== undefined && <p className="text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-9', className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-20 font-mono text-xs leading-relaxed', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(control, 'h-9 pr-8', className)} {...rest}>
      {children}
    </select>
  )
}

interface ChipOption<T extends string> {
  value: T
  label: ReactNode
  hint?: string
}

interface ChipGroupProps<T extends string> {
  options: ReadonlyArray<ChipOption<T>>
  selected: readonly T[]
  onChange: (next: T[]) => void
  /** Values that are always selected and cannot be toggled off. */
  locked?: readonly T[]
}

/** Multi-select as toggle chips. */
export function ChipGroup<T extends string>({ options, selected, onChange, locked = [] }: ChipGroupProps<T>) {
  const toggle = (value: T) => {
    if (locked.includes(value)) return
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt.value) || locked.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.hint}
            aria-pressed={on}
            onClick={() => toggle(opt.value)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              on
                ? 'border-accent-500/60 bg-accent-500/15 text-accent-200'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
              locked.includes(opt.value) && 'cursor-default',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
