param(
    [string]$ComposeFile = "docker-compose.prod.yml"
)

$backendEnv = "backend/.env.production"
if (-not (Test-Path $backendEnv)) {
    Write-Error "Missing $backendEnv. Copy backend/.env.production.example to backend/.env.production before restarting workers."
    exit 1
}

& docker compose -f $ComposeFile exec -T app php artisan queue:restart

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& docker compose -f $ComposeFile restart queue-worker

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
