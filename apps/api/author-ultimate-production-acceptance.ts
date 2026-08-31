import { Prisma, db } from "@qre/db";
import { AnalyticsEventTypes } from "@qre/contracts";
import type { MemoryRepository } from "./src/repositories/memoryRepository.js";
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";
import { compileExperience } from "./src/services/experienceService.js";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `AUTHOR ULTIMATE PRODUCTION ACCEPTANCE FAILED: ${message}`,
    );
  }
}

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function sequenceFingerprint(value: unknown): string {
  if (!Array.isArray(value)) return "";

  return value
    .map((item) => {
      const record =
        item && typeof item === "object"
          ? item as Record<string, unknown>
          : undefined;
      const payload =
        record?.payload && typeof record.payload === "object"
          ? record.payload as Record<string, unknown>
          : undefined;

      return clean(
        record?.text ??
        payload?.text ??
        record?.content ??
        payload?.content,
      );
    })
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
}

function warningSet(result: { warnings?: string[] }): Set<string> {
  return new Set(
    Array.isArray(result.warnings)
      ? result.warnings.map(clean).filter(Boolean)
      : [],
  );
}

function memoryFingerprint(
  context: Awaited<ReturnType<MemoryRepository["loadContext"]>>,
): string {
  return JSON.stringify({
    entities: context.entities
      .map((item) => [
        item.id,
        item.kind,
        item.name,
        item.canonicalKey,
        item.confidence,
        item.visibility,
        item.metadata ?? null,
      ])
      .sort(),
    facts: context.facts
      .map((item) => [
        item.id,
        item.entityId ?? null,
        item.kind,
        item.predicate,
        item.value,
        item.confidence,
        item.source,
        item.sourceRef ?? null,
        item.status,
        item.visibility,
        item.metadata ?? null,
      ])
      .sort(),
    relations: context.relations
      .map((item) => [
        item.id,
        item.fromEntityId,
        item.toEntityId,
        item.relation,
        item.confidence,
        item.source,
        item.sourceRef ?? null,
        item.visibility,
        item.metadata ?? null,
      ])
      .sort(),
    events: context.events
      .map((item) => [
        item.id,
        item.type,
        item.summary,
        item.occurredAt,
        item.source,
        item.confidence,
        item.entityIds,
        item.sessionId ?? null,
        item.metadata ?? null,
      ])
      .sort(),
  });
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

function diagnosticsOf(result: Awaited<ReturnType<typeof compileExperience>>): Record<string, unknown> {
  return result.authorDiagnostics && typeof result.authorDiagnostics === "object"
    ? result.authorDiagnostics as Record<string, unknown>
    : {};
}

function createReadOnlyMemoryRepository(
  realRepository: MemoryRepository,
): MemoryRepository {
  return {
    assertAccess: realRepository.assertAccess.bind(realRepository),
    loadContext: realRepository.loadContext.bind(realRepository),
    async writeBatch(): Promise<void> {
      throw new Error(
        "ULTIMATE_ACCEPTANCE_MEMORY_WRITE_SUPPRESSED",
      );
    },
  };
}

async function runAuthor(
  input: {
    assetId: string;
    userId?: string;
    prompt: string;
    lens: string;
    operationId: string;
    sessionId: string;
    memoryRepository: MemoryRepository;
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
    memoryRepository: input.memoryRepository,
  });

  const diagnostics = diagnosticsOf(result);
  const warningNames = warningSet(result);

  assert(
    clean(diagnostics.qualityStatus) === "ACCEPTED",
    `${input.lens}: canonical Author quality status is not ACCEPTED`,
  );

  assert(
    diagnostics.renderable === true,
    `${input.lens}: result is not renderable`,
  );

  assert(
    diagnostics.complete === true,
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

  const beats = Array.isArray(result.beats)
    ? result.beats
    : [];

  assert(
    beats.length === result.momentCount,
    `${input.lens}: beat count does not match rendered moments`,
  );

  for (const beat of beats) {
    const meta =
      beat.meta && typeof beat.meta === "object"
        ? beat.meta as Record<string, unknown>
        : {};
    const sourceIds = Array.isArray(meta.sourceIds)
      ? meta.sourceIds
      : [];

    assert(
      sourceIds.length > 0,
      `${input.lens}: beat ${beat.order} lost source provenance`,
    );
  }

  return {
    result,
    diagnostics,
    warningNames,
  };
}

const assetId =
  clean(process.env.QRE_TEST_ASSET_ID) || "GRIMES";

const userId =
  clean(process.env.QRE_TEST_USER_ID) || undefined;

const sweep =
  clean(
    process.env.QRE_ULTIMATE_LENS_SWEEP || "true",
  ).toLowerCase() !== "false";

const allowMemoryWrite =
  clean(
    process.env.QRE_ULTIMATE_ALLOW_MEMORY_WRITE || "false",
  ).toLowerCase() === "true";

const realMemoryRepository =
  createMemoryRepository();

const memoryRepository =
  allowMemoryWrite
    ? realMemoryRepository
    : createReadOnlyMemoryRepository(
        realMemoryRepository,
      );

console.log(
  "--- QRE ULTIMATE PRODUCTION AUTHOR ACCEPTANCE ---",
);

console.log(
  `asset=${assetId}`,
);

console.log(
  `user=${userId ? "present" : "asset-scope"}`,
);

console.log(
  `memoryWriteMode=${allowMemoryWrite ? "production-write" : "read-only-observation"}`,
);

console.log(
  `lensSweep=${sweep}`,
);

const asset =
  await db.asset.findUnique({
    where: { id: assetId },
    select: {
      id: true,
      displayName: true,
      category: true,
      slug: true,
    },
  });

assert(
  asset,
  `real asset '${assetId}' does not exist`,
);

const baselineMemory =
  await realMemoryRepository.loadContext({
    assetId,
    userId,
  });

assert(
  baselineMemory.facts.length +
    baselineMemory.events.length >
    0,
  "real asset has no durable memory available to test",
);

const baselineMemoryFingerprint =
  memoryFingerprint(
    baselineMemory,
  );

const prompt =
  "Show me another moment from this asset's world. Let the significance emerge from what is already known.";

const baselineNeedle =
  [
    ...baselineMemory.facts
      .filter(
        (fact) =>
          fact.status === "active" &&
          fact.confidence >= 0.7,
      )
      .map((fact) => clean(fact.value)),
    ...baselineMemory.events.map(
      (event) => clean(event.summary),
    ),
  ]
    .filter(
      (value) =>
        value.length >= 3 &&
        !lower(prompt).includes(
          lower(value),
        ),
    )
    .find(Boolean) || "";

assert(
  baselineNeedle.length > 0,
  "could not identify a real pre-existing memory detail outside the return prompt",
);

const presenceRows =
  await db.geoProof.findMany({
    where: { assetId },
    select: { sessionId: true },
    orderBy: { createdAt: "asc" },
  });

const realPresenceSessionIds = [
  ...new Set(
    presenceRows
      .map((row) => row.sessionId)
      .filter(
        (value): value is string =>
          typeof value === "string" &&
          value.length > 0,
      ),
  ),
];

assert(
  realPresenceSessionIds.length >= 2,
  `real return-state proof requires at least two distinct persisted presence sessions; found ${realPresenceSessionIds.length}`,
);

console.log(
  `realPresenceSessions=${realPresenceSessionIds.length}`,
);

console.log(
  `realPeripheralNeedle=${baselineNeedle}`,
);

console.log(
  `baseline.facts=${baselineMemory.facts.length}`,
);

console.log(
  `baseline.events=${baselineMemory.events.length}`,
);

const coreSessionId =
  `acceptance:ultimate:${assetId}:core`;

const coreOperationId =
  `acceptance:ultimate:${assetId}:core`;

const coreRun =
  await runAuthor({
    assetId,
    userId,
    prompt,
    lens: "revisit",
    operationId: coreOperationId,
    sessionId: coreSessionId,
    memoryRepository,
  });

const core = coreRun.result;

const afterCoreMemory =
  await realMemoryRepository.loadContext({
    assetId,
    userId,
  });

const coreMemoryFingerprint =
  memoryFingerprint(
    afterCoreMemory,
  );

if (!allowMemoryWrite) {
  assert(
    baselineMemoryFingerprint ===
      coreMemoryFingerprint,
    "read-only ultimate acceptance mutated durable memory",
  );

  assert(
    coreRun.warningNames.has(
      "memory_projection_failed",
    ),
    "read-only mode did not suppress production memory projection",
  );

  assert(
    coreRun.warningNames.has(
      "author_experience_state_persistence_failed",
    ),
    "read-only mode did not suppress Author state persistence",
  );
}

const coreText = [
  ...core.moments,
  ...core.cinematicScenes,
  ...core.beats,
]
  .map((item) => clean(JSON.stringify(item)))
  .join(" ")
  .toLowerCase();

const corePeripheralReappeared =
  coreText.includes(
    lower(baselineNeedle),
  );

const coreAnalytics =
  await analyticsForSession(
    coreSessionId,
  );

const coreAnalyticsTypes =
  new Set(
    coreAnalytics.map(
      (event) => event.type,
    ),
  );

assert(
  coreAnalyticsTypes.has(
    AnalyticsEventTypes.AI_MEMORY_USED,
  ),
  "real production run did not persist AI_MEMORY_USED analytics",
);

assert(
  coreAnalyticsTypes.has(
    AnalyticsEventTypes.AI_CINEMATIC_DECISION,
  ),
  "real production run did not persist AI_CINEMATIC_DECISION analytics",
);

if (allowMemoryWrite) {
  assert(
    coreAnalyticsTypes.has(
      AnalyticsEventTypes.AI_MEMORY_LEARNED,
    ),
    "production-write run did not persist AI_MEMORY_LEARNED analytics",
  );
}

const session =
  await db.scanSession.findUnique({
    where: { id: coreSessionId },
    select: {
      id: true,
      assetId: true,
      status: true,
    },
  });

assert(
  session?.assetId === assetId,
  "production Author did not persist its real session",
);

assert(
  core.presence?.isReturning === true,
  `production Author did not recognize the real asset as returning; visitNumber=${core.presence?.visitNumber ?? "none"}`,
);

assert(
  Number(core.presence?.visitNumber ?? 0) > 1,
  `production Author return visit number was not greater than one; got ${core.presence?.visitNumber ?? "none"}`,
);

assert(
  !lower(prompt).includes(
    lower(baselineNeedle),
  ),
  "test prompt accidentally contains the real peripheral memory detail",
);

console.log(
  `core.renderedPeripheral=${corePeripheralReappeared}`,
);

console.log(
  `core.analyticsEvents=${coreAnalytics.length}`,
);

console.log(
  `core.analyticsTypes=${[...coreAnalyticsTypes].join(",")}`,
);

console.log(
  `core.sessionStatus=${session?.status ?? "missing"}`,
);

console.log(
  `core.returning=${Boolean(core.presence?.isReturning)}`,
);

console.log(
  `core.visitNumber=${core.presence?.visitNumber ?? "none"}`,
);

console.log(
  `core.momentCount=${core.momentCount}`,
);

console.log(
  `core.memoryUnchanged=${baselineMemoryFingerprint === coreMemoryFingerprint}`,
);

console.log(
  "PASS · real production Author path executed against real memory, real session state, real analytics, and real return context",
);

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
  console.log(
    "--- QRE UNIVERSAL REAL LENS SWEEP ---",
  );

  const fingerprints = new Map<
    string,
    string
  >();

  for (const lens of lensNames) {
    const sessionId =
      `acceptance:ultimate:${assetId}:lens:${lens}`;

    const operationId =
      `acceptance:ultimate:${assetId}:lens:${lens}`;

    const run =
      await runAuthor({
        assetId,
        userId,
        prompt,
        lens,
        operationId,
        sessionId,
        memoryRepository,
      });

    const result = run.result;
    const fingerprint =
      sequenceFingerprint(
        result.moments,
      );

    assert(
      fingerprint,
      `${lens}: empty sequence fingerprint`,
    );

    fingerprints.set(
      lens,
      fingerprint,
    );

    const lensAnalytics =
      await analyticsForSession(
        sessionId,
      );

    assert(
      lensAnalytics.some(
        (event) =>
          event.type ===
          AnalyticsEventTypes.AI_MEMORY_USED,
      ),
      `${lens}: missing AI_MEMORY_USED analytics`,
    );

    assert(
      lensAnalytics.some(
        (event) =>
          event.type ===
          AnalyticsEventTypes.AI_CINEMATIC_DECISION,
      ),
      `${lens}: missing AI_CINEMATIC_DECISION analytics`,
    );

    if (!allowMemoryWrite) {
      const warnings =
        run.warningNames;

      assert(
        warnings.has(
          "memory_projection_failed",
        ),
        `${lens}: read-only mode unexpectedly allowed memory projection`,
      );

      assert(
        warnings.has(
          "author_experience_state_persistence_failed",
        ),
        `${lens}: read-only mode unexpectedly allowed Author state persistence`,
      );

      assert(
        !lensAnalytics.some(
          (event) =>
            event.type ===
            AnalyticsEventTypes.AI_MEMORY_LEARNED,
        ),
        `${lens}: read-only mode emitted AI_MEMORY_LEARNED despite suppressed persistence`,
      );
    }

    const diagnostics =
      diagnosticsOf(result);

    console.log(
      `${lens}: score=${clean(diagnostics.selectedScore)} moments=${result.momentCount} returning=${Boolean(result.presence?.isReturning)}`,
    );
  }

  const uniqueFingerprints =
    new Set(fingerprints.values());

  assert(
    uniqueFingerprints.size >= 3,
    `lens sweep did not materially differentiate the experience; unique sequences=${uniqueFingerprints.size}`,
  );

  const afterSweepMemory =
    await realMemoryRepository.loadContext({
      assetId,
      userId,
    });

  assert(
    baselineMemoryFingerprint ===
      memoryFingerprint(afterSweepMemory),
    "universal read-only lens sweep mutated durable memory",
  );

  console.log(
    `uniqueLensSequences=${uniqueFingerprints.size}/${lensNames.length}`,
  );

  console.log(
    "PASS · universal lens sweep materially changes authored experience while preserving real source truth and durable-memory isolation",
  );

  console.log(
    "--- END QRE UNIVERSAL REAL LENS SWEEP ---",
  );
}

console.log(
  "PASS · QRE ULTIMATE PRODUCTION AUTHOR ACCEPTANCE",
);

console.log(
  "--- END QRE ULTIMATE PRODUCTION AUTHOR ACCEPTANCE ---",
);
