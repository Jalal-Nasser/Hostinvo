# Launch Preparation

## Overview
Phase 24 introduces the commercial launch layer for Hostinvo:
- SaaS licensing validation and activation
- Provider-focused marketing pages
- Provider onboarding wizard
- Operational checklist for go-live readiness

This phase is additive and does not rewrite existing module logic.

## SaaS Licensing

### Data model
- `licenses`
  - Core fields: `license_key`, `owner_email`, `plan`, `status`, `max_clients`, `max_services`, `issued_at`, `expires_at`
  - Operational fields: `activation_limit`, `last_validated_at`, optional `tenant_id`
- `license_activations`
  - Tracks domain and instance activation records per license
  - Captures activation status, timestamps, and optional tenant mapping

### Validation flow
1. Client submits `license_key` and `domain` to `/api/v1/licensing/validate`
2. Backend validates:
   - key exists
   - license status is active
   - license is not expired
   - domain binding matches first bound activation domain (if already bound)
3. Response includes plan and limit metadata (`max_clients`, `max_services`, activation counters)

### Activation flow
1. Client submits `license_key`, `domain`, and `instance_id` to `/api/v1/licensing/activate`
2. Backend validates the same rules as above
3. Activation limit is enforced (`activation_limit` or plan default)
4. Activation record is written and license heartbeat timestamp is updated

## Provider Onboarding Process

### Step 1 - Create account
- Endpoint: `POST /api/v1/auth/provider-register`
- Creates tenant, owner user, tenant-owner role mapping, and primary tenant membership
- Optional license activation can be performed during registration

### Step 2 - Configure company
- Endpoint: `PUT /api/v1/auth/onboarding/company`
- Updates tenant identity and launch defaults:
  - company name
  - primary domain
  - locale
  - currency
  - timezone

### Step 3 - Add first server
- Uses existing server management module (`/dashboard/servers`)
- Configure cPanel/Plesk endpoint, credentials, and SSL policy

### Step 4 - Create first product
- Uses existing product catalog module (`/dashboard/products/new`)
- Define product type, pricing cycles, and visibility

### Status endpoint
- `GET /api/v1/auth/onboarding/status`
- Returns step completion and progress percentage for UI wizard rendering

## Frontend Launch Pages
- `/{locale}/` landing page
- `/{locale}/pricing`
- `/{locale}/features`
- `/{locale}/documentation`
- `/{locale}/contact`
- `/{locale}/onboarding`

English and Arabic content are available with automatic RTL/LTR direction from locale layout.

## Deployment Checklist

### Licensing
- [ ] Create and issue production license records
- [ ] Confirm `activation_limit` values for each plan
- [ ] Validate license-domain binding behavior in staging

### Onboarding
- [ ] Verify provider registration creates tenant owner and membership
- [ ] Verify company setup step persists tenant profile
- [ ] Verify onboarding progress transitions after first server/product creation

### Infrastructure
- [ ] Build and publish production images
- [ ] Run migrations with `--force`
- [ ] Warm Laravel caches (`config`, `route`, `event`, `view`)
- [ ] Ensure `storage:link --force` runs in deployment scripts
- [ ] Restart queue workers after deployment

### Security and Operations
- [ ] Verify production secrets are injected from secure secret store
- [ ] Confirm Redis password and protected network exposure
- [ ] Confirm webhook rate limiting and gateway allowlist are active
- [ ] Confirm monitoring alerts and health endpoints are reachable

### Launch validation
- [ ] Run integration suite (including onboarding and licensing tests)
- [ ] Run performance smoke tests from `docs/PERFORMANCE_TESTING.md`
- [ ] Run staging dry-run with real deployment flow before production cutover
