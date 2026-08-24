import fs from "node:fs";

const ROOT = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, ROOT), "utf8");
const write = (path, value) => fs.writeFileSync(new URL(path, ROOT), value, "utf8");

function replaceOnce(text, pattern, replacement, label) {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`PATCH FAILED: ${label}`);
  console.log(`PATCHED: ${label}`);
  return next;
}

function ensureReplace(text, pattern, replacement, label, alreadyApplied) {
  if (alreadyApplied(text)) {
    console.log(`ALREADY: ${label}`);
    return text;
  }
  return replaceOnce(text, pattern, replacement, label);
}

const brainPath = "apps/api/src/services/authorBrainUniversal.ts";
let brain = read(brainPath);

brain = ensureReplace(
  brain,
  /import\s*\{\s*recoverBeatPlanFromLatentMovie\s*,?\s*\}\s*from\s*["']\.\/authorBeatPlanRecovery\.js["']\s*;?/m,
  'import { buildGroundedAuthorSequence } from "./authorSequencePlanner.js";',
  "authorBrainUniversal.ts · replace latent-recovery authority with grounded sequence planner",
  (text) => /buildGroundedAuthorSequence\s*\}/.test(text) || /buildGroundedAuthorSequence\s+from\s+["']\.\/authorSequencePlanner\.js["']/.test(text),
);

brain = ensureReplace(
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
  (text) => /function buildFallbackBeatPlan\([\s\S]*?buildGroundedAuthorSequence\(/m.test(text),
);

brain = ensureReplace(
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
  (text) => /buildFallbackBeatPlan\(\s*cognition,\s*realityGraph,\s*realityEnvelope,/m.test(text),
);

brain = ensureReplace(
  brain,
  /beatPlanRecovered:\s*Boolean\(\s*cognition\s*\.latentMovieCandidates\s*\?\.length,\s*\),/m,
  `beatPlanRecovered: false,
        beatPlanSource: "grounded_sequence_planner",`,
  "authorBrainUniversal.ts · stop reporting latent recovery as authoritative planning",
  (text) => /beatPlanSource:\s*["']grounded_sequence_planner["']/.test(text),
);

brain = ensureReplace(
  brain,
  /last\.content\s*\+=\s*`\s*\\n\\s*\\nQRE REPAIR FEEDBACK:\\n\$\{feedback\}`;/m,
  `last.content +=
        "\\n\\nREPAIR: Regenerate only the failed viewer-facing film cuts. Preserve supplied reality, approved sequence, and endpoint. Return JSON only.";`,
  "authorBrainUniversal.ts · remove repair diagnostics from Mouth prompt",
  (text) => /REPAIR: Regenerate only the failed viewer-facing film cuts/.test(text),
);

write(brainPath, brain);

const mouthPath = "apps/api/src/services/authorMouthCandidateSearch.ts";
let mouth = read(mouthPath);

mouth = ensureReplace(
  mouth,
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
  "authorMouthCandidateSearch.ts · strip planner-only fields before Mouth",
  (text) => /beat\.relationStrength/.test(text) && /beat\.eventIds/.test(text),
);

mouth = ensureReplace(
  mouth,
  /"2-7 words preferred\. One thought\. Make the next moment desirable\."/,
  `"Keep film cuts short and fast, usually 2-7 words. There is no fixed line length; use a longer sentence only when the wording itself is the hit.",`,
  "authorMouthCandidateSearch.ts · restore relative brevity rule",
  (text) => /There is no fixed line length/.test(text),
);

mouth = ensureReplace(
  mouth,
  /"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes\."/,
  `"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",
    "Creative framing is allowed: deadpan, mock-serious, absurd, game, mission, noir, status, callback, personification, and rhetorical language when grounded by the supplied beat.",`,
  "authorMouthCandidateSearch.ts · allow grounded creative framing without new reality",
  (text) => /Creative framing is allowed: deadpan/.test(text),
);

write(mouthPath, mouth);

const plannerPath = "apps/api/src/services/authorSequencePlanner.ts";
let planner = read(plannerPath);

planner = ensureReplace(
  planner,
  /role: "completion", gainKind: "payoff", attentionFunction: "payoff"/,
  `role: "release", gainKind: "payoff", attentionFunction: "release"`,
  "authorSequencePlanner.ts · make checkout a release rather than a second payoff",
  (text) => /role: "release", gainKind: "payoff", attentionFunction: "release"/.test(text),
);

planner = ensureReplace(
  planner,
  /role: "completion" \| "location"/,
  `role: "release" | "location"`,
  "authorSequencePlanner.ts · allow release presence role",
  (text) => /role: "release" \| "location"/.test(text),
);

planner = ensureReplace(
  planner,
  /\["arrival", "location", "completion"\]/g,
  `["arrival", "location", "release"]`,
  "authorSequencePlanner.ts · protect release presence cut",
  (text) => /\["arrival", "location", "release"\]/.test(text),
);

planner = ensureReplace(
  planner,
  /beat\.role !== "completion"/g,
  `beat.role !== "release"`,
  "authorSequencePlanner.ts · keep opening presence separate from checkout release",
  (text) => /beat\.role !== "release"/.test(text),
);

planner = ensureReplace(
  planner,
  /beat\.role === "completion"/g,
  `beat.role === "release"`,
  "authorSequencePlanner.ts · place checkout release before endpoint",
  (text) => /beat\.role === "release"/.test(text),
);

planner = ensureReplace(
  planner,
  /const normalized = beats\s*\.slice\(0, 6\)\s*\.map\(\(beat, index\) => \(\{ \.\.\.beat, order: index \+ 1 \}\)\);/m,
  `// Preserve the endpoint as the final cut. Presence/location cuts are protected
  // because the user explicitly authorized them as film material; semantic reality
  // beats fill the remaining capacity. There is no numeric quota beyond keeping the
  // playback compact; this is only a safety cap at the final composition boundary.
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
  (text) => /const presenceBeats = beats\.filter/.test(text) && /completionPresence/.test(text),
);

write(plannerPath, planner);

console.log("AUTHOR CANONICAL PATH PATCH COMPLETE");
console.log("Next: build contracts, build engine, build api, run author:fast.");
