# Beta Checklist: Billing and Payment Flows

- [ ] Create invoice draft and ensure totals are stored in minor units.
- [ ] Mark invoice as paid using staging-safe payment path.
- [ ] Confirm payment and transaction records are created with `tenant_id`.
- [ ] Validate webhook processing with sandbox signatures only.
- [ ] Verify invalid webhook signatures are rejected with 400.
- [ ] Execute subscription renewal automation and confirm `next_billing_date` advancement.
- [ ] Confirm `last_billed_at` is stamped after renewal.
- [ ] Confirm no live Stripe/PayPal credentials are configured in staging.

