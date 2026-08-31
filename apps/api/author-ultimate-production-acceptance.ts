import { randomUUID } from "node:crypto";
import { Prisma, db } from "@qre/db";
import { AnalyticsEventTypes } from "@qre/contracts";
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";
import { compileExperience } from "./src/services/experienceService.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(`AUTHOR ULTIMATE PRODUCTION ACCEPTANCE FAILED: ${message}`);
  }
}

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function sequenceFingerprint(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => clean((item as Record<string, unknown>)?.text))
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
}

async function auditRows(operationId: string): Promise<number> {
  const rows = await db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "qre_memory_audit"
    WHERE "operation_id" = ${operationId}
  `);

  return Number(rows[0]?.count ?? 0);
}

async function analyticsForSession(sessionId: string) {
  return db.analyticsEvent.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      type: true,
      sessionId: true,
      meta: true,
      createdAt: true,
    },
  });
}

async function runAuthor(
  input: {
    assetId: string;
    userId?: string;
    prompt: string;
    lens: string;
    operationId: string;
    sessionId: string;
  },
) {
  const result = await compileExperience({
    assetId: input.assetId,
    userId: input.userId,
    prompt: input.prompt,
    lens: input.lens,
    movieMode: true,
    operationId: input.operationId,
    sessionId: input.sessionId,
    memoryRepository,
  });

  const diagnostics = result.authorDiagnostics as
    | Record<string, unknown>
    | undefined;

  assert(
    clean(diagnostics?.qualityStatus) === "ACCEPTED",
    `${input.lens}: canonical Author quality status is not ACCEPTED`,
  );

  assert(
    diagnostics?.renderable === true,
    `${input.lens}: result is not renderable`,
  );

  assert(
    diagnostics?.complete === true,
    `${input.lens}: authored result is not complete`,
  );

  assert(
    result.momentCount > 0,
    `${input.lens}: no moments returned`,
  );

  assert(
    result.moments.length === result.cinematicScenes.length,
    `${input.lens}: moments/scenes diverged`,
  );

  const beats = Array.isArray(result.beats) ? result.beats : [];
  assert(
    beats.length === result.momentCount,
    `${input.lens}: beat count does not match rendered moments`,
  );

  for (const beat of beats) {
    const meta = (beat.meta ?? {}) as Record<string, unknown>;
    const sourceIds = Array.isArray(meta.sourceIds) ? meta.sourceIds : [];
    assert(
      sourceIds.length > 0,
      `${input.lens}: beat ${beat.order} lost source provenance`,
    );
  }

  return result;
}

const assetId = clean(process.env.QRE_TEST_ASSET_ID) || "GRIMES";
const userId = clean(process.env.QRE_TEST_USER_ID) || undefined;
const sweep =
  clean(process.env.QRE_ULTIMATE_LENS_SWEEP || "true").toLowerCase() !== "false";

const memoryRepository = createMemoryRepository();

console.log("--- QRE ULTIMATE PRODUCTION AUTHOR ACCEPTANCE ---");
console.log(`asset=${assetId}`);
console.log(`user=${userId ? "present" : "asset-scope"}`);
console.log(`lensSweep=${sweep}`);

const asset = await db.asset.findUnique({
  where: { id: assetId },
  select: {
    id: true,
    displayName: true,
    category: true,
    slug: true,
  },
});

assert(asset, `real asset '${assetId}' does not exist`);

const baselineMemory = await memoryRepository.loadContext({
  assetId,
  userId,
});

assert(
  baselineMemory.facts.length + baselineMemory.events.length > 0,
  "real asset has no durable memory available to test",
);

const prompt =
  "Show me another moment from this asset's world. Let the significance emerge from what is already known.";

const baselineNeedle =
  [...baselineMemory.facts]
    .filter((fact) => fact.status === "active" && fact.confidence >= 0.7)
    .map((fact) => clean(fact.value))
    .filter((value) => value.length >= 3)
    .find((value) => !lower(prompt).includes(lower(value))) ||
  [...baselineMemory.events]
    .map((event) => clean(event.summary))
    .filter((value) => value.length >= 3)
    .find((value) => !lower(prompt).includes(lower(value))) ||
  "";

assert(
  baselineNeedle.length > 0,
  "could not identify a real pre-existing memory detail outside the return prompt",
);

console.log(`realPeripheralNeedle=${baselineNeedle}`);
console.log(`baseline.facts=${baselineMemory.facts.length}`);
console.log(`baseline.events=${baselineMemory.events.length}`);

const sessionId = `acceptance:ultimate:${assetId}:${Date.now()}:${randomUUID()}`;
const operationId = `acceptance:ultimate:${assetId}:${Date.now()}:${randomUUID()}`;

const core = await runAuthor({
  assetId,
  userId,
  prompt,
  lens: "revisit",
  operationId,
  sessionId,
});

const afterMemory = await memoryRepository.loadContext({
  assetId,
  userId,
});

const afterMemoryText = [
  ...afterMemory.facts.map((fact) => fact.value),
  ...afterMemory.events.map((event) => event.summary),
].map(lower);

assert(
  afterMemoryText.includes(lower(baselineNeedle)) ||
    afterMemoryText.some((value) => value.includes(lower(baselineNeedle))),
  "real pre-existing peripheral memory disappeared after production authoring",
);

const renderedCore = [
  ...core.moments,
  ...core.cinematicScenes,
  ...core.beats,
];
const renderedCoreText = renderedCore
  .map((item) => clean(JSON.stringify(item)))
  .join(" ")
  .toLowerCase();

const peripheralReappeared = renderedCoreText.includes(lower(baselineNeedle));

const analytics = await analyticsForSession(sessionId);
const analyticsTypes = new Set(analytics.map((event) => event.type));

assert(
  analyticsTypes.has(AnalyticsEventTypes.AI_MEMORY_USED),
  "real production run did not persist AI_MEMORY_USED analytics",
);

assert(
  analyticsTypes.has(AnalyticsEventTypes.AI_CINEMATIC_DECISION),
  "real production run did not persist AI_CINEMATIC_DECISION analytics",
);

assert(
  analyticsTypes.has(AnalyticsEventTypes.AI_MEMORY_LEARNED),
  "real production run did not persist AI_MEMORY_LEARNED analytics",
);

const session = await db.scanSession.findUnique({
  where: { id: sessionId },
  select: {
    id: true,
    assetId: true,
    status: true,
  },
});

assert(session?.assetId === assetId, "production Author did not persist its real session");

const auditCount = await auditRows(operationId);
assert(
  auditCount === 1,
  `production operation expected exactly one idempotent audit row, got ${auditCount}`,
);

console.log(`core.renderedPeripheral=${peripheralReappeared}`);
console.log(`core.analyticsEvents=${analytics.length}`);
console.log(`core.analyticsTypes=${[...analyticsTypes].join(",")}`);
console.log(`core.auditRows=${auditCount}`);
console.log(`core.sessionStatus=${session?.status ?? "missing"}`);
console.log(`core.returning=${Boolean(core.presence?.isReturning)}`);
console.log(`core.momentCount=${core.momentCount}`);
console.log("PASS · real production Author path persisted memory, analytics, session, and idempotent audit state");

const lensNames = [
  "funny",
  "romance",
  "horror",
  "sentimental",
  "absurd",
  "demented",
  "chaotic",
  "neutral",
] as const;

if (sweep) {
  console.log("--- QRE UNIVERSAL REAL LENS SWEEP ---");

  const fingerprints = new Map<string, string>();

  for (const lens of lensNames) {
    const lensSessionId = `acceptance:lens:${assetId}:${lens}:${Date.now()}:${randomUUID()}`;
    const lensOperationId = `acceptance:lens:${assetId}:${lens}:${Date.now()}:${randomUUID()}`;

    const result = await runAuthor({
      assetId,
      userId,
      prompt,
      lens,
      operationId: lensOperationId,
      sessionId: lensSessionId,
    });

    const fingerprint = sequenceFingerprint(result.moments);
    assert(fingerprint, `${lens}: empty sequence fingerprint`);
    fingerprints.set(lens, fingerprint);

    const lensAnalytics = await analyticsForSession(lensSessionId);
    assert(
      lensAnalytics.some((event) => event.type === AnalyticsEventTypes.AI_MEMORY_USED),
      `${lens}: missing AI_MEMORY_USED analytics`,
    );
    assert(
      lensAnalytics.some((event) => event.type === AnalyticsEventTypes.AI_CINEMATIC_DECISION),
      `${lens}: missing AI_CINEMATIC_DECISION analytics`,
    );

    const lensAuditCount = await auditRows(lensOperationId);
    assert(
      lensAuditCount === 1,
      `${lens}: expected one audit row for one logical operation, got ${lensAuditCount}`,
    );

    console.log(
      `${lens}: score=${clean((result.authorDiagnostics as Record<string, unknown> | undefined)?.selectedScore)} moments=${result.momentCount} auditRows=${lensAuditCount}`,
    );
  }

  const uniqueFingerprints = new Set(fingerprints.values());
  assert(
    uniqueFingerprints.size >= 3,
    `lens sweep did not materially differentiate the experience; unique sequences=${uniqueFingerprints.size}`,
  );

  console.log(`uniqueLensSequences=${uniqueFingerprints.size}/${lensNames.length}`);
  console.log("PASS · universal lens sweep materially changes authored experience while preserving production gates");
  console.log("--- END QRE UNIVERSAL REAL LENS SWEEP ---");
}

console.log("PASS · QRE ULTIMATE PRODUCTION AUTHOR ACCEPTANCE");
console.log("--- END QRE ULTIMATE PRODUCTION AUTHOR ACCEPTANCE ---");
