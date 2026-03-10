param(
    [string]$ComposeFile = "docker-compose.prod.yml",
    [switch]$SkipBuild
)

$backendEnv = "backend/.env.production"
if (-not (Test-Path $backendEnv)) {
    Write-Error "Missing $backendEnv. Copy backend/.env.production.example to backend/.env.production before deploying."
    exit 1
}

function Invoke-Compose {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    & docker compose -f $ComposeFile @Arguments

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

if (-not $SkipBuild) {
    Invoke-Compose build --pull
}

Invoke-Compose up -d --remove-orphans

Invoke-Compose exec -T app php artisan package:discover --ansi
Invoke-Compose exec -T app php artisan migrate --force --no-interaction
Invoke-Compose exec -T app php artisan optimize:clear
Invoke-Compose exec -T app php artisan config:cache
Invoke-Compose exec -T app php artisan route:cache
Invoke-Compose exec -T app php artisan view:cache
Invoke-Compose exec -T app php artisan event:cache
Invoke-Compose exec -T app php artisan queue:restart
Invoke-Compose restart queue-worker
