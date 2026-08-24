import fs from "node:fs";

const ROOT = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, ROOT), "utf8");
const write = (path, value, original) => {
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  fs.writeFileSync(new URL(path, ROOT), value.replace(/\r?\n/g, eol), "utf8");
};

function replaceOnce(text, pattern, replacement, label) {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`PATCH FAILED: ${label}`);
  console.log(`PATCHED: ${label}`);
  return next;
}

function replaceUnless(text, pattern, replacement, label, already) {
  if (already.test(text)) {
    console.log(`ALREADY: ${label}`);
    return text;
  }
  return replaceOnce(text, pattern, replacement, label);
}

function replaceRepairBlock(text) {
  if (!text.includes("QRE REPAIR FEEDBACK:")) {
    console.log("ALREADY: authorBrainUniversal.ts · repair feedback already clean");
    return text;
  }

  const start = text.lastIndexOf("last.content +=");
  const marker = text.indexOf("QRE REPAIR FEEDBACK:", start);
  const end = text.indexOf(";", marker);

  if (start < 0 || marker < 0 || end < 0) {
    throw new Error("PATCH FAILED: authorBrainUniversal.ts · locate repair feedback block");
  }

  const replacement = [
    "last.content +=",
    "        \"\\n\\nREPAIR: Regenerate only the failed viewer-facing film cuts. Preserve supplied reality, approved sequence, and endpoint. Return JSON only.\";",
  ].join("\n");

  console.log("PATCHED: authorBrainUniversal.ts · remove repair diagnostics from Mouth prompt");
  return text.slice(0, start) + replacement + text.slice(end + 1);
}

const brainPath = "apps/api/src/services/authorBrainUniversal.ts";
let brainOriginal = read(brainPath);
let brain = brainOriginal.replace(/\r\n/g, "\n");

brain = replaceUnless(
  brain,
  /import\s*\{\s*recoverBeatPlanFromLatentMovie\s*,?\s*\}\s*from\s*["']\.\/authorBeatPlanRecovery\.js["']\s*;?/m,
  'import { buildGroundedAuthorSequence } from "./authorSequencePlanner.js";',
  "authorBrainUniversal.ts · replace latent-recovery authority with grounded sequence planner",
  /buildGroundedAuthorSequence\s+from\s+["']\.\/authorSequencePlanner\.js["']/,
);

brain = replaceUnless(
  brain,
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
  "authorBrainUniversal.ts · canonical beat-plan source",
  /function buildFallbackBeatPlan\([\s\S]*?buildGroundedAuthorSequence\(/m,
);

brain = replaceUnless(
  brain,
  /let beatPlan =\s*buildFallbackBeatPlan\(\s*cognition,\s*realityGraph,\s*\);/m,
  `let beatPlan =
    buildFallbackBeatPlan(
      cognition,
      realityGraph,
      realityEnvelope,
      { ...input, realityGraph },
    );`,
  "authorBrainUniversal.ts · invoke grounded planner with full reality and presence",
  /buildFallbackBeatPlan\(\s*cognition,\s*realityGraph,\s*realityEnvelope,/m,
);

brain = replaceUnless(
  brain,
  /beatPlanRecovered:\s*Boolean\(\s*cognition\s*\.latentMovieCandidates\s*\?\.length,\s*\),/m,
  `beatPlanRecovered: false,
        beatPlanSource: "grounded_sequence_planner",`,
  "authorBrainUniversal.ts · stop reporting latent recovery as authoritative planning",
  /beatPlanSource:\s*["']grounded_sequence_planner["']/,
);

brain = replaceRepairBlock(brain);
write(brainPath, brain, brainOriginal);

const mouthPath = "apps/api/src/services/authorMouthCandidateSearch.ts";
let mouthOriginal = read(mouthPath);
let mouth = mouthOriginal.replace(/\r\n/g, "\n");

mouth = replaceUnless(
  mouth,
  /const beats = input\.beats\.length\s*\?\s*input\.beats\s*:\s*\[\];/m,
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
  "authorMouthCandidateSearch.ts · strip planner-only fields before Mouth",
  /beat\.relationStrength/,
);

mouth = replaceUnless(
  mouth,
  /"2-7 words preferred\. One thought\. Make the next moment desirable\."/,
  `"Keep film cuts short and fast, usually 2-7 words. There is no fixed line length; use a longer sentence only when the wording itself is the hit.",`,
  "authorMouthCandidateSearch.ts · restore relative brevity rule",
  /There is no fixed line length/,
);

mouth = replaceUnless(
  mouth,
  /"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes\."/,
  `"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",
    "Creative framing is allowed: deadpan, mock-serious, absurd, game, mission, noir, status, callback, personification, and rhetorical language when grounded by the supplied beat.",`,
  "authorMouthCandidateSearch.ts · allow grounded creative framing without new reality",
  /Creative framing is allowed: deadpan/,
);

write(mouthPath, mouth, mouthOriginal);

const plannerPath = "apps/api/src/services/authorSequencePlanner.ts";
let plannerOriginal = read(plannerPath);
let planner = plannerOriginal.replace(/\r\n/g, "\n");

planner = replaceUnless(
  planner,
  /role:\s*"completion",\s*gainKind:\s*"payoff",\s*attentionFunction:\s*"payoff"/m,
  `role: "release", gainKind: "payoff", attentionFunction: "release"`,
  "authorSequencePlanner.ts · make checkout a release rather than a second payoff",
  /role:\s*"release",\s*gainKind:\s*"payoff",\s*attentionFunction:\s*"release"/,
);

planner = replaceUnless(
  planner,
  /role:\s*"completion"\s*\|\s*"location"/,
  `role: "release" | "location"`,
  "authorSequencePlanner.ts · allow release presence role",
  /role:\s*"release"\s*\|\s*"location"/,
);

planner = replaceUnless(
  planner,
  /\["arrival",\s*"location",\s*"completion"\]/,
  `["arrival", "location", "release"]`,
  "authorSequencePlanner.ts · protect release presence cut",
  /\["arrival",\s*"location",\s*"release"\]/,
);

planner = replaceUnless(
  planner,
  /beat\.role\s*!==\s*"completion"/,
  `beat.role !== "release"`,
  "authorSequencePlanner.ts · keep opening presence separate from checkout release",
  /beat\.role\s*!==\s*"release"/,
);

planner = replaceUnless(
  planner,
  /beat\.role\s*===\s*"completion"/,
  `beat.role === "release"`,
  "authorSequencePlanner.ts · place checkout release before endpoint",
  /beat\.role\s*===\s*"release"/,
);

planner = replaceUnless(
  planner,
  /const normalized = beats\s*\.slice\(0, 6\)\s*\.map\(\(beat, index\) => \(\{ \.\.\.beat, order: index \+ 1 \}\)\);/m,
  `// Preserve the endpoint as the final cut. Presence/location cuts are protected
  // because the user explicitly authorized them as film material; semantic reality
  // beats fill the remaining capacity. This is a compact playback safety cap, not
  // a creative beat quota.
  const endpointBeat = beats.find((beat) => beat.eventIds.includes(endpointId) && beat.attentionFunction === "payoff");
  const presenceBeats = beats.filter((beat) =>
    beat.eventIds.length === 0 &&
    ["arrival", "location", "release"].includes(beat.role),
  );
  const regularBeats = beats.filter((beat) =>
    beat !== endpointBeat && !presenceBeats.includes(beat),
  );
  const capacityForRegular = Math.max(0, 6 - presenceBeats.length - (endpointBeat ? 1 : 0));
  const openingPresence = presenceBeats.filter((beat) => beat.role !== "release");
  const completionPresence = presenceBeats.filter((beat) => beat.role === "release");
  const normalized = [
    ...openingPresence,
    ...regularBeats.slice(0, capacityForRegular),
    ...completionPresence,
    ...(endpointBeat ? [endpointBeat] : []),
  ].slice(0, 6).map((beat, index) => ({ ...beat, order: index + 1 }));`,
  "authorSequencePlanner.ts · protect presence cuts and source-derived endpoint",
  /const presenceBeats = beats\.filter/,
);

write(plannerPath, planner, plannerOriginal);

console.log("AUTHOR CANONICAL PATH V2 COMPLETE");
console.log("Next: build contracts, build engine, build api, run planner acceptance, run author:fast.");
