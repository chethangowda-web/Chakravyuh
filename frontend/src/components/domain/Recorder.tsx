import { Mic, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '../ui/Button'

export const MAX_RECORD_SECONDS = 20

/** A plain-words reason and fix for each way the browser can refuse the microphone. */
function micProblem(error: unknown): string {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) return 'This browser cannot record on this page (it needs https or localhost). Upload an audio file instead.'
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Microphone blocked. Click the lock icon in the address bar, set Microphone to Allow, then press Record again. Or upload an audio file.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No microphone was found on this device. Upload an audio file, or type the attack.'
  if (name === 'NotReadableError') return 'The microphone is being used by another app. Close it and try again, or upload an audio file.'
  return 'The microphone could not be started. Upload an audio file, or type the attack.'
}

/** Microphone recorder (shared by the Voice Lab and the Live Judge Challenge). Hands back one WebM blob. */
export function Recorder({ onRecorded, busy }: { onRecorded: (blob: Blob) => void; busy: boolean }) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [problem, setProblem] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    },
    [],
  )

  const stop = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    timerRef.current = null
    recorderRef.current?.stop()
    setRecording(false)
  }

  const start = async () => {
    setProblem(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        onRecorded(new Blob(chunks, { type: 'audio/webm' }))
      }
      recorderRef.current = recorder
      recorder.start()
      setSeconds(0)
      setRecording(true)
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_RECORD_SECONDS) stop()
          return s + 1
        })
      }, 1000)
    } catch (error) {
      setProblem(micProblem(error))
    }
  }

  return (
    <div className="flex items-center gap-2">
      {recording ? (
        <Button variant="danger" icon={<Square className="size-4" aria-hidden />} onClick={stop}>
          Stop · {seconds}s
        </Button>
      ) : (
        <Button icon={<Mic className="size-4" aria-hidden />} loading={busy} onClick={() => void start()}>
          Record
        </Button>
      )}
      {problem !== null && <span className="text-xs text-red-300">{problem}</span>}
    </div>
  )
}
