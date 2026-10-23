import { createHash } from "node:crypto";

const MIGRATION_ID = /^\d{4,}_[a-z0-9]+(?:_[a-z0-9]+)*$/;
const ISOLATION = new Set(["read committed", "repeatable read", "serializable"]);
const RETRYABLE = new Set(["40001", "40P01"]);
export class DatabaseContractError extends Error {
  constructor(code, message = "Database contract violation") { super(message); this.name = "DatabaseContractError"; this.code = code; }
}

export function validateMigrationManifest(migrations) {
  if (!Array.isArray(migrations)) throw new DatabaseContractError("invalid_migrations", "Migrations must be an array");
  const seen = new Set();
  let previous = "";
  return Object.freeze(migrations.map((migration, index) => {
    if (!migration || typeof migration !== "object" || Array.isArray(migration)) throw new DatabaseContractError("invalid_migration", `Migration ${index} must be an object`);
    const { id, checksum, destructive = false, requiresBackup = false } = migration;
    if (typeof id !== "string" || !MIGRATION_ID.test(id) || seen.has(id)) throw new DatabaseContractError("invalid_migration_id", `Migration ${index} has an invalid or duplicate ID`);
    if (previous && id.localeCompare(previous) <= 0) throw new DatabaseContractError("migration_order", "Migrations must be sorted by ID");
    if (typeof checksum !== "string" || !/^[a-f0-9]{64}$/.test(checksum)) throw new DatabaseContractError("invalid_checksum", `Migration ${id} must have a SHA-256 checksum`);
    if (typeof destructive !== "boolean" || typeof requiresBackup !== "boolean") throw new DatabaseContractError("invalid_flags", `Migration ${id} has invalid flags`);
    if (destructive && !requiresBackup) throw new DatabaseContractError("backup_required", `Destructive migration ${id} must require a backup`);
    seen.add(id); previous = id;
    return Object.freeze({ id, checksum, destructive, requiresBackup });
  }));
}

export function checksumMigration(sql) {
  if (typeof sql !== "string" || !sql.trim()) throw new DatabaseContractError("empty_migration");
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

/**
 * Adapter contract: begin({isolation}), commit(), rollback(), release().
 * Retry is opt-in and only permitted when the caller explicitly certifies that
 * its callback is safe to rerun (e.g. no external side effects).
 */
export async function withTransaction(pool, callback, { isolation = "read committed", retries = 0, retrySafe = false } = {}) {
  if (!pool || typeof pool.connect !== "function" || typeof callback !== "function") throw new TypeError("Pool and callback are required");
  if (!ISOLATION.has(isolation)) throw new DatabaseContractError("invalid_isolation");
  if (!Number.isSafeInteger(retries) || retries < 0 || retries > 3 || (retries > 0 && retrySafe !== true)) throw new DatabaseContractError("unsafe_retry_policy");
  let attempt = 0;
  while (true) {
    const client = await pool.connect();
    let began = false;
    try {
      await client.query(`BEGIN ISOLATION LEVEL ${isolation.toUpperCase()}`);
      began = true;
      const result = await callback(client, { attempt });
      await client.query("COMMIT");
      return result;
    } catch (error) {
      if (began) {
        try { await client.query("ROLLBACK"); } catch { /* preserve the original error */ }
      }
      const code = typeof error?.code === "string" ? error.code : "";
      if (attempt < retries && RETRYABLE.has(code)) { attempt += 1; continue; }
      throw new DatabaseContractError(RETRYABLE.has(code) ? "transaction_conflict" : "transaction_failed", "Database transaction did not complete");
    } finally {
      try { client.release(); } catch { /* connection pool owns final recovery */ }
    }
  }
}
