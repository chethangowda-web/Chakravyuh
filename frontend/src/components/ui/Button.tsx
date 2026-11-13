import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'

import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent-500 text-zinc-950 shadow-[0_8px_24px_-10px_rgba(20,184,166,0.9)] hover:bg-accent-400 hover:shadow-[0_10px_28px_-8px_rgba(20,184,166,0.95)] disabled:bg-accent-500/50 disabled:shadow-none',
  secondary: 'border border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 disabled:text-zinc-500',
  ghost: 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 disabled:text-zinc-600',
  danger: 'border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:text-red-300/50',
}
const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-9 gap-2 px-3.5 text-sm',
}

const base =
  'inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled === true || loading}
      className={cn(base, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

interface LinkButtonProps {
  to: string
  variant?: Variant
  size?: Size
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export function LinkButton({ to, variant = 'secondary', size = 'md', icon, className, children }: LinkButtonProps) {
  return (
    <Link to={to} className={cn(base, VARIANTS[variant], SIZES[size], className)}>
      {icon}
      {children}
    </Link>
  )
}
