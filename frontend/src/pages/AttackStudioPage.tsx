import { Eye, Languages, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { endpoints } from '../api/endpoints'
import { useAttackTemplates } from '../api/hooks/queries'
import { useAction } from '../api/hooks/useAction'
import { LangBadge, VariantBadge } from '../components/domain/Badges'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { ChipGroup, Field, Select } from '../components/ui/Form'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { CATEGORY_LABELS, WRAPPER_LABELS } from '../lib/labels'
import { LANGUAGES, VARIANT_LABELS } from '../lib/languages'
import type { AttackWrapper, LanguageCode, ScriptVariant } from '../types/domain'

const LANGS = Object.keys(LANGUAGES) as LanguageCode[]
const VARIANTS = Object.keys(VARIANT_LABELS) as ScriptVariant[]
const WRAPPERS = Object.keys(WRAPPER_LABELS) as AttackWrapper[]

export function AttackStudioPage() {
  const templates = useAttackTemplates()
  const [templateId, setTemplateId] = useState('')
  const [languages, setLanguages] = useState<LanguageCode[]>(['en-IN', 'hi-IN', 'kn-IN'])
  const [variants, setVariants] = useState<ScriptVariant[]>(['native', 'code_mixed'])
  const [wrappers, setWrappers] = useState<AttackWrapper[]>([])
  const preview = useAction(endpoints.previewAttack)
  const paraphrase = useAction(endpoints.generateParaphrases)

  const items = templates.data?.items ?? []
  const selectedId = templateId || items[0]?.id || ''
  const selected = items.find((t) => t.id === selectedId)

  const run = () =>
    void preview.run({ template_id: selectedId, languages, variants, wrappers })

  return (
    <>
      <PageHeader
        title="Attack Studio"
        description="See exactly how one attack is localized by Sarvam — native script, romanized and code-mixed — before running a campaign."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Attack" className="lg:col-span-1">
          {templates.loading && <Skeleton className="h-64" />}
          {templates.error && <ErrorNotice error={templates.error} onRetry={templates.reload} />}
          {templates.data && (
            <div className="space-y-5">
              <Field label="Seed attack" htmlFor="seed">
                <Select id="seed" value={selectedId} onChange={(e) => setTemplateId(e.target.value)}>
                  {items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {CATEGORY_LABELS[t.category].short} · {t.technique}
                    </option>
                  ))}
                </Select>
              </Field>
              {selected && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm leading-relaxed text-zinc-300">
                  {selected.text}
                  {selected.notes !== null && <p className="mt-2 text-xs text-zinc-500">{selected.notes}</p>}
                </div>
              )}
              <Field label="Languages" htmlFor="langs">
                <ChipGroup
                  options={LANGS.map((l) => ({ value: l, label: LANGUAGES[l].native }))}
                  selected={languages}
                  onChange={setLanguages}
                />
              </Field>
              <Field label="Script variants" htmlFor="variants" hint="English is always shown in its original form.">
                <ChipGroup options={VARIANTS.map((v) => ({ value: v, label: VARIANT_LABELS[v] }))} selected={variants} onChange={setVariants} />
              </Field>
              <Field label="Wrappers (optional)" htmlFor="wrappers">
                <ChipGroup options={WRAPPERS.map((w) => ({ value: w, label: WRAPPER_LABELS[w] }))} selected={wrappers} onChange={setWrappers} />
              </Field>
              <Button
                variant="primary"
                className="w-full"
                icon={<Eye className="size-4" aria-hidden />}
                loading={preview.pending}
                disabled={selectedId === '' || languages.length === 0 || variants.length === 0}
                onClick={run}
              >
                Preview variants
              </Button>
              <Button
                className="w-full"
                icon={<Sparkles className="size-4" aria-hidden />}
                loading={paraphrase.pending}
                disabled={selectedId === ''}
                onClick={() => void paraphrase.run({ template_id: selectedId, count: 3 })}
              >
                Generate paraphrases (Sarvam-105B)
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {preview.error && <ErrorNotice error={preview.error} />}
          {paraphrase.error && <ErrorNotice error={paraphrase.error} />}
          {paraphrase.data && (
            <Card title="LLM-generated paraphrases" description="Same intent, different wording — useful as new seeds.">
              <ul className="space-y-2 text-sm text-zinc-300">
                {paraphrase.data.paraphrases.map((p) => (
                  <li key={p} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">{p}</li>
                ))}
              </ul>
            </Card>
          )}
          {!preview.data && !preview.pending && (
            <div className="grid place-items-center rounded-xl border border-dashed border-zinc-800 py-20 text-center">
              <Languages className="size-6 text-zinc-600" aria-hidden />
              <p className="mt-3 text-sm text-zinc-400">Pick an attack and press “Preview variants”.</p>
              <p className="mt-1 text-xs text-zinc-600">Each variant is translated by Sarvam Translate and verified by Sarvam language ID.</p>
            </div>
          )}
          {preview.pending && <Skeleton className="h-72" />}
          {preview.data?.warnings.map((w) => (
            <p key={w} className="rounded-md border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">{w}</p>
          ))}
          <div className="grid gap-4 md:grid-cols-2">
            {preview.data?.variants.map((v) => (
              <Card key={`${v.language}-${v.variant}-${v.mutation_chain.join('+')}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <LangBadge language={v.language} native />
                  <VariantBadge variant={v.variant} />
                  {v.mutation_chain.map((m) => (
                    <Badge key={m}>{m}</Badge>
                  ))}
                </div>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">{v.attack_text}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                  {v.detected_language !== null && (
                    <Badge tone="accent" className="font-mono">
                      LID {v.detected_language} · {v.detected_script}
                    </Badge>
                  )}
                  {v.marker_token !== null && <span className="font-mono">marker {v.marker_token}</span>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
