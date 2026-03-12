# Beta Environment Validation

Phase 22 provides controlled beta validation tooling for staging-safe verification.

## Scope

This phase adds:

- staging fixture seeders for tenants, clients, catalog, servers, packages, and baseline services/subscriptions
- validation scripts and lifecycle checklists
- `BetaValidationService` simulations for provisioning, billing cycle, and webhook processing
- Artisan command: `php artisan hostinvo:beta-validate`

No core business modules are rewritten in this phase.

## Environment Guardrails

- Validation command is restricted to `staging`, `local`, or `testing` environments.
- Staging fixtures use test domains (`*.hostinvo.test`) and placeholder credentials only.
- Payment safety checks reject live-mode patterns during beta validation.
- Never place production secrets in `backend/.env.staging`.

## Seed Staging Fixtures

From repository root:

```bash
docker compose -f docker-compose.staging.yml exec -T app php artisan db:seed --class='Database\Seeders\Beta\BetaFixtureSeeder' --force
```

Helper scripts:

- PowerShell: `scripts/beta/seed-fixtures.ps1`
- Bash: `scripts/beta/seed-fixtures.sh`

## Run Beta Validation

From repository root:

```bash
docker compose -f docker-compose.staging.yml exec -T app php artisan hostinvo:beta-validate
```

Options:

- `--seed` seeds beta fixtures before checks
- `--json` prints machine-readable JSON report

Examples:

```bash
docker compose -f docker-compose.staging.yml exec -T app php artisan hostinvo:beta-validate --seed
docker compose -f docker-compose.staging.yml exec -T app php artisan hostinvo:beta-validate --json
```

Helper scripts:

- PowerShell: `scripts/beta/run-validation.ps1`
- Bash: `scripts/beta/run-validation.sh`

## Command Checks

`hostinvo:beta-validate` runs:

1. Database connectivity check
2. Queue health check
3. Redis health check
4. Worker/scheduler process visibility check
5. Monitoring endpoint registration check (`/health*`, `/metrics*`)
6. Payment sandbox configuration safety check
7. Provisioning simulation (rollback transaction)
8. Billing cycle simulation (rollback transaction)
9. Webhook verification simulation (rollback transaction)

## Lifecycle Checklists

Use these files for controlled beta walkthroughs:

- `scripts/beta/checklists/tenant-onboarding.md`
- `scripts/beta/checklists/provisioning-workflow.md`
- `scripts/beta/checklists/billing-payment-flow.md`
- `scripts/beta/checklists/domain-lifecycle.md`
- `scripts/beta/checklists/support-ticket-lifecycle.md`

