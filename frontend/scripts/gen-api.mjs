// Generates the typed API contract from the FastAPI app — no running server needed.
//
//   npm run gen:api         -> writes src/api/openapi.json + src/api/schema.d.ts
//   npm run contract:check  -> exits 1 if the committed files are out of date
//
// Python is located at backend/.venv (Windows or Unix layout) or via $CHAKRAVYUH_PYTHON.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const backendDir = resolve(frontendDir, '..', 'backend')
const outDir = join(frontendDir, 'src', 'api')
const specPath = join(outDir, 'openapi.json')
const typesPath = join(outDir, 'schema.d.ts')
const checkOnly = process.argv.includes('--check')

function findPython() {
  if (process.env.CHAKRAVYUH_PYTHON) return process.env.CHAKRAVYUH_PYTHON
  const candidates = [
    join(backendDir, '.venv', 'Scripts', 'python.exe'),
    join(backendDir, '.venv', 'bin', 'python'),
  ]
  const found = candidates.find((p) => existsSync(p))
  if (!found) {
    console.error('Python venv not found. Create backend/.venv or set CHAKRAVYUH_PYTHON.')
    process.exit(1)
  }
  return found
}

const run = spawnSync(findPython(), ['-m', 'scripts.export_openapi'], {
  cwd: backendDir,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
})
if (run.status !== 0) {
  console.error(run.stderr || run.error)
  console.error('Failed to export OpenAPI spec from the backend.')
  process.exit(1)
}

const spec = JSON.parse(run.stdout)
const specText = `${JSON.stringify(spec, null, 2)}\n`
const header =
  '/**\n' +
  ' * GENERATED from the FastAPI OpenAPI spec by scripts/gen-api.mjs — DO NOT EDIT.\n' +
  ' * Change backend/app/schemas/* then run `npm run gen:api`.\n' +
  ' */\n\n'
const typesText = header + astToString(await openapiTS(spec)).replace(/\r\n/g, '\n')

const normalize = (s) => s.replace(/\r\n/g, '\n')
const read = (p) => (existsSync(p) ? normalize(readFileSync(p, 'utf8')) : null)

if (checkOnly) {
  const stale = []
  if (read(specPath) !== specText) stale.push('src/api/openapi.json')
  if (read(typesPath) !== typesText) stale.push('src/api/schema.d.ts')
  if (stale.length > 0) {
    console.error(`API contract is out of date: ${stale.join(', ')}`)
    console.error('Run `npm run gen:api` and commit the result.')
    process.exit(1)
  }
  console.log('API contract is up to date.')
} else {
  mkdirSync(outDir, { recursive: true })
  writeFileSync(specPath, specText, 'utf8')
  writeFileSync(typesPath, typesText, 'utf8')
  console.log(`Wrote ${specPath}\nWrote ${typesPath}`)
}
