import { BadgeCheck, Crosshair, Plus, ShieldQuestion, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { endpoints } from '../api/endpoints'
import { useAction } from '../api/hooks/useAction'
import { useTargets } from '../api/hooks/queries'
import { Badge } from '../components/ui/Badge'
import { Button, LinkButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ErrorNotice } from '../components/ui/ErrorNotice'
import { EmptyState } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/PageHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { useToast } from '../lib/toast'

export function TargetsPage() {
  const targets = useTargets()
  const toast = useToast()
  const remove = useAction(endpoints.deleteTarget)

  const onDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}" and ALL its campaigns and findings?`)) return
    await remove.run(id)
    toast.show('Target deleted', 'success')
    targets.reload()
  }

  return (
    <>
      <PageHeader
        title="Targets"
        description="Applications you own or are authorized to test. Ownership must be verified before any attack is sent."
        actions={
          <LinkButton to="/targets/new" variant="primary" icon={<Plus className="size-4" aria-hidden />}>
            New target
          </LinkButton>
        }
      />
      {remove.error && <div className="mb-4"><ErrorNotice error={remove.error} /></div>}
      {targets.loading && <Skeleton className="h-48" />}
      {targets.error && !targets.data && <ErrorNotice error={targets.error} onRetry={targets.reload} />}
      {targets.data && targets.data.items.length === 0 && (
        <EmptyState
          icon={Crosshair}
          title="No targets yet"
          description="Add your LLM endpoint — or start with the built-in BharatBank demo app."
          action={<LinkButton to="/targets/new" variant="primary">Register a target</LinkButton>}
        />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {targets.data?.items.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/targets/${t.id}`} className="block truncate text-base font-semibold text-zinc-100 hover:text-accent-300">
                  {t.name}
                </Link>
                <p className="mt-1 truncate font-mono text-xs text-zinc-500">
                  {t.method} {t.base_url}
                </p>
              </div>
              {t.verification_status === 'verified' ? (
                <Badge tone="success">
                  <BadgeCheck className="size-3.5" aria-hidden /> Verified
                </Badge>
              ) : (
                <Badge tone="warning">
                  <ShieldQuestion className="size-3.5" aria-hidden /> Unverified
                </Badge>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {t.canary_strings.length} canary secret{t.canary_strings.length === 1 ? '' : 's'} · {t.headers.length} header
                {t.headers.length === 1 ? '' : 's'}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" icon={<Trash2 className="size-3.5" aria-hidden />} onClick={() => void onDelete(t.id, t.name)}>
                  Delete
                </Button>
                <LinkButton size="sm" to={`/targets/${t.id}`}>
                  Open
                </LinkButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
