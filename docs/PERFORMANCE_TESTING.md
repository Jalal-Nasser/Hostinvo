# Performance Testing

## Scope
Phase 23 focuses on performance tuning without business-logic changes:
- PostgreSQL index optimization for tenant-scoped queries
- Redis-backed caching for high-frequency tenant settings and catalog lookups
- Queue tier tuning (`critical`, `default`, `low`) and per-queue metrics
- API query optimization (eager loading + pagination clamping)

## Laravel Optimization Commands
Run during deploy/warmup:

```bash
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan view:cache
php artisan optimize
```

Optional reset during troubleshooting:

```bash
php artisan optimize:clear
```

## k6 Load Test Example
Create `scripts/load/k6-api-smoke.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    api_read_mix: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<900'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'https://staging-api.hostinvo.example';
  const token = __ENV.API_TOKEN || '';
  const tenantHost = __ENV.TENANT_HOST || 'staging-tenant.hostinvo.example';

  const headers = {
    Authorization: `Bearer ${token}`,
    'X-Tenant-Host': tenantHost,
    Accept: 'application/json',
  };

  const responses = [
    http.get(`${baseUrl}/api/v1/admin/clients?per_page=20`, { headers }),
    http.get(`${baseUrl}/api/v1/admin/invoices?per_page=20&status=unpaid`, { headers }),
    http.get(`${baseUrl}/api/v1/admin/orders?per_page=20&status=pending`, { headers }),
    http.get(`${baseUrl}/api/v1/admin/tickets?per_page=20`, { headers }),
  ];

  for (const response of responses) {
    check(response, {
      'status is 200': (r) => r.status === 200,
      'json response': (r) => r.headers['Content-Type']?.includes('application/json'),
    });
  }

  sleep(1);
}
```

Run:

```bash
k6 run -e BASE_URL=https://staging-api.hostinvo.example \
       -e API_TOKEN=<token> \
       -e TENANT_HOST=<tenant-host> \
       scripts/load/k6-api-smoke.js
```

## Recommended Concurrency Limits
- Baseline read-heavy API: `50-100` VUs
- Mixed read/write API: `20-50` VUs
- Webhook bursts: `<=10 req/sec` sustained per gateway endpoint
- Queue-intensive provisioning tests: cap at worker capacity per tier and monitor backlog growth

## Metrics To Watch
Watch these in `/metrics` and `/metrics/json`:
- `hostinvo_request_latency_ms_avg`
- `hostinvo_error_rate`
- `hostinvo_job_failure_rate`
- `hostinvo_queue_depth{queue="critical|default|low"}`
- `hostinvo_queue_jobs_processed_total{queue="..."}`
- `hostinvo_queue_jobs_failed_total{queue="..."}`

Operational thresholds:
- P95 API latency > 500ms for 5+ minutes
- Error rate > 1%
- Queue backlog above configured threshold (`MONITORING_ALERT_QUEUE_BACKLOG_THRESHOLD`)
- Job failure rate above configured threshold (`MONITORING_ALERT_JOB_FAILURE_RATE_THRESHOLD`)

## Performance Checklist
- PostgreSQL indexes are present (including Phase 23 partial indexes)
- Redis cache keys remain tenant-scoped for tenant-sensitive data
- Queue workers run by tier: `critical`, `default`, `low`
- API list endpoints keep eager loading and bounded pagination
- Config/route/event/view caches are warm in production and staging
- Monitoring dashboards include queue depth and per-queue failure metrics
