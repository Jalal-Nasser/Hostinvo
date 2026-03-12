# Beta Checklist: Tenant Onboarding

- [ ] Create a new tenant in staging with `default_locale` set correctly (`en` or `ar`).
- [ ] Verify tenant owner login via `/api/v1/auth/login` succeeds.
- [ ] Confirm tenant-scoped resources are isolated (`tenant_id` is set on created records).
- [ ] Validate role assignment for tenant owner/admin accounts.
- [ ] Validate locale switch between English and Arabic for portal/admin UI.
- [ ] Confirm Arabic pages render with RTL layout.
- [ ] Confirm no production domains, API keys, or email addresses are used.

