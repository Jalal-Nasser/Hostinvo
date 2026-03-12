param(
    [string]$ComposeFile = "docker-compose.staging.yml",
    [switch]$SeedFixtures,
    [switch]$Json
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Push-Location $repoRoot

try {
    $commandArgs = @("exec", "-T", "app", "php", "artisan", "hostinvo:beta-validate")

    if ($SeedFixtures) {
        $commandArgs += "--seed"
    }

    if ($Json) {
        $commandArgs += "--json"
    }

    & docker compose -f $ComposeFile @commandArgs

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}

