# aether-ai-database

**Status:** Initial transaction and migration-contract primitives implemented on a feature branch. No database engine, schema, or migration runner is selected here.

## Implemented

- [Database source](src/index.js): SHA-256 migration checksums, ordered migration manifest validation, destructive-migration backup flags, explicit transaction isolation, rollback/release handling, and opt-in retry for recognized serialization/deadlock errors.
- [Unit tests](test/database.test.js): manifest ordering, checksum, commit/rollback, connection release, retry policy, and isolation validation.
- Dependency-free Node.js package with Node 20/22 CI.

## Limitations

This is an adapter contract, not a database driver or migration runner. A production integration must ensure migration checksums are compared against applied history, migration execution is serialized, callbacks retried are side-effect-safe, and the transaction API is compatible with the selected database driver. No schema migrations or production database connection are included.

## Documentation

- [Repository specification](docs/REPOSITORY_SPECIFICATION.md)
- [Project specification](docs/PROJECT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Dependencies and contracts](docs/DEPENDENCIES_AND_CONTRACTS.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Security review](docs/SECURITY_REVIEW.md)
- [Master catalog](https://github.com/Monupatel62/aether-ai-platform/blob/main/docs/REPOSITORY_CATALOG.md)
