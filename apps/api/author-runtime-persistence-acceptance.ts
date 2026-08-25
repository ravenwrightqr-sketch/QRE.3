import { randomUUID } from "node:crypto";
import { Prisma, db } from "@qre/db";
import { AnalyticsEventTypes } from "@qre/contracts";

import { compileExperience } from "./src/services/experienceService.js";
import { createMemoryRepository } from "./src/repositories/memoryRepository.js";
import { createAnalyticsRepository } from "./src/repositories/analyticsRepository.js";
import { buildAuthorBehaviorProfile } from "./src/services/authorBehaviorProfile.js";
import { extractAuthorExperienceStates } from "./src/services/authorExperienceMemory.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function normalizeTruth(context: Awaited<ReturnType<ReturnType<typeof createMemoryRepository>["loadContext"]>>) {
  return JSON.stringify({
    entities: context.entities
      .map((entity) => [entity.kind, entity.name, entity.canonicalKey])
      .sort(),
    facts: context.facts
      .map((fact) => [fact.kind, fact.predicate, fact.value, fact.source, fact.status])
      .sort(),
    relations: context.relations
      .map((relation) => [relation.fromEntityId, relation.toEntityId, relation.relation, relation.source])
      .sort(),
  });
}

async function writeBehavior(assetId: string, types: string[]): Promise<void> {
  const analytics = createAnalyticsRepository();
  for (const type of types) {
    await analytics.trackEvent({
      assetId,
      type,
      meta:
        type === AnalyticsEventTypes.AI_CREATIVE_ACCEPTED
          ? {
              feedback: "short punchy callback",
              trajectory: "reframe>recur>payoff",
              styleTags: ["short", "callback", "attitude"],
            }
          : type === AnalyticsEventTypes.AI_CREATIVE_REJECTED
            ? {
                feedback: "too explanatory",
                trajectory: "setup>setup>setup",
                styleTags: ["longform"],
              }
            : undefined,
    } as any);
  }
}

const slug = `author-runtime-golden-${randomUUID()}`;
let assetId = "";

try {
  const asset = await db.asset.create({
    data: {
      slug,
      displayName: "Author Runtime Golden Test",
      status: "active",
      paid: false,
    },
    select: { id: true, slug: true },
  });
  assetId = asset.id;

  const prompt =
    "Coco entered nervous, the lawyer was already contacted, then the bathwater came, pink bows came next, the mirror approved, fabulous arrived, but peace is temporary.";

  const snapshotRepository = () => createMemoryRepository();

  const round1 = await compileExperience({
    prompt,
    assetId,
    memoryRepository: snapshotRepository(),
    movieMode: true,
  });

  const contextAfterRound1 = await snapshotRepository().loadContext({ assetId });
  const truthRound1 = normalizeTruth(contextAfterRound1);
  const statesRound1 = extractAuthorExperienceStates(contextAfterRound1);

  assert(round1.authorExperienceState, "round 1 did not produce Author experience state");
  assert(statesRound1.length >= 1, "round 1 state was not persisted to memory");
  assert(contextAfterRound1.entities.length > 0, "round 1 did not persist world entities");
  assert(contextAfterRound1.facts.length > 0, "round 1 did not persist world facts");
  assert(round1.memory?.events && round1.memory.events > 0, "round 1 did not report memory event writes");

  await writeBehavior(assetId, [
    AnalyticsEventTypes.FLOW_COMPLETE,
    AnalyticsEventTypes.AI_CREATIVE_ACCEPTED,
    AnalyticsEventTypes.AI_CREATIVE_ACCEPTED,
    AnalyticsEventTypes.EXPERIENCE_REPLAY,
    AnalyticsEventTypes.MEDIA_REPLAY,
  ]);

  const round2Analytics = createAnalyticsRepository();
  const persistedRound2Events = await round2Analytics.findEvents({ assetId, limit: 100 });
  const round2Profile = buildAuthorBehaviorProfile(
    persistedRound2Events.flatMap((event: any) => {
      const feedback = String(event.meta?.feedback ?? "").trim();
      return feedback ? [`accepted:${feedback}`] : [];
    }),
  );
  assert(persistedRound2Events.length >= 5, "round 2 analytics did not persist to the database");
  assert(round2Profile.confidence > 0, "round 2 analytics did not become learnable profile evidence");

  const round2 = await compileExperience({
    prompt,
    assetId,
    memoryRepository: snapshotRepository(),
    movieMode: true,
  });

  const contextAfterRound2 = await snapshotRepository().loadContext({ assetId });
  const truthRound2 = normalizeTruth(contextAfterRound2);
  const statesRound2 = extractAuthorExperienceStates(contextAfterRound2);

  assert(round2.authorExperienceState, "round 2 did not recover Author experience state");
  assert(statesRound2.length >= 2, "round 2 did not append a persisted Author state");
  assert(truthRound2 === truthRound1, "world truth changed between round 1 and round 2");
  assert(
    (round2.authorExperienceState as any).revisitedEventIds.length >=
      (round1.authorExperienceState as any).revisitedEventIds.length,
    "round 2 did not recover/revisit prior state",
  );

  await writeBehavior(assetId, [
    AnalyticsEventTypes.AI_CREATIVE_ACCEPTED,
    AnalyticsEventTypes.AI_CREATIVE_REJECTED,
    AnalyticsEventTypes.AI_VARIATION_SELECTED,
    AnalyticsEventTypes.EXPERIENCE_REPLAY,
    AnalyticsEventTypes.FLOW_COMPLETE,
  ]);

  const round3 = await compileExperience({
    prompt,
    assetId,
    memoryRepository: snapshotRepository(),
    movieMode: true,
  });

  const contextAfterRound3 = await snapshotRepository().loadContext({ assetId });
  const truthRound3 = normalizeTruth(contextAfterRound3);
  const statesRound3 = extractAuthorExperienceStates(contextAfterRound3);
  const persistedRound3Events = await createAnalyticsRepository().findEvents({ assetId, limit: 200 });
  const round3Profile = buildAuthorBehaviorProfile(
    persistedRound3Events.flatMap((event: any) => {
      const feedback = String(event.meta?.feedback ?? "").trim();
      const values = feedback ? [`accepted:${feedback}`] : [];
      if (event.type === AnalyticsEventTypes.AI_CREATIVE_REJECTED) values.push(`rejected:${feedback}`);
      if (event.type === AnalyticsEventTypes.EXPERIENCE_REPLAY || event.type === AnalyticsEventTypes.MEDIA_REPLAY) values.push("replay:true");
      return values;
    }),
  );

  assert(round3.authorExperienceState, "round 3 did not recover Author experience state");
  assert(statesRound3.length >= 3, "round 3 state did not persist through the real memory path");
  assert(truthRound3 === truthRound1, "world truth changed across persisted rounds");
  assert(persistedRound3Events.length >= persistedRound2Events.length, "analytics history did not persist across rounds");
  assert(round3Profile.confidence >= round2Profile.confidence, "learned confidence regressed across persisted rounds");

  const round1State: any = round1.authorExperienceState;
  const round2State: any = round2.authorExperienceState;
  const round3State: any = round3.authorExperienceState;

  assert(
    round2State.tempo.nextBeatPull !== round1State.tempo.nextBeatPull ||
      round2State.tempo.compression !== round1State.tempo.compression ||
      round2State.tempo.revealSpacing !== round1State.tempo.revealSpacing ||
      round2State.tempo.holdPressure !== round1State.tempo.holdPressure,
    "round 2 did not measurably adapt tempo after persisted behavior",
  );

  assert(
    round3State.tempo.nextBeatPull !== round1State.tempo.nextBeatPull ||
      round3State.tempo.compression !== round1State.tempo.compression ||
      round3State.tempo.revealSpacing !== round1State.tempo.revealSpacing ||
      round3State.tempo.holdPressure !== round1State.tempo.holdPressure,
    "round 3 lost learned tempo adaptation",
  );

  assert(round3State.memoryHooks.some((hook: string) => hook.startsWith("adapted-tempo:")), "round 3 did not persist adaptive tempo hook");
  assert(statesRound3.at(-1)?.tempo, "latest persisted Author state is malformed");

  console.log("AUTHOR RUNTIME PERSISTENCE ACCEPTANCE: PASS");
  console.log(`Asset=${assetId}`);
  console.log(`Round1StateCount=${statesRound1.length}`);
  console.log(`Round2StateCount=${statesRound2.length}`);
  console.log(`Round3StateCount=${statesRound3.length}`);
  console.log(`Round1Tempo=${round1State.tempo.mode}`);
  console.log(`Round2Tempo=${round2State.tempo.mode}`);
  console.log(`Round3Tempo=${round3State.tempo.mode}`);
  console.log(`Round1Pull=${round1State.tempo.nextBeatPull}`);
  console.log(`Round2Pull=${round2State.tempo.nextBeatPull}`);
  console.log(`Round3Pull=${round3State.tempo.nextBeatPull}`);
  console.log(`Round2ProfileConfidence=${round2Profile.confidence}`);
  console.log(`Round3ProfileConfidence=${round3Profile.confidence}`);
  console.log(`AnalyticsRound2=${persistedRound2Events.length}`);
  console.log(`AnalyticsRound3=${persistedRound3Events.length}`);
  console.log("TRUTH_INVARIANT=UNCHANGED");
} finally {
  if (assetId) {
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_audit" WHERE "asset_id" = ${assetId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_relation" WHERE "asset_id" = ${assetId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_fact" WHERE "asset_id" = ${assetId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_event" WHERE "asset_id" = ${assetId}`);
    await db.$executeRaw(Prisma.sql`DELETE FROM "qre_memory_entity" WHERE "asset_id" = ${assetId}`);
    await db.analyticsEvent.deleteMany({ where: { assetId } });
    await db.asset.delete({ where: { id: assetId } });
  }
  await db.$disconnect();
}
