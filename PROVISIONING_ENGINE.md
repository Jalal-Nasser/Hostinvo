# Hostinvo Provisioning Engine
# Version 2.0 — Aligned with System Architecture v2
# Source of truth: Hostinvo_System_Architecture_v2.docx § 7

---

## Overview

The provisioning engine manages the complete lifecycle of hosting accounts on remote control panels. It is built around a **driver interface pattern** — the core engine never contains panel-specific logic. All panel integrations are encapsulated in driver classes that implement a shared interface. Adding a new panel (DirectAdmin, Virtualizor, etc.) requires only a new driver class.

---

## Supported Panels (v1)

| Panel | Driver Class | API Type |
|-------|-------------|----------|
| cPanel / WHM | `CpanelDriver` | WHM XML-API v2 + cPanel UAPI |
| Plesk | `PleskDriver` | Plesk REST API (JSON) |

### Future Drivers (Roadmap)
- DirectAdmin
- Virtualizor
- Proxmox
- DigitalOcean
- Hetzner

---

## Directory Structure

```
app/
└── Provisioning/
    ├── Contracts/
    │   └── ProvisioningDriverInterface.php   ← all drivers implement this
    ├── Drivers/
    │   ├── Cpanel/
    │   │   └── CpanelDriver.php
    │   └── Plesk/
    │       └── PleskDriver.php
    ├── DTOs/
    │   ├── ProvisionPayload.php              ← readonly DTO, typed input
    │   └── ProvisionResult.php               ← readonly DTO, typed output
    │   └── UsageData.php
    │   └── ServiceStatus.php
    ├── DriverFactory.php                     ← resolves driver from panel_type
    ├── ServerSelector.php                    ← picks best server by load
    ├── ProvisioningJobDispatcher.php         ← dispatches jobs to critical queue
    └── ProvisioningLogger.php               ← writes to provisioning_logs table
```

---

## ProvisioningDriverInterface

All drivers must implement the following 8 operations with typed PHP 8.3 signatures:

```php
namespace App\Provisioning\Contracts;

interface ProvisioningDriverInterface
{
    public function createAccount(ProvisionPayload $payload): ProvisionResult;

    public function suspendAccount(string $username, string $reason): bool;

    public function unsuspendAccount(string $username): bool;

    public function terminateAccount(string $username): bool;

    public function changePackage(string $username, string $package): bool;

    public function resetPassword(string $username, string $serviceId): bool;

    public function syncUsage(string $username): UsageData;

    public function syncServiceStatus(string $username): ServiceStatus;
}
```

> **Rule:** Drivers must throw `App\Exceptions\ProvisioningException` on any API failure. They must never return null or swallow exceptions silently.

---

## Lifecycle Operations

### All 8 Required Operations

| Operation | Method | Trigger | cPanel API | Plesk API |
|-----------|--------|---------|-----------|-----------|
| Create Account | `createAccount()` | Order paid | `createacct` (WHM) | `POST /api/v2/subscriptions` |
| Suspend Account | `suspendAccount()` | Invoice overdue + grace expired | `suspendacct` (WHM) | `PUT /api/v2/subscriptions/{id}` → status: suspended |
| Unsuspend Account | `unsuspendAccount()` | Invoice paid after suspension | `unsuspendacct` (WHM) | `PUT /api/v2/subscriptions/{id}` → status: active |
| Terminate Account | `terminateAccount()` | Cancellation confirmed | `removeacct` (WHM) | `DELETE /api/v2/subscriptions/{id}` |
| Change Package | `changePackage()` | Service upgrade/downgrade | `changepackage` (WHM) | `PUT /api/v2/subscriptions/{id}` → serviceplanName |
| Reset Password | `resetPassword()` | Client or admin request | `passwd` (cPanel UAPI) | `POST /api/v2/subscriptions/{id}/resetPassword` |
| Sync Usage | `syncUsage()` | Daily cron — SyncServiceUsage task | `showbw` (WHM) | `GET /api/v2/subscriptions/{id}/stat` |
| Sync Service Status | `syncServiceStatus()` | Hourly cron — SyncServiceStatus task | `accountsummary` (WHM) | `GET /api/v2/subscriptions/{id}` |

---

## ProvisionPayload DTO

```php
readonly class ProvisionPayload
{
    public function __construct(
        public string  $serviceId,
        public string  $username,
        public string  $domain,
        public string  $email,
        public string  $packageName,    // panel-specific package name from server_packages
        public string  $ip,
        public ?string $contactEmail = null,
    ) {}
}
```

> **Rule:** `ProvisionPayload` must never contain plaintext credentials. Account passwords are generated or accepted before queue dispatch, encrypted into `service_credentials.value`, and retrieved inside the driver at runtime via `Crypt::decrypt()`.

---

## ProvisionResult DTO

```php
readonly class ProvisionResult
{
    public function __construct(
        public bool    $success,
        public string  $username,
        public ?string $ip        = null,
        public ?string $nameserver1 = null,
        public ?string $nameserver2 = null,
        public ?string $rawResponse = null,  // stored in provisioning_logs.response_payload
    ) {}
}
```

---

## ServerSelector

`App\Provisioning\ServerSelector`

Picks the best server for a new hosting account. Never hardcode a server ID anywhere.

**Selection Logic:**
1. Filter servers by `panel_type` matching the product's required panel
2. Filter servers linked to the product via `server_packages`
3. Filter servers with `status = active`
4. Filter servers where `account_count < max_accounts` (or `max_accounts IS NULL`)
5. Order by `account_count ASC` — pick the server with the fewest accounts (least-fill)
6. Return the first result or throw `NoAvailableServerException`

```php
class ServerSelector
{
    public function pickServer(string $productId): Server
    {
        // queries servers via ServerRepository
        // applies all 5 filters above
        // throws NoAvailableServerException if none found
    }
}
```

---

## ProvisioningJobDispatcher

`App\Provisioning\ProvisioningJobDispatcher`

Dispatches provisioning jobs to the `critical` Redis queue with retry configuration.

**Rules:**
- All provisioning jobs go to the `critical` queue — never `default` or `low`
- Retry policy: **3 attempts**, backoff: **60s → 300s → 900s** (exponential)
- Jobs must be **idempotent**: before making an API call, check `service.status`. If already `active`, skip and log a warning.
- After all retries are exhausted, dispatch `AdminAlertNotification` to the tenant admin email

```php
class ProvisioningJobDispatcher
{
    public function dispatch(ProvisionAccountJob $job): void
    {
        $job->onQueue('critical')
            ->tries(3)
            ->backoff([60, 300, 900]);

        dispatch($job);
    }
}
```

> **Rule:** `ProvisionAccountJob` receives `service_id` only. It must not serialize plaintext passwords or credential blobs into `jobs.payload` or `failed_jobs.payload`.

---

## ProvisioningLogger

`App\Provisioning\ProvisioningLogger`

Writes all provisioning API calls and responses to the `provisioning_logs` table.

**Rules:**
- Write a `status: pending` record **before** the API call
- Update to `status: success` or `status: failed` **after** the call
- Store sanitized `request_payload` (strip passwords) and raw `response_payload` as JSONB
- Record `duration_ms` for every operation
- Never expose credential values in log entries

```php
class ProvisioningLogger
{
    public function logStart(string $serviceId, string $operation, array $payload): int;

    public function logSuccess(int $logId, array $response, int $durationMs): void;

    public function logFailure(int $logId, string $error, array $response, int $durationMs): void;
}
```

---

## DriverFactory

`App\Provisioning\DriverFactory`

Resolves the correct driver class from `server.panel_type`.

```php
class DriverFactory
{
    public static function make(string $panelType): ProvisioningDriverInterface
    {
        return match ($panelType) {
            'cpanel' => app(CpanelDriver::class),
            'plesk'  => app(PleskDriver::class),
            default  => throw new UnsupportedPanelException("Panel: {$panelType}"),
        };
    }
}
```

---

## New Account Provisioning Flow

```
Order payment confirmed
    → PaymentService fires OrderPaidEvent
    → ProvisioningService::handleOrderPaid() listener invoked
    → ServerSelector::pickServer($productId) selects lowest-account server
    → DriverFactory::make($server->panel_type) resolves driver
    → Password generated or accepted and stored encrypted in service_credentials
    → ProvisionAccountJob(service_id) dispatched to 'critical' queue
        → Queue worker picks up job
        → Check: is service.status already 'active'? → skip if so (idempotency)
        → ProvisioningLogger::logStart()
        → ProvisioningService builds ProvisionPayload without password
        → $driver->createAccount($payload)
        → On success:
            service.status = active
            service.username = $result->username
            service_credentials retained/updated (all values encrypted)
            ProvisioningLogger::logSuccess()
            NotificationService sends 'account_created' email (EN or AR per client locale)
        → On failure (attempt 1–3):
            ProvisioningLogger::logFailure()
            Job retried with backoff (60s → 300s → 900s)
        → On final failure (attempt 3):
            Job → failed_jobs table
            AdminAlertNotification dispatched
            provisioning_log written with full exception
```

---

## cPanel / WHM Integration Details

| Aspect | Detail |
|--------|--------|
| API Type | WHM XML-API v2 for account management; cPanel UAPI for account-level operations |
| Authentication | WHM API token stored encrypted in `servers.api_token` — header: `Authorization: whm root:{token}` |
| Base URL (WHM) | `https://{server_ip}:2087/json-api/` |
| Base URL (UAPI) | `https://{server_ip}:2083/execute/` |
| SSL Verification | Controlled by `servers.ssl_verify` — disable only for self-signed dev environments |
| Account Username | Generated from client domain or custom prefix + random suffix; stored in `services.username` |
| Package Mapping | Hostinvo product maps to a named cPanel package; stored in `server_packages.panel_package_name` |
| Error Handling | Parse `result/status/statusmsg` from JSON response — throw `ProvisioningException` on failure |
| Required WHM ACL | `create-acct`, `kill-acct`, `suspend-acct`, `unsuspend-acct`, `change-package`, `show-bandwidth` — least privilege |

---

## Plesk Integration Details

| Aspect | Detail |
|--------|--------|
| API Type | Plesk REST API (JSON) — requires Plesk Obsidian 18.0 or later |
| Authentication | API key header: `X-API-Key: {key}` — key stored encrypted in `servers.api_token` |
| Base URL | `https://{server_ip}:8443/api/v2/` |
| Subscription Model | One Plesk subscription per hosting account — maps 1:1 to a Hostinvo service record |
| Service Plan | Hostinvo product maps to a Plesk service plan name; stored in `server_packages.panel_package_name` |
| Error Handling | Parse `code/message` from JSON error response — throw `ProvisioningException` on non-2xx |

---

## Error Handling Rules

1. Drivers throw `App\Exceptions\ProvisioningException` — never return false or null on failure
2. `ProvisionAccountJob` catches `ProvisioningException`, logs the failure, and re-throws to trigger queue retry
3. After all retries, Laravel moves the job to `failed_jobs` — the dispatcher sends an admin alert
4. `ProvisioningLogger` always writes — even if the job fails before reaching the driver call
5. **Never** log decrypted credentials anywhere — not in logs, not in `provisioning_logs`, not in `failed_jobs` payload

---

## Queue Configuration

| Queue | Priority | Workers | Used For | Retry Attempts | Backoff |
|-------|----------|---------|---------|---------------|---------|
| critical | Highest | 2 | Provisioning, payments, suspensions | 3 | 60s → 300s → 900s |
| default | Normal | 2 | Invoice generation, email notifications | 3 | 60s → 180s |
| low | Low | 1 | Usage sync, reports, session cleanup | 2 | 120s |

---

## Localization in Provisioning Notifications

- Account creation success email must be sent in the client's configured locale (`clients.locale`)
- Both `en` and `ar` email templates must exist in `resources/views/emails/en/` and `resources/views/emails/ar/`
- Arabic emails must render RTL — the email template must set `dir="rtl"` on the root element
- `NotificationService` resolves the correct template by `(event, locale)` from `notification_templates`
