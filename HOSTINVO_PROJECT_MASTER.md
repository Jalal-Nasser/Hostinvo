# HOSTINVO_PROJECT_MASTER.md

# Hostinvo

## Project Summary
Hostinvo is a multi-tenant SaaS web hosting automation platform built to help hosting providers manage clients, billing, service provisioning, domains, support, and operational automation from one centralized system.

The platform is inspired by products such as WHMCS, but it will be designed with a modern modular architecture, AI-assisted development workflow, and support for bilingual interfaces.

---

## Product Goals

- Automate billing, invoicing, and payment collection
- Manage clients, services, subscriptions, and domains
- Provision hosting accounts automatically
- Support integrations with hosting control panels
- Provide a client self-service portal
- Provide an admin dashboard for operators
- Include support ticketing and knowledge base features
- Support English and Arabic languages across the platform

---

## Supported Languages

Hostinvo must support the following interface languages from the beginning:

- English
- Arabic

### Localization Requirements

- All customer-facing and admin-facing UI text must be translatable
- Database design should support language-aware settings where needed
- Email templates, invoice labels, notifications, and knowledge base content should support localization
- The frontend must support RTL layout for Arabic
- The frontend must support LTR layout for English
- Language switching should be available in both client portal and admin dashboard

### Recommended Localization Approach

Frontend:
- Use internationalization support compatible with the chosen frontend
- Ensure RTL-aware layouts and components

Backend:
- Store translatable strings through language files / translation resources
- Keep business logic language-agnostic
- Support localized email and notification templates

---

## Recommended Primary Technology Stack

This is the recommended stack for the first version of Hostinvo and should be treated as the default stack during AI-assisted development.

### Backend
- Language: PHP
- Framework: Laravel

### Frontend
- Primary recommendation: Next.js (React)
- Alternative for faster initial delivery: Laravel Blade

### Database
- PostgreSQL

### Cache / Queue
- Redis

### Containerization
- Docker

### Local Development Environment
- Docker Desktop

### API
- REST API as primary
- GraphQL as optional future extension

### Authentication
- Laravel authentication stack with JWT / OAuth support if needed

---

## Alternative Technology Options

These options are acceptable only if the project direction changes later.

### Option 1
- Language: TypeScript
- Framework: NestJS

### Option 2
- Language: Python
- Framework: Django

### Option 3
- Language: Go
- Framework: Gin or Fiber

### Recommendation
Laravel + PHP remains the recommended choice for Hostinvo because it is a strong fit for:

- billing systems
- admin-heavy SaaS platforms
- queues and scheduled jobs
- modular backend architecture
- rapid development
- mature ecosystem

---

## Hosting Control Panel Support

Hostinvo must support integration with:

- cPanel / WHM
- Plesk

### Provisioning Operations Required

The provisioning engine must support:

- CreateAccount
- SuspendAccount
- UnsuspendAccount
- TerminateAccount
- ChangePackage
- ResetPassword
- SyncUsage
- SyncServiceStatus

### Integration Design Rule

All hosting integrations must be implemented using a modular driver-based architecture so more providers can be added later, such as:

- DirectAdmin
- Virtualizor
- Proxmox
- DigitalOcean
- Hetzner
- AWS-based infrastructure

---

## Core Platform Modules

### 1. Authentication & Authorization
- user registration and login
- password reset
- roles and permissions
- tenant isolation

### 2. Client Management
- customer profiles
- company details
- contacts
- activity logs

### 3. Products & Plans
- hosting packages
- pricing models
- billing cycles
- configurable options

### 4. Orders & Checkout
- order creation
- checkout flow
- tax handling
- order review and acceptance

### 5. Billing & Invoices
- invoice generation
- recurring billing
- due dates
- payment tracking
- refunds and credits

### 6. Payment Gateways
- Stripe
- PayPal
- manual payments
- future gateway adapters

### 7. Hosting Provisioning Engine
- driver-based provisioning
- service lifecycle management
- account operations
- package assignment

### 8. Server & Infrastructure Management
- server records
- panel credentials
- provisioning metadata
- usage synchronization

### 9. Domain Management
- registration
- renewal
- expiry tracking
- registrar integrations

### 10. Support System
- ticketing
- departments
- replies
- statuses
- canned responses
- knowledge base

### 11. Notifications
- email notifications
- in-app notifications
- billing reminders
- provisioning alerts

### 12. Client Portal
- service management
- invoices
- payments
- support tickets
- profile settings
- language switching

### 13. Admin Dashboard
- clients overview
- invoices overview
- provisioning status
- support management
- automation monitoring
- analytics and reports

### 14. Automation System
- cron jobs
- queue workers
- retry handling
- audit logs
- system jobs

---

## High-Level System Architecture

### Frontend Layer
- Next.js frontend for client portal and admin UI
- bilingual support with Arabic RTL and English LTR
- authenticated dashboards
- API-driven components

### Backend Layer
- Laravel modular backend
- REST API
- domain-oriented modules
- service classes
- queue workers
- scheduled jobs

### Data Layer
- PostgreSQL for transactional data
- Redis for queues, caching, and short-lived state

### Infrastructure Layer
- Dockerized local development
- separate containers for app, nginx, postgres, redis, queue worker, scheduler
- production deployment on Linux Docker hosts or container orchestration later

### External Integrations
- cPanel / WHM API
- Plesk API
- Stripe API
- PayPal API
- SMTP / email service provider
- domain registrar APIs later

---

## Development Environment

### Use Docker Desktop?
Yes, use Docker Desktop for local development.

### Why
- easy multi-container development
- consistent local environment
- simplifies Laravel, PostgreSQL, Redis, and Nginx setup
- good fit for AI-generated setup and onboarding

### Production Note
Docker Desktop is for development only.
Production should use Docker Engine on Linux-based servers or managed container infrastructure.

---

## Suggested Docker Services

- app
- nginx
- postgres
- redis
- queue-worker
- scheduler
- mail testing service for development

---

## Database Architecture Overview

The database must be designed for a multi-tenant SaaS model.

### Main Entity Groups

#### Identity
- users
- roles
- permissions
- password_resets
- sessions

#### Tenancy / Accounts
- tenants
- tenant_settings
- tenant_users

#### Clients
- clients
- client_contacts
- client_addresses
- client_activity_logs

#### Catalog
- products
- product_pricing
- product_groups
- configurable_options

#### Orders
- orders
- order_items
- coupons
- taxes

#### Billing
- invoices
- invoice_items
- payments
- transactions
- credit_balances
- subscriptions

#### Hosting Services
- services
- service_credentials
- service_usage
- service_suspensions
- provisioning_logs

#### Servers
- servers
- server_groups
- server_packages
- panel_metadata

#### Domains
- domains
- domain_contacts
- domain_renewals
- registrar_logs

#### Support
- tickets
- ticket_replies
- ticket_departments
- ticket_statuses
- knowledge_base_articles
- knowledge_base_categories

#### Notifications
- notifications
- notification_templates
- email_logs

#### Automation
- jobs
- failed_jobs
- scheduled_task_logs
- webhook_logs
- audit_logs

---

## AI-Assisted Development Workflow

Hostinvo will be developed using a hybrid AI workflow:

- Claude for architecture, reasoning, reviews, and refinement
- Codex / ChatGPT for implementation, scaffolding, and iterative code generation

### Recommended Workflow

1. Define architecture
2. Define database schema
3. Define module boundaries
4. Generate Docker environment
5. Build backend foundation
6. Build modules one by one
7. Review code and architecture
8. Refactor and harden
9. Add tests
10. Add integrations

### Important Rule
Do not ask AI to build the whole platform at once.
Build Hostinvo module by module.

---

## AI Coding Rules

All generated code must follow the primary stack:

- Backend: Laravel (PHP)
- Frontend: Next.js or Laravel Blade
- Database: PostgreSQL
- Queue: Redis
- Containerization: Docker

### Restrictions
- Do not generate backend code in Node.js, Python, or Go unless explicitly requested
- Do not mix multiple backend stacks in the same implementation
- Keep provisioning integrations isolated behind driver interfaces
- Keep localization support in all UI and notification layers
- Respect Arabic RTL support in all frontend layouts

---

## Recommended Development Roadmap

### Phase 1
Project foundation
- Docker setup
- Laravel app bootstrap
- PostgreSQL and Redis integration
- environment configuration

### Phase 2
Authentication and tenant foundation
- auth
- roles
- permissions
- tenant model

### Phase 3
Client management
- clients
- contacts
- profile management

### Phase 4
Products and pricing
- product catalog
- billing cycles
- pricing rules

### Phase 5
Orders and checkout
- order creation
- checkout
- taxes
- order states

### Phase 6
Billing and invoices
- invoice generation
- recurring billing
- payments
- credits

### Phase 7
Payment gateways
- Stripe
- PayPal

### Phase 8
Provisioning engine
- generic driver contracts
- job dispatching
- lifecycle operations

### Phase 9
cPanel integration
- account creation
- suspension
- package changes

### Phase 10
Plesk integration
- provisioning operations
- plan mapping

### Phase 11
Support system
- tickets
- departments
- replies
- notifications

### Phase 12
Client portal
- services
- invoices
- tickets
- profile
- language switcher

### Phase 13
Admin dashboard
- reporting
- operations
- automation monitoring

### Phase 14
Domain management
- registrar foundation
- renewal tracking

### Phase 15
Localization completion
- Arabic translations
- English translations
- RTL validation
- email template localization

### Phase 16
Security and hardening
- audit logs
- rate limiting
- permission review
- integration secrets handling

---

## Suggested Repository Structure

```text
hostinvo/
├── docs/
│   ├── HOSTINVO_PROJECT_MASTER.md
│   └── archive/
├── backend/
├── frontend/
├── docker/
└── scripts/
```

---

## File Management Recommendation

Use this file as the main source of truth for AI prompts.

### Recommended Action
- Keep `HOSTINVO_PROJECT_MASTER.md` as the primary document
- Move old smaller markdown files into `/docs/archive/` instead of deleting them immediately

### Why
- They may still be useful as references
- You avoid losing planning work
- The master file becomes the main file attached to AI prompts

### Later Cleanup
After the project stabilizes, you can delete the smaller files if everything important has been preserved in this master file.

---

## Prompt Rule for AI

When prompting Claude or Codex, use instructions like:

Read `HOSTINVO_PROJECT_MASTER.md` and follow it as the authoritative project specification.
Use Laravel as backend, PostgreSQL as database, Redis as queue/cache, Docker for development, and support English + Arabic UI with RTL compatibility for Arabic.
Build only the requested phase or module. Do not generate the entire system at once.

---

## Final Recommendation

For Hostinvo, the best practical first implementation is:

- Backend: Laravel
- Frontend: Next.js
- Database: PostgreSQL
- Cache / Queue: Redis
- Development: Docker Desktop
- Languages: English + Arabic
- Hosting panels: cPanel / WHM and Plesk

This is the recommended baseline for v1.
