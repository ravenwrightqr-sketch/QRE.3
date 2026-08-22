import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "@qre/db";
import { AnalyticsEventTypes } from "@qre/contracts";
import type { AuthorBrainTruth, CognitiveAuthorContext, CognitiveCreativeLearning } from "@qre/contracts";
import { buildAuthorIdentityState } from "./src/services/authorIdentityState.js";
import { buildCognitiveAuthorContext } from "./src/services/authorCognitiveContext.js";
import { authorMoviePipeline } from "./src/services/authorMoviePipeline.js";

function selectedLens(result: Awaited<ReturnType<typeof authorMoviePipeline>>): string {
  const cognition = result.authored.field.movieCognition;
  assert.ok(cognition && typeof cognition === "object" && !Array.isArray(cognition));
  const selected = (cognition as Record<string, unknown>).selected;
  assert.ok(selected && typeof selected === "object" && !Array.isArray(selected));
  const lens = (selected as Record<string, unknown>).lens;
  assert.ok(lens && typeof lens === "object" && !Array.isArray(lens));
  const id = (lens as Record<string, unknown>).id;
  assert.equal(typeof id, "string");
  assert.ok(id);
  return id;
}

function realityPacket(result: Awaited<ReturnType<typeof authorMoviePipeline>>): string[] {
  const packet = result.authored.field.packet;
  assert.ok(packet && typeof packet === "object" && !Array.isArray(packet));
  const reality = (packet as Record<string, unknown>).reality;
  assert.ok(Array.isArray(reality));
  assert.ok(reality.every((value) => typeof value === "string"));
  return reality as string[];
}

const suffix = randomUUID().replace(/-/g, "").slice(0, 18);

const assetA = await db.asset.create({
  data: {
    slug: `adaptive-real-a-${suffix}`,
    displayName: "REAL ADAPTIVE TEST A",
  },
});

const assetB = await db.asset.create({
  data: {
    slug: `adaptive-real-b-${suffix}`,
    displayName: "REAL ADAPTIVE TEST B",
  },
});

const reality: string[] = [
  "came in nervous",
  "got a bath",
  "stole a blue bow",
  "left looking fabulous",
];

const prompt =
  "Write a 5-line sequence about Coco. Final line: Peace was temporary.";

const makeContext = (creativeLearning: CognitiveCreativeLearning): CognitiveAuthorContext =>
  buildCognitiveAuthorContext({
    creativeLearning,
    textBeatTarget: 5,
  });

const baseTruth = (context: CognitiveAuthorContext): AuthorBrainTruth => ({
  prompt,
  subject: "Coco",
  lens: "neutral",
  facts: [...reality],
  sourceMoments: [...reality],
  memoryContext: ["returns for grooming"],
  creativeLearningContext: [],
  trajectory: ["hook", "question", "turn", "escalation", "payoff"],
  cognitiveContext: context,
});

let baseline: Awaited<ReturnType<typeof authorMoviePipeline>> | undefined;
let learned: Awaited<ReturnType<typeof authorMoviePipeline>> | undefined;

try {
  // A genuinely clean baseline from the production IdentityState path.
  const beforeState = await buildAuthorIdentityState({
    assetId: assetA.id,
    kind: "pet",
    subject: "Coco",
  });

  assert.equal(beforeState.creativeLearning.accepted.length, 0);
  assert.equal(beforeState.creativeLearning.successfulLenses.length, 0);

  const beforeContext = buildCognitiveAuthorContext({
    identityState: beforeState,
    textBeatTarget: 5,
  });

  assert.equal(beforeContext.creativeLearning?.accepted.length, 0);
  assert.equal(beforeContext.creativeLearning?.successfulLenses.length, 0);

  baseline = await authorMoviePipeline(baseTruth(beforeContext));
  const baselineLens = selectedLens(baseline);

  // Real persisted Experience + Flow.
  const experience = await db.experience.create({
    data: {
      assetId: assetA.id,
      title: "REAL ADAPTIVE TEST EXPERIENCE",
      blueprint: {
        type: "test",
        source: "real-adaptive-learning-acceptance",
        prompt,
      },
    },
  });

  const flow = await db.flow.create({
    data: {
      name: "REAL ADAPTIVE COURTROOM FLOW",
      status: "PUBLISHED",
      publishedAt: new Date(),
      actions: {
        generativeAuthor: true,
        sourcePrompt: prompt,
        learningProfile: {
          lens: "courtroom",
          promptShape: "compact",
          promptSignals: ["cinematic-request"],
        },
      },
    },
  });

  await db.experience.update({
    where: { id: experience.id },
    data: { flowId: flow.id },
  });

  // Real runtime outcome evidence.
  await db.analyticsEvent.createMany({
    data: [
      {
        assetId: assetA.id,
        flowId: flow.id,
        type: AnalyticsEventTypes.SCAN,
        meta: { source: "real-adaptive-learning-acceptance", ordinal: 1 },
      },
      {
        assetId: assetA.id,
        flowId: flow.id,
        type: AnalyticsEventTypes.SCAN,
        meta: { source: "real-adaptive-learning-acceptance", ordinal: 2 },
      },
      {
        assetId: assetA.id,
        flowId: flow.id,
        type: AnalyticsEventTypes.FLOW_COMPLETE,
        meta: { source: "real-adaptive-learning-acceptance", outcome: "positive", ordinal: 1 },
      },
      {
        assetId: assetA.id,
        flowId: flow.id,
        type: AnalyticsEventTypes.FLOW_COMPLETE,
        meta: { source: "real-adaptive-learning-acceptance", outcome: "positive", ordinal: 2 },
      },
    ],
  });

  // Reload through the actual production state builder.
  const afterState = await buildAuthorIdentityState({
    assetId: assetA.id,
    kind: "pet",
    subject: "Coco",
  });

  const afterAccepted = afterState.creativeLearning.accepted.join("\n");
  const afterWinners = afterState.creativeLearning.successfulLenses.join("\n");

  assert.match(
    afterAccepted + "\n" + afterWinners,
    /courtroom/i,
    "real persisted runtime outcome must become creative learning",
  );

  const afterContext = buildCognitiveAuthorContext({
    identityState: afterState,
    textBeatTarget: 5,
  });

  assert.ok(afterContext.creativeLearning);
  assert.match(
    JSON.stringify(afterContext.creativeLearning),
    /courtroom/i,
    "IdentityState creative learning must reach CognitiveAuthorContext",
  );

  learned = await authorMoviePipeline(baseTruth(afterContext));
  const learnedLens = selectedLens(learned);

  assert.notEqual(
    learnedLens,
    baselineLens,
    "real persisted learning must materially change the creative decision",
  );

  const baselineReality = realityPacket(baseline);
  const learnedReality = realityPacket(learned);

  for (const fact of reality) {
    assert.ok(
      baselineReality.includes(fact),
      `baseline lost supplied reality fact: ${fact}`,
    );
    assert.ok(
      learnedReality.includes(fact),
      `learned output lost supplied reality fact: ${fact}`,
    );
  }

  // Asset B is a real separate asset owned by the same database universe,
  // with no learning evidence of its own.
  const stateB = await buildAuthorIdentityState({
    assetId: assetB.id,
    kind: "pet",
    subject: "Coco B",
  });

  assert.equal(stateB.creativeLearning.accepted.length, 0);
  assert.equal(stateB.creativeLearning.rejected.length, 0);
  assert.equal(stateB.creativeLearning.successfulLenses.length, 0);

  console.log("REAL ADAPTIVE LEARNING ACCEPTANCE: PASS");
  console.log(`baselineLens=${baselineLens}`);
  console.log(`learnedLens=${learnedLens}`);
  console.log(`learningPersisted=${/courtroom/i.test(afterAccepted + "\n" + afterWinners)}`);
  console.log(`identityStateProjection=${/courtroom/i.test(JSON.stringify(afterState.creativeLearning))}`);
  console.log(`contextProjection=${/courtroom/i.test(JSON.stringify(afterContext.creativeLearning))}`);
  console.log("realityPreserved=true");
  console.log("assetIsolation=true");
} finally {
  // Remove only records created by this acceptance.
  await db.analyticsEvent.deleteMany({
    where: { assetId: { in: [assetA.id, assetB.id] } },
  });

  await db.experience.deleteMany({
    where: { assetId: { in: [assetA.id, assetB.id] } },
  });

  const testFlowNames = ["REAL ADAPTIVE COURTROOM FLOW"];
  await db.flow.deleteMany({
    where: { name: { in: testFlowNames } },
  });

  await db.asset.deleteMany({
    where: { id: { in: [assetA.id, assetB.id] } },
  });
}
