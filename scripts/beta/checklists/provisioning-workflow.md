# Beta Checklist: Hosting Provisioning Workflow

- [ ] Create an order and paid invoice for a hosting product in staging.
- [ ] Confirm a service record is created and tied to the tenant and client.
- [ ] Dispatch `create_account` provisioning operation from admin API.
- [ ] Verify `provisioning_jobs` and `provisioning_logs` records are created.
- [ ] Validate queue routing uses expected tier (`critical` for provisioning operations).
- [ ] Confirm no plaintext credentials are present in `jobs` or `failed_jobs` payloads.
- [ ] Confirm provisioned service status transitions to expected state.
- [ ] Repeat with a failed simulation path and verify failure logging.

