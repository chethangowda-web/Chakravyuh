import { Upload } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '../ui/Button'

/** Pick an audio file (shared by the Voice Lab and the Live Judge Challenge). */
export function AudioFilePicker({ onPick, busy }: { onPick: (file: File) => void; busy: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          e.target.value = ''
        }}
      />
      <Button icon={<Upload className="size-4" aria-hidden />} loading={busy} onClick={() => inputRef.current?.click()}>
        Upload audio
      </Button>
    </>
  )
}
