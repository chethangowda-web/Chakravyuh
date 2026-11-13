import { AudioLines, Mic, Square, Upload, Volume2, Wand2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { endpoints } from '../api/endpoints'
import { useAttackTemplates, useTargets } from '../api/hooks/queries'
import { useAction } from '../api/hooks/useAction'
import { CategoryText, LangBadge, VerdictText } from '../components/domain/Badges'
import { DetectorList, EvidenceBlock, HighlightedText } from '../components/domain/Evidence'
import { SeverityBadge } from '../components/domain/SeverityBadge'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { Field, Select, Textarea } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { pct } from '../lib/format'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../lib/labels'
import { LANGUAGES } from '../lib/languages'
import { pick } from '../lib/params'
import type { AttackCategory, LanguageCode } from '../types/domain'

const LANGS = Object.keys(LANGUAGES) as LanguageCode[]
const MAX_RECORD_SECONDS = 20

export function VoiceLabPage() {
  const targets = useTargets()
  const templates = useAttackTemplates()

  const [targetChoice, setTargetChoice] = useState('')
  const [language, setLanguage] = useState<LanguageCode>('kn-IN')
  const [seedId, setSeedId] = useState('')
  const [text, setText] = useState('')
  const [category, setCategory] = useState<AttackCategory>('sensitive_data_leak')
  const [codeMixed, setCodeMixed] = useState(false)
  const [audio, setAudio] = useState<{ id: string; source: 'tts' | 'upload' } | null>(null)

  const loadSeed = useAction(endpoints.previewAttack)
  const synth = useAction(endpoints.synthesizeVoice)
  const upload = useAction(endpoints.uploadVoice)
  const test = useAction(endpoints.runVoiceTest)

  const allVerified = (targets.data?.items ?? []).filter((t) => t.verification_status === 'verified')
  // bare bots first, so the default is never a Shield-protected copy
  const verified = [...allVerified.filter((t) => t.shield_for_target_id === null), ...allVerified.filter((t) => t.shield_for_target_id !== null)]
  const target = verified.find((t) => String(t.id) === targetChoice) ?? verified[0]
  // Spoken attacks can't rely on a hidden code, so only marker-free seeds; show the chosen category's seeds
  // (falling back to all of them for categories that have none).
  const voiceSeeds = (templates.data?.items ?? []).filter((t) => !t.marker_required)
  const inCategory = voiceSeeds.filter((t) => t.category === category)
  const seeds = inCategory.length > 0 ? inCategory : voiceSeeds
  const selectedSeed = seeds.find((s) => s.id === seedId) ?? seeds[0]

  const onLoadSeed = async () => {
    if (!selectedSeed) return
    const res = await loadSeed.run({
      template_id: selectedSeed.id,
      languages: [language],
      variants: [codeMixed ? 'code_mixed' : 'native'],
      wrappers: [],
    })
    const first = res?.variants[0]
    if (first) {
      setText(first.attack_text)
      setCategory(selectedSeed.category)
      setAudio(null)
      test.reset()
    }
  }

  const onSynthesize = async () => {
    const asset = await synth.run({ text, language })
    if (asset) {
      setAudio({ id: asset.id, source: 'tts' })
      test.reset()
    }
  }

  const onFile = async (file: Blob, name: string) => {
    const asset = await upload.run(file, name, language)
    if (asset) {
      setAudio({ id: asset.id, source: 'upload' })
      test.reset()
    }
  }

  const onRun = async () => {
    if (!audio || !target) return
    await test.run({
      audio_id: audio.id,
      target_id: target.id,
      category,
      language,
      intended_text: audio.source === 'tts' ? text : null,
      code_mixed: codeMixed,
    })
  }

  const result = test.data

  return (
    <>
      <PageHeader
        title="Voice Lab"
        description="Test the whole voice pipeline: attacker audio → Sarvam speech-to-text → your LLM. Speak an attack, or let Sarvam text-to-speech voice it for you."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Card title="1 · Pick a voice-enabled target">
            {targets.loading && <Skeleton className="h-10" />}
            {targets.data && verified.length === 0 && (
              <p className="text-sm text-zinc-400">
                No verified targets yet. <Link to="/targets/new" className="text-accent-400 hover:underline">Register one</Link>.
              </p>
            )}
            {verified.length > 0 && (
              <Select aria-label="Target" value={String(target?.id ?? '')} onChange={(e) => setTargetChoice(e.target.value)}>
                {verified.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.shield_for_target_id !== null ? ' (behind Shield)' : ''}</option>
                ))}
              </Select>
            )}
            <p className="mt-2 text-xs text-zinc-500">The transcript is sent to the target as text, like a typical STT → LLM voice assistant.</p>
          </Card>

          <Card title="2 · Create the spoken attack">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Language spoken" htmlFor="lang">
                  <Select id="lang" value={language} onChange={(e) => setLanguage(pick(e.target.value, LANGS) ?? 'kn-IN')}>
                    {LANGS.map((l) => <option key={l} value={l}>{LANGUAGES[l].label}</option>)}
                  </Select>
                </Field>
                <Field label="Attack category" htmlFor="cat">
                  <Select id="cat" value={category} onChange={(e) => setCategory(pick(e.target.value, CATEGORY_ORDER) ?? 'sensitive_data_leak')}>
                    {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c].label}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Start from a seed attack" htmlFor="seed" hint="Translated into the chosen language by Sarvam Translate.">
                <div className="flex gap-2">
                  <Select id="seed" value={selectedSeed?.id ?? ''} onChange={(e) => setSeedId(e.target.value)}>
                    {seeds.map((s) => <option key={s.id} value={s.id}>{CATEGORY_LABELS[s.category].short} · {s.technique}</option>)}
                  </Select>
                  <Button icon={<Wand2 className="size-4" aria-hidden />} loading={loadSeed.pending} onClick={() => void onLoadSeed()} disabled={!selectedSeed}>
                    Load
                  </Button>
                </div>
              </Field>
              <Field label="Attack text to speak" htmlFor="text">
                <Textarea id="text" rows={4} value={text} onChange={(e) => { setText(e.target.value); setAudio(null) }} className="font-sans text-sm" />
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" className="size-4 accent-teal-500" checked={codeMixed} onChange={(e) => setCodeMixed(e.target.checked)} />
                Code-mixed speech (uses Saaras v3 “codemix” mode for transcription)
              </label>
              {loadSeed.error && <ErrorNotice error={loadSeed.error} />}
              {synth.error && <ErrorNotice error={synth.error} />}
              {upload.error && <ErrorNotice error={upload.error} />}
              <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
                <Button variant="primary" icon={<Volume2 className="size-4" aria-hidden />} loading={synth.pending} disabled={text.trim() === ''} onClick={() => void onSynthesize()}>
                  Speak it (Sarvam TTS)
                </Button>
                <Recorder onRecorded={(blob) => void onFile(blob, 'recording.webm')} busy={upload.pending} />
                <FilePicker onPick={(file) => void onFile(file, file.name)} busy={upload.pending} />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="3 · Run the pipeline">
            {!audio && <p className="text-sm text-zinc-500">Create or upload audio first.</p>}
            {audio && (
              <div className="space-y-4">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio controls src={endpoints.audioUrl(audio.id)} className="w-full" />
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Badge>{audio.source === 'tts' ? 'Sarvam TTS' : 'Uploaded / recorded'}</Badge>
                  <LangBadge language={language} native />
                </div>
                <Button variant="primary" icon={<AudioLines className="size-4" aria-hidden />} loading={test.pending} disabled={!target} onClick={() => void onRun()}>
                  Transcribe and attack the target
                </Button>
                {test.error && <ErrorNotice error={test.error} />}
              </div>
            )}
          </Card>

          {result && (
            <>
              <Card title="Pipeline result">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <SeverityBadge severity={result.result.severity} />
                  <VerdictText verdict={result.result.verdict} confidence={result.result.confidence} />
                  <CategoryText category={result.result.category} />
                  <Link to={`/findings/${result.result.id}`} className="ml-auto text-xs text-accent-400 hover:underline">Open full finding</Link>
                </div>
                <div className="space-y-4">
                  <EvidenceBlock label={`Sarvam STT heard${result.detected_language ? ` (${result.detected_language})` : ''}`}>{result.transcript}</EvidenceBlock>
                  {result.transcript_drift === null && audio?.source === 'tts' && (
                    <p className="text-xs text-zinc-500">Drift not comparable: the transcript is written in a different script than the text you typed.</p>
                  )}
                  {result.transcript_drift !== null && (
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-zinc-500">
                        <span>Transcript drift from the intended text</span>
                        <span className="font-mono">{pct(result.transcript_drift)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, result.transcript_drift * 100)}%` }} />
                      </div>
                    </div>
                  )}
                  <EvidenceBlock label="Target response" tone={result.result.verdict === 'vulnerable' ? 'danger' : 'neutral'}>
                    {result.result.extracted_reply === null ? (
                      <span className="text-zinc-500">No reply ({result.result.judge_rationale ?? 'error'})</span>
                    ) : (
                      <HighlightedText
                        text={result.result.extracted_reply}
                        spans={result.result.detector_hits.filter((h) => h.fired && h.detector !== 'refusal').flatMap((h) => h.spans)}
                      />
                    )}
                  </EvidenceBlock>
                </div>
              </Card>
              <Card title="Detectors">
                <DetectorList hits={result.result.detector_hits} />
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function FilePicker({ onPick, busy }: { onPick: (file: File) => void; busy: boolean }) {
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

function Recorder({ onRecorded, busy }: { onRecorded: (blob: Blob) => void; busy: boolean }) {
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
    } catch {
      setProblem('Microphone unavailable or permission denied.')
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
