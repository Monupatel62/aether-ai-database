import { describe, expect, it } from "vitest";
import { validateMigrationStream } from "../src/index.js";
import type { MigrationStream } from "../src/index.js";

const valid: MigrationStream = {
  streamId: "core-schema",
  schemaVersion: "1",
  migrations: [
    { sequence: 1, id: "001-create-tenant", checksumSha256: "a".repeat(64), summary: "Create tenant metadata", destructive: false },
    { sequence: 2, id: "002-add-membership", checksumSha256: "b".repeat(64), summary: "Add membership relation", destructive: false }
  ]
};

describe("migration metadata validation", () => {
  it("accepts ordered unique migration metadata", () => {
    expect(validateMigrationStream(valid)).toEqual([]);
  });

  it("rejects duplicate IDs, duplicate/non-monotonic sequence, and malformed checksums", () => {
    const invalid: MigrationStream = {
      ...valid,
      migrations: [
        valid.migrations[0]!,
        { ...valid.migrations[1]!, sequence: 1, id: valid.migrations[0]!.id, checksumSha256: "not-a-checksum" }
      ]
    };
    const codes = validateMigrationStream(invalid).map(issue => issue.code);
    expect(codes).toContain("duplicate_sequence");
    expect(codes).toContain("non_monotonic_sequence");
    expect(codes).toContain("duplicate_migration_id");
    expect(codes).toContain("invalid_checksum");
  });

  it("requires explicit approval for destructive migrations", () => {
    const stream: MigrationStream = {
      ...valid,
      migrations: [{ ...valid.migrations[0]!, destructive: true }]
    };
    expect(validateMigrationStream(stream).map(issue => issue.code)).toContain("destructive_migration");
    expect(validateMigrationStream(stream, { allowDestructive: true })).toEqual([]);
  });

  it("bounds migration count and validates identifiers and summaries", () => {
    const invalid: MigrationStream = {
      ...valid,
      streamId: "../bad",
      migrations: [{ ...valid.migrations[0]!, id: "bad id", summary: " " }]
    };
    const codes = validateMigrationStream(invalid, { maxMigrations: 1 }).map(issue => issue.code);
    expect(codes).toContain("invalid_stream_id");
    expect(codes).toContain("invalid_migration_id");
    expect(codes).toContain("invalid_summary");
  });
});
