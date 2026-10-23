export interface MigrationDescriptor {
  /** Monotonic sequence within a migration stream. */
  readonly sequence: number;
  /** Stable identifier, unique within the stream. */
  readonly id: string;
  /** SHA-256 checksum of the reviewed migration artifact, hex-encoded. */
  readonly checksumSha256: string;
  /** Human-readable summary; do not include schema or customer data. */
  readonly summary: string;
  /** Destructive or data-loss-prone migrations require explicit approval. */
  readonly destructive: boolean;
}

export interface MigrationStream {
  readonly streamId: string;
  readonly schemaVersion: "1";
  readonly migrations: readonly MigrationDescriptor[];
}

export interface MigrationValidationIssue {
  readonly code:
    | "invalid_stream_id"
    | "unsupported_schema_version"
    | "empty_stream"
    | "too_many_migrations"
    | "invalid_sequence"
    | "duplicate_sequence"
    | "non_monotonic_sequence"
    | "invalid_migration_id"
    | "duplicate_migration_id"
    | "invalid_checksum"
    | "invalid_summary"
    | "destructive_migration";
  readonly path: string;
}

export interface MigrationValidationOptions {
  readonly maxMigrations?: number;
  readonly allowDestructive?: boolean;
}

/**
 * Validates migration metadata only. It never connects to a database, runs SQL,
 * verifies a checksum against a file, or proves a migration is reversible.
 */
export function validateMigrationStream(
  stream: MigrationStream,
  options: MigrationValidationOptions = {}
): readonly MigrationValidationIssue[] {
  const issues: MigrationValidationIssue[] = [];
  const maxMigrations = options.maxMigrations ?? 2_000;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(stream.streamId)) {
    issues.push({ code: "invalid_stream_id", path: "/streamId" });
  }
  if (stream.schemaVersion !== "1") {
    issues.push({ code: "unsupported_schema_version", path: "/schemaVersion" });
  }
  if (stream.migrations.length === 0) issues.push({ code: "empty_stream", path: "/migrations" });
  if (!Number.isInteger(maxMigrations) || maxMigrations < 1 || maxMigrations > 100_000) {
    throw new RangeError("maxMigrations must be an integer between 1 and 100000.");
  }
  if (stream.migrations.length > maxMigrations) {
    issues.push({ code: "too_many_migrations", path: "/migrations" });
  }

  const ids = new Set<string>();
  const sequences = new Set<number>();
  let previousSequence = 0;
  stream.migrations.forEach((migration, index) => {
    const path = `/migrations/${index}`;
    if (!Number.isSafeInteger(migration.sequence) || migration.sequence < 1) {
      issues.push({ code: "invalid_sequence", path: `${path}/sequence` });
    }
    if (sequences.has(migration.sequence)) {
      issues.push({ code: "duplicate_sequence", path: `${path}/sequence` });
    }
    sequences.add(migration.sequence);
    if (migration.sequence <= previousSequence) {
      issues.push({ code: "non_monotonic_sequence", path: `${path}/sequence` });
    }
    previousSequence = migration.sequence;

    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(migration.id)) {
      issues.push({ code: "invalid_migration_id", path: `${path}/id` });
    }
    if (ids.has(migration.id)) {
      issues.push({ code: "duplicate_migration_id", path: `${path}/id` });
    }
    ids.add(migration.id);

    if (!/^[a-f0-9]{64}$/.test(migration.checksumSha256)) {
      issues.push({ code: "invalid_checksum", path: `${path}/checksumSha256` });
    }
    if (typeof migration.summary !== "string" || migration.summary.trim().length < 1 || migration.summary.length > 240) {
      issues.push({ code: "invalid_summary", path: `${path}/summary` });
    }
    if (migration.destructive && options.allowDestructive !== true) {
      issues.push({ code: "destructive_migration", path: `${path}/destructive` });
    }
  });
  return issues;
}
