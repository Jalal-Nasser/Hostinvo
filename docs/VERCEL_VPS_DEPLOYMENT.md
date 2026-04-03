# Hostinvo Vercel + VPS Deployment

## Architecture Summary

Hostinvo remains a single monorepo with explicit runtime boundaries:

- `frontend/` deploys to Vercel as the Next.js runtime.
- `backend/` deploys to the VPS as the Laravel API runtime.
- PostgreSQL, Redis, queue workers, scheduler, and Zoho/SMTP mail stay on the VPS.
- Plesk is used only for domain management, TLS, and reverse proxying to the Docker-managed backend.

## Domain Mapping

| Domain | Runtime | Purpose |
|--------|---------|---------|
| `hostinvo.dev` | Vercel | Marketing site and public-facing pages |
| `portal.hostinvo.dev` | Vercel | Auth, onboarding, dashboard, and client portal UI |
| `api.hostinvo.dev` | VPS / Plesk reverse proxy | Laravel API, Sanctum, webhooks, health, and metrics |

## Repository Boundary

- Do not split the repository.
- Deploy the Vercel projects with `frontend/` as the root directory.
- Deploy the VPS runtime from the same repository with Docker targeting `backend/`.
- Keep local-only env files untracked. Commit example files only.

## Frontend Deployment on Vercel

Create two Vercel projects that both point to this repository and use `frontend/` as the root directory:

1. Marketing project
   - Production domain: `hostinvo.dev`
2. Portal project
   - Production domain: `portal.hostinvo.dev`

Recommended frontend production variables for both Vercel projects:

```dotenv
NEXT_PUBLIC_APP_NAME=Hostinvo
NEXT_PUBLIC_MARKETING_URL=https://hostinvo.dev
NEXT_PUBLIC_PORTAL_URL=https://portal.hostinvo.dev
NEXT_PUBLIC_API_URL=https://api.hostinvo.dev
NEXT_PUBLIC_API_BASE_URL=https://api.hostinvo.dev/api/v1
INTERNAL_API_BASE_URL=https://api.hostinvo.dev/api/v1
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SESSION_COOKIE=hostinvo_session
```

Notes:

- `NEXT_PUBLIC_API_BASE_URL` is the canonical API base used by the frontend.
- `INTERNAL_API_BASE_URL` must also point to `https://api.hostinvo.dev/api/v1` on Vercel because the `nginx` Docker hostname only exists in local Docker networking.
- Auth, forgot-password, reset-password, onboarding, dashboard, and portal routes should resolve against `portal.hostinvo.dev`.

## Backend Deployment on VPS / Plesk

Deploy the repository to the VPS and keep the backend Docker-managed:

- `api.hostinvo.dev` is configured in Plesk.
- Plesk terminates TLS and reverse proxies to the backend nginx/app container on the VPS.
- PostgreSQL, Redis, queue workers, scheduler, and mail remain private to the VPS.

Recommended backend production variables:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.hostinvo.dev
FRONTEND_URL=https://portal.hostinvo.dev
MARKETING_URL=https://hostinvo.dev
PORTAL_URL=https://portal.hostinvo.dev

SESSION_DOMAIN=.hostinvo.dev
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

SANCTUM_STATEFUL_DOMAINS=hostinvo.dev,portal.hostinvo.dev,api.hostinvo.dev
CORS_ALLOWED_ORIGINS=https://hostinvo.dev,https://portal.hostinvo.dev
```

## CORS and Sanctum Notes

- Laravel CORS must allow `https://hostinvo.dev` and `https://portal.hostinvo.dev`.
- Sanctum stateful domains must include `hostinvo.dev`, `portal.hostinvo.dev`, and `api.hostinvo.dev`.
- Use `SESSION_DOMAIN=.hostinvo.dev` so secure cookies work across the `portal` and `api` subdomains.
- Keep `supports_credentials=true` for SPA auth.

## Mail Placement

- SMTP mail stays on the backend/VPS side only.
- Vercel does not send transactional mail directly.
- Use backend env values only for Zoho/SMTP credentials.
- Never place SMTP credentials in any frontend env file.

## Local and Production Env Safety

- Keep these files untracked: `.env`, `backend/.env`, `frontend/.env.local`.
- Commit only example files such as:
  - `.env.example`
  - `.env.production.example`
  - `backend/.env.example`
  - `backend/.env.production.example`
  - `frontend/.env.example`
  - `frontend/.env.production.example`

## Testing Flow

Validate all three entry points after deployment:

1. `https://hostinvo.dev`
   - marketing pages load
   - locale switching works
2. `https://portal.hostinvo.dev`
   - login page loads
   - onboarding loads
   - dashboard requests authenticate against `api.hostinvo.dev`
3. `https://api.hostinvo.dev`
   - `/health` returns success
   - `/health/database` returns success
   - `/health/redis` returns success
   - `/health/queue` returns success
   - CORS allows requests from the two Vercel origins

## Operational Rule

Treat Plesk as the edge manager only:

- DNS / domain assignment
- TLS certificates
- reverse proxy to Docker

Do not use the Plesk Laravel installer or mix the Laravel runtime with Plesk-managed PHP handlers.
