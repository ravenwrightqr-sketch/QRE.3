import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function file(name) {
  return path.join(root, name);
}

function read(name) {
  const target = file(name);
  return { target, text: fs.readFileSync(target, "utf8") };
}

function replaceExact(name, source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`ALIGNMENT GUARD FAILED: ${name} missing expected block: ${label}`);
  }
  const next = source.replace(from, to);
  if (next === source) {
    throw new Error(`ALIGNMENT GUARD FAILED: ${name} replacement made no change: ${label}`);
  }
  return next;
}

function write(target, text) {
  fs.writeFileSync(target, text, "utf8");
}

let changed = [];

// ---------------------------------------------------------------------------
// 1. Author cognition: remove Coco-shaped semantic inference and make the
//    semantic thesis generic and graph-derived.
// ---------------------------------------------------------------------------
{
  const name = "apps/api/src/services/authorCognition.ts";
  const { target, text: original } = read(name);
  let text = original;

  text = replaceExact(
    name,
    text,
    'import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph, RealityRelation } from "@qre/contracts";',
    'import type { LatentMovieCandidate, LatentMovieTrajectoryStep, RealityGraph } from "@qre/contracts";',
    "remove semantic hard-code relation import",
  );

  text = replaceExact(
    name,
    text,
    `const NEGATIVE_STATES = /\\b(?:scared|afraid|nervous|worried|uncertain|shy|timid|overwhelmed|lost|intimidated|uneasy|anxious|hesitant|frightened|uncomfortable)\\b/i;\nconst POSITIVE_STATES = /\\b(?:happy|proud|calm|confident|fierce|excited|content|comfortable|bold|brave|relaxed|joyful)\\b/i;\nconst AGENCY_TERMS = /\\b(?:control|agency|status|dominant|confident|proud|fierce|brave|bold|ready|owns?|command|mastery)\\b/i;\nconst DISLIKE_TERMS = /\\b(?:hates?|dislikes?|afraid|scared|avoids?|resists?|refuses?)\\b/i;\nconst POSITIVE_RELATIONS = new Set<RealityRelation[\"kind\"]>([\"changes\", \"contrasts\", \"recontextualizes\", \"converges\"]);\n\n`,
    "",
    "remove Coco-shaped semantic regex vocabulary",
  );

  const oldSemantic = `function semanticTurnForStep(\n  graph: RealityGraph | undefined,\n  step: LatentMovieTrajectoryStep,\n  lens?: string,\n): string {\n  if (!graph || step.eventIds.length < 1) return clean(step.viewerChange);\n\n  const from = eventById(graph, step.eventIds[0]);\n  const to = eventById(graph, step.eventIds[step.eventIds.length - 1]);\n  const source = clean(from?.emotionalState || from?.label);\n  const target = clean(to?.emotionalState || to?.label);\n  const lensText = clean(lens).toLowerCase();\n  const playfulStatus = /funny|comedy|humou?r|playful|fierce|bold|devious|absurd/i.test(lensText);\n\n  if (step.operation === \"payoff\") return clean(step.viewerChange);\n\n  if (NEGATIVE_STATES.test(source) && (AGENCY_TERMS.test(target) || playfulStatus)) {\n    return \"semantic turn: initial vulnerability gives way to agency/status\";\n  }\n\n  if (DISLIKE_TERMS.test(source) && (POSITIVE_STATES.test(target) || playfulStatus)) {\n    return \"semantic turn: resistance becomes participation/status\";\n  }\n\n  if (step.operation === \"contrast\" || step.operation === \"reframe\") {\n    return \"semantic turn: the later supplied detail changes the meaning of the earlier one\";\n  }\n\n  if (POSITIVE_RELATIONS.has(step.operation as RealityRelation[\"kind\"])) {\n    return \"semantic turn: the supplied relationship changes the earlier reading\";\n  }\n\n  return clean(step.viewerChange);\n}\n`;

  text = replaceExact(
    name,
    text,
    oldSemantic,
    `function semanticTurnForStep(\n  _graph: RealityGraph | undefined,\n  step: LatentMovieTrajectoryStep,\n  _lens?: string,\n): string {\n  return clean(step.viewerChange);\n}\n`,
    "replace hard-coded semantic turn classifier",
  );

  const oldThesis = `  const initial = eventById(graph, trajectory[0]?.eventIds[0] ?? \"\")?.label ?? candidate.evidence[0] ?? \"the supplied opening\";\n  const semanticTurn = firstMeaningful?.viewerChange ?? \"the supplied relationship changes the reading\";\n  const payoffLabel = eventById(graph, payoff?.eventIds[payoff.eventIds.length - 1] ?? \"\")?.label ?? candidate.payoff;\n\n  return {\n`;

  const newThesis = `  const initialEventId = trajectory[0]?.eventIds[0] ?? \"\";\n  const initial = eventById(graph, initialEventId)?.label ?? candidate.evidence[0] ?? \"the supplied opening\";\n  const semanticTurn = firstMeaningful?.viewerChange ?? \"the supplied relationship changes the reading\";\n  const payoffLabel = eventById(graph, payoff?.eventIds[payoff.eventIds.length - 1] ?? \"\")?.label ?? candidate.payoff;\n  const beforeEventIds = firstMeaningful?.eventIds?.length ? [firstMeaningful.eventIds[0]] : [initialEventId];\n  const afterEventIds = firstMeaningful?.eventIds?.length && firstMeaningful.eventIds.length > 1\n    ? [firstMeaningful.eventIds[firstMeaningful.eventIds.length - 1]]\n    : [];\n  const relationKind = candidate.supportingRelationKinds.find((kind) =>\n    [\"before\", \"after\", \"causes\", \"changes\", \"contrasts\", \"repeats\", \"belongs_to\", \"involves\", \"recontextualizes\", \"converges\"].includes(kind),\n  );\n\n  return {\n`;

  text = replaceExact(name, text, oldThesis, newThesis, "derive generic semantic thesis anchors");

  text = replaceExact(
    name,
    text,
    `      initialReading: initial,\n      semanticTurn,\n      carrierEventIds,\n      sealingEventIds,\n      payoffDependency:`,
    `      initialReading: initial,\n      semanticTurn,\n      beforeEventIds,\n      afterEventIds,\n      relationKind,\n      beforeMeaning: beforeEventIds.map((id) => clean(eventById(graph, id)?.label)).filter(Boolean),\n      afterMeaning: afterEventIds.map((id) => clean(eventById(graph, id)?.label)).filter(Boolean),\n      carrierEventIds,\n      sealingEventIds,\n      payoffDependency:`,
    "store structured semantic transition",
  );

  text = replaceExact(
    name,
    text,
    '"Identity metadata is world state, not an automatic film cut.",',
    '"Identity metadata is world state, not an automatic experience sequence item.",',
    "replace film vocabulary in cognition rules",
  );

  text = replaceExact(
    name,
    text,
    '"One beat is one viewer-facing film moment.",',
    '"One beat is one viewer-facing sequence moment.",',
    "replace film vocabulary in scene rules",
  );

  write(target, text);
  changed.push(name);
}

// ---------------------------------------------------------------------------
// 2. Latent movie contract: make semantic transition structured while keeping
//    existing fields for compatibility during the migration.
// ---------------------------------------------------------------------------
{
  const name = "packages/contracts/src/experience/latentMovie.ts";
  const { target, text: original } = read(name);
  let text = original;

  text = replaceExact(
    name,
    text,
    `export type LatentStoryThesis = {\n  initialReading: string;\n  semanticTurn: string;\n  carrierEventIds: string[];\n  sealingEventIds: string[];\n  payoffDependency: string;\n  counterfactualDependency: number;\n};`,
    `export type LatentStoryThesis = {\n  initialReading: string;\n  semanticTurn: string;\n  beforeMeaning: string[];\n  afterMeaning: string[];\n  beforeEventIds: string[];\n  afterEventIds: string[];\n  relationKind?: string;\n  carrierEventIds: string[];\n  sealingEventIds: string[];\n  payoffDependency: string;\n  counterfactualDependency: number;\n};`,
    "add structured semantic transition fields",
  );

  write(target, text);
  changed.push(name);
}

// ---------------------------------------------------------------------------
// 3. UniversalMind: creative language is realization, never world evidence;
//    runtime moments remain the canonical sequence material.
// ---------------------------------------------------------------------------
{
  const name = "packages/engine/src/cognition/universalMind.ts";
  const { target, text: original } = read(name);
  let text = original;

  const creativeEvidenceFn = `function creativeEvidence(selected: CreativeCandidate[], world: WorldModel): void {\n  for (const candidate of selected) {\n    if (!candidate.creativeDetails.length) continue;\n    const event = world.events.find((item) => item.id === candidate.eventId);\n    if (!event) continue;\n    for (const detail of candidate.creativeDetails) if (!event.evidence.some((item) => item.source === \"creative_realization\" && item.detail === detail)) event.evidence.push({ id: \`creative-\${event.id}-\${detail.toLowerCase().replace(/[^a-z0-9]+/g, \"-\")}\`, kind: \"detail\", salience: Math.max(0.4, Math.min(1, candidate.creativity / 10)), source: \"creative_realization\", detail, confidence: Math.max(0.4, Math.min(0.95, candidate.creativity / 10)) });\n  }\n}\n`;

  text = replaceExact(name, text, creativeEvidenceFn, "", "remove creative realization to world evidence mutation");
  text = replaceExact(name, text, "  creativeEvidence(selected, world);\n", "", "remove creative evidence side effect call");

  const visualFn = `function lensVisual(lens: WorldModel[\"lens\"], index: number): NonNullable<CinematicScene[\"visual\"]> {\n  if (lens === \"horror\") return { theme: \"dark\", animation: index % 2 ? \"glitch\" : \"slow_zoom\" };\n  if (lens === \"romance\") return { theme: \"cinematic\", animation: \"slow_zoom\" };\n  if (lens === \"wild\") return { theme: \"cinematic\", animation: \"particles\" };\n  if (lens === \"mysterious\") return { theme: \"dark\", animation: \"parallax\" };\n  if (lens === \"comedy\") return { theme: \"cinematic\", animation: \"parallax\" };\n  return { theme: \"cinematic\", animation: index === 0 ? \"slow_zoom\" : \"parallax\" };\n}\n`;

  text = replaceExact(name, text, visualFn, "", "remove lens-generated visual semantics");

  const oldBuildScenes = `function buildScenes(moments: ExperienceMoment[], world: WorldModel): CinematicScene[] { return moments.map((moment, index) => ({ id: \`mind-scene-\${index + 1}\`, type: sceneType(index, moments.length), duration: Number(moment.meta?.duration ?? 3600), moment, order: index, transition: index === 0 ? \"none\" : world.lens === \"horror\" ? (index % 2 ? \"fade\" : \"flash\") : world.lens === \"romance\" ? \"cinematic\" : world.lens === \"wild\" ? \"zoom\" : \"fade\", visual: lensVisual(world.lens, index), preload: index < moments.length - 1 })); }`;
  const newBuildScenes = `function buildScenes(moments: ExperienceMoment[]): CinematicScene[] {\n  return moments.map((moment, index) => ({\n    id: \`mind-scene-\${index + 1}\`,\n    type: sceneType(index, moments.length),\n    duration: Number(moment.meta?.duration ?? 3600),\n    moment,\n    order: index,\n    transition: \"none\",\n    preload: index < moments.length - 1,\n    meta: { source: \"experience_sequence\" },\n  }));\n}`;

  text = replaceExact(name, text, oldBuildScenes, newBuildScenes, "remove generated cinematic scene visuals");
  text = replaceExact(name, text, "  const cinematicScenes = buildScenes(moments, world);", "  const cinematicScenes = buildScenes(moments);", "route sequence moments directly into runtime projection");

  write(target, text);
  changed.push(name);
}

console.log("UNIVERSAL AUTHOR ALIGNMENT: PASS");
console.log(`Changed=${changed.length}`);
for (const name of changed) console.log(`- ${name}`);
console.log("Invariants restored:");
console.log("- persistent memory remains the durable truth layer");
console.log("- RealityGraph remains the Author projection");
console.log("- creative realization never mutates world evidence");
console.log("- semantic transitions are graph-derived, not Coco-specific");
console.log("- UniversalMind no longer manufactures visual/cinematic semantics");
console.log("- ExperienceMoment remains the runtime sequence atom");
