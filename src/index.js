export const DATABASE_CONTRACT_VERSION = "1.0";
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const MIGRATION_NAME_RE = /^[0-9]{14}_[a-z0-9]+(?:_[a-z0-9]+)*$/;
const SHA256_RE = /^[a-f0-9]{64}$/;

function identifier(value, field) {
  if (typeof value !== "string" || !ID_RE.test(value)) throw new TypeError(`${field} must be a valid identifier`);
  return value;
}

/** Driver-neutral migration metadata. SQL execution/transactions are owned by the selected adapter. */
export function createMigrationManifestEntry(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("migration input must be an object");
  if (typeof input.name !== "string" || !MIGRATION_NAME_RE.test(input.name)) throw new TypeError("migration name must begin with a 14-digit timestamp and use lowercase snake_case");
  if (typeof input.checksumSha256 !== "string" || !SHA256_RE.test(input.checksumSha256)) throw new TypeError("checksumSha256 must be a lowercase SHA-256 hex digest");
  const compatibility = input.compatibility ?? "expand";
  if (!["expand", "contract", "data", "operational"].includes(compatibility)) throw new TypeError("unsupported migration compatibility category");
  const dependencies = input.dependsOn ?? [];
  if (!Array.isArray(dependencies) || dependencies.length > 50) throw new TypeError("dependsOn must be an array with at most 50 entries");
  const normalizedDependencies = [...new Set(dependencies.map((dep) => {
    if (typeof dep !== "string" || !MIGRATION_NAME_RE.test(dep)) throw new TypeError("migration dependency name is invalid");
    if (dep === input.name) throw new TypeError("migration cannot depend on itself");
    return dep;
  }))];
  return Object.freeze({
    contractVersion: DATABASE_CONTRACT_VERSION,
    name: input.name,
    checksumSha256: input.checksumSha256,
    compatibility,
    dependsOn: Object.freeze(normalizedDependencies),
    requiresBackup: input.requiresBackup === true,
    ...(typeof input.description === "string" ? { description: input.description.trim().slice(0, 240) } : {}),
  });
}

/** Reject duplicate names, unknown dependencies, and dependency cycles before executing a migration plan. */
export function validateMigrationPlan(entries) {
  if (!Array.isArray(entries)) throw new TypeError("migration plan must be an array");
  const byName = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry.name !== "string") throw new TypeError("migration entry is invalid");
    if (byName.has(entry.name)) throw new TypeError(`duplicate migration: ${entry.name}`);
    byName.set(entry.name, entry);
  }
  for (const entry of entries) for (const dependency of entry.dependsOn ?? []) {
    if (!byName.has(dependency)) throw new TypeError(`unknown dependency ${dependency} for ${entry.name}`);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(name) {
    if (visiting.has(name)) throw new TypeError(`migration dependency cycle at ${name}`);
    if (visited.has(name)) return;
    visiting.add(name);
    for (const dependency of byName.get(name).dependsOn ?? []) visit(dependency);
    visiting.delete(name);
    visited.add(name);
  }
  for (const name of byName.keys()) visit(name);
  return Object.freeze({ valid: true, count: entries.length, orderedNames: Object.freeze([...byName.keys()]) });
}

/** Driver adapter must set/reset tenant context transaction-locally; this helper only validates the value. */
export function requireTenantContext(input = {}) {
  const tenantId = identifier(input.tenantId, "tenantId");
  const principalId = identifier(input.principalId, "principalId");
  const source = input.source ?? "request";
  if (!["request", "job", "system"].includes(source)) throw new TypeError("tenant context source is invalid");
  if (source === "system" && input.systemAuthorized !== true) throw new TypeError("system tenant context requires explicit authorization");
  return Object.freeze({
    contractVersion: DATABASE_CONTRACT_VERSION,
    tenantId,
    principalId,
    source,
    ...(typeof input.correlationId === "string" && ID_RE.test(input.correlationId) ? { correlationId: input.correlationId } : {}),
  });
}

/** A tenant context must never be assumed to survive pooled-connection reuse. */
export function tenantContextResetPolicy() {
  return Object.freeze({
    setWithinTransaction: true,
    resetBeforeConnectionReturn: true,
    rejectMissingContext: true,
    testWithNonOwnerRole: true,
  });
}
