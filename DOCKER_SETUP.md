# Hostinvo Docker Environment
# Version 2.0 — Aligned with System Architecture v2
# Source of truth: Hostinvo_System_Architecture_v2.docx § 12

---

## Overview

All local development runs in **Docker Desktop**. Seven containers share a single bridge network (`hostinvo_network`). The production environment uses Docker Engine on Linux — Docker Desktop is for development only.

For the production split used by Hostinvo:

- `frontend/` deploys to Vercel for `hostinvo.dev` and `portal.hostinvo.dev`
- `backend/` deploys to the VPS for `api.hostinvo.dev`
- Plesk handles DNS, TLS, and reverse proxying only

See [docs/VERCEL_VPS_DEPLOYMENT.md](docs/VERCEL_VPS_DEPLOYMENT.md) for the runtime boundary and deployment-specific env values.

---

## Containers

| Container | Image | Port(s) | Role |
|-----------|-------|---------|------|
| app | php:8.3-fpm (custom Dockerfile) | 9000 (internal) | Laravel PHP-FPM — serves the backend application |
| nginx | nginx:alpine | 80, 443 | Web server — reverse proxy to PHP-FPM for API; serves Next.js static output or proxies to Next dev server |
| postgres | postgres:16-alpine | 5432 | Primary PostgreSQL 16 database — all application data |
| redis | redis:7-alpine | 6379 | Cache, session storage, and all queue backends |
| queue-worker | Same image as app | — | Runs `artisan queue:work` on critical, default, and low queues |
| scheduler | Same image as app | — | Runs `artisan schedule:run` every minute via cron |
| mailpit | axllent/mailpit | 1025 (SMTP), 8025 (Web UI) | Local email catcher — all dev emails visible at http://localhost:8025 |

---

## docker-compose.yml Structure

```yaml
services:

  app:
    build:
      context: ./docker/php
      dockerfile: Dockerfile
    image: hostinvo-app
    container_name: hostinvo_app
    restart: unless-stopped
    working_dir: /var/www/html
    volumes:
      - ./backend:/var/www/html
    networks:
      - hostinvo_network
    depends_on:
      - postgres
      - redis

  nginx:
    image: nginx:alpine
    container_name: hostinvo_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./backend:/var/www/html
      - ./docker/nginx/conf.d:/etc/nginx/conf.d
    networks:
      - hostinvo_network
    depends_on:
      - app

  postgres:
    image: postgres:16-alpine
    container_name: hostinvo_postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - hostinvo_network

  redis:
    image: redis:7-alpine
    container_name: hostinvo_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - hostinvo_network

  queue-worker:
    image: hostinvo-app
    container_name: hostinvo_queue_worker
    restart: unless-stopped
    working_dir: /var/www/html
    command: php artisan queue:work --queue=critical,default,low --sleep=3 --tries=3 --max-time=3600
    volumes:
      - ./backend:/var/www/html
    networks:
      - hostinvo_network
    depends_on:
      - app
      - redis

  scheduler:
    image: hostinvo-app
    container_name: hostinvo_scheduler
    restart: unless-stopped
    working_dir: /var/www/html
    command: >
      sh -c "while true; do php artisan schedule:run --verbose --no-interaction; sleep 60; done"
    volumes:
      - ./backend:/var/www/html
    networks:
      - hostinvo_network
    depends_on:
      - app

  mailpit:
    image: axllent/mailpit
    container_name: hostinvo_mailpit
    restart: unless-stopped
    ports:
      - "1025:1025"   # SMTP — set MAIL_HOST=mailpit MAIL_PORT=1025 in .env
      - "8025:8025"   # Web UI — open http://localhost:8025 in browser
    networks:
      - hostinvo_network

networks:
  hostinvo_network:
    driver: bridge

volumes:
  postgres_data:   # persists PostgreSQL data across container restarts
  redis_data:      # persists Redis AOF data across container restarts
```

---

## Environment Variables (.env.example)

```dotenv
# Application
APP_NAME=Hostinvo
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

# Database
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=hostinvo
DB_USERNAME=hostinvo
DB_PASSWORD=secret

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=null

# Cache / Queue / Session
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Mail (development — mailpit)
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=noreply@hostinvo.test
MAIL_FROM_NAME="${APP_NAME}"

# Stripe (never commit real keys)
STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=

# PayPal (never commit real keys)
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=
PAYPAL_MODE=sandbox

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1

# Localization
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US
```

> **Rule:** Never commit `.env` to version control. Only `.env.example` is committed.
>
> Local-only env files such as `.env`, `backend/.env`, and `frontend/.env.local` must remain untracked.

---

## Repository Layout

```
hostinvo/
├── backend/                  ← Laravel 11 application
│   ├── app/
│   ├── database/
│   ├── lang/
│   │   ├── en/               ← English backend translations
│   │   └── ar/               ← Arabic backend translations
│   ├── resources/
│   │   └── views/
│   │       └── emails/
│   │           ├── en/       ← English email templates
│   │           └── ar/       ← Arabic email templates (dir="rtl")
│   └── routes/
│       └── api.php           ← All routes prefixed /api/v1/
├── frontend/                 ← Next.js 14 application
│   ├── src/
│   │   └── app/
│   │       └── [locale]/
│   │           ├── auth/
│   │           ├── portal/
│   │           ├── admin/
│   │           └── super-admin/
│   ├── messages/
│   │   ├── en.json           ← English UI translations (no hardcoded strings in JSX)
│   │   └── ar.json           ← Arabic UI translations
│   └── tailwind.config.ts    ← RTL plugin configured; use ms-/me-/ps-/pe-
├── docker/
│   ├── nginx/
│   │   └── conf.d/
│   │       └── default.conf
│   └── php/
│       └── Dockerfile        ← php:8.3-fpm base + composer + extensions
├── docs/
│   ├── HOSTINVO_PROJECT_MASTER.md
│   ├── Hostinvo_System_Architecture_v2.docx
│   └── archive/
└── scripts/
    └── setup.sh              ← one-command dev environment bootstrap
```

---

## PHP Dockerfile (docker/php/Dockerfile)

```dockerfile
FROM php:8.3-fpm

# System dependencies
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev libpq-dev \
    zip unzip && apt-get clean && rm -rf /var/lib/apt/lists/*

# PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd

# Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
```

---

## Nginx Configuration (docker/nginx/conf.d/default.conf)

```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/html/public;
    index index.php;

    # API — Laravel PHP-FPM
    location /api/ {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

---

## Development vs Production

| Concern | Development (Docker Desktop) | Production (Docker Engine / Linux) |
|---------|------------------------------|-------------------------------------|
| Environment | Docker Desktop — local machine | Docker Engine on Linux VPS or dedicated server |
| SSL | HTTP only (localhost) | Let's Encrypt via Certbot or managed certificate |
| Email | Mailpit — all mail caught at localhost:8025 | SES / SendGrid / Postmark / custom SMTP |
| Debug | `APP_DEBUG=true` — Laravel Telescope enabled | `APP_DEBUG=false` — log to file/syslog only |
| Queue Workers | Single `queue-worker` container | Supervisor managing 3–5 workers per queue tier |
| Next.js | `next dev` — hot reload on port 3000 | `next build` + `next start` behind nginx proxy |
| Scaling | Single node — all containers on one machine | Horizontal app scaling + load balancer in front of nginx |
| Secrets | `.env` file — never committed to git | Environment variables injected by orchestration or secret manager |

---

## Queue Worker Configuration (Production)

In production, Supervisor manages multiple workers per queue tier:

```ini
[program:hostinvo-critical]
command=php /var/www/html/artisan queue:work redis --queue=critical --tries=3 --backoff=60,300,900
numprocs=2
autostart=true
autorestart=true

[program:hostinvo-default]
command=php /var/www/html/artisan queue:work redis --queue=default --tries=3 --backoff=60,180
numprocs=2
autostart=true
autorestart=true

[program:hostinvo-low]
command=php /var/www/html/artisan queue:work redis --queue=low --tries=2 --backoff=120
numprocs=1
autostart=true
autorestart=true
```

---

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-org/hostinvo.git && cd hostinvo

# 2. Copy environment file
cp backend/.env.example backend/.env

# 3. Start all containers
docker compose up -d

# 4. Install PHP dependencies
docker compose exec app composer install

# 5. Generate app key
docker compose exec app php artisan key:generate

# 6. Run migrations
docker compose exec app php artisan migrate

# 7. (Optional) Seed dev data
docker compose exec app php artisan db:seed

# 8. View caught emails
open http://localhost:8025
```

---

## Localization Notes

- All Next.js frontend components must use `useTranslations()` — never hardcode English strings in JSX
- All Tailwind spacing/padding/margin must use logical CSS properties: `ms-`, `me-`, `ps-`, `pe-`
- The Next.js root layout sets `lang` and `dir` on `<html>` based on the active locale
- Arabic (`ar`) locale sets `dir="rtl"` — English (`en`) sets `dir="ltr"`
- All backend user-facing strings use `Lang::get()` — never hardcoded PHP strings
- Arabic email templates set `dir="rtl"` on the root element and use RTL-aware table layouts

---

## TLS Termination (Production)

TLS is terminated by an upstream proxy (Traefik, Cloudflare, ALB, or Nginx gateway).
The containerized Nginx listens on HTTP only and should not be exposed directly to the internet.
