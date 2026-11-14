# Starts the Chakravyuh dev stack, each service in its own window.
#   Backend      -> http://127.0.0.1:8010  (API docs at /docs)
#   Demo target  -> http://127.0.0.1:8100  (BharatBank Assist, the app we attack)
#   Demo target  -> http://127.0.0.1:8101  (Sahayak Seva, government-scheme helpdesk)
#   Demo target  -> http://127.0.0.1:8102  (Kaveri Bank Assist, realistic well-configured bot)
#   Frontend     -> http://localhost:5173
# Usage (from repo root):  powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
# First-time setup: see README.md ("Setup").

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$python = Join-Path $backend '.venv\Scripts\python.exe'

if (-not (Test-Path $python)) { throw "Backend venv missing. Run: python -m venv backend\.venv; backend\.venv\Scripts\pip install -r backend\requirements-dev.txt" }
if (-not (Test-Path (Join-Path $frontend 'node_modules'))) { throw "Frontend deps missing. Run: cd frontend; npm install" }
if (-not (Test-Path (Join-Path $backend '.env'))) { Write-Warning "backend\.env not found - copy backend\.env.example and set SARVAM_API_KEY." }

Start-Process powershell -WorkingDirectory $backend -ArgumentList '-NoExit', '-Command', "& '$python' -m uvicorn app.main:app --reload --port 8010"
Start-Process powershell -WorkingDirectory $root -ArgumentList '-NoExit', '-Command', "& '$python' -m uvicorn app:app --app-dir demo_target --port 8100"
Start-Process powershell -WorkingDirectory $root -ArgumentList '-NoExit', '-Command', "`$env:DEMO_BOT='sahayak'; & '$python' -m uvicorn app:app --app-dir demo_target --port 8101"
Start-Process powershell -WorkingDirectory $root -ArgumentList '-NoExit', '-Command', "`$env:DEMO_BOT='kaveri'; & '$python' -m uvicorn app:app --app-dir demo_target --port 8102"
Start-Process powershell -WorkingDirectory $frontend -ArgumentList '-NoExit', '-Command', 'npm run dev'

Write-Host 'Backend     : http://127.0.0.1:8010/docs'
Write-Host 'Demo target : http://127.0.0.1:8100  (BharatBank Assist)'
Write-Host 'Demo target : http://127.0.0.1:8101  (Sahayak Seva)'
Write-Host 'Demo target : http://127.0.0.1:8102  (Kaveri Bank Assist, realistic)'
Write-Host 'Frontend    : http://localhost:5173'
