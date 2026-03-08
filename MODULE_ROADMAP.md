# Hostinvo Development Roadmap
# Version 2.0 — Aligned with System Architecture v2
# Source of truth: Hostinvo_System_Architecture_v2.docx § 16

---

## Build Rule

> Build **one phase at a time**. Each phase must be completed and reviewed before the next phase begins.
> Do not generate the entire platform at once.
> Each Codex prompt must reference `HOSTINVO_PROJECT_MASTER.md` and `Hostinvo_System_Architecture_v2.docx` as the authoritative specification.

---

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| 01 | Foundation | ⬜ Not started |
| 02 | Auth & Tenancy | ⬜ Not started |
| 03 | Client Management | ⬜ Not started |
| 04 | Products & Plans | ⬜ Not started |
| 05 | Orders & Checkout | ⬜ Not started |
| 06 | Billing & Invoices | ⬜ Not started |
| 07 | Payment Gateways | ⬜ Not started |
| 08 | Provisioning Engine | ⬜ Not started |
| 09 | cPanel Integration | ⬜ Not started |
| 10 | Plesk Integration | ⬜ Not started |
| 11 | Support System | ⬜ Not started |
| 12 | Client Portal | ⬜ Not started |
| 13 | Admin Dashboard | ⬜ Not started |
| 14 | Domain Management | ⬜ Not started |
| 15 | Localization Completion | ⬜ Not started |
| 16 | Security & Hardening | ⬜ Not started |

---

## Phase 01 — Foundation

**Goal:** Working Docker environment with Laravel scaffold connected to PostgreSQL and Redis.

### Deliverables
- `docker-compose.yml` with all 7 services: app, nginx, postgres, redis, queue-worker, scheduler, mailpit
- Laravel 11 project initialized in `backend/`
- Next.js 14 project initialized in `frontend/`
- PostgreSQL 16 connectivity confirmed (`php artisan migrate`)
- Redis 7 connectivity confirmed (cache, session, queue)
- `.env` and `.env.example` fully documented
- Base `api.php` route file with `/api/v1/` prefix and standard response envelope stub
- `Makefile` or `scripts/setup.sh` for one-command dev environment start

### Key Migrations (Phase 01)
- None — only project scaffold and connectivity verification

### Codex Prompt Focus
Generate Docker environment and base Laravel + Next.js project scaffold.

---

## Phase 02 — Auth & Tenancy

**Goal:** Secure authentication with full multi-tenant isolation enforced at the data layer.

### Deliverables
- Migrations: `tenants`, `tenant_settings`, `users`, `roles`, `permissions`, `role_user`, `permission_role`, `sessions`, `password_reset_tokens`
- `TenantScope` global Eloquent scope applied to all tenant-aware models
- `ResolveTenant` middleware registered on all authenticated route groups
- Laravel Sanctum configured for SPA cookie auth + CSRF
- Super Admin guard (separate Sanctum guard, bypasses tenant scope deliberately)
- `AuthService`: login, logout, token management, password reset, session tracking
- `TenantService`: tenant resolution, settings provisioning, isolation enforcement
- Form Request classes: `LoginRequest`, `RegisterRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`
- API endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`
- Policies and role-based access enforced via Laravel Policies — no inline `Gate::` checks

### Codex Prompt Focus
Implement authentication system and tenant isolation with global query scopes and middleware.

---

## Phase 03 — Client Management

**Goal:** Full client profile management with contacts, addresses, and activity logging.

### Deliverables
- Migrations: `clients`, `client_contacts`, `client_addresses`, `client_activity_logs`
- `ClientService`: create/update/search clients, manage contacts and addresses, write activity logs
- `ClientRepository` implementing `ClientRepositoryInterface` — bound in `AppServiceProvider`
- `ClientController` (thin — max 10 lines per action, delegates to `ClientService`)
- Form Requests: `StoreClientRequest`, `UpdateClientRequest`
- `ClientPolicy`: all actions verify `$user->tenant_id === $client->tenant_id`
- API endpoints under `GET|POST|PUT|DELETE /api/v1/clients`
- Soft deletes on `clients`

### Codex Prompt Focus
Create client management module with repository pattern and tenant-scoped policies.

---

## Phase 04 — Products & Plans

**Goal:** Product catalog with flexible pricing, billing cycles, and configurable options.

### Deliverables
- Migrations: `products`, `product_pricing`, `product_groups`, `configurable_options`, `configurable_option_values`
- `ProductService`: manage plan catalog, calculate pricing, manage configurable options and groups
- `ProductRepository` implementing `ProductRepositoryInterface`
- All `price` columns as `INTEGER` in smallest currency unit — documented in migration comments
- API endpoints under `/api/v1/products`
- Tenant-scoped: all product queries filtered by `tenant_id`

### Codex Prompt Focus
Create products and pricing module with integer monetary storage.

---

## Phase 05 — Orders & Checkout

**Goal:** Order creation workflow with tax calculation and coupon support.

### Deliverables
- Migrations: `orders`, `order_items`, `taxes`, `coupons`, `coupon_usages`
- `OrderService`: create orders, manage status transitions, apply taxes and coupons, validate checkout
- `OrderRepository` implementing `OrderRepositoryInterface`
- Order status machine: `pending → active | cancelled | fraud`
- All total/amount columns as `INTEGER`
- API endpoints under `/api/v1/orders`
- Soft deletes on `orders`

### Codex Prompt Focus
Implement order and checkout system with coupon and tax handling.

---

## Phase 06 — Billing & Invoices

**Goal:** Invoice generation, recurring billing engine, and credit balance management.

### Deliverables
- Migrations: `invoices`, `invoice_items`, `subscriptions`, `credit_balances`
- `InvoiceService`: generate invoices, add line items, calculate totals, set due dates, issue credits
- `BillingService`: run recurring billing cycles, manage subscriptions, apply grace periods, trigger suspensions
- `InvoiceRepository` and `SubscriptionRepository`
- Scheduled task stub: `GenerateRecurringInvoices` (fires daily at 00:00 UTC)
- Invoice status machine: `draft → unpaid → paid | overdue | cancelled | refunded`
- All monetary columns as `INTEGER`
- Compound indexes on `invoices`: `(tenant_id, status)`, `(tenant_id, client_id)`, `(tenant_id, due_date)`
- Soft deletes on `invoices`
- API endpoints under `/api/v1/invoices`

### Codex Prompt Focus
Implement billing engine and invoice generation with recurring subscription management.

---

## Phase 07 — Payment Gateways

**Goal:** Driver-based payment gateway system supporting Stripe, PayPal, and manual payments.

### Deliverables
- Migrations: `payments`, `transactions`, `webhook_logs`
- `PaymentGatewayInterface`: `charge()`, `refund()`, `verifyWebhook()`, `getTransactionStatus()`
- `StripeGateway`: Stripe Payment Intents API, signed webhook verification via `Stripe\Webhook::constructEvent()`
- `PayPalGateway`: PayPal Orders API v2, IPN verification (POST-back to PayPal before processing)
- `ManualGateway`: offline payments — admin marks invoice as paid
- `PaymentService`: resolves gateway from tenant settings, records Payment + Transaction, fires `InvoicePaidEvent`
- `WebhookController`: `POST /api/v1/webhooks/{gateway}` — verifies signature, delegates to gateway driver
- All payment amounts as `INTEGER`; gateway credentials stored encrypted

### Codex Prompt Focus
Integrate Stripe and PayPal payment gateways with webhook signature verification.

---

## Phase 08 — Provisioning Engine

**Goal:** Driver-based hosting account lifecycle management with full async job infrastructure.

### Deliverables
- Migrations: `services`, `service_credentials`, `service_usage`, `service_suspensions`, `provisioning_logs`
- `ProvisioningDriverInterface` with all 8 typed method signatures
- `ProvisionPayload` and `ProvisionResult` readonly DTO classes
- `DriverFactory`: resolves driver from `server.panel_type`
- `ServerSelector`: picks server by lowest active account count per product group
- `ProvisioningJobDispatcher`: dispatches to `critical` queue, 3 attempts, backoff 60/300/900s
- `ProvisioningLogger`: writes pending/success/failed records to `provisioning_logs` with JSONB payloads
- `ProvisionAccountJob`, `SuspendAccountJob`, `UnsuspendAccountJob`, `TerminateAccountJob`, `ChangePackageJob`
- Queue tier configuration: `critical` (2 workers), `default` (2 workers), `low` (1 worker)
- Jobs must be idempotent — check service status before API call
- Soft deletes on `services`

### Codex Prompt Focus
Build provisioning engine driver architecture with async job dispatch and idempotency.

---

## Phase 09 — cPanel Integration

**Goal:** Full CpanelDriver implementing all 8 provisioning operations against WHM + cPanel APIs.

### Deliverables
- `CpanelDriver` implementing `ProvisioningDriverInterface`
- All 8 operations implemented against WHM XML-API v2 and cPanel UAPI
- Per-operation WHM API token authentication (`Authorization: whm root:{token}`)
- SSL verification controlled by `servers.ssl_verify`
- Error parsing from `result/status/statusmsg` JSON fields
- `ProvisioningException` thrown on any non-success response
- Migrations: `servers`, `server_groups`, `server_packages`, `panel_metadata`
- `ServerService`: manage server records, store encrypted credentials, track package assignments
- `api_token` on `servers` encrypted with `Crypt::encrypt` on write, `Crypt::decrypt` on read
- API endpoints under `/api/v1/servers`

### Codex Prompt Focus
Implement full cPanel/WHM driver for all 8 provisioning operations.

---

## Phase 10 — Plesk Integration

**Goal:** Full PleskDriver implementing all 8 provisioning operations against Plesk REST API.

### Deliverables
- `PleskDriver` implementing `ProvisioningDriverInterface`
- All 8 operations implemented against Plesk REST API (Obsidian 18.0+)
- `X-API-Key` header authentication — key encrypted in `servers.api_token`
- Error parsing from `code/message` JSON fields — `ProvisioningException` on non-2xx
- Package mapping from `server_packages.panel_package_name`
- Integration tests using mocked HTTP responses

### Codex Prompt Focus
Implement full Plesk REST API driver for all 8 provisioning operations.

---

## Phase 11 — Support System

**Goal:** Full ticketing system with departments, replies, and knowledge base.

### Deliverables
- Migrations: `tickets`, `ticket_replies`, `ticket_departments`, `ticket_statuses`, `knowledge_base_articles`, `knowledge_base_categories`
- `TicketService`: create tickets, handle replies, manage departments and statuses, send notifications
- Ticket status machine: `open → pending → answered → on_hold → closed`
- Internal notes (staff-only replies)
- `KnowledgeBaseService`: manage articles with `title_en`, `title_ar`, `content_en`, `content_ar` columns
- API endpoints under `/api/v1/tickets`
- Soft deletes on `tickets`

### Codex Prompt Focus
Create support ticketing system with departments and bilingual knowledge base.

---

## Phase 12 — Client Portal

**Goal:** Next.js client self-service portal consuming the REST API.

### Deliverables
- Next.js pages under `/[locale]/portal/`: Dashboard, Services, Invoices, Pay Invoice, Tickets, New Ticket, Profile, Language Switcher
- Zustand stores: `authStore`, `tenantStore`, `localeStore`, `notificationStore`
- Axios instance (`lib/api.ts`): `baseURL=/api/v1/`, `withCredentials: true`, CSRF interceptor, 401 interceptor
- TanStack Query (React Query v5) for all API data fetching
- `next-intl` configured with `locales: ['en', 'ar']`
- `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>` set in root layout
- All Tailwind spacing uses logical properties: `ms-`, `me-`, `ps-`, `pe-` — never `ml-`, `mr-`, `pl-`, `pr-`
- Shadcn/ui components customized to Hostinvo branding
- React Hook Form + Zod for all form validation

### Codex Prompt Focus
Build Next.js client self-service portal with bilingual RTL support.

---

## Phase 13 — Admin Dashboard

**Goal:** Next.js admin management dashboard for tenant operators.

### Deliverables
- Next.js pages under `/[locale]/admin/`: Dashboard, Clients, Services, Invoices, Orders, Products, Servers, Domains, Tickets, Reports, Automation Monitor
- Role-based navigation — menu items hidden/shown per user permissions
- Data tables with server-side pagination (cursor-based for large datasets)
- Charts and reporting components using Recharts or similar
- Audit log viewer (`/admin/audit-logs`)
- Server management with connection test (`POST /api/v1/servers/{id}/test`)
- Same RTL / localization requirements as Client Portal (Phase 12)

### Codex Prompt Focus
Build Next.js admin management dashboard with role-based navigation and reporting.

---

## Phase 14 — Domain Management

**Goal:** Domain lifecycle tracking, renewal management, and expiry alerts.

### Deliverables
- Migrations: `domains`, `domain_contacts`, `domain_renewals`, `registrar_logs`
- `DomainService`: track renewals, send expiry reminders, interface with registrar drivers
- Scheduled task: `CheckDomainExpiry` — sends renewal reminders at 60, 30, 14, and 7 days before expiry
- Registrar driver interface foundation (no live registrar integration in v1 — manual mode)
- Domain status machine: `active → expired | pending_transfer | pending_delete | cancelled`
- API endpoints under `/api/v1/domains`
- Soft deletes on `domains`

### Codex Prompt Focus
Implement domain management module with expiry tracking and renewal reminders.

---

## Phase 15 — Localization Completion

**Goal:** Complete Arabic translations, RTL validation, and localized email templates across the full platform.

### Deliverables

#### Backend
- `lang/en/*.php` — all backend user-facing strings in English
- `lang/ar/*.php` — complete Arabic translations for all backend strings
- All email templates in `resources/views/emails/en/` and `resources/views/emails/ar/`
- Arabic email templates with `dir="rtl"` on the root element
- `NotificationService` resolves template by `(event, locale)` from `notification_templates`

#### Frontend
- `messages/en.json` — complete English translation map (no hardcoded strings in JSX)
- `messages/ar.json` — complete Arabic translation map
- Full RTL audit: all Tailwind directional classes replaced with logical equivalents
- `Intl.NumberFormat` used for all currency display with locale and currency code
- `Intl.DateTimeFormat` used for all date display
- Language switcher tested in both portal and admin dashboard
- Arabic invoice PDF rendering validated (RTL layout, symbol suffix for SAR)

### Codex Prompt Focus
Complete Arabic localization and RTL validation across backend, frontend, and email templates.

---

## Phase 16 — Security & Hardening

**Goal:** Production-ready security posture — audit logs active, rate limiting enforced, pen-test prep complete.

### Deliverables

#### Audit Logging
- `AuditLogger` service writing to `audit_logs` on every admin and provisioning action
- Before/after state captured as JSONB for all model mutations
- Audit log viewer in admin dashboard (Phase 13 enhancement)

#### Rate Limiting
- Redis-backed throttle middleware: 60 req/min per authenticated user
- 10 req/min per IP for all auth endpoints (`/api/v1/auth/`)
- 10 req/min per IP for webhook endpoints (`/api/v1/webhooks/`)

#### Encryption Review
- All `servers.api_token` values verified encrypted — accessor/mutator test coverage
- All `service_credentials.value` values verified encrypted — accessor/mutator test coverage
- All gateway keys in `tenant_settings` verified encrypted

#### Security Headers
- `Content-Security-Policy`: `default-src 'self'` — no inline scripts, no eval
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (production only)

#### Webhook Security
- Stripe: `Stripe\Webhook::constructEvent()` with `STRIPE_WEBHOOK_SECRET` — reject with 403 on failure
- PayPal: IPN POST-back verification — only proceed if response is `VERIFIED`

#### Permission Audit
- Full review of all `Policy` classes — confirm `tenant_id` ownership checked on every action
- Confirm Super Admin guard cannot be escalated from regular admin routes
- WHM API token ACL review — confirm least-privilege token configuration documented

#### Additional
- `CHANGELOG.md` initialized
- Dependency vulnerability scan (`composer audit`, `npm audit`)
- `.env` secrets management documentation for production

### Codex Prompt Focus
Security review and hardening pass — audit logs, rate limiting, encryption verification, CSP headers.

---

## Automation Tasks Reference

The following scheduled tasks must be active by the end of their respective phases:

| Task | Frequency | UTC Time | Phase Introduced |
|------|-----------|----------|-----------------|
| GenerateRecurringInvoices | Daily | 00:00 | 06 |
| SendInvoiceReminders | Daily | 08:00 | 06 |
| SuspendOverdueServices | Daily | 02:00 | 08 |
| SyncServiceUsage | Daily | 03:00 | 08 |
| SyncServiceStatus | Hourly | — | 08 |
| CheckDomainExpiry | Daily | 01:00 | 14 |
| ProcessFailedJobs | Every 30 min | — | 08 |
| CleanupExpiredSessions | Daily | 04:00 | 02 |
| SendWeeklyReports | Weekly (Mon) | 07:00 | 13 |
| ArchiveOldAuditLogs | Monthly (1st) | 05:00 | 16 |
