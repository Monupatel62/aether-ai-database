# Dependencies and Contracts — aether-ai-database

**Status:** Proposed; technology selections remain open unless an accepted ADR says otherwise.

## Dependencies
Selected database driver and migration tooling (TBD). Domain repositories consume the shared tooling/contracts; the database package must not import API, orchestration, memory, files, billing or other domain services.

## Owned contracts
Shared persistence tooling, migration conventions, connection/security configuration guidance, low-level persistence contracts, tenant-isolation patterns, backup/restore/PITR verification and restore drills. Database provides tenant-isolation primitives and guidance only; it does not establish canonical tenant/workspace membership or role-grant ownership. Each domain owns its table semantics, domain constraints and migration intent; the physical migration packaging/composition strategy remains open.

## Requirements
- Version public schemas and message envelopes.
- Document limits, timeouts, retry behavior, idempotency, cancellation, and error handling where relevant.
- Preserve correlation IDs across API, agent, tool, queue, and provider operations.
- Document operational signals and failure recovery, not only the happy path.

Use versioned schemas, safe stable errors, bounded payloads/timeouts/retries, explicit idempotency and compatibility policy. Every schema change needs consumer review, migration notes and positive/negative fixtures. No repository boundary automatically requires a separate deployed service.

- [Master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
- [Master architecture](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/MASTER_ARCHITECTURE.md)
- [Security threat model](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/SECURITY_THREAT_MODEL.md)
- [Repository specification](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/repositories/aether-ai-database.md)
