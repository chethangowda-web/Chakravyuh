import { useHealth } from '../../api/hooks/system'
import { cn } from '../../lib/cn'

function Pill({ ok, label, title }: { ok: boolean | undefined; label: string; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
    >
      <span
        className={cn(
          'size-2 rounded-full',
          ok === undefined ? 'animate-pulse bg-zinc-600' : ok ? 'bg-emerald-500' : 'bg-red-500',
        )}
        aria-hidden
      />
      {label}
    </span>
  )
}

/** Live API + Sarvam configuration indicator shown in the top bar. */
export function BackendStatus() {
  const { data, error } = useHealth()
  const apiOk = error ? false : data ? data.status === 'ok' : undefined
  const sarvamOk = error ? false : data?.sarvam_configured

  return (
    <div className="flex items-center gap-2">
      <Pill
        ok={apiOk}
        label={apiOk === false ? 'API offline' : 'API'}
        title={error ? error.message : `Backend ${data?.version ?? ''}`}
      />
      <Pill
        ok={sarvamOk}
        label={sarvamOk === false ? 'Sarvam key missing' : 'Sarvam AI'}
        title="Whether SARVAM_API_KEY is configured on the server (the key never reaches the browser)"
      />
    </div>
  )
}
