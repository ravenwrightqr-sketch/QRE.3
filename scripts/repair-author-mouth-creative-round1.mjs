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

// The model is the creative author. Deterministic semantic prose is removed so
// an internal contract can never become viewer language.
const fallbackPattern = /export function semanticCreativeFallback\(\s*beat: MouthCandidateBeat,\s*envelope: RealityEnvelope,\s*\): string\[\] \{[\s\S]*?\n\}\n\nexport function deterministicCreativeFallback/;
source = replaceOnce(
  source,
  fallbackPattern,
  `export function semanticCreativeFallback(\n  _beat: MouthCandidateBeat,\n  _envelope: RealityEnvelope,\n): string[] {\n  // Creative language comes from the model. Deterministic recovery is only\n  // the final source-preserving emergency path.\n  return [];\n}\n\nexport function deterministicCreativeFallback`,
  "semanticCreativeFallback block",
);

// Never let the sequence selector starve because source-preserving recovery is
// marked literal. Recovery remains lowest-quality but remains available.
const literalFilterPattern = /const creative = dedupe\(\s*pool\.candidates,?\s*\)\s*\.filter\(\s*isAuthorizedMouthCandidate,?\s*\)\s*\.filter\(\s*\(candidate\) => !candidate\.reasons\.includes\(\s*"literal-source-restatement",?\s*\),?\s*\);/;
if (literalFilterPattern.test(source)) {
  source = source.replace(
    literalFilterPattern,
    `const creative = dedupe(\n      pool.candidates,\n    ).filter(\n      isAuthorizedMouthCandidate,\n    );`,
  );
}

// Remove duplicated realization-boundary rejection left by earlier repair work.
source = source.replace(
  /\n\s*if \(candidate\.reasons\.includes\("realization-boundary-rejected"\)\) return false;\n\s*if \(candidate\.reasons\.includes\("realization-boundary-rejected"\)\) return false;\n/,
  `\n  if (candidate.reasons.includes("realization-boundary-rejected")) return false;\n`,
);

// Make the selected lens a first-class creative treatment in each beat.
source = replaceOnce(
  source,
  /function compactCreativeJob\(beat: MouthCandidateBeat, envelope: RealityEnvelope\) \{\n\s*const s = semantic\(beat\);/,
  `function compactCreativeJob(\n  beat: MouthCandidateBeat,\n  envelope: RealityEnvelope,\n  lensName?: string,\n) {\n  const s = semantic(beat);\n  const lens = classifyLens(lensName || "NONE");`,
  "compactCreativeJob signature",
);

// Global reality vocabulary is redundant and encourages cross-beat borrowing.
source = source.replace(
  /\n\s*realityVocabulary: \{\s*entities: envelope\.suppliedEntities\.slice\(0, 24\), actions: envelope\.suppliedActions\.slice\(0, 24\), states: envelope\.suppliedStates\.slice\(0, 24\), phrases: envelope\.suppliedPhrases\.slice\(0, 24\),\s*\},/,
  "",
);

// Lens pressure is creative direction, never a reality grant.
source = replaceOnce(
  source,
  /\n\s*semanticRealization: s \? \{/,
  `\n    creativeTreatment: {\n      lens: lens.label,\n      intensity: lens.intensity,\n      framingBias: [...lens.framingBias],\n      preferredMoves: [...lens.realizationPreferences],\n      forbiddenRealityMoves: [...lens.forbiddenRealityMoves],\n      instruction:\n        "Push this lens hard as a writing treatment. Amplify framing, attitude, rhythm, status, irony, implication, contrast, tension, humor, tenderness, suspense, absurdity, or elegance. The lens changes HOW the supplied reality lands; it never creates new concrete reality.",\n    },\n\n    semanticRealization: s ? {`,
  "lens creativeTreatment",
);

source = replaceOnce(
  source,
  /\n\s*creativeJob: "REALIZE THE EXPERIENCE,[\s\S]*?Do not explain the thesis\.",/,
  `\n    creativeJob:\n      "Write the strongest human line you can from this beat. The source may be mundane; the realization must not be. Find the interesting reading inside the supplied material. Prefer contradiction, before/after pressure, status reversal, implication, recontextualization, juxtaposition, callback, consequence, understatement, compression, irony, or wordplay when supported. Use the selected lens aggressively. Be bold in LANGUAGE while staying conservative about REALITY. Do not merely paraphrase. The reader should feel the meaning rather than receive an explanation. Prefer 2–10 memorable words when possible.",`,
  "creativeJob",
);

// Replace the overlong defensive system prompt with a creativity-first contract.
const systemPattern = /function buildSystemPrompt\(\): string \{[\s\S]*?\n\}\n\nexport function buildMouthCandidateMessages/;
source = replaceOnce(
  source,
  systemPattern,
  `function buildSystemPrompt(): string {\n  return [\n    "You are QRE's ONE MOUTH: a sharp human-level copywriter.",\n    "Turn ordinary supplied reality into unusually good language.",\n    "The movie, beats, semantic meaning, and reality are already decided. You only write the realization.",\n    "Treat facts as raw material, not prose that must be copied.",\n    "Find the most interesting reading inside mundane material.",\n    "The selected lens is a strong creative amplifier. Push it: attitude, status, rhythm, irony, humor, suspense, tenderness, absurdity, elegance, tension, implication, or genre flavor.",\n    "Reality controls WHAT happened. The lens controls HOW it lands.",\n    "Use implication, metaphor, personification, juxtaposition, compression, wordplay, understatement, reversal, callback, recontextualization, and consequence whenever the approved meaning supports them.",\n    "A boring fact can become a killer line without becoming a new event.",\n    "Novel language is allowed. A new concrete event, action, person, place, chronology, reaction, object interaction, or sensory fact is not allowed unless explicitly supplied or authorized by the prompt.",\n    "A lens never grants permission to literalize its props. Fierce does not authorize aggression. Heist does not authorize an invented theft. Game does not authorize an invented level or score. Noir does not authorize an invented crime.",\n    "Sensory claims such as smell, taste, sound, temperature, lighting, or bodily sensation require explicit support; do not invent them for atmosphere.",\n    "Strong examples of the target PATTERN are semantic transformations such as 'Groomed. Not exactly innocent.' 'Freshly groomed. Mischief pending.' and 'Spa day. Beautiful mischief begins.' Use the pattern, not the exact wording, and only when the supplied meaning supports it.",\n    "For every beat, return exactly three materially different complete candidate lines. Never return labels, placeholders, metadata, or the strings A, B, or C as candidate text.",\n    "The opening naturally identifies the supplied subject. Later lines may omit it once established.",\n    "At payoff, land the supplied endpoint and accumulated meaning without adding another event.",\n    "Never mention the viewer, audience, beat, strategy, cognition, source, planner, or writing process in candidate text.",\n  ].join(" ");\n}\n\nexport function buildMouthCandidateMessages`,
  "buildSystemPrompt",
);

// Pass the selected lens into every beat job.
source = replaceOnce(
  source,
  /compactCreativeJob\(\s*beat,\s*input\.envelope,?\s*\)/,
  `compactCreativeJob(\n        beat,\n        input.envelope,\n        input.lens,\n      )`,
  "buildMouthCandidateMessages compactCreativeJob call",
);

// Preserve domain context as contextual guidance; it is not reality authorization.
source = replaceOnce(
  source,
  /jobs,\n\s*priorTexts:/,
  `jobs,\n\n          domainContext: input.domainContext ?? null,\n\n          priorTexts:`,
  "domainContext in model packet",
);

// Tell the model exactly what belongs in the output values.
source = replaceOnce(
  source,
  /task: "REALIZE_APPROVED_CREATIVE_JOBS",/,
  `task: "REALIZE_APPROVED_CREATIVE_JOBS",\n\n          instruction:\n            "Return exactly three actual written creative realizations for every beat. Use the requested lens and domain context as creative treatment. Do not return labels, placeholders, metadata, or the strings A, B, or C as candidate text.",`,
  "model task instruction",
);

// Defend parsing against small local-model failures.
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
console.log("- domain context passed as creative context");
console.log("- creativity-first prompt installed");
console.log("- A/B/C placeholder outputs rejected");
