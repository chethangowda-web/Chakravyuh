import { useCallback, useEffect, useRef, useState } from 'react'

import { endpoints } from '../api/endpoints'
import type { LanguageCode } from '../types/domain'

const MAX_SPOKEN_CHARS = 450
// 0.05 s of silence: playing it inside a click "unlocks" this element, so later automatic playback is allowed.
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

/** Reads like speech: no markdown marks, one line, cut at a sentence end so it never stops mid-word. */
export function speakable(text: string, max = MAX_SPOKEN_CHARS): string {
  const plain = text
    .replace(/[*_`#>]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('। '), cut.lastIndexOf('? '), cut.lastIndexOf('! '), cut.lastIndexOf(':'))
  return (end > max * 0.5 ? cut.slice(0, end + 1) : cut).trim()
}

interface SpeechState {
  /** Which button is currently loading or playing. */
  key: string | null
  phase: 'idle' | 'loading' | 'playing'
  error: string | null
  /** True once Sarvam text-to-speech audio has actually started playing in this page session. */
  spoke: boolean
}

/** Sarvam text-to-speech playback: one clip at a time, with a stable state for the buttons. */
export function useSpeech() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<SpeechState>({ key: null, phase: 'idle', error: null, spoke: false })

  const element = useCallback(() => {
    audio.current ??= new Audio()
    return audio.current
  }, [])

  /** Call from a click handler. Browsers only allow sound after a click, and Shield's reply arrives later. */
  const unlock = useCallback(() => {
    const el = element()
    if (el.src === '' || el.paused) {
      el.src = SILENCE
      void el.play().catch(() => undefined)
    }
  }, [element])

  const stop = useCallback(() => {
    audio.current?.pause()
    setState((s) => ({ ...s, key: null, phase: 'idle' }))
  }, [])

  useEffect(
    () => () => {
      audio.current?.pause()
    },
    [],
  )

  const speak = useCallback(
    async (key: string, text: string, language: LanguageCode) => {
      stop()
      const clean = speakable(text)
      if (clean === '') return
      setState((s) => ({ ...s, key, phase: 'loading', error: null }))
      try {
        const asset = await endpoints.synthesizeVoice({ text: clean, language })
        const el = element()
        el.src = endpoints.audioUrl(asset.id)
        el.onended = () => setState((s) => ({ ...s, key: null, phase: 'idle' }))
        el.onerror = () => setState((s) => ({ ...s, key: null, phase: 'idle', error: 'The audio could not be played.' }))
        el.onplaying = () => setState((s) => ({ ...s, key, phase: 'playing', spoke: true }))
        await el.play()
      } catch (error) {
        const blocked = error instanceof DOMException && error.name === 'NotAllowedError'
        setState((s) => ({
          ...s,
          key: null,
          phase: 'idle',
          error: blocked ? 'The browser blocked autoplay. Press Listen.' : error instanceof Error ? error.message : 'Could not speak this reply.',
        }))
      }
    },
    [stop, element],
  )

  return { ...state, speak, stop, unlock }
}
