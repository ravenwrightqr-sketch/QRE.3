import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(name) {
  return path.join(root, name);
}

function read(name) {
  return fs.readFileSync(file(name), "utf8");
}

function write(name, content) {
  fs.writeFileSync(file(name), content, "utf8");
}

function requireOnce(name, text, needle, label) {
  const count = text.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 anchor, found ${count}`);
  }
}

function ensureImport(text, importLine) {
  if (text.includes(importLine)) return text;
  const marker = 'import { buildAuthorRealityEnvelope } from "./authorRealityEnvelope.js";\n';
  requireOnce("authorBrainUniversal.ts", text, marker, "master import anchor");
  return text.replace(marker, marker + importLine + "\n");
}

function replaceMasterCandidateBeat(text) {
  const start = text.indexOf("function candidateBeatFromSlot(");
  const end = text.indexOf("\nfunction ensureEndpointCandidate(", start);
  if (start < 0 || end < 0) throw new Error("master candidateBeatFromSlot block not found");

  const replacement = `function candidateBeatFromSlot(\n  slot: RealizationSlot,\n  spine: MeaningSpine,\n  envelope: ReturnType<typeof buildAuthorRealityEnvelope>,\n  originalBeat?: MouthCandidateBeat,\n): MouthCandidateBeat {\n  const spineBeat = meaningSpineForBeat(\n    spine,\n    slot.order,\n  );\n\n  if (!spineBeat) {\n    throw new Error(\n      \`CANONICAL MOUTH INVARIANT FAILED: missing spine beat \${slot.order}.\`,\n    );\n  }\n\n  const endpoint = endpointLabel(envelope);\n  const isPayoff =\n    slot.kind === "payoff" ||\n    originalBeat?.attentionFunction === "payoff" ||\n    originalBeat?.role === "payoff";\n\n  const sourceEventIds = uniq(\n    [\n      ...slot.sourceEventIds,\n      ...slot.inheritedEventIds,\n    ],\n    8,\n  );\n\n  const sourceLabels = uniq(slot.sourceLabels, 8);\n  const targetLabels = uniq(\n    [\n      ...slot.targetLabels,\n      ...(isPayoff && endpoint ? [endpoint] : []),\n    ],\n    8,\n  );\n\n  const baseBeat: MouthCandidateBeat = {\n    order: slot.order,\n    role:\n      originalBeat?.role ||\n      (isPayoff ? "payoff" : slot.kind),\n    attentionFunction:\n      originalBeat?.attentionFunction ||\n      (isPayoff ? "payoff" : "reframe"),\n    creativeMove:\n      originalBeat?.creativeMove ||\n      (isPayoff ? "callback" : "none"),\n    realizationMode: \`${slot.kind} \${slot.mode}\`.trim(),\n    eventIds: sourceEventIds,\n    change:\n      clean(spineBeat.change) ||\n      clean(originalBeat?.change),\n    next:\n      clean(spineBeat.next) ||\n      clean(originalBeat?.next) ||\n      targetLabels.join("; "),\n    frontier:\n      clean(spineBeat.next) ||\n      clean(originalBeat?.next) ||\n      targetLabels.join("; "),\n    setsUp:\n      originalBeat?.setsUp?.length\n        ? uniq(originalBeat.setsUp, 6)\n        : sourceLabels,\n    paysOff:\n      isPayoff\n        ? [endpoint].filter(Boolean)\n        : targetLabels,\n    obligations: slot.obligations,\n    forbiddenMoves: slot.forbiddenMoves,\n    relationKinds: slot.relationKinds,\n    relationStrength: slot.relationStrength,\n  };\n\n  const { strategies, realization } =\n    buildCreativeRealizationForBeat(\n      baseBeat,\n      envelope,\n    );\n\n  return {\n    ...baseBeat,\n    realizationStrategies: strategies.map(\n      (candidate) => candidate.strategy,\n    ),\n    creativeRealization: realization,\n  };\n}\n`;

  return text.slice(0, start) + replacement + text.slice(end);
}

function replaceMouthMessages(text) {
  const start = text.indexOf("function strategyNames(");
  const end = text.indexOf("\nexport function parseMouthCandidateBatch(", start);
  if (start < 0 || end < 0) throw new Error("Mouth strategy/message block not found");

  const replacement = `function strategyNames(\n  beat: MouthCandidateBeat,\n  envelope: RealityEnvelope,\n): string[] {\n  const supplied = unique(beat.realizationStrategies ?? []);\n  if (supplied.length) return supplied.slice(0, 5);\n\n  return selectSafeStrategies(\n    beat,\n    envelope,\n    5,\n  ).map((candidate) => candidate.strategy);\n}\n\nexport function buildMouthCandidateMessages(\n  input: MouthCandidateGenerationInput,\n): Array<{ role: "system" | "user"; content: string }> {\n  const beat = input.beats[0];\n\n  if (!beat) {\n    return [\n      { role: "system", content: "QRE CANONICAL MOUTH: no approved beat." },\n      { role: "user", content: JSON.stringify({ task: "none" }) },\n    ];\n  }\n\n  const anchors = (beat.eventIds ?? []).map((id) => ({\n    id,\n    label: eventLabel(input.envelope, id),\n  }));\n\n  const relations = input.envelope.relations\n    .filter(\n      (relation) =>\n        (beat.eventIds ?? []).includes(relation.from) ||\n        (beat.eventIds ?? []).includes(relation.to),\n    )\n    .map((relation) => ({\n      from: eventLabel(input.envelope, relation.from),\n      to: eventLabel(input.envelope, relation.to),\n      kind: relation.kind,\n      strength: relation.strength,\n    }));\n\n  const strategies = strategyNames(beat, input.envelope);\n  const creativeLock = getMouthCreativeLock(input.lens);\n  const creativeDirective = buildMouthCreativeLockDirective(creativeLock);\n  const creativeRealization = beat.creativeRealization;\n\n  const system = [\n    "QRE CANONICAL MOUTH · ONE APPROVED CREATIVE BEAT.",\n    "The upstream Author chose the reality, movie, meaning, relationship, and semantic job.",\n    "Your job is to realize that meaning in memorable viewer-facing language.",\n    "SUPPLIED FACTS ARE RAW MATERIAL, NOT AUTOMATIC VIEWER LANGUAGE.",\n    "Do not simply restate a supplied fact when you can reveal what is interesting about it.",\n    `SAFE REALIZATION STRATEGIES: ${strategies.join(", ") || "implication, compression"}.`,\n    `CREATIVE REALIZATION: ${creativeRealization?.creativeOpportunity || "Find the most interesting safe interpretation of the approved semantic job."}`,\n    `REALIZATION INTENT: ${creativeRealization?.realizationIntent || "Express the approved meaning without literal fact restatement."}`,\n    `VIEWER EFFECT: ${creativeRealization?.viewerEffect || "Create curiosity, attitude, surprise, or satisfying payoff."}`,\n    ...creativeDirective,\n    "Write 5 materially different short viewer-facing lines for this beat.",\n    "2-7 words preferred. One dominant thought. One semantic move.",\n    "Make the next cut feel desirable without inventing a new event.",\n    "Never use a literal source sentence as a candidate unless it is an exact terminal endpoint.",\n    "Never use fact-collage captions such as subject + trait + action when a stronger creative realization is available.",\n    "",\n    "REALITY LOCK: never invent concrete actions, body reactions, facial expressions, objects, people, places, sounds, dialogue, chronology, or outcomes.",\n    "Creative framing MAY introduce new wording, attitude, status language, implication, rhythm, rhetorical pressure, metaphor, or genre flavor.",\n    "New wording is not new reality.",\n    "Never write planner language, explain the relationship, or turn the beat into a summary.",\n    "",\n    "GOOD RHYTHM REFERENCES:",\n    "Already prepared.",\n    "Not exactly subtle.",\n    "Then came the turn.",\n    "That settled it.",\n    "Peace was temporary.",\n    "",\n    "These are rhythm references only. Do not copy unsupplied facts.",\n    "",\n    "PAYOFF: if this beat is the payoff, return only the exact supplied endpoint phrase.",\n    "",\n    "RETURN JSON ONLY:",\n    '{"variantsByBeat":[{"order":NUMBER,"variants":["LINE 1","LINE 2","LINE 3","LINE 4","LINE 5"]}]}',\n  ].join("\\n");\n\n  const user = {\n    task: "realize_one_approved_creative_beat",\n    subject: input.envelope.subject,\n    lens: clean(input.lens),\n    priorTexts: input.priorTexts ?? [],\n    suppliedEvidence: input.envelope.suppliedPhrases,\n    beat: {\n      order: beat.order,\n      role: beat.role,\n      attentionFunction: beat.attentionFunction,\n      creativeMove: beat.creativeMove,\n      realizationMode: beat.realizationMode,\n      realizationStrategies: strategies,\n      creativeRealization: creativeRealization ?? null,\n      creativeLock: creativeLock.name,\n      eventIds: beat.eventIds ?? [],\n      anchors,\n      relationKinds: beat.relationKinds ?? [],\n      relationStrength: beat.relationStrength ?? 0,\n      relations,\n      change: clean(beat.change),\n      next: clean(beat.next || beat.frontier),\n      obligations: beat.obligations ?? [],\n      forbiddenMoves: beat.forbiddenMoves ?? [],\n      payoff: isPayoffBeat(beat),\n      endpoint: endpointText(beat),\n    },\n  };\n\n  return [\n    { role: "system", content: system },\n    { role: "user", content: JSON.stringify(user) },\n  ];\n}\n`;

  return text.slice(0, start) + replacement + text.slice(end);
}

function apply() {
  const masterName = "apps/api/src/services/authorBrainUniversal.ts";
  const mouthName = "apps/api/src/services/authorMouthCandidateSearch.ts";

  let master = read(masterName);
  let mouth = read(mouthName);

  const brainImport = 'import { buildCreativeRealizationForBeat } from "./authorRealizationStrategyLattice.js";\n';
  master = ensureImport(master, brainImport);
  master = replaceMasterCandidateBeat(master);
  mouth = replaceMouthMessages(mouth);

  write(masterName, master);
  write(mouthName, mouth);

  console.log("CREATIVE REALIZATION WIRING APPLIED");
  console.log("Master Author now computes creativeRealization per approved beat.");
  console.log("Mouth now realizes creative meaning instead of echoing source facts.");
}

apply();
