import { Prisma } from "@prisma/client";
import { db } from "@qre/db";

import { createMemoryRepository } from "./src/repositories/memoryRepository.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `AUTHOR MEMORY AUDIT IDEMPOTENCY ACCEPTANCE FAILED: ${message}`,
    );
  }
}

const assetId = String(
  process.env.QRE_TEST_ASSET_ID ?? "",
).trim();

assert(
  assetId,
  "Set QRE_TEST_ASSET_ID to a real existing QRE asset",
);

const operationId =
  `acceptance:audit-idempotency:${assetId}:${Date.now()}`;

const memoryRepository =
  createMemoryRepository();

const batch = {
  operationId,
  assetId,
  entities: [],
  facts: [],
  relations: [],
  events: [],
};

console.log(
  "--- AUTHOR MEMORY AUDIT IDEMPOTENCY ACCEPTANCE ---",
);
console.log(`asset=${assetId}`);
console.log(`operationId=${operationId}`);

await Promise.all([
  memoryRepository.writeBatch(batch),
  memoryRepository.writeBatch(batch),
]);

const rows =
  await db.$queryRaw<
    Array<{ count: bigint }>
  >(
    Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "qre_memory_audit"
      WHERE "asset_id" = ${assetId}
        AND "operation_id" = ${operationId}
    `,
  );

const count = Number(
  rows[0]?.count ?? 0,
);

console.log(`auditRows=${count}`);

assert(
  count === 1,
  `expected exactly one audit row for operationId, got ${count}`,
);

console.log(
  "PASS · concurrent identical memory operations produce exactly one audit row",
);
console.log(
  "--- END AUTHOR MEMORY AUDIT IDEMPOTENCY ACCEPTANCE ---",
);
