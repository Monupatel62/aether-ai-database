import test from "node:test";
import assert from "node:assert/strict";
import { checksumMigration, DatabaseContractError, validateMigrationManifest, withTransaction } from "../src/index.js";

function fakePool(handler = async () => ({ rows: [] })) {
  const clients = [];
  return { clients, async connect() {
    const client = { statements: [], async query(sql) { this.statements.push(sql); return handler(sql, this); }, release() { this.released = true; } };
    clients.push(client); return client;
  } };
}

test("validates ordered unique migrations and destructive backup flags", () => {
  const manifest = validateMigrationManifest([{ id: "0001_create_users", checksum: "a".repeat(64) }, { id: "0002_drop_legacy", checksum: "b".repeat(64), destructive: true, requiresBackup: true }]);
  assert.equal(manifest.length, 2);
  assert.throws(() => validateMigrationManifest([{ id: "0001_drop_table", checksum: "a".repeat(64), destructive: true }]), (e) => e.code === "backup_required");
  assert.throws(() => validateMigrationManifest([{ id: "0002_second", checksum: "a".repeat(64) }, { id: "0001_first", checksum: "b".repeat(64) }]), DatabaseContractError);
});

test("computes stable SHA-256 migration checksums", () => {
  assert.equal(checksumMigration("CREATE TABLE demo(id int);").length, 64);
  assert.throws(() => checksumMigration("  "), DatabaseContractError);
});

test("commits and releases successful transactions", async () => {
  const pool = fakePool();
  const result = await withTransaction(pool, async (client) => { await client.query("SELECT 1"); return "ok"; });
  assert.equal(result, "ok");
  assert.deepEqual(pool.clients[0].statements, ["BEGIN ISOLATION LEVEL READ COMMITTED", "SELECT 1", "COMMIT"]);
  assert.equal(pool.clients[0].released, true);
});

test("rolls back failed transactions and hides database details", async () => {
  const pool = fakePool(async (sql) => { if (sql === "SELECT broken") throw Object.assign(new Error("private sql detail"), { code: "XX000" }); return {}; });
  await assert.rejects(withTransaction(pool, (client) => client.query("SELECT broken")), (e) => e.code === "transaction_failed" && !e.message.includes("private"));
  assert.equal(pool.clients[0].statements.at(-1), "ROLLBACK");
  assert.equal(pool.clients[0].released, true);
});

test("retries only recognized transient errors when explicitly safe", async () => {
  let calls = 0;
  const pool = fakePool(async (sql) => { if (sql === "SELECT work" && calls++ === 0) throw Object.assign(new Error("serialization"), { code: "40001" }); return {}; });
  await withTransaction(pool, (client) => client.query("SELECT work"), { retries: 1, retrySafe: true });
  assert.equal(pool.clients.length, 2);
  await assert.rejects(withTransaction(pool, async () => {}, { retries: 1 }), DatabaseContractError);
});

test("rejects unsupported isolation levels", async () => {
  const pool = fakePool();
  await assert.rejects(withTransaction(pool, async () => {}, { isolation: "read uncommitted" }), DatabaseContractError);
});
