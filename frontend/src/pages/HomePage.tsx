import { ArrowRight, Check, FileSearch, Languages, Puzzle, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import { Link } from 'react-router'

import { useDashboard, useJourney } from '../api/hooks/queries'
import { ChakravyuhFormation } from '../components/domain/ChakravyuhFormation'
import { Badge } from '../components/ui/Badge'
import { LinkButton } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { cn } from '../lib/cn'
import { STEP_META } from '../lib/journey'
import { LANGUAGES } from '../lib/languages'
import type { DashboardSummary, Journey } from '../types/domain'

const STEP_TEXT: Record<string, string> = {
  target: 'Register your chatbot’s web address and prove you own it. Chakravyuh only attacks verified bots.',
  attack: 'An AI attacker tries scams and tricks in Hindi, Kannada, Telugu and Tamil, typed or spoken, and shows exactly what leaked.',
  fix: 'Sarvam rewrites the bot’s instructions; Chakravyuh re-attacks, including attacks the fix never saw, and checks normal users still get answers.',
  protect: 'Shield guards the live bot: it reads every message in English first, blocks attacks, and removes leaked data from replies.',
}

function Hero({ journey }: { journey: Journey | undefined }) {
  const next = journey?.steps.find((s) => s.key === journey.next_key)
  return (
    <section className="bg-grid relative grid items-center gap-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 px-8 py-8 lg:grid-cols-[1.05fr_1fr]">
      <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-accent-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative">
      <Badge tone="accent">
        <Sparkles className="size-3.5" aria-hidden /> Indic red-teaming lab · powered by Sarvam AI
      </Badge>
      <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-zinc-50">
        Chatbots are safe in English.{' '}
        <span className="bg-gradient-to-r from-accent-300 to-emerald-200 bg-clip-text text-transparent">
          Are they safe in ಕನ್ನಡ, हिन्दी, తెలుగు and தமிழ்?
        </span>
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
        Chakravyuh attacks your chatbot the way a scammer would, in Indian languages, shows exactly what leaked, fixes it
        with Sarvam AI, and guards it live.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {next ? (
          <LinkButton to={next.link} variant="primary" icon={<ArrowRight className="size-4" aria-hidden />}>
            Next step: {STEP_META[next.key]?.title ?? next.key}
          </LinkButton>
        ) : (
          <LinkButton to="/dashboard" variant="primary" icon={<ArrowRight className="size-4" aria-hidden />}>
            See the results
          </LinkButton>
        )}
        <LinkButton to="/challenge">Try to break it yourself</LinkButton>
        <span className="ml-1 flex items-center gap-2 text-sm text-zinc-500">
          <span className="font-medium text-zinc-300">Test</span> → <span className="font-medium text-zinc-300">Fix</span> →{' '}
          <span className="font-medium text-zinc-300">Protect</span>
        </span>
      </div>
      <p className="mt-6 max-w-md text-xs leading-relaxed text-zinc-500">
        <span className="text-zinc-300">The formation on the right is your real data.</span> Each ring is a language; its gaps
        are the attacks that got through. Dots replay real attacks: red ones reached the core.
      </p>
      </div>
      <div className="relative">
        <ChakravyuhFormation />
      </div>
    </section>
  )
}

function JourneyCards({ journey }: { journey: Journey }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Your journey</h2>
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {journey.steps.map((step, i) => {
          const meta = STEP_META[step.key]
          const Icon = meta?.icon ?? Check
          const isNext = journey.next_key === step.key
          return (
            <li
              key={step.key}
              className={cn(
                'relative flex flex-col rounded-xl border p-5 transition-colors',
                isNext ? 'border-accent-500/60 bg-accent-500/[0.07] shadow-[0_0_0_1px_rgba(20,184,166,0.15)]' : 'border-zinc-800 bg-zinc-900/50',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-lg ring-1',
                    step.done ? 'bg-accent-500/15 text-accent-300 ring-accent-500/30' : 'bg-zinc-900 text-zinc-400 ring-zinc-700',
                  )}
                >
                  <Icon className="size-4.5" aria-hidden />
                </span>
                {step.done ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-accent-300">
                    <Check className="size-3.5" aria-hidden /> Done
                  </span>
                ) : isNext ? (
                  <span className="text-xs font-medium text-accent-200">Next</span>
                ) : (
                  <span className="text-xs text-zinc-600">Step {i + 1}</span>
                )}
              </div>
              <p className="mt-4 text-[15px] font-semibold text-zinc-100">
                {i + 1}. {meta?.title ?? step.key}
              </p>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-400">{STEP_TEXT[step.key]}</p>
              <p className="mt-3 text-xs text-zinc-500">{step.detail}</p>
              <LinkButton to={step.link} size="sm" variant={isNext ? 'primary' : 'secondary'} className="mt-4 self-start">
                {step.done ? 'Open' : 'Start'}
              </LinkButton>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function LiveNumbers({ data }: { data: DashboardSummary }) {
  const b = data.breakdown
  if (b.total_tests === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 px-5 py-6 text-sm text-zinc-500">
        No results yet. Run your first campaign and the numbers appear here.
      </p>
    )
  }
  const english = b.by_language.find((s) => s.language === 'en-IN')
  const worst = [...b.by_language].filter((s) => s.language !== 'en-IN').sort((x, y) => y.vulnerability_rate - x.vulnerability_rate)[0]
  const confirmed = b.total_vulnerabilities ? Math.round((b.vulnerabilities_confirmed / b.total_vulnerabilities) * 100) : 0
  const tiles = [
    { label: 'Attacks run', value: b.total_tests.toLocaleString(), hint: `${data.total_campaigns} campaigns` },
    { label: 'Got through', value: b.total_vulnerabilities.toLocaleString(), hint: `${Math.round((b.total_vulnerabilities / b.total_tests) * 100)}% of attacks` },
    english && worst
      ? {
          label: 'Language gap',
          value: `${Math.round(english.vulnerability_rate * 100)}% → ${Math.round(worst.vulnerability_rate * 100)}%`,
          hint: `English vs ${LANGUAGES[worst.language].label}`,
        }
      : { label: 'Language gap', value: '—', hint: 'Test English and an Indian language' },
    { label: 'Proven by rules', value: `${confirmed}%`, hint: 'of findings; the AI judge decides the rest' },
  ]
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Live results</h2>
        <Link to="/dashboard" className="text-xs text-accent-400 hover:underline">
          Full dashboard →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{t.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-50">{t.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{t.hint}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const WHY = [
  {
    icon: Languages,
    title: 'Built for Indian languages',
    text: 'Native script, romanized and code-mixed attacks, checked by Sarvam language ID: the way people actually type.',
  },
  {
    icon: FileSearch,
    title: 'Proof, not opinions',
    text: 'Planted secrets, hidden codes and Aadhaar/PAN patterns prove a leak; the AI judge must quote its evidence.',
  },
  {
    icon: ShieldCheck,
    title: 'From finding to protection',
    text: 'Fixes are re-tested on attacks they never saw, and Shield guards the live bot without blocking real users.',
  },
]

export function HomePage() {
  const journey = useJourney()
  const dash = useDashboard(null)
  return (
    <div className="space-y-8">
      <Hero journey={journey.data} />
      {journey.data ? <JourneyCards journey={journey.data} /> : <Skeleton className="h-56" />}
      {dash.data ? <LiveNumbers data={dash.data} /> : <Skeleton className="h-28" />}

      <section className="grid gap-4 md:grid-cols-3">
        {WHY.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
            <Icon className="size-5 text-accent-400" aria-hidden />
            <p className="mt-3 font-medium text-zinc-100">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{text}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link to="/integrations" className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-accent-500/50">
          <Puzzle className="size-5 text-accent-400" aria-hidden />
          <p className="mt-3 font-medium text-zinc-100">Browser extension</p>
          <p className="mt-1 text-sm text-zinc-400">Test your own chatbot’s web page in any Indian language, right from Chrome or Edge.</p>
          <p className="mt-3 text-xs text-accent-400 group-hover:underline">Set it up →</p>
        </Link>
        <Link to="/integrations" className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-accent-500/50">
          <Workflow className="size-5 text-accent-400" aria-hidden />
          <p className="mt-3 font-medium text-zinc-100">GitHub Action</p>
          <p className="mt-1 text-sm text-zinc-400">Block a release automatically when your bot leaks or is weaker in an Indian language.</p>
          <p className="mt-3 text-xs text-accent-400 group-hover:underline">Add it to your repo →</p>
        </Link>
      </section>
    </div>
  )
}
