param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

& docker compose exec app php artisan @Arguments
