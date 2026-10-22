# Security Review — aether-ai-database

**Status:** Design checklist only; no audit or certification claimed.

## Assets and threats
Tenant data, identifiers, credentials, configuration, audit records and service interfaces may be exposed through cross-tenant access, forged/stale context, malformed payloads, replay, resource exhaustion, unsafe dependencies or log leaks.

## Required controls
Enforce tenant scoping in data access paths, use parameterized queries, least-privilege DB roles, managed secrets, encryption and protected backups. Migrations must avoid leaking data and document retention/deletion effects. Do not let a shared schema layer become a bypass around domain authorization.

- Validate all trust-boundary payloads.
- Use least-privilege identities and runtime-only secrets.
- Enforce authorization at resource ownership boundaries.
- Define retention, deletion and telemetry redaction.
- Review dependency licenses, provenance, vulnerabilities and CI permissions.

## Verification
Test tenant isolation, migration upgrade/rollback limits, backup restore, retention/deletion, concurrent writes, transaction boundaries, and least-privilege DB access.

Before release, add unit tests, contract tests for direct dependencies, negative authorization/input tests, and failure/recovery tests for the behavior this component owns. Use synthetic or sanitized data only.
- [ ] Positive/negative contract fixtures run in CI.
- [ ] Tenant isolation and denial paths tested.
- [ ] Secret and dependency scans recorded.
- [ ] Failure/retry/recovery behavior tested.
