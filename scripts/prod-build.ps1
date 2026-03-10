param(
    [string]$ComposeFile = "docker-compose.prod.yml"
)

$backendEnv = "backend/.env.production"
if (-not (Test-Path $backendEnv)) {
    Write-Error "Missing $backendEnv. Copy backend/.env.production.example to backend/.env.production before building."
    exit 1
}

$arguments = @("compose", "-f", $ComposeFile, "build", "--pull")

& docker $arguments

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
