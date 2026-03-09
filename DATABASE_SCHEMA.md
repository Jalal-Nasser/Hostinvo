# Hostinvo Database Schema
# Version 2.0 — Aligned with System Architecture v2
# Source of truth: Hostinvo_System_Architecture_v2.docx § 6

---

## Design Rules (Mandatory)

- All public-facing entity PKs use **UUID** (gen_random_uuid())
- Internal / lookup table PKs use **BIGSERIAL**
- All monetary values stored as **INTEGER** in smallest currency unit (cents for USD, halalas for SAR)
- All timestamps use **TIMESTAMP WITH TIME ZONE** stored in UTC
- Every table in groups 03–12 carries a **tenant_id UUID NOT NULL FK → tenants.id**
- Soft deletes use **deleted_at TIMESTAMPTZ NULL** (SoftDeletes trait on all client-facing models)
- Foreign keys are enforced at **database level**, not just Eloquent relations
- Flexible payloads use **JSONB** columns (audit before/after, provisioning responses, notification data)
- Sensitive values (api_token, credentials) are **encrypted with Laravel Crypt** — never stored raw
- Compound indexes: **(tenant_id, status)**, **(tenant_id, client_id)**, **(tenant_id, due_date)** on all major tables

---

## Group 01 — Identity

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | gen_random_uuid() |
| tenant_id | UUID NULL FK → tenants.id | NULL for Super Admin |
| name | VARCHAR(255) NOT NULL | |
| email | VARCHAR(255) NOT NULL | unique per tenant |
| email_verified_at | TIMESTAMPTZ NULL | |
| password | VARCHAR(255) NOT NULL | bcrypt, cost ≥ 12 |
| remember_token | VARCHAR(100) NULL | |
| locale | VARCHAR(10) NOT NULL DEFAULT 'en' | 'en' or 'ar' |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, email)*

---

### roles
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| name | VARCHAR(100) NOT NULL | e.g. admin, support, billing |
| guard_name | VARCHAR(100) NOT NULL DEFAULT 'web' | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, name)*

---

### permissions
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NULL FK → tenants.id | NULL = platform-level permission |
| name | VARCHAR(255) NOT NULL | e.g. clients.view, invoices.create |
| guard_name | VARCHAR(100) NOT NULL DEFAULT 'web' | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Unique: (name, tenant_id)*

---

### role_user
| Column | Type | Notes |
|--------|------|-------|
| role_id | BIGINT NOT NULL FK → roles.id | |
| user_id | UUID NOT NULL FK → users.id | |

*Composite PK: (role_id, user_id)*

---

### permission_role
| Column | Type | Notes |
|--------|------|-------|
| permission_id | BIGINT NOT NULL FK → permissions.id | |
| role_id | BIGINT NOT NULL FK → roles.id | |

*Composite PK: (permission_id, role_id)*

---

### sessions
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(255) PK | |
| user_id | UUID NULL FK → users.id | |
| tenant_id | UUID NULL FK → tenants.id | stamped from authenticated session context |
| ip_address | INET NULL | |
| user_agent | TEXT NULL | |
| payload | TEXT NOT NULL | |
| last_activity | INTEGER NOT NULL | Unix timestamp |

*Index: (user_id), (tenant_id), (last_activity)*

---

### password_reset_tokens
| Column | Type | Notes |
|--------|------|-------|
| tenant_id | UUID NOT NULL FK → tenants.id | required tenant context for reset flow |
| email | VARCHAR(255) NOT NULL | |
| token | VARCHAR(255) NOT NULL | hashed |
| created_at | TIMESTAMPTZ NULL | |

*Composite key / unique: (email, tenant_id)*

---

## Group 02 — Tenancy

### tenants
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR(255) NOT NULL | hosting company name |
| slug | VARCHAR(100) NOT NULL UNIQUE | subdomain / identifier |
| plan | VARCHAR(100) NOT NULL DEFAULT 'standard' | |
| status | VARCHAR(50) NOT NULL DEFAULT 'active' | active, suspended, cancelled |
| owner_user_id | UUID NULL FK → users.id | first admin user |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ NULL | |

---

### tenant_settings
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| key | VARCHAR(255) NOT NULL | e.g. currency, default_language, smtp_host |
| value | TEXT NULL | encrypted for sensitive keys |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Unique: (tenant_id, key)*

---

## Group 03 — Clients

### clients
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| user_id | UUID NULL FK → users.id | linked login account |
| company_name | VARCHAR(255) NULL | |
| first_name | VARCHAR(100) NOT NULL | |
| last_name | VARCHAR(100) NOT NULL | |
| email | VARCHAR(255) NOT NULL | |
| phone | VARCHAR(50) NULL | |
| country | CHAR(2) NULL | ISO 3166-1 alpha-2 |
| currency | CHAR(3) NOT NULL DEFAULT 'USD' | ISO 4217 |
| locale | VARCHAR(10) NOT NULL DEFAULT 'en' | |
| status | VARCHAR(50) NOT NULL DEFAULT 'active' | active, suspended, closed |
| credit_balance | INTEGER NOT NULL DEFAULT 0 | in smallest currency unit |
| notes | TEXT NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ NULL | |

*Indexes: (tenant_id, email), (tenant_id, status)*

---

### client_contacts
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| first_name | VARCHAR(100) NOT NULL | |
| last_name | VARCHAR(100) NOT NULL | |
| email | VARCHAR(255) NOT NULL | |
| phone | VARCHAR(50) NULL | |
| is_primary | BOOLEAN NOT NULL DEFAULT false | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, client_id)*

---

### client_addresses
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| type | VARCHAR(50) NOT NULL DEFAULT 'billing' | billing, service |
| address_line_1 | VARCHAR(255) NOT NULL | |
| address_line_2 | VARCHAR(255) NULL | |
| city | VARCHAR(100) NULL | |
| state | VARCHAR(100) NULL | |
| postal_code | VARCHAR(20) NULL | |
| country | CHAR(2) NOT NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

### client_activity_logs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | append-only, no soft delete |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| user_id | UUID NULL FK → users.id | actor (admin or client) |
| description | TEXT NOT NULL | human-readable event |
| ip_address | INET NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, client_id)*

---

## Group 04 — Catalog

### products
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| product_group_id | BIGINT NULL FK → product_groups.id | |
| name | VARCHAR(255) NOT NULL | |
| description | TEXT NULL | |
| type | VARCHAR(50) NOT NULL | shared_hosting, vps, reseller, domain, other |
| status | VARCHAR(50) NOT NULL DEFAULT 'active' | active, hidden, retired |
| welcome_email | TEXT NULL | localized in email templates |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ NULL | |

*Index: (tenant_id, status)*

---

### product_pricing
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| product_id | UUID NOT NULL FK → products.id | |
| billing_cycle | VARCHAR(50) NOT NULL | monthly, quarterly, semi_annual, annual, biennial, triennial, one_time |
| price | INTEGER NOT NULL | in smallest currency unit |
| setup_fee | INTEGER NOT NULL DEFAULT 0 | |
| currency | CHAR(3) NOT NULL DEFAULT 'USD' | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Unique: (product_id, billing_cycle, currency)*

---

### product_groups
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| name | VARCHAR(255) NOT NULL | |
| sort_order | INTEGER NOT NULL DEFAULT 0 | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

### configurable_options
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| product_id | UUID NOT NULL FK → products.id | |
| name | VARCHAR(255) NOT NULL | |
| option_type | VARCHAR(50) NOT NULL | dropdown, quantity, checkbox, text |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

### configurable_option_values
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| option_id | BIGINT NOT NULL FK → configurable_options.id | |
| name | VARCHAR(255) NOT NULL | |
| price_modifier | INTEGER NOT NULL DEFAULT 0 | added to base price, in smallest unit |
| sort_order | INTEGER NOT NULL DEFAULT 0 | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

## Group 05 — Orders

### orders
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| status | VARCHAR(50) NOT NULL DEFAULT 'pending' | pending, active, cancelled, fraud |
| total_amount | INTEGER NOT NULL | in smallest currency unit |
| currency | CHAR(3) NOT NULL DEFAULT 'USD' | |
| coupon_id | BIGINT NULL FK → coupons.id | |
| tax_amount | INTEGER NOT NULL DEFAULT 0 | |
| notes | TEXT NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ NULL | |

*Indexes: (tenant_id, status), (tenant_id, client_id)*

---

### order_items
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| order_id | UUID NOT NULL FK → orders.id | |
| product_id | UUID NOT NULL FK → products.id | |
| billing_cycle | VARCHAR(50) NOT NULL | |
| quantity | INTEGER NOT NULL DEFAULT 1 | |
| unit_price | INTEGER NOT NULL | |
| setup_fee | INTEGER NOT NULL DEFAULT 0 | |
| discount_amount | INTEGER NOT NULL DEFAULT 0 | |
| total | INTEGER NOT NULL | |
| configurable_options | JSONB NULL | selected option values |
| created_at | TIMESTAMPTZ NOT NULL | |

---

### taxes
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| name | VARCHAR(100) NOT NULL | e.g. VAT, GST |
| rate | INTEGER NOT NULL | basis points — e.g. 1500 = 15.00% |
| country | CHAR(2) NULL | NULL = applies globally |
| state | VARCHAR(100) NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

### coupons
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| code | VARCHAR(100) NOT NULL | |
| type | VARCHAR(50) NOT NULL | percentage, fixed_amount |
| value | INTEGER NOT NULL | % basis points or fixed amount in smallest unit |
| max_uses | INTEGER NULL | NULL = unlimited |
| uses_count | INTEGER NOT NULL DEFAULT 0 | |
| expires_at | TIMESTAMPTZ NULL | |
| product_restrictions | JSONB NULL | array of product UUIDs |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Unique: (tenant_id, code)*

---

### coupon_usages
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| coupon_id | BIGINT NOT NULL FK → coupons.id | |
| order_id | UUID NOT NULL FK → orders.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| created_at | TIMESTAMPTZ NOT NULL | |

---

## Group 06 — Billing

### invoices
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| subscription_id | UUID NULL FK → subscriptions.id | |
| status | VARCHAR(50) NOT NULL DEFAULT 'draft' | draft, unpaid, paid, overdue, cancelled, refunded |
| total | INTEGER NOT NULL | in smallest currency unit |
| subtotal | INTEGER NOT NULL | |
| tax_amount | INTEGER NOT NULL DEFAULT 0 | |
| currency | CHAR(3) NOT NULL DEFAULT 'USD' | |
| due_date | DATE NOT NULL | |
| paid_at | TIMESTAMPTZ NULL | |
| notes | TEXT NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ NULL | |

*Indexes: (tenant_id, status), (tenant_id, client_id), (tenant_id, due_date)*

---

### invoice_items
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| invoice_id | UUID NOT NULL FK → invoices.id | |
| description | VARCHAR(500) NOT NULL | |
| quantity | INTEGER NOT NULL DEFAULT 1 | |
| unit_price | INTEGER NOT NULL | in smallest currency unit |
| discount_amount | INTEGER NOT NULL DEFAULT 0 | |
| total | INTEGER NOT NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |

---

### subscriptions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| service_id | UUID NOT NULL FK → services.id | |
| product_id | UUID NOT NULL FK → products.id | |
| billing_cycle | VARCHAR(50) NOT NULL | |
| price | INTEGER NOT NULL | locked at subscription time |
| currency | CHAR(3) NOT NULL DEFAULT 'USD' | |
| status | VARCHAR(50) NOT NULL DEFAULT 'active' | active, suspended, cancelled, pending_cancellation |
| next_billing_date | DATE NOT NULL | |
| last_billed_at | TIMESTAMPTZ NULL | |
| grace_period_days | INTEGER NOT NULL DEFAULT 3 | |
| auto_renew | BOOLEAN NOT NULL DEFAULT true | |
| cancellation_reason | TEXT NULL | |
| cancelled_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ NULL | |

*Indexes: (tenant_id, status), (tenant_id, next_billing_date)*

---

### payments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| invoice_id | UUID NOT NULL FK → invoices.id | |
| gateway | VARCHAR(100) NOT NULL | stripe, paypal, manual |
| gateway_transaction_id | VARCHAR(255) NULL | external reference |
| amount | INTEGER NOT NULL | in smallest currency unit |
| currency | CHAR(3) NOT NULL DEFAULT 'USD' | |
| status | VARCHAR(50) NOT NULL | successful, failed, pending, refunded |
| paid_at | TIMESTAMPTZ NULL | |
| notes | TEXT NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, invoice_id)*

---

### transactions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| payment_id | UUID NOT NULL FK → payments.id | |
| type | VARCHAR(50) NOT NULL | charge, refund, chargeback |
| amount | INTEGER NOT NULL | |
| currency | CHAR(3) NOT NULL | |
| gateway_response | JSONB NULL | raw gateway payload |
| created_at | TIMESTAMPTZ NOT NULL | |

---

### credit_balances
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| amount | INTEGER NOT NULL | positive = credit, negative = debit |
| currency | CHAR(3) NOT NULL DEFAULT 'USD' | |
| description | TEXT NOT NULL | |
| invoice_id | UUID NULL FK → invoices.id | |
| created_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, client_id)*

---

## Group 07 — Hosting Services

### services
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| product_id | UUID NOT NULL FK → products.id | |
| server_id | BIGINT NOT NULL FK → servers.id | |
| order_id | UUID NULL FK → orders.id | |
| status | VARCHAR(50) NOT NULL DEFAULT 'pending' | pending, active, suspended, terminated, cancelled |
| username | VARCHAR(255) NULL | panel account username |
| domain | VARCHAR(255) NULL | primary domain on this service |
| billing_cycle | VARCHAR(50) NOT NULL | |
| price | INTEGER NOT NULL | locked at order time |
| currency | CHAR(3) NOT NULL DEFAULT 'USD' | |
| registration_date | DATE NULL | |
| next_due_date | DATE NULL | |
| termination_date | DATE NULL | |
| notes | TEXT NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ NULL | |

*Indexes: (tenant_id, status), (tenant_id, client_id), (server_id, status)*

---

### service_credentials
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| service_id | UUID NOT NULL FK → services.id | |
| key | VARCHAR(100) NOT NULL | e.g. cpanel_password, ftp_password, db_password |
| value | TEXT NOT NULL | **encrypted with Laravel Crypt — never stored raw** |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Unique: (service_id, key)*
> **Rule:** Never log `value`. Only access via model accessor that calls `Crypt::decrypt()`.

---

### service_usage
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| service_id | UUID NOT NULL FK → services.id | |
| disk_used_mb | INTEGER NOT NULL DEFAULT 0 | |
| disk_limit_mb | INTEGER NULL | NULL = unlimited |
| bandwidth_used_mb | INTEGER NOT NULL DEFAULT 0 | |
| bandwidth_limit_mb | INTEGER NULL | |
| inodes_used | INTEGER NOT NULL DEFAULT 0 | |
| synced_at | TIMESTAMPTZ NOT NULL | |

*Index: (service_id)*

---

### service_suspensions
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| service_id | UUID NOT NULL FK → services.id | |
| reason | TEXT NOT NULL | |
| suspended_by_user_id | UUID NULL FK → users.id | NULL = automated |
| suspended_at | TIMESTAMPTZ NOT NULL | |
| unsuspended_at | TIMESTAMPTZ NULL | |

---

### provisioning_logs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| service_id | UUID NOT NULL FK → services.id | |
| server_id | BIGINT NOT NULL FK → servers.id | |
| operation | VARCHAR(100) NOT NULL | createAccount, suspendAccount, etc. |
| status | VARCHAR(50) NOT NULL | pending, success, failed |
| request_payload | JSONB NULL | sanitized — no raw credentials |
| response_payload | JSONB NULL | raw API response |
| error_message | TEXT NULL | |
| duration_ms | INTEGER NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, service_id), (status)*

---

## Group 08 — Servers

### servers
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | internal — never exposed in client-facing API URLs |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| server_group_id | BIGINT NULL FK → server_groups.id | |
| name | VARCHAR(255) NOT NULL | |
| panel_type | VARCHAR(50) NOT NULL | cpanel, plesk |
| api_endpoint | VARCHAR(500) NOT NULL | base URL of panel API |
| api_token | TEXT NOT NULL | **encrypted with Laravel Crypt — Crypt::encrypt on write, Crypt::decrypt on read** |
| hostname | VARCHAR(255) NULL | |
| ip_address | INET NULL | |
| status | VARCHAR(50) NOT NULL DEFAULT 'active' | active, maintenance, disabled |
| max_accounts | INTEGER NULL | NULL = unlimited |
| account_count | INTEGER NOT NULL DEFAULT 0 | maintained by SyncServiceStatus |
| ssl_verify | BOOLEAN NOT NULL DEFAULT true | false only for self-signed dev environments |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, panel_type, status)*

---

### server_groups
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| name | VARCHAR(255) NOT NULL | |
| fill_type | VARCHAR(50) NOT NULL DEFAULT 'least_accounts' | least_accounts, sequential |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

### server_packages
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| server_id | BIGINT NOT NULL FK → servers.id | |
| product_id | UUID NOT NULL FK → products.id | |
| panel_package_name | VARCHAR(255) NOT NULL | name of package/plan on the panel |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Unique: (server_id, product_id)*

---

### panel_metadata
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| server_id | BIGINT NOT NULL FK → servers.id | |
| key | VARCHAR(255) NOT NULL | |
| value | JSONB NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Unique: (server_id, key)*

---

## Group 09 — Domains

### domains
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| service_id | UUID NULL FK → services.id | linked hosting service if any |
| domain | VARCHAR(255) NOT NULL | |
| tld | VARCHAR(50) NOT NULL | |
| status | VARCHAR(50) NOT NULL DEFAULT 'active' | active, expired, pending_transfer, pending_delete, cancelled |
| registrar | VARCHAR(100) NULL | |
| registration_date | DATE NULL | |
| expiry_date | DATE NOT NULL | |
| auto_renew | BOOLEAN NOT NULL DEFAULT true | |
| dns_management | BOOLEAN NOT NULL DEFAULT false | |
| id_protection | BOOLEAN NOT NULL DEFAULT false | |
| renewal_price | INTEGER NULL | in smallest currency unit |
| currency | CHAR(3) NOT NULL DEFAULT 'USD' | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ NULL | |

*Indexes: (tenant_id, status), (tenant_id, expiry_date)*

---

### domain_contacts
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| domain_id | UUID NOT NULL FK → domains.id | |
| type | VARCHAR(50) NOT NULL | registrant, admin, tech, billing |
| first_name | VARCHAR(100) NOT NULL | |
| last_name | VARCHAR(100) NOT NULL | |
| email | VARCHAR(255) NOT NULL | |
| phone | VARCHAR(50) NULL | |
| address | JSONB NOT NULL | {line1, city, state, postal_code, country} |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

### domain_renewals
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| domain_id | UUID NOT NULL FK → domains.id | |
| years | SMALLINT NOT NULL DEFAULT 1 | |
| price | INTEGER NOT NULL | |
| status | VARCHAR(50) NOT NULL | pending, completed, failed |
| renewed_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |

---

### registrar_logs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| domain_id | UUID NOT NULL FK → domains.id | |
| operation | VARCHAR(100) NOT NULL | register, renew, transfer, update_contacts |
| status | VARCHAR(50) NOT NULL | success, failed |
| request_payload | JSONB NULL | |
| response_payload | JSONB NULL | |
| error_message | TEXT NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |

---

## Group 10 — Support

### ticket_departments
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| name | VARCHAR(255) NOT NULL | |
| email | VARCHAR(255) NULL | inbound email pipe address |
| is_default | BOOLEAN NOT NULL DEFAULT false | |
| sort_order | INTEGER NOT NULL DEFAULT 0 | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

### ticket_statuses
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| name | VARCHAR(100) NOT NULL | |
| color | VARCHAR(7) NULL | hex color for UI |
| is_default | BOOLEAN NOT NULL DEFAULT false | |
| sort_order | INTEGER NOT NULL DEFAULT 0 | |

---

### tickets
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| client_id | UUID NOT NULL FK → clients.id | |
| department_id | BIGINT NOT NULL FK → ticket_departments.id | |
| assigned_user_id | UUID NULL FK → users.id | |
| subject | VARCHAR(500) NOT NULL | |
| status | VARCHAR(50) NOT NULL DEFAULT 'open' | open, pending, answered, on_hold, closed |
| priority | VARCHAR(50) NOT NULL DEFAULT 'medium' | low, medium, high, urgent |
| service_id | UUID NULL FK → services.id | related service if any |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |
| deleted_at | TIMESTAMPTZ NULL | |

*Indexes: (tenant_id, status), (tenant_id, client_id)*

---

### ticket_replies
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| ticket_id | UUID NOT NULL FK → tickets.id | |
| user_id | UUID NULL FK → users.id | NULL if reply is from the client |
| client_id | UUID NULL FK → clients.id | NULL if reply is from a staff user |
| message | TEXT NOT NULL | |
| is_internal_note | BOOLEAN NOT NULL DEFAULT false | |
| attachments | JSONB NULL | array of file metadata |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

### knowledge_base_categories
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| name | VARCHAR(255) NOT NULL | |
| parent_id | BIGINT NULL FK → knowledge_base_categories.id | |
| sort_order | INTEGER NOT NULL DEFAULT 0 | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

---

### knowledge_base_articles
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| category_id | BIGINT NOT NULL FK → knowledge_base_categories.id | |
| title_en | VARCHAR(500) NOT NULL | |
| title_ar | VARCHAR(500) NULL | |
| content_en | TEXT NOT NULL | |
| content_ar | TEXT NULL | |
| status | VARCHAR(50) NOT NULL DEFAULT 'draft' | draft, published |
| views_count | INTEGER NOT NULL DEFAULT 0 | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, status)*

---

## Group 11 — Notifications

### notification_templates
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| event | VARCHAR(255) NOT NULL | e.g. invoice.created, service.suspended |
| locale | VARCHAR(10) NOT NULL | 'en' or 'ar' |
| subject | VARCHAR(500) NOT NULL | |
| body_html | TEXT NOT NULL | Blade/template with placeholders |
| body_text | TEXT NULL | plain text fallback |
| is_enabled | BOOLEAN NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ NOT NULL | |
| updated_at | TIMESTAMPTZ NOT NULL | |

*Unique: (tenant_id, event, locale)*

---

### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| type | VARCHAR(255) NOT NULL | fully qualified notification class |
| notifiable_type | VARCHAR(255) NOT NULL | e.g. App\Models\Client |
| notifiable_id | UUID NOT NULL | |
| data | JSONB NOT NULL | notification payload |
| read_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |

*Index: (notifiable_type, notifiable_id, read_at)*

---

### email_logs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| to_email | VARCHAR(255) NOT NULL | |
| subject | VARCHAR(500) NOT NULL | |
| event | VARCHAR(255) NULL | originating event |
| status | VARCHAR(50) NOT NULL | sent, failed, bounced |
| error_message | TEXT NULL | |
| sent_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, to_email)*

---

## Group 12 — Automation

### jobs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | native Laravel jobs table |
| queue | VARCHAR(255) NOT NULL | critical, default, low |
| payload | JSONB NOT NULL | |
| attempts | SMALLINT NOT NULL DEFAULT 0 | |
| reserved_at | INTEGER NULL | |
| available_at | INTEGER NOT NULL | |
| created_at | INTEGER NOT NULL | |

*Index: (queue, reserved_at, available_at)*

---

### failed_jobs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| uuid | VARCHAR(255) NOT NULL UNIQUE | |
| connection | TEXT NOT NULL | |
| queue | TEXT NOT NULL | |
| payload | TEXT NOT NULL | |
| exception | TEXT NOT NULL | |
| failed_at | TIMESTAMPTZ NOT NULL DEFAULT now() | |

---

### scheduled_task_logs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| task_class | VARCHAR(255) NOT NULL | |
| status | VARCHAR(50) NOT NULL | running, completed, failed |
| started_at | TIMESTAMPTZ NOT NULL | |
| completed_at | TIMESTAMPTZ NULL | |
| duration_ms | INTEGER NULL | |
| output | TEXT NULL | |
| error_message | TEXT NULL | |

---

### audit_logs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | **never soft-deleted** |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| user_id | UUID NULL FK → users.id | NULL for automated system actions |
| ip_address | INET NULL | |
| user_agent | TEXT NULL | |
| action | VARCHAR(255) NOT NULL | e.g. client.updated, invoice.cancelled |
| model_type | VARCHAR(255) NOT NULL | e.g. App\Models\Invoice |
| model_id | UUID NOT NULL | |
| before | JSONB NULL | state before change |
| after | JSONB NULL | state after change |
| created_at | TIMESTAMPTZ NOT NULL | |

*Indexes: (tenant_id, model_type, model_id), (tenant_id, user_id)*

---

### webhook_logs
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | |
| tenant_id | UUID NOT NULL FK → tenants.id | |
| gateway | VARCHAR(100) NOT NULL | stripe, paypal |
| event_type | VARCHAR(255) NOT NULL | e.g. payment_intent.succeeded |
| payload | JSONB NOT NULL | raw webhook body |
| status | VARCHAR(50) NOT NULL | received, processed, failed |
| error_message | TEXT NULL | |
| processed_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ NOT NULL | |

*Index: (tenant_id, gateway, status)*

---

## Compound Index Summary

| Table | Index Columns |
|-------|--------------|
| clients | (tenant_id, email), (tenant_id, status) |
| orders | (tenant_id, status), (tenant_id, client_id) |
| invoices | (tenant_id, status), (tenant_id, client_id), (tenant_id, due_date) |
| subscriptions | (tenant_id, status), (tenant_id, next_billing_date) |
| services | (tenant_id, status), (tenant_id, client_id), (server_id, status) |
| tickets | (tenant_id, status), (tenant_id, client_id) |
| domains | (tenant_id, status), (tenant_id, expiry_date) |
| provisioning_logs | (tenant_id, service_id), (status) |
| audit_logs | (tenant_id, model_type, model_id), (tenant_id, user_id) |
| webhook_logs | (tenant_id, gateway, status) |

---

## Soft Delete Reference

The following models use `deleted_at` (SoftDeletes trait):

`tenants`, `clients`, `orders`, `invoices`, `subscriptions`, `services`, `domains`, `tickets`, `products`

> `audit_logs`, `client_activity_logs`, `email_logs`, `webhook_logs`, `provisioning_logs` are append-only and must **never** be soft-deleted.
