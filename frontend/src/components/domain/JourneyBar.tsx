import { Check } from 'lucide-react'
import { Link } from 'react-router'

import { useJourney } from '../../api/hooks/queries'
import { cn } from '../../lib/cn'
import { STEP_META } from '../../lib/journey'
import type { JourneyStep } from '../../types/domain'

function Step({ step, isNext }: { step: JourneyStep; isNext: boolean }) {
  const meta = STEP_META[step.key] ?? { label: step.key, title: step.key, icon: Check }
  const Icon = step.done ? Check : meta.icon
  return (
    <Link
      to={step.link}
      title={`${meta.title}: ${step.detail}`}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors',
        step.done && 'text-accent-300 hover:bg-accent-500/10',
        isNext && 'bg-accent-500/15 font-medium text-accent-200 ring-1 ring-accent-500/50 hover:bg-accent-500/25',
        !step.done && !isNext && 'text-zinc-500 hover:text-zinc-300',
      )}
    >
      <Icon className={cn('size-3.5', isNext && 'animate-pulse')} aria-hidden />
      <span className="hidden md:inline">{meta.label}</span>
    </Link>
  )
}

/** Compact Test → Fix → Protect progress, shown on every page. Click a step to go there. */
export function JourneyBar() {
  const journey = useJourney()
  const steps = journey.data?.steps
  if (!steps) return null
  return (
    <nav aria-label="Your progress" className="flex items-center">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          {i > 0 && <span className={cn('mx-0.5 h-px w-4', steps[i - 1]?.done ? 'bg-accent-500/50' : 'bg-zinc-700')} aria-hidden />}
          <Step step={step} isNext={journey.data?.next_key === step.key} />
        </div>
      ))}
    </nav>
  )
}
