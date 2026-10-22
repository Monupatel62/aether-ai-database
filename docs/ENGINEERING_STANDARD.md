# Engineering Standard — aether-ai-database

Applies if implementation is explicitly authorized:
- Use small modules, explicit ownership and typed interfaces.
- Comments explain invariants and non-obvious trade-offs, not syntax.
- Validate trust-boundary inputs; keep errors stable and safe.
- Use correlation IDs; never log credentials or protected content.
- Bound payload size, time, concurrency and retries.
- Make retryable side effects idempotent.
- Use least-privilege CI/workload identities and runtime secret injection.
- Add unit, contract, negative authorization, tenant isolation and failure tests.
- Record dependency licenses and update docs/runbooks with behavior changes.

Enforce tenant scoping in data access paths, use parameterized queries, least-privilege DB roles, managed secrets, encryption and protected backups. Migrations must avoid leaking data and document retention/deletion effects. Do not let a shared schema layer become a bypass around domain authorization.

- [Master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
- [Master architecture](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/MASTER_ARCHITECTURE.md)
- [Security threat model](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/SECURITY_THREAT_MODEL.md)
- [Repository specification](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/repositories/aether-ai-database.md)
