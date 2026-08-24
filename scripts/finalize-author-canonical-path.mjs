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

const brainPath = "apps/api/src/services/authorBrainUniversal.ts";
let brain = read(brainPath);

brain = replaceOnce(
  brain,
  /import \{\n  recoverBeatPlanFromLatentMovie,\n\} from "\.\/authorBeatPlanRecovery\.js";\n/,
  "import { buildGroundedAuthorSequence } from \"./authorSequencePlanner.js\";\n",
  "authorBrainUniversal.ts · replace latent-recovery authority with grounded sequence planner",
);

brain = replaceOnce(
  brain,
  /function buildFallbackBeatPlan\(\n  cognition:[\s\S]*?\n}\n\nfunction buildBeatMessages\(/,
  `function buildFallbackBeatPlan(\n  cognition: ReturnType<typeof buildAuthorCognitivePlan>,\n  realityGraph: ReturnType<typeof buildAuthorRealityGraph>,\n  realityEnvelope: ReturnType<typeof buildAuthorRealityEnvelope>,\n  input: AuthorBrainTruth,\n): BeatPlan | undefined {\n  const planned = buildGroundedAuthorSequence({\n    graph: realityGraph,\n    envelope: realityEnvelope,\n    subject: input.subject,\n    lens: input.lens,\n    presenceSummary: input.presenceSummary ?? [],\n  });\n\n  if (!planned?.beats.length) return undefined;\n\n  return normalizeBeatPlan(planned);\n}\n\nfunction buildBeatMessages(`,
  "authorBrainUniversal.ts · canonical beat-plan source",
);

brain = replaceOnce(
  brain,
  /let beatPlan =\n    buildFallbackBeatPlan\(\n      cognition,\n      realityGraph,\n    \);/,
  `let beatPlan =\n    buildFallbackBeatPlan(\n      cognition,\n      realityGraph,\n      realityEnvelope,\n      { ...input, realityGraph },\n    );`,
  "authorBrainUniversal.ts · invoke grounded planner with full reality and presence",
);

brain = replaceOnce(
  brain,
  /beatPlanRecovered:\n        Boolean\(\n          cognition\n            \.latentMovieCandidates\n            \?\.length,\n        \),/,
  `beatPlanRecovered: false,\n      beatPlanSource: "grounded_sequence_planner",`,
  "authorBrainUniversal.ts · stop reporting latent recovery as authoritative planning",
);

brain = replaceOnce(
  brain,
  /last\.content \+=\n        `\\n\\nQRE REPAIR FEEDBACK:\\n\$\{feedback\}`;/,
  `last.content +=\n        "\\n\\nREPAIR: Regenerate only the failed viewer-facing film cuts. Preserve supplied reality, approved sequence, and endpoint. Return JSON only.";`,
  "authorBrainUniversal.ts · remove repair diagnostics from Mouth prompt",
);

write(brainPath, brain);

const mouthPath = "apps/api/src/services/authorMouthCandidateSearch.ts";
let mouth = read(mouthPath);

mouth = replaceOnce(
  mouth,
  /const beats = input\.beats\.length \? input\.beats : \[\];/,
  `const beats = input.beats.length\n    ? input.beats.map((beat) => ({\n        order: beat.order,\n        role: beat.role,\n        attentionFunction: beat.attentionFunction,\n        creativeMove: beat.creativeMove,\n        realizationMode: beat.realizationMode,\n        eventIds: beat.eventIds,\n        change: beat.change,\n        setsUp: beat.setsUp,\n        paysOff: beat.paysOff,\n        relationKinds: beat.relationKinds,\n        relationStrength: beat.relationStrength,\n      }))\n    : [];`,
  "authorMouthCandidateSearch.ts · strip planner-only fields before Mouth",
);

mouth = replaceOnce(
  mouth,
  /"2-7 words preferred\. One thought\. Make the next moment desirable\.",/,
  `"Keep film cuts short and fast, usually 2-7 words. There is no fixed line length; use a longer sentence only when the wording itself is the hit.",`,
  "authorMouthCandidateSearch.ts · restore relative brevity rule",
);

mouth = replaceOnce(
  mouth,
  /"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes\.",/,
  `"Do not invent physical actions, reactions, objects, people, locations, sounds, chronology, or outcomes.",\n    "Creative framing is allowed: deadpan, mock-serious, absurd, game, mission, noir, status, callback, personification, and rhetorical language when grounded by the supplied beat.",`,
  "authorMouthCandidateSearch.ts · allow grounded creative framing without new reality",
);

write(mouthPath, mouth);

const plannerPath = "apps/api/src/services/authorSequencePlanner.ts";
let planner = read(plannerPath);

planner = replaceOnce(
  planner,
  /  const normalized = beats\n    \.slice\(0, 6\)\n    \.map\(\(beat, index\) => \(\{ \.\.\.beat, order: index \+ 1 \}\)\);/,
  `  // Preserve the endpoint as the final cut. Presence/location cuts may occupy\n  // the opening or closing neighborhood, but they can never displace the\n  // source-derived payoff. Keep the play short without deleting meaningful\n  // material just to satisfy a numeric quota.\n  const endpointBeat = beats.find((beat) => beat.eventIds.includes(endpointId) && beat.attentionFunction === "payoff");\n  const nonEndpoint = beats.filter((beat) => beat !== endpointBeat);\n  const capacityBeforeEndpoint = endpointBeat ? 5 : 6;\n  const normalized = [\n    ...nonEndpoint.slice(0, capacityBeforeEndpoint),\n    ...(endpointBeat ? [endpointBeat] : []),\n  ].map((beat, index) => ({ ...beat, order: index + 1 }));`,
  "authorSequencePlanner.ts · preserve endpoint while mixing presence cuts",
);

write(plannerPath, planner);

console.log("AUTHOR CANONICAL PATH PATCH COMPLETE");
console.log("Next: build contracts, build engine, build api, run author:fast.");
