# Beta Checklist: Domain Lifecycle

- [ ] Create a domain linked to a tenant and client.
- [ ] Validate domain status transitions (`active`, `expired`, `pending_transfer`, `pending_delete`, `cancelled`).
- [ ] Add/update domain contact data and confirm tenant isolation.
- [ ] Record a renewal event and verify `domain_renewals` integrity.
- [ ] Verify `registrar_logs` captures domain activity.
- [ ] Confirm no live registrar credentials are configured in staging.
- [ ] Validate Arabic and English labels render correctly in domain views.

