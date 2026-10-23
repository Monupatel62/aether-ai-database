import test from "node:test";
import assert from "node:assert/strict";
import { createMigrationManifestEntry, validateMigrationPlan, requireTenantContext, tenantContextResetPolicy } from "../src/index.js";

const checksum = "a".repeat(64);
const nameA = "20261023090000_add_source_table";
const nameB = "20261023090100_add_source_index";

test("validates migration names, checksums, and compatibility metadata", () => {
  const entry = createMigrationManifestEntry({ name: nameA, checksumSha256: checksum, compatibility: "expand", requiresBackup: true });
  assert.equal(entry.requiresBackup, true);
  assert.throws(() => createMigrationManifestEntry({ name: "bad_name", checksumSha256: checksum }), /timestamp/);
  assert.throws(() => createMigrationManifestEntry({ name: nameA, checksumSha256: "bad" }), /SHA-256/);
});

test("rejects duplicate migrations, missing dependencies, and cycles", () => {
  const a = createMigrationManifestEntry({ name: nameA, checksumSha256: checksum });
  const b = createMigrationManifestEntry({ name: nameB, checksumSha256: checksum, dependsOn: [nameA] });
  assert.equal(validateMigrationPlan([a, b]).count, 2);
  assert.throws(() => validateMigrationPlan([a, a]), /duplicate/);
  assert.throws(() => validateMigrationPlan([b]), /unknown dependency/);
  const cyclicA = createMigrationManifestEntry({ name: nameA, checksumSha256: checksum, dependsOn: [nameB] });
  assert.throws(() => validateMigrationPlan([cyclicA, b]), /cycle/);
});

test("requires explicit tenant and principal context", () => {
  const context = requireTenantContext({ tenantId: "tenant-a", principalId: "user-a", source: "request" });
  assert.equal(context.tenantId, "tenant-a");
  assert.throws(() => requireTenantContext({ tenantId: "tenant-a" }), /principalId/);
  assert.throws(() => requireTenantContext({ tenantId: "tenant-a", principalId: "user-a", source: "system" }), /explicit authorization/);
});

test("documents pool-safe transaction-local tenant context requirements", () => {
  assert.deepEqual(tenantContextResetPolicy(), { setWithinTransaction: true, resetBeforeConnectionReturn: true, rejectMissingContext: true, testWithNonOwnerRole: true });
});
