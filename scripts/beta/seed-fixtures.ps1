param(
    [string]$ComposeFile = "docker-compose.staging.yml"
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Push-Location $repoRoot

try {
    & docker compose -f $ComposeFile exec -T app php artisan db:seed --class=Database\Seeders\Beta\BetaFixtureSeeder --force

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}

