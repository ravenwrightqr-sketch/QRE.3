import fs from "node:fs";

const ROOT = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, ROOT), "utf8");
const write = (path, value) => fs.writeFileSync(new URL(path, ROOT), value, "utf8");

const normalize = (text) => text.replace(/\r\n?/g, "\n");

function ensure(text, label, already, matcher, replacement) {
  if (already(text)) {
    console.log(`ALREADY: ${label}`);
    return text;
  }
  if (!matcher.test(text)) {
    throw new Error(`PATCH FAILED: ${label}`);
  }
  const next = text.replace(matcher, replacement);
  console.log(`PATCHED: ${label}`);
  return next;
}

const brainPath = "apps/api/src/services/authorBrainUniversal.ts";
let brain = normalize(read(brainPath));

if (!brain.includes("buildGroundedAuthorSequence")) {
  brain = ensure(
    brain,
    "authorBrainUniversal.ts · grounded planner import",
    () => false,
    /import\s*\{\s*recoverBeatPlanFromLatentMovie,?\s*\}\s*from\s*["']\.\/authorBeatPlanRecovery\.js["']\s*;?/m,
    'import { buildGroundedAuthorSequence } from "./authorSequencePlanner.js";',
  );
} else {
  console.log("ALREADY: authorBrainUniversal.ts · grounded planner import");
}

if (!/function buildFallbackBeatPlan\([\s\S]*?buildGroundedAuthorSequence\(/m.test(brain)) {
  brain = ensure(
    brain,
    "authorBrainUniversal.ts · canonical beat-plan source",
    () => false,
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
} else {
  console.log("ALREADY: authorBrainUniversal.ts · canonical beat-plan source");
}

if (!/buildFallbackBeatPlan\(\s*cognition,\s*realityGraph,\s*realityEnvelope,/m.test(brain)) {
  brain = ensure(
    brain,
    "authorBrainUniversal.ts · invoke grounded planner",
    () => false,
    /let beatPlan =\s*buildFallbackBeatPlan\(\s*cognition,\s*realityGraph,\s*\);/m,
    `let beatPlan =
    buildFallbackBeatPlan(
      cognition,
      realityGraph,
      realityEnvelope,
      { ...input, realityGraph },
    );`,
  );
} else {
  console.log("ALREADY: authorBrainUniversal.ts · invoke grounded planner");
}

if (!brain.includes('beatPlanSource: "grounded_sequence_planner"')) {
  brain = ensure(
    brain,
    "authorBrainUniversal.ts · planner source diagnostics",
    () => false,
    /beatPlanRecovered:\s*Boolean\(\s*cognition\s*\.latentMovieCandidates\s*\?\.length,\s*\),/m,
    `beatPlanRecovered: false,
        beatPlanSource: "grounded_sequence_planner",`,
  );
} else {
  console.log("ALREADY: authorBrainUniversal.ts · planner source diagnostics");
}

if (!brain.includes("REPAIR: Regenerate only the failed viewer-facing film cuts")) {
  brain = ensure(
    brain,
    "authorBrainUniversal.ts · clean Mouth repair feedback",
    () => false,
    /last\.content\s*\+=\s*[\s\S]*?QRE REPAIR FEEDBACK:[\s\S]*?\$\{feedback\}`;/m,
    `last.content +=
        "\\n\\nREPAIR: Regenerate only the failed viewer-facing film cuts. Preserve supplied reality, approved sequence, and endpoint. Return JSON only.";`,
  );
} else {
  console.log("ALREADY: authorBrainUniversal.ts · clean Mouth repair feedback");
}

write(brainPath, brain);

const mouthPath = "apps/api/src/services/authorMouthCandidateSearch.ts";
let mouth = normalize(read(mouthPath));

if (!/beat\.relationStrength/.test(mouth)) {
  mouth = ensure(
    mouth,
    "authorMouthCandidateSearch.ts · strip planner-only fields",
    () => false,
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
} else {
  console.log("ALREADY: authorMouthCandidateSearch.ts · strip planner-only fields");
}

if (!mouth.includes("There is no fixed line length")) {
  mouth = ensure(
    mouth,
    "authorMouthCandidateSearch.ts · relative brevity",
    () => false,
    /"2-7 words preferred\. One thought\. Make the next moment desirable\."/,
    `"Keep film cuts short and fast, usually 2-7 words. There is no fixed line length; use a longer sentence only when the wording itself is the hit.",`,
  );
} else {
  console.log("ALREADY: authorMouthCandidateSearch.ts · relative brevity");
}

if (!mouth.includes("Creative framing is allowed: deadpan")) {
  mouth = ensure(
    mouth,
    "authorMouthCandidateSearch.ts · grounded creative framing",
    () => false,
    /"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes\."/,
    `"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",
    "Creative framing is allowed: deadpan, mock-serious, absurd, game, mission, noir, status, callback, personification, and rhetorical language when grounded by the supplied beat.",`,
  );
} else {
  console.log("ALREADY: authorMouthCandidateSearch.ts · grounded creative framing");
}

write(mouthPath, mouth);

const plannerPath = "apps/api/src/services/authorSequencePlanner.ts";
let planner = normalize(read(plannerPath));

// Normalize the presence role to release regardless of the partially-applied state.
planner = planner.replace(
  /role: "(?:completion|release)", gainKind: "payoff", attentionFunction: "(?:payoff|release)"/g,
  'role: "release", gainKind: "payoff", attentionFunction: "release"',
);
planner = planner.replace(
  /role: "arrival" \| "location" \| "(?:completion|release)"/g,
  'role: "arrival" | "location" | "release"',
);
planner = planner.replace(/cut\.role === "completion"/g, 'cut.role === "release"');
planner = planner.replace(/cut\.role !== "completion"/g, 'cut.role !== "release"');

if (/role: "release", gainKind: "payoff", attentionFunction: "release"/.test(planner)) {
  console.log('ALREADY/PATCHED: authorSequencePlanner.ts · release role');
}

// Replace the entire presence insertion block, whether it still calls the value `completion`
// or has already been partially migrated to `release`.
const presenceBlock = /  const presence = presenceCuts\(input\.presenceSummary\);[\s\S]*?\n  \}\n\n  const normalized = beats\n    \.slice\(0, 6\)\n    \.map\(\(beat, index\) => \(\{ \.\.\.beat, order: index \+ 1 \}\)\);/m;
const groundedPresenceBlock = `  const presence = presenceCuts(input.presenceSummary);
  if (presence.length) {
    const arrival = presence.filter(
      (cut) => cut.role === "arrival" || cut.role === "location",
    );
    const release = presence.filter((cut) => cut.role === "release");
    const insertAt = Math.min(1, beats.length);

    for (const cut of [...arrival].reverse()) {
      beats.splice(insertAt, 0, {
        order: 0,
        role: cut.role,
        gainKind: cut.gainKind,
        change: cut.text,
        next: "The real work starts here.",
        frontier: cut.text,
        necessity: "User-authorized presence is an intentional film moment.",
        eventIds: [],
        attentionFunction: cut.attentionFunction,
        setsUp: [],
        paysOff: [],
        creativeMove: "none",
        nextBeatPullTarget: 0.52,
      });
    }

    for (const cut of release) {
      const end = beats.length - 1;
      beats.splice(Math.max(0, end), 0, {
        order: 0,
        role: "release",
        gainKind: "payoff",
        change: cut.text,
        next: "",
        frontier: cut.text,
        necessity: "User-authorized check-out/presence is an intentional film moment.",
        eventIds: [],
        attentionFunction: "release",
        setsUp: beats.length ? [beats[Math.max(0, end - 1)]?.change ?? ""] : [],
        paysOff: [],
        creativeMove: "none",
        nextBeatPullTarget: 0.45,
      });
    }
  }

  // Presence is film material. The source-derived payoff remains the final beat.
  const endpointIdForComposition = input.envelope.endpointEventId || endpointId;
  const endpointBeat = beats.find(
    (beat) =>
      beat.eventIds.includes(endpointIdForComposition) &&
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
  const openingPresence = presenceBeats.filter((beat) => beat.role !== "release");
  const releasePresence = presenceBeats.filter((beat) => beat.role === "release");
  const normalized = [
    ...openingPresence,
    ...regularBeats.slice(0, capacityForRegular),
    ...releasePresence,
    ...(endpointBeat ? [endpointBeat] : []),
  ]
    .slice(0, 6)
    .map((beat, index) => ({ ...beat, order: index + 1 }));`;

if (presenceBlock.test(planner)) {
  planner = planner.replace(presenceBlock, groundedPresenceBlock);
  console.log("PATCHED: authorSequencePlanner.ts · canonical presence/endpoint composition");
} else if (/const endpointBeat = beats\.find\([\s\S]*?const normalized = \[[\s\S]*?releasePresence/.test(planner)) {
  console.log("ALREADY: authorSequencePlanner.ts · canonical presence/endpoint composition");
} else {
  throw new Error("PATCH FAILED: authorSequencePlanner.ts · canonical presence/endpoint composition");
}

write(plannerPath, planner);

console.log("AUTHOR CANONICAL PATH V4 COMPLETE");
console.log("Next: build contracts, build engine, build api, run author-sequence-planner-acceptance, then author:fast.");
