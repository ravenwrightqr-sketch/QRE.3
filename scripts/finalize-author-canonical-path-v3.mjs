import fs from "node:fs";

const ROOT = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, ROOT), "utf8");
const write = (path, value) => fs.writeFileSync(new URL(path, ROOT), value, "utf8");

function normalize(text) {
  return text.replace(/\r\n?/g, "\n");
}

function ensureText(text, label, already, find, replacement) {
  if (already(text)) {
    console.log(`ALREADY: ${label}`);
    return text;
  }
  const next = text.replace(find, replacement);
  if (next === text) throw new Error(`PATCH FAILED: ${label}`);
  console.log(`PATCHED: ${label}`);
  return next;
}

const brainPath = "apps/api/src/services/authorBrainUniversal.ts";
let brain = normalize(read(brainPath));

brain = ensureText(
  brain,
  "authorBrainUniversal.ts · grounded planner import",
  (t) => t.includes("buildGroundedAuthorSequence") && t.includes("./authorSequencePlanner.js"),
  /import\s*\{\s*recoverBeatPlanFromLatentMovie,?\s*\}\s*from\s*[\"']\.\/authorBeatPlanRecovery\.js[\"']\s*;?/m,
  'import { buildGroundedAuthorSequence } from "./authorSequencePlanner.js";',
);

brain = ensureText(
  brain,
  "authorBrainUniversal.ts · canonical beat-plan source",
  (t) => /function buildFallbackBeatPlan\([\s\S]*?buildGroundedAuthorSequence\(/m.test(t),
  /function buildFallbackBeatPlan\([\s\S]*?\n\}\n\nfunction buildBeatMessages\(/m,
  `function buildFallbackBeatPlan(
  cognition: ReturnType<typeof buildAuthorCognitivePlan>,
  realityGraph: ReturnType<typeof buildAuthorRealityGraph>,
  realityEnvelope: ReturnType<typeof buildAuthorRealityEnvelope>,
  input: AuthorBrainTruth,
): BeatPlan | undefined {
  const planned = buildGroundedAuthorSequence({
    graph: realityGraph,
    envelope: realityEnvelope,
    subject: input.subject,
    lens: input.lens,
    presenceSummary: input.presenceSummary ?? [],
  });

  if (!planned?.beats.length) return undefined;

  return normalizeBeatPlan(planned);
}

function buildBeatMessages(`,
);

brain = ensureText(
  brain,
  "authorBrainUniversal.ts · invoke grounded planner",
  (t) => /buildFallbackBeatPlan\(\s*cognition,\s*realityGraph,\s*realityEnvelope,/m.test(t),
  /let beatPlan =\s*buildFallbackBeatPlan\(\s*cognition,\s*realityGraph,\s*\);/m,
  `let beatPlan =
    buildFallbackBeatPlan(
      cognition,
      realityGraph,
      realityEnvelope,
      { ...input, realityGraph },
    );`,
);

brain = ensureText(
  brain,
  "authorBrainUniversal.ts · planner source diagnostics",
  (t) => t.includes('beatPlanSource: "grounded_sequence_planner"'),
  /beatPlanRecovered:\s*Boolean\(\s*cognition\s*\.latentMovieCandidates\s*\?\.length,\s*\),/m,
  `beatPlanRecovered: false,
        beatPlanSource: "grounded_sequence_planner",`,
);

brain = ensureText(
  brain,
  "authorBrainUniversal.ts · clean Mouth repair feedback",
  (t) => t.includes("REPAIR: Regenerate only the failed viewer-facing film cuts"),
  /last\.content\s*\+=\s*[\s\S]*?QRE REPAIR FEEDBACK:[\s\S]*?\$\{feedback\}`;/m,
  `last.content +=
        "\\n\\nREPAIR: Regenerate only the failed viewer-facing film cuts. Preserve supplied reality, approved sequence, and endpoint. Return JSON only.";`,
);
write(brainPath, brain);

const mouthPath = "apps/api/src/services/authorMouthCandidateSearch.ts";
let mouth = normalize(read(mouthPath));

mouth = ensureText(
  mouth,
  "authorMouthCandidateSearch.ts · strip planner-only fields",
  (t) => /beat\.relationStrength/.test(t) && /beat\.setsUp/.test(t) && !/beat\.obligations/.test(t.split("const beats = input.beats.length")[1]?.split(";")[0] ?? ""),
  /const beats = input\.beats\.length \? input\.beats : \[\];/m,
  `const beats = input.beats.length
    ? input.beats.map((beat) => ({
        order: beat.order,
        role: beat.role,
        attentionFunction: beat.attentionFunction,
        creativeMove: beat.creativeMove,
        realizationMode: beat.realizationMode,
        eventIds: beat.eventIds,
        change: beat.change,
        setsUp: beat.setsUp,
        paysOff: beat.paysOff,
        relationKinds: beat.relationKinds,
        relationStrength: beat.relationStrength,
      }))
    : [];`,
);

mouth = ensureText(
  mouth,
  "authorMouthCandidateSearch.ts · relative brevity",
  (t) => t.includes("There is no fixed line length"),
  /"2-7 words preferred\. One thought\. Make the next moment desirable\."/,
  `"Keep film cuts short and fast, usually 2-7 words. There is no fixed line length; use a longer sentence only when the wording itself is the hit.",`,
);

mouth = ensureText(
  mouth,
  "authorMouthCandidateSearch.ts · grounded creative framing",
  (t) => t.includes("Creative framing is allowed: deadpan"),
  /"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes\."/,
  `"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",
    "Creative framing is allowed: deadpan, mock-serious, absurd, game, mission, noir, status, callback, personification, and rhetorical language when grounded by the supplied beat.",`,
);
write(mouthPath, mouth);

const plannerPath = "apps/api/src/services/authorSequencePlanner.ts";
let planner = normalize(read(plannerPath));

planner = ensureText(
  planner,
  "authorSequencePlanner.ts · checkout release role",
  (t) => /role: "release", gainKind: "payoff", attentionFunction: "release"/.test(t),
  /role: "completion", gainKind: "payoff", attentionFunction: "payoff"/,
  `role: "release", gainKind: "payoff", attentionFunction: "release"`,
);

planner = ensureText(
  planner,
  "authorSequencePlanner.ts · release presence role type",
  (t) => /type PresenceCut =/.test(t) && /role: "arrival" \| "location" \| "release"/.test(t),
  /role: "arrival" \| "location" \| "completion"/,
  `role: "arrival" | "location" | "release"`,
);

planner = ensureText(
  planner,
  "authorSequencePlanner.ts · presence completion classification",
  (t) => /cut\.role === "release"/.test(t) && /cut\.role !== "release"/.test(t),
  /\["arrival", "location", "completion"\]/g,
  `["arrival", "location", "release"]`,
);
planner = planner.replace(/cut\.role === "completion"/g, 'cut.role === "release"');
planner = planner.replace(/cut\.role !== "completion"/g, 'cut.role !== "release"');

const oldNormalization = /  const normalized = beats\n    \.slice\(0, 6\)\n    \.map\(\(beat, index\) => \(\{ \.\.\.beat, order: index \+ 1 \}\)\);/m;
const newNormalization = `  // Presence is intentional film material, not metadata. Keep it in the
  // same sequence as creative beats, but never let it replace the source-derived payoff.
  const endpointBeat = beats.find(
    (beat) =>
      beat.eventIds.includes(endpointId) &&
      beat.attentionFunction === "payoff",
  );
  const presenceBeats = beats.filter(
    (beat) =>
      beat.eventIds.length === 0 &&
      ["arrival", "location", "release"].includes(beat.role),
  );
  const regularBeats = beats.filter(
    (beat) => beat !== endpointBeat && !presenceBeats.includes(beat),
  );
  const capacityForRegular = Math.max(
    0,
    6 - presenceBeats.length - (endpointBeat ? 1 : 0),
  );
  const openingPresence = presenceBeats.filter(
    (beat) => beat.role !== "release",
  );
  const releasePresence = presenceBeats.filter(
    (beat) => beat.role === "release",
  );
  const normalized = [
    ...openingPresence,
    ...regularBeats.slice(0, capacityForRegular),
    ...releasePresence,
    ...(endpointBeat ? [endpointBeat] : []),
  ]
    .slice(0, 6)
    .map((beat, index) => ({ ...beat, order: index + 1 }));`;

if (/const presenceBeats = beats\.filter/.test(planner)) {
  console.log("ALREADY: authorSequencePlanner.ts · protected presence/endpoint normalization");
} else {
  planner = ensureText(
    planner,
    "authorSequencePlanner.ts · protect presence cuts and source endpoint",
    () => false,
    oldNormalization,
    newNormalization,
  );
}

write(plannerPath, planner);

console.log("AUTHOR CANONICAL PATH V3 COMPLETE");
console.log("Next: build contracts, build engine, build api, run author-sequence-planner-acceptance, then author:fast.");
