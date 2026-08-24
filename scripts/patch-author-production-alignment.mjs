import fs from "node:fs";

const root = process.cwd();

function file(path) {
  return `${root}/${path}`;
}

function replaceOnce(path, label, from, to) {
  const target = file(path);
  const source = fs.readFileSync(target, "utf8");
  const count = source.split(from).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${count}`);
  }
  fs.writeFileSync(target, source.replace(from, to), "utf8");
  console.log(`PATCHED: ${path} · ${label}`);
}

// 1. Canonical Mouth must recognize the current production prompt, not only the retired name.
replaceOnce(
  "apps/api/src/services/localModelRuntime.ts",
  "canonical Mouth detector",
  '  return /QRE\'s theatrical mouth/i.test(system);',
  '  return /QRE CANONICAL MOUTH/i.test(system) || /QRE\\\'s theatrical mouth/i.test(system);',
);

// 2. The universal Author must not require the discovered factual endpoint to be the literal final words.
replaceOnce(
  "apps/api/src/services/authorBrainUniversal.ts",
  "universal completion gate",
  `  const complete =
    sequenceResult.rejected === 0 &&
    mouth.texts.length ===
      sequence.cuts.length &&
    sequenceResult.scenes.length ===
      sequence.cuts.length &&
    sequenceArc.accepted &&
    endpointExact;`,
  `  const complete =
    sequenceResult.rejected === 0 &&
    mouth.texts.length ===
      sequence.cuts.length &&
    sequenceResult.scenes.length ===
      sequence.cuts.length &&
    sequenceArc.accepted;`,
);

// 3. Add a deterministic, source-grounded expansion only for service/receipt-like experiences.
const universalPath = file("apps/api/src/services/authorBrainUniversal.ts");
let universal = fs.readFileSync(universalPath, "utf8");
const anchor = `function buildFallbackBeatPlan(\n  cognition: ReturnType<\n    typeof buildAuthorCognitivePlan\n  >,\n  realityGraph: ReturnType<\n    typeof buildAuthorRealityGraph\n  >,\n): BeatPlan | undefined {`;
if (!universal.includes(anchor)) throw new Error("service expansion anchor not found");

const helper = `function expandServiceBeatPlan(\n  plan: BeatPlan,\n  input: AuthorBrainTruth,\n  realityGraph: ReturnType<typeof buildAuthorRealityGraph>,\n  endpointEventId: string,\n): BeatPlan {\n  if (plan.beats.length >= 3) return plan;\n\n  const serviceLike = /service|receipt|clean|cleaning|housekeeping|repair|maintenance|inspection|groom|grooming|property|work order|visit|round/i.test(\n    [\n      input.prompt,\n      input.lens ?? "",\n      ...input.facts,\n      ...input.sourceMoments,\n    ].join(" "),\n  );\n\n  if (!serviceLike) return plan;\n\n  const existing = new Set(\n    plan.beats.flatMap((beat) => beat.eventIds ?? []),\n  );\n  const usable = realityGraph.events.filter((event) => {\n    if (existing.has(event.id)) return false;\n    if (!clean(event.label)) return false;\n    return true;\n  });\n\n  const target = Math.min(5, Math.max(3, usable.length + plan.beats.length));\n  const added = [];\n\n  for (const event of usable) {\n    if (plan.beats.length + added.length >= target) break;\n\n    const previous =\n      [...plan.beats, ...added][\n        [...plan.beats, ...added].length - 1\n      ];\n    const index = plan.beats.length + added.length + 1;\n    const isEndpoint = event.id === endpointEventId;\n\n    added.push({\n      order: index,\n      role: isEndpoint ? "payoff" : index === 2 ? "reframe" : "escalation",\n      gainKind: isEndpoint ? "payoff" : index === 2 ? "reframe" : "discovery",\n      change: clean(event.label),\n      next: isEndpoint\n        ? "Land the supplied ending cleanly."
        : clean(usable.find((candidate) => candidate.id !== event.id)?.label) || "What deserves the next cut?",\n      frontier: isEndpoint\n        ? clean(event.label)
        : clean(usable.find((candidate) => candidate.id !== event.id)?.label),\n      necessity: isEndpoint\n        ? "Pays off the supplied service experience."
        : "Carries the supplied work forward without inventing a new event.",\n      eventIds: [event.id],\n      attentionFunction: isEndpoint ? "payoff" : index === 2 ? "reframe" : "escalation",\n      setsUp: previous?.change ? [clean(previous.change)] : [],\n      paysOff: isEndpoint ? [clean(event.label)] : [],\n      creativeMove: index === 2 ? "contrast" : isEndpoint ? "recontextualization" : "none",\n      nextBeatPullTarget: isEndpoint ? 0.25 : 0.55,\n    });\n  }\n\n  if (!added.length) return plan;\n\n  return {\n    ...plan,\n    beats: [...plan.beats, ...added].slice(0, 6).map((beat, index) => ({\n      ...beat,\n      order: index + 1,\n    })),\n    attentionArc: [...plan.beats, ...added]\n      .map((beat) => beat.attentionFunction ?? "reframe")\n      .join(" → "),\n  };\n}\n\n`;
universal = universal.replace(anchor, helper + anchor);
const beatPlanAnchor = `  if (!beatPlan) {\n    return {`;
const insert = `  beatPlan = expandServiceBeatPlan(\n    beatPlan,\n    { ...input, realityGraph },\n    realityGraph,\n    realityEnvelope.endpointEventId,\n  );\n\n`;
if (universal.split(beatPlanAnchor).length - 1 !== 1) throw new Error("service expansion insertion anchor mismatch");
universal = universal.replace(beatPlanAnchor, insert + beatPlanAnchor);
fs.writeFileSync(universalPath, universal, "utf8");
console.log("PATCHED: apps/api/src/services/authorBrainUniversal.ts · service film expansion");

// 4. Strengthen the canonical Mouth instruction against physical invention.
const mouthPath = file("apps/api/src/services/authorMouthCandidateSearch.ts");
let mouth = fs.readFileSync(mouthPath, "utf8");
const mouthAnchor = '    "Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",';
const mouthReplacement = `    "Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",\n    "For supplied states, preferences, attitudes, or relationships, prefer implication, status, contrast, rhetorical attitude, compression, callback, or wording changes. Do not invent a body reaction merely to make the line vivid.",\n    "Every concrete verb or physical claim must be directly supported by the beat's source events; otherwise rewrite it as a grounded state/relationship line.",`;
if (mouth.split(mouthAnchor).length - 1 !== 1) throw new Error("Mouth truth instruction anchor mismatch");
mouth = mouth.replace(mouthAnchor, mouthReplacement);
fs.writeFileSync(mouthPath, mouth, "utf8");
console.log("PATCHED: apps/api/src/services/authorMouthCandidateSearch.ts · state-aware truth instruction");

console.log("AUTHOR PRODUCTION ALIGNMENT COMPLETE");
