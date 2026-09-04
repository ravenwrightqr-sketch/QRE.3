import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mouthPath = path.join(root, "apps/api/src/services/authorMouth.ts");

function fail(message) {
  console.error(`AUTHOR MOUTH ROUND1: ${message}`);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.writeFileSync(file, content, "utf8");
}

function replaceOnce(source, pattern, replacement, label) {
  if (!pattern.test(source)) fail(`could not locate ${label}`);
  return source.replace(pattern, replacement);
}

let source = read(mouthPath);

// 1. Keep the model as the creative author. Kill the metadata-to-prose fallback.
const fallbackPattern = /export function semanticCreativeFallback\(\s*beat: MouthCandidateBeat,\s*envelope: RealityEnvelope,\s*\): string\[\] \{[\s\S]*?\n\}\n\nexport function deterministicCreativeFallback/;
source = replaceOnce(
  source,
  fallbackPattern,
  `export function semanticCreativeFallback(\n  _beat: MouthCandidateBeat,\n  _envelope: RealityEnvelope,\n): string[] {\n  // Creative language comes from the model. Deterministic recovery is only\n  // the final source-preserving emergency path.\n  return [];\n}\n\nexport function deterministicCreativeFallback`,
  "semanticCreativeFallback block",
);

// 2. Stop literal recovery candidates from being thrown away by the sequence selector.
const literalFilterPattern = /const creative = dedupe\(\s*pool\.candidates,?\s*\)\s*\.filter\(\s*isAuthorizedMouthCandidate,?\s*\)\s*\.filter\(\s*\(candidate\) => !candidate\.reasons\.includes\(\s*"literal-source-restatement",?\s*\),?\s*\);/;
if (literalFilterPattern.test(source)) {
  source = source.replace(
    literalFilterPattern,
    `const creative = dedupe(\n      pool.candidates,\n    ).filter(\n      isAuthorizedMouthCandidate,\n    );`,
  );
}

// 3. Remove duplicated boundary rejection if an earlier repair left it behind.
source = source.replace(
  /\n\s*if \(candidate\.reasons\.includes\("realization-boundary-rejected"\)\) return false;\n\s*if \(candidate\.reasons\.includes\("realization-boundary-rejected"\)\) return false;\n/,
  `\n  if (candidate.reasons.includes("realization-boundary-rejected")) return false;\n`,
);

// 4. Make the lens a first-class creative treatment in every beat job.
source = replaceOnce(
  source,
  /function compactCreativeJob\(beat: MouthCandidateBeat, envelope: RealityEnvelope\) \{\n\s*const s = semantic\(beat\);/,
  `function compactCreativeJob(\n  beat: MouthCandidateBeat,\n  envelope: RealityEnvelope,\n  lensName?: string,\n) {\n  const s = semantic(beat);\n  const lens = classifyLens(lensName || "NONE");`,
  "compactCreativeJob signature",
);

// 5. Remove global reality vocabulary from the model packet; beat-local reality remains in events/scope.
source = source.replace(
  /\n\s*realityVocabulary: \{\s*entities: envelope\.suppliedEntities\.slice\(0, 24\), actions: envelope\.suppliedActions\.slice\(0, 24\), states: envelope\.suppliedStates\.slice\(0, 24\), phrases: envelope\.suppliedPhrases\.slice\(0, 24\),\s*\},/,
  "",
);

// 6. Add operational lens pressure to the job immediately before semanticRealization.
source = replaceOnce(
  source,
  /\n\s*semanticRealization: s \? \{/,
  `\n    creativeTreatment: {\n      lens: lens.label,\n      intensity: lens.intensity,\n      framingBias: [...lens.framingBias],\n      preferredMoves: [...lens.realizationPreferences],\n      forbiddenRealityMoves: [...lens.forbiddenRealityMoves],\n      instruction:\n        "Push this lens hard as a writing treatment. Change framing, attitude, rhythm, status, irony, implication, contrast, tension, tenderness, humor, or genre flavor. The lens changes HOW the supplied reality lands; it never creates new concrete reality.",\n    },\n\n    semanticRealization: s ? {`,
  "lens creativeTreatment",
);

// 7. Replace the current generic creative job with a direct authoring brief.
source = replaceOnce(
  source,
  /\n\s*creativeJob: "REALIZE THE EXPERIENCE,[\s\S]*?Do not explain the thesis\.",/,
  `\n    creativeJob:\n      "Write the strongest human line you can from this beat. The source may be mundane; the realization must not be. Find the click: contrast, attitude, implication, status, irony, tension, tenderness, humor, absurdity, elegance, or consequence. Use the selected lens aggressively. Transform significance rather than merely paraphrasing the event. Be bold with language and framing while remaining inside supplied reality. Novel phrasing and figurative language are welcome. A new concrete event, person, place, chronology, reaction, or sensory fact is not. Prefer the smallest memorable line that makes the approved meaning felt.",`,
  "creativeJob",
);

// 8. Replace the old all-warden system prompt with a creativity-first prompt.
const systemPattern = /function buildSystemPrompt\(\): string \{[\s\S]*?\n\}\n\nexport function buildMouthCandidateMessages/;
source = replaceOnce(
  source,
  systemPattern,
  `function buildSystemPrompt(): string {\n  return [\n    "You are QRE's ONE MOUTH: a sharp human-level copywriter.",\n    "Turn ordinary supplied reality into unusually good language.",\n    "The movie, beats, semantic meaning, and reality are already decided. You only write the realization.",\n    "Treat the source facts as raw material, not prose that must be repeated.",\n    "Find the interesting reading inside mundane material.",\n    "Use the selected lens as a strong creative amplifier: push its attitude, framing, rhythm, status, irony, tension, humor, tenderness, absurdity, suspense, or elegance.",\n    "Reality controls WHAT happened. The lens controls HOW it lands.",\n    "Be creatively ambitious with implication, metaphor, personification, juxtaposition, compression, wordplay, understatement, reversal, callback, and status language when the approved meaning supports them.",\n    "Novel language is allowed. New concrete reality is not.",\n    "Do not invent a new event, action, person, place, chronology, reaction, object interaction, or sensory detail unless it is explicitly supplied or explicitly authorized by the prompt.",\n    "Do not turn a lens into a literal scene. Fierce does not authorize aggression. Heist does not authorize an invented theft. Game does not authorize an invented score or level. Noir does not authorize an invented crime.",\n    "A semantic realization can be bold without becoming a new fact: 'Groomed. Not exactly innocent.' 'Freshly groomed. Mischief pending.' 'Spa day. Beautiful mischief begins.'",\n    "Sensory details such as smell, taste, sound, temperature, or lighting require explicit support; do not invent them for atmosphere.",\n    "For every beat, return exactly three materially different complete candidate lines. They must be actual written lines, never labels or placeholders.",\n    "Do not return A, B, C, or placeholder text as candidate values.",\n    "The opening naturally identifies the supplied subject. Later lines may omit it when identity is already established.",\n    "At payoff, land the supplied endpoint and accumulated meaning without adding another event.",\n    "Never mention the viewer, audience, beat, strategy, cognition, source, planner, or writing process in the candidate text.",\n  ].join(" ");\n}\n\nexport function buildMouthCandidateMessages`,
  "buildSystemPrompt",
);

// 9. Pass the selected lens into every compact beat job.
source = replaceOnce(
  source,
  /compactCreativeJob\(\s*beat,\s*input\.envelope,?\s*\)/,
  `compactCreativeJob(\n        beat,\n        input.envelope,\n        input.lens,\n      )`,
  "buildMouthCandidateMessages compactCreativeJob call",
);

// 10. Make the JSON task explicit without demonstrating A/B/C as values.
source = replaceOnce(
  source,
  /task: "REALIZE_APPROVED_CREATIVE_JOBS",/,
  `task: "REALIZE_APPROVED_CREATIVE_JOBS",\n\n          instruction:\n            "Return exactly three actual written creative realizations for every beat. Use the requested lens as a strong creative treatment. Do not return labels, placeholders, metadata, or the strings A, B, or C as candidate text.",`,
  "model task instruction",
);

// 11. Reject bare A/B/C if a local model ignores the instruction.
source = replaceOnce(
  source,
  /function cleanVariant\(\s*value: unknown,\s*\): string \{\s*return clean\(value\)/,
  `function cleanVariant(\n  value: unknown,\n): string {\n  const cleaned = clean(value)`,
  "cleanVariant opening",
);
source = replaceOnce(
  source,
  /return clean\(value\)\n\s*\.replace\(/,
  `if (/^(?:A|B|C)$/i.test(cleaned)) return "";\n\n  return cleaned\n    .replace(`,
  "cleanVariant placeholder guard",
);

// 12. Idempotency marker.
if (!source.includes("AUTHOR MOUTH CREATIVE ROUND1")) {
  source = source.replace(
    "/**\n * ONE PRODUCTION MOUTH.",
    "/**\n * AUTHOR MOUTH CREATIVE ROUND1\n *\n * Creativity-first realization with a separate hard reality boundary.\n *\n * ONE PRODUCTION MOUTH.",
  );
}

write(mouthPath, source);
console.log("AUTHOR MOUTH CREATIVE ROUND1: APPLIED");
console.log("- model remains primary creative author");
console.log("- semantic prose fallback disabled");
console.log("- literal recovery retained as last-resort candidate");
console.log("- lens treatment injected into beat jobs");
console.log("- global reality vocabulary removed from model packet");
console.log("- creativity-first prompt installed");
console.log("- A/B/C placeholder outputs rejected");
