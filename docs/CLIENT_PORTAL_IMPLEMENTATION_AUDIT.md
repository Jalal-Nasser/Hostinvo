# Client Portal Implementation Audit

## 1. Sections Checked
- Portal shell: left rail, desktop flyout, top utility bar, footer, locale switcher, account and saved-request entry points
- Homepage: domain hero, quick action cards, news block, route-backed action destinations
- Domain area: domain list, domain details, contacts, renewals, register request flow, transfer request flow, pricing
- Support area: tickets list, ticket details, new ticket, support submenu pages, network status, knowledgebase, news
- Billing and services area: invoices list/detail, services list/detail, linked support entry points
- Pagination and filters: domains, tickets, invoices, services

## 2. Broken Links/Routes
- Fixed: `Products` now surfaces real portal routes for services, invoices, and account
- Fixed: `Domains` submenu routes now go to register request, transfer request, and pricing pages
- Fixed: `Support -> Network Status`, `Knowledgebase`, and `News` now resolve to real portal pages
- Fixed: top utility links for saved requests and account now resolve to real portal pages

## 3. Dead Cards/Buttons
- Fixed: homepage quick actions now route only to real portal destinations
- Fixed: invoice list/detail `View invoice` actions use real API-backed pages
- Fixed: service list/detail actions use real API-backed pages and a real ticket creation entry point
- Kept honest: invoice detail `Pay invoice` remains disabled because no client payment endpoint exists yet

## 4. Placeholder Flows
- Fixed: domain registration no longer shows fabricated availability or prices
- Fixed: domain transfer no longer shows fabricated auth-code validation
- Fixed: account page no longer implies edit capability; it is explicitly read-only until backend profile endpoints exist
- Kept honest: knowledgebase, news, network status, and website security remain route-backed informational states without fake live content

## 5. Missing Core Client Portal Items
- Payments remain pending because no client payment flow endpoint is currently exposed to the portal
- Profile editing remains pending because backend update endpoints for portal users are not currently exposed
- Live registrar availability and transfer processing remain pending because no registrar lookup/transfer endpoint exists yet

## 6. Fixes Applied
- Added real API-backed client invoice pages:
  - `/[locale]/portal/invoices`
  - `/[locale]/portal/invoices/[invoiceId]`
- Added real API-backed client service pages:
  - `/[locale]/portal/services`
  - `/[locale]/portal/services/[serviceId]`
- Added backend client API routes:
  - `GET /api/v1/client/invoices`
  - `GET /api/v1/client/invoices/{invoice}`
  - `GET /api/v1/client/services`
  - `GET /api/v1/client/services/{service}`
- Replaced fake domain registration with a frontend request flow that creates a real support ticket for manual registrar handling
- Replaced fake domain transfer validation with a frontend request flow that creates a real support ticket for manual transfer handling
- Added pagination controls to portal domains, tickets, invoices, and services using API metadata
- Kept account read-only with honest copy because backend update actions are not available
- Updated portal navigation and product-area surfacing so services and invoices are reachable from the client portal

## 7. Remaining Intentional Stubs
- Online invoice payment from the client portal is intentionally pending until a real client payment endpoint exists
- Account/profile editing is intentionally pending until backend profile update endpoints exist
- Domain registration and transfer are intentionally request-based until real registrar APIs are connected
- News, network status, knowledgebase publishing, and website security content remain honest empty states until provider-managed content is available
