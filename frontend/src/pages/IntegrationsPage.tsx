import { Check, Copy, ExternalLink, Puzzle, Workflow } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

const REPO = 'https://github.com/chethangowda-web/Chakravyuh'

const WORKFLOW = `name: Chakravyuh multilingual security gate
on: pull_request

jobs:
  redteam:
    runs-on: ubuntu-latest
    steps:
      - uses: chethangowda-web/Chakravyuh@v1.0.0
        with:
          api-url: \${{ secrets.CHAKRAVYUH_API }}
          target-id: \${{ vars.CHAKRAVYUH_TARGET_ID }}
          languages: en-IN,hi-IN,kn-IN
          max-critical: "0"   # any critical leak blocks
          max-gap: "0.15"     # Indian language 15+ points worse blocks`

const LOCAL = `backend\\.venv\\Scripts\\python scripts\\ci_gate.py --campaign-id 30 --max-critical 0 --max-gap 0.15`

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative">
      <pre className="whitespace-pre-wrap break-all rounded-lg border border-zinc-800 bg-zinc-950 p-4 pr-24 font-mono text-xs leading-relaxed text-zinc-300">
        {text}
      </pre>
      <Button
        size="sm"
        className="absolute right-2 top-2"
        icon={copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        onClick={() => {
          void navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

function Steps({ items }: { items: readonly string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((text, i) => (
        <li key={text} className="flex gap-3 text-sm text-zinc-300">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-500/15 text-xs font-medium text-accent-300">{i + 1}</span>
          <span className="pt-0.5">{text}</span>
        </li>
      ))}
    </ol>
  )
}

export function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Integrations"
        description="Use Chakravyuh where you already work: in the browser while testing your bot, and in GitHub on every pull request."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Browser extension (Chrome / Edge)" description="Test your own chatbot’s web page in any Indian language without leaving the browser.">
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
              <Puzzle className="mt-0.5 size-5 shrink-0 text-accent-400" aria-hidden />
              <p>
                Open your bot’s page → pick an attack and language → <span className="text-zinc-200">Insert into chat box</span> → send it
                yourself → select the reply → <span className="text-zinc-200">Check</span>. You get the verdict with evidence, and it is saved
                here as a finding. It only works on sites that match a <span className="text-zinc-200">verified</span> target.
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Install</p>
              <Steps
                items={[
                  'Open chrome://extensions (or edge://extensions) and turn on Developer mode.',
                  'Click “Load unpacked” and choose the browser-extension folder of this project.',
                  'Pin the Chakravyuh icon. It talks to http://127.0.0.1:8010 by default (change it under ⚙).',
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Try it on the demo bots</p>
              <div className="flex flex-wrap gap-2">
                <a className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-accent-500" href="http://127.0.0.1:8101/chat-ui" target="_blank" rel="noreferrer">
                  Sahayak Seva chat <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <a className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-accent-500" href="http://127.0.0.1:8100/chat-ui" target="_blank" rel="noreferrer">
                  BharatBank chat <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Permissions: only the tab where you open it, only to insert text and read your selection. It never sends messages to the bot on its own.
            </p>
          </div>
        </Card>

        <Card title="GitHub Action" description="Red-team your staging bot on every pull request and block the merge when it leaks.">
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
              <Workflow className="mt-0.5 size-5 shrink-0 text-accent-400" aria-hidden />
              <p>
                Runs a campaign against a verified target (or gates a finished one), then <span className="text-zinc-200">fails the build</span> on
                critical findings or a large <span className="text-zinc-200">Language Security Gap</span>, with a per-language table in the job summary.
              </p>
            </div>
            <div>
              <p className="mb-2 font-mono text-xs text-zinc-500">.github/workflows/chakravyuh.yml</p>
              <CopyBlock text={WORKFLOW} />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Or run the same gate locally</p>
              <CopyBlock text={LOCAL} />
            </div>
            <p className="text-xs text-zinc-500">
              Needs a Chakravyuh API that GitHub’s runners can reach. Each new campaign spends Sarvam credits on your server. Details:{' '}
              <a className="text-accent-400 hover:underline" href={`${REPO}/blob/main/action.yml`} target="_blank" rel="noreferrer">
                action.yml
              </a>
              .
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
