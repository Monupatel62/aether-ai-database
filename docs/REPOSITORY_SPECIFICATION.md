# Repository specification: aether-ai-database

**Status:** Documentation baseline copied from the Aether AI master specification. Implementation status must be verified separately.

## Mission

Database schemas, migrations, persistence helpers, tenancy model, retention, backup, and restore contracts.

## Dependencies and connections

Selected database driver and migration tooling (TBD). Domain repositories consume the shared tooling/contracts; the database package must not import API, orchestration, memory, files, billing or other domain services.

## Owned capabilities

Shared persistence tooling, migration conventions, connection/security configuration guidance, low-level persistence contracts, tenant-isolation patterns, backup/restore/PITR verification and restore drills. Each domain owns its table semantics, domain constraints and migration intent; the physical migration packaging/composition strategy remains open.

## Non-goals

- Duplicating domain logic owned by another repository.
- Storing secrets in source control or logging raw sensitive payloads.
- Bypassing authentication, tenant authorization, retention, or audit requirements.
- Treating a repository boundary as automatic proof that a separate runtime service is required.

## Contract requirements

- Version public schemas and message envelopes.
- Document limits, timeouts, retry behavior, idempotency, cancellation, and error handling where relevant.
- Preserve correlation IDs across API, agent, tool, queue, and provider operations.
- Document operational signals and failure recovery, not only the happy path.

## Security and reliability checklist

- [ ] Least privilege and tenant isolation.
- [ ] Safe configuration defaults and runtime-only secrets.
- [ ] Input validation and payload limits.
- [ ] Retry-safe behavior and duplicate-delivery handling.
- [ ] Data retention/deletion and log redaction.
- [ ] Backup/restore or rollback plan where state/configuration is involved.

## Implementation gates

1. Confirm ownership and dependencies in [master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md).
2. Decide open infrastructure choices through ADRs rather than assumptions.
3. Build a minimal, testable component and add contract tests.
4. Run dependency/license, vulnerability, secret, and configuration checks.
5. Update architecture and runbooks in the same change as behavior.

## Research references

- [Aether AI master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
- [AI DIAL Core](https://github.com/epam/ai-dial-core)
- [AI DIAL Chat architecture](https://github.com/epam/ai-dial-chat/blob/development/docs/architecture.md)

All external projects are references or candidate dependencies only. Verify exact version, license, dependency tree, and security posture before reuse.

## Security and privacy

Enforce tenant scoping in data access paths, use parameterized queries, least-privilege DB roles, managed secrets, encryption and protected backups. Migrations must avoid leaking data and document retention/deletion effects. Do not let a shared schema layer become a bypass around domain authorization.

## Test plan

Test tenant isolation, migration upgrade/rollback limits, backup restore, retention/deletion, concurrent writes, transaction boundaries, and least-privilege DB access.

Before release, add unit tests, contract tests for direct dependencies, negative authorization/input tests, and failure/recovery tests for the behavior this component owns. Use synthetic or sanitized data only.

## Data-layer research gate

See [Data Infrastructure Evaluation](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/DATA_INFRASTRUCTURE_EVALUATION.md). PostgreSQL is the proposed transactional-store candidate, not yet an accepted deployment choice. This repository should own migration conventions, schema contracts, connection/security configuration guidance, backup/PITR verification and restore drills—not every domain's business rules. Domain owners own their data semantics and schema changes. Test RLS under non-owner runtime roles, pooled-connection tenant context reset, migration compatibility, backup restore and outbox consistency. No domain service may access another domain's private tables. Never make the cache or vector index the authority for billing, permissions, or durable run state.

## Related documentation

- [Master repository catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
- [Master architecture](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/MASTER_ARCHITECTURE.md)
- [Architecture audit](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/ARCHITECTURE_AUDIT.md)
- [Security threat model](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/SECURITY_THREAT_MODEL.md)
- [Open decisions and research](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/OPEN_DECISIONS_RESEARCH.md)
- [Continuity handoff](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/WORK_HANDOFF.md)
