import { ShieldCheck, ShieldOff } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'

import { useFormation } from '../../api/hooks/queries'
import { cn } from '../../lib/cn'
import { CATEGORY_LABELS } from '../../lib/labels'
import { LANGUAGES } from '../../lib/languages'
import type { FormationAttack, LanguageCode } from '../../types/domain'

/**
 * The Living Chakravyuh: the battle formation from the Mahabharata, drawn from real results.
 * One ring per language (outermost English), rotating in alternate directions. The GAPS in a ring are its
 * weakness: their size is that language's real attack-success rate. Dots replay real attacks: a blocked one
 * bursts on its language's ring; a leak flies through to the core, which flashes red.
 *
 * Dots, bursts and the core flash are positioned by a requestAnimationFrame loop (plain SVG attributes, no CSS
 * transforms), which renders the same in every browser. Only the slow ring rotation is CSS.
 */

const RING_ORDER: LanguageCode[] = ['en-IN', 'hi-IN', 'kn-IN', 'te-IN', 'ta-IN']
const OUTER = 252
const STEP = 38
const CORE = 60
const SEGMENTS = 12
const START = 296
const SPAWN_MS = 1150
const FLIGHT_MS = 1600
const BURST_MS = 750
const CORE_FLASH_MS = 900
const NAME = 'CHAKRAVYUH · चक्रव्यूह · ಚಕ್ರವ್ಯೂಹ · చక్రవ్యూహం · சக்கரவியூகம் · '

type Scope = 'bare' | 'shield'

interface Dot {
  id: number
  angle: number
  stop: number
  born: number
  attack: FormationAttack
}

interface Burst {
  id: number
  x: number
  y: number
  born: number
  breached: boolean
}

interface Scene {
  now: number
  dots: Dot[]
  bursts: Burst[]
  lastHit: number
}

const EMPTY: Scene = { now: 0, dots: [], bursts: [], lastHit: -Infinity }

function ringColor(rate: number): string {
  if (rate < 0.15) return '#2dd4bf'
  if (rate < 0.35) return '#facc15'
  if (rate < 0.5) return '#fb923c'
  return '#f87171'
}

const easeIn = (p: number) => p * p * (1.6 - 0.6 * p) // accelerates toward the target

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Planted-secret evidence names the secret itself; never show that on the home page. */
function safeDetail(detail: string | null): string | null {
  if (!detail) return null
  return detail.toLowerCase().startsWith('leaked secret') ? 'leaked a planted secret' : detail
}

/** Home: all campaigns with a With/Without Shield switch. With `campaignId`: that one campaign, no switch. */
export function ChakravyuhFormation({ campaignId = null }: { campaignId?: number | null }) {
  // `?replay=shield` opens the Home page straight in the With Shield view (handy on stage).
  const [scope, setScope] = useState<Scope>(() =>
    new URLSearchParams(window.location.search).get('replay') === 'shield' ? 'shield' : 'bare',
  )
  // Keyed by scope: switching With/Without Shield starts a fresh replay.
  return <FormationView key={`${scope}:${campaignId ?? 'all'}`} scope={scope} onScope={campaignId === null ? setScope : null} campaignId={campaignId} />
}

function FormationView({
  scope,
  onScope,
  campaignId,
}: {
  scope: Scope
  onScope: ((s: Scope) => void) | null
  campaignId: number | null
}) {
  const formation = useFormation(scope, campaignId)
  const data = formation.data

  const [scene, setScene] = useState<Scene>(EMPTY)
  const [last, setLast] = useState<FormationAttack | null>(null)
  const [tally, setTally] = useState({ shown: 0, leaks: 0 })

  const rings = RING_ORDER.map((code, i) => ({
    code,
    radius: OUTER - i * STEP,
    stat: data?.rings.find((r) => r.language === code) ?? null,
  })).filter((r) => r.stat !== null)

  // One animation loop: spawn a real attack every SPAWN_MS, move dots, land them, age bursts.
  useEffect(() => {
    const attacks = data?.attacks ?? []
    if (attacks.length === 0 || reducedMotion()) return
    let raf = 0
    let lastSpawn = -Infinity
    let cursor = 0
    let nextId = 0
    let dots: Dot[] = []
    let bursts: Burst[] = []
    let lastHit = -Infinity

    const loop = (t: number) => {
      if (!document.hidden) {
        if (t - lastSpawn >= SPAWN_MS) {
          lastSpawn = t
          const attack = attacks[cursor % attacks.length]
          cursor += 1
          if (attack) {
            const ring = Math.max(RING_ORDER.indexOf(attack.language), 0)
            dots.push({
              id: nextId++,
              angle: Math.random() * Math.PI * 2,
              born: t,
              attack,
              stop: attack.breached ? CORE : OUTER - ring * STEP,
            })
          }
        }
        const landed = dots.filter((d) => t - d.born >= FLIGHT_MS)
        if (landed.length) {
          dots = dots.filter((d) => t - d.born < FLIGHT_MS)
          for (const d of landed) {
            bursts.push({
              id: d.id,
              born: t,
              breached: d.attack.breached,
              x: Math.cos(d.angle) * d.stop,
              y: Math.sin(d.angle) * d.stop,
            })
            if (d.attack.breached) lastHit = t
            setLast(d.attack)
            setTally((s) => ({ shown: s.shown + 1, leaks: s.leaks + (d.attack.breached ? 1 : 0) }))
          }
        }
        bursts = bursts.filter((b) => t - b.born < BURST_MS)
        setScene({ now: t, dots: [...dots], bursts: [...bursts], lastHit })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [data])

  const shield = (data?.scope ?? scope) === 'shield'
  const { now } = scene
  const flash = Math.max(0, 1 - (now - scene.lastHit) / CORE_FLASH_MS)
  const nameLength = 2 * Math.PI * 286 - 8

  return (
    <div className="relative flex flex-col items-center">
      {onScope !== null && (
      <div className="mb-3 inline-flex rounded-full border border-zinc-700/80 bg-zinc-950/70 p-0.5 text-xs" role="group" aria-label="Replay">
        {(['bare', 'shield'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onScope(s)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors',
              scope === s ? (s === 'shield' ? 'bg-accent-500/20 text-accent-200' : 'bg-red-500/15 text-red-200') : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            {s === 'shield' ? <ShieldCheck className="size-3.5" aria-hidden /> : <ShieldOff className="size-3.5" aria-hidden />}
            {s === 'shield' ? 'With Shield' : 'Without Shield'}
          </button>
        ))}
      </div>
      )}

      <svg viewBox="-300 -300 600 600" className="w-full max-w-[540px]" role="img" aria-label="Chakravyuh: one ring per language; gaps show how often attacks got through">
        <defs>
          <radialGradient id="cv-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#0f766e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cv-hit" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cv-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </radialGradient>
          <path id="cv-name-path" d="M 0,-286 a 286,286 0 1,1 0,572 a 286,286 0 1,1 0,-572" />
        </defs>
        <circle r="295" fill="url(#cv-bg)" />

        <g className="cv-ring cv-rev" style={{ animationDuration: '160s' } as CSSProperties} aria-hidden>
          <text className="fill-zinc-500 text-[11px]" opacity="0.55">
            <textPath href="#cv-name-path" textLength={nameLength} lengthAdjust="spacing">
              {NAME.repeat(3)}
            </textPath>
          </text>
        </g>

        {shield && (
          <circle className="cv-shield" r={OUTER + 22} fill="none" stroke="#2dd4bf" strokeWidth="4" strokeOpacity="0.8">
            <title>Chakravyuh Shield</title>
          </circle>
        )}

        {rings.map(({ code, radius, stat }, i) => {
          const rate = stat?.vulnerability_rate ?? 0
          const unit = (2 * Math.PI * radius) / SEGMENTS
          const gap = Math.max(unit * Math.min(rate, 0.92), rate > 0 ? 2 : 0)
          return (
            <g key={code} className={cn('cv-ring', i % 2 === 1 && 'cv-rev')} style={{ animationDuration: `${38 + i * 14}s` } as CSSProperties}>
              <circle r={radius} fill="none" stroke="#27272a" strokeWidth="11" />
              <circle
                r={radius}
                fill="none"
                stroke={ringColor(rate)}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(unit - gap, 1)} ${gap}`}
                strokeOpacity="0.9"
              >
                <title>
                  {LANGUAGES[code].label}: {Math.round(rate * 100)}% of attacks got through ({stat?.vulnerable}/{stat?.total})
                </title>
              </circle>
            </g>
          )
        })}

        <circle r={CORE + 34 * flash} fill="url(#cv-hit)" opacity={flash} />
        <circle r={CORE} fill="url(#cv-core)" stroke={flash > 0 ? '#f87171' : '#2dd4bf'} strokeOpacity={0.5 + 0.5 * flash} strokeWidth={1.5 + 3 * flash} />
        <text y="-4" textAnchor="middle" className="fill-zinc-100 text-[19px] font-semibold tracking-widest">
          CORE
        </text>
        <text y="17" textAnchor="middle" className="fill-zinc-400 text-[11px]">
          secrets · Aadhaar · PAN
        </text>

        {scene.dots.map((d) => {
          const p = Math.min(1, (now - d.born) / FLIGHT_MS)
          const r = START + (d.stop - START) * easeIn(p)
          const tail = START + (d.stop - START) * easeIn(Math.max(0, p - 0.12))
          const color = d.attack.breached ? '#f87171' : '#5eead4'
          return (
            <g key={d.id} opacity={Math.min(1, 0.25 + p * 3)}>
              <line
                x1={Math.cos(d.angle) * tail}
                y1={Math.sin(d.angle) * tail}
                x2={Math.cos(d.angle) * r}
                y2={Math.sin(d.angle) * r}
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeOpacity="0.45"
              />
              <circle cx={Math.cos(d.angle) * r} cy={Math.sin(d.angle) * r} r={d.attack.breached ? 8 : 6.5} fill={color} />
            </g>
          )
        })}
        {scene.bursts.map((b) => {
          const q = Math.min(1, (now - b.born) / BURST_MS)
          return (
            <circle
              key={b.id}
              cx={b.x}
              cy={b.y}
              r={6 + 20 * q}
              fill="none"
              stroke={b.breached ? '#f87171' : '#5eead4'}
              strokeWidth={3 * (1 - q) + 0.5}
              opacity={1 - q}
            />
          )
        })}

        {rings.map(({ code, radius, stat }) => (
          <g key={`label-${code}`} transform={`translate(0 ${-radius})`}>
            <rect x="-56" y="-13" width="112" height="26" rx="13" fill="#09090b" fillOpacity="0.92" stroke="#3f3f46" />
            <text y="5" textAnchor="middle" className="fill-zinc-100 text-[14px] font-semibold">
              {LANGUAGES[code].native} {Math.round((stat?.vulnerability_rate ?? 0) * 100)}%
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-2 h-12 w-full max-w-[540px] text-center text-xs">
        {formation.error ? (
          <p className="text-zinc-500">Could not load the formation.</p>
        ) : !data ? (
          <p className="text-zinc-500">Loading real results…</p>
        ) : data.attacks.length === 0 ? (
          <p className="text-zinc-500">No results yet for this view. Run a campaign{shield ? ' against a “+ Shield” target' : ''}.</p>
        ) : (
          <>
            <p className="text-zinc-500">
              Replaying {data.attacks.length} real attacks{campaignId !== null ? ' from this campaign' : shield ? ' on the Shield-protected bots' : ''} ·{' '}
              <span className={tally.leaks ? 'text-red-300' : 'text-accent-300'}>
                {tally.leaks}/{tally.shown} reached the core
              </span>
            </p>
            {last && (
              <Link to={`/findings/${last.result_id}`} className="mt-1 inline-block max-w-full truncate text-zinc-300 hover:text-accent-300">
                {LANGUAGES[last.language].native} · {CATEGORY_LABELS[last.category].label} →{' '}
                <span className={last.breached ? 'font-semibold text-red-300' : 'font-semibold text-accent-300'}>
                  {last.breached ? 'LEAK' : 'BLOCKED'}
                </span>
                {last.breached && safeDetail(last.detail) ? <span className="text-zinc-500"> · {safeDetail(last.detail)}</span> : null}
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
