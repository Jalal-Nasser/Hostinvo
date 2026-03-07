param(
    [switch]$Build
)

$arguments = @("compose", "up", "-d")

if ($Build) {
    $arguments += "--build"
}

& docker $arguments
