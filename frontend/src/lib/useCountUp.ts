import { useEffect, useRef, useState } from 'react'

/** Animates a number from its previous value to `target` (about 0.7 s). Instant with "reduce motion". */
export function useCountUp(target: number, durationMs = 700): number {
  const [shown, setShown] = useState(0)
  const current = useRef(0)
  useEffect(() => {
    const from = current.current
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let start = 0
    const step = (t: number) => {
      if (start === 0) start = t
      const p = instant ? 1 : Math.min(1, (t - start) / durationMs)
      const value = Math.round(from + (target - from) * (1 - (1 - p) ** 3))
      current.current = value
      setShown(value)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return shown
}
