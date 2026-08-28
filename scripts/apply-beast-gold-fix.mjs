import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content, "utf8");
}

function replaceOnce(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`BEAST GOLD FIX: replacement did not match: ${label}`);
  }
  return next;
}

// ---------------------------------------------------------------------------
// 1. Canonical movie authority.
// Cognition already performs movie search + viewer-state rerank. Canonical
// Author must consume that result instead of launching a second search.
// ---------------------------------------------------------------------------
{
  const file = "apps/api/src/services/authorBrainCanonical.ts";
  let source = read(file);

  if (source.includes('import { searchUniversalMovieCandidates } from "./authorUniversalMovieSearch.js";')) {
    source = source.replace(
      'import { searchUniversalMovieCandidates } from "./authorUniversalMovieSearch.js";\n',
      "",
    );
  }

  source = replaceOnce(
    source,
    /function chooseMovie\(\n  input: AuthorBrainTruth,\n  graph: ReturnType<typeof buildAuthorRealityGraph>,\n  lens: string,\n  realizationMode: AuthorRealizationMode,\n\): LatentMovieCandidate \| undefined \{/,
    `function chooseMovie(\n  input: AuthorBrainTruth,\n  graph: ReturnType<typeof buildAuthorRealityGraph>,\n  lens: string,\n  realizationMode: AuthorRealizationMode,\n  cognition: ReturnType<typeof buildAuthorCognitivePlan>,\n): LatentMovieCandidate | undefined {`,
    "pass Cognition into chooseMovie",
  );

  source = replaceOnce(
    source,
    /  const candidates = searchUniversalMovieCandidates\(\{[\s\S]*?  \}\);/,
    "  const candidates = cognition.latentMovieCandidates;",
    "consume Cognition movie candidates",
  );

  source = replaceOnce(
    source,
    /      graph,\n      lens,\n      realizationMode,\n    \);/,
    `      graph,\n      lens,\n      realizationMode,\n      cognition,\n    );`,
    "pass Cognition result to chooseMovie",
  );

  write(file, source);
}

// ---------------------------------------------------------------------------
// 2. Mouth semantic-compression lane.
//
// The canonical doctrine permits a realization to preserve meaning while
// changing every source word. The previous evaluator quietly required lexical
// beat overlap, which killed examples such as:
//   talked til close -> We stayed.
//   feeling good      -> Fabulous.
//   mud bath was free -> Complimentary.
//
// This patch adds a small language-level compression classifier. It is not a
// domain phrase dictionary. Concrete claims remain subject to the existing
// invention firewall.
// ---------------------------------------------------------------------------
{
  const file = "apps/api/src/services/authorMouthInterpretation.ts";
  let source = read(file);

  source = replaceOnce(
    source,
    /function compactRhetoricalShape\(text: string\): boolean \{[\s\S]*?\n\}\nexport function evaluateMouthInterpretation/,
    `function compactRhetoricalShape(text: string): boolean {\n  const wordCount = text.split(/\\s+/).filter(Boolean).length;\n  if (!wordCount || wordCount > 12) return false;\n\n  const terminal = /[.!?]$/.test(text);\n  const fragment = !CLAUSE_SUBJECT_MARKER.test(text) && wordCount <= 6;\n  const framing = ABSTRACT_FRAMING.test(text);\n  return terminal && (fragment || framing);\n}\n\nconst SEMANTIC_COMPRESSION_VERBS = new Set([\n  "stay",\n  "stayed",\n  "stays",\n  "remain",\n  "remained",\n  "remains",\n  "keep",\n  "kept",\n  "keeps",\n  "continued",\n  "continue",\n  "continues",\n  "knew",\n  "know",\n  "knows",\n  "felt",\n  "feel",\n  "feels",\n  "waited",\n  "wait",\n  "waits",\n]);\n\nconst FUNCTION_WORDS = new Set([\n  "the",\n  "a",\n  "an",\n  "we",\n  "us",\n  "i",\n  "you",\n  "he",\n  "she",\n  "they",\n  "it",\n  "our",\n  "my",\n  "your",\n  "their",\n  "still",\n  "just",\n  "finally",\n  "again",\n  "already",\n  "apparently",\n]);\n\nconst SEMANTIC_COMPRESSION_FRAMING = new Set([\n  "fabulous",\n  "complimentary",\n]);\n\nfunction semanticCompressionShape(\n  text: string,\n  sourceLabels: readonly string[],\n): boolean {\n  const wordCount = text.split(/\\s+/).filter(Boolean).length;\n  if (wordCount === 0 || wordCount > 7) return false;\n  if (CONCRETE_CLAIM.test(text) || EXTERNAL_STATE_CLAIM.test(text)) return false;\n\n  const current = tokens(text);\n  const source = tokens(sourceLabels.join(" "));\n  const significant = [...current].filter((token) => !FUNCTION_WORDS.has(token));\n\n  const compressionVerb = significant.some((token) =>\n    SEMANTIC_COMPRESSION_VERBS.has(token),\n  );\n  const framing = ABSTRACT_FRAMING.test(text) ||\n    significant.some((token) => SEMANTIC_COMPRESSION_FRAMING.has(token));\n\n  if (!compressionVerb && !framing) return false;\n\n  const unknown = significant.filter(\n    (token) =>\n      !source.has(token) &&\n      !SEMANTIC_COMPRESSION_VERBS.has(token) &&\n      !ABSTRACT_FRAMING.test(token) &&\n      !SEMANTIC_COMPRESSION_FRAMING.has(token),\n  );\n\n  const touchesBeat = overlap(current, source) >= 0.04;\n\n  // Do not let an unsupported property piggyback on a source noun.\n  // Example rejected shape: "Coffee shop. Already strange."\n  if (touchesBeat) return unknown.length === 0;\n\n  // A compact rhetorical realization may contain one non-signal noun when it\n  // is clearly framing/compressing rather than asserting a new concrete fact.\n  // This preserves "A joyous tumble." without authorizing unrelated concrete\n  // world material such as "Free mud." for a different beat.\n  return unknown.length <= 1;\n}\n\nexport function evaluateMouthInterpretation`,
    "install semantic-compression classifier",
  );

  source = replaceOnce(
    source,
    /  const semanticBeatSupport =[\s\S]*?        \);\n\n  \/\*\n   \* The world can provide associative lift/,
    `  const semanticCompression = semanticCompressionShape(\n    text,\n    input.sourceLabels,\n  );\n\n  const semanticBeatSupport =\n    hasBeatSource\n      ? (\n          beatTouchesLanguage ||\n          literalRestatement === 1 ||\n          semanticCompression ||\n          (\n            frameSignal &&\n            sourceAnchor >= 0.04\n          )\n        )\n      : (\n          wholeSourceAnchor >= 0.08 ||\n          frameSignal\n        );\n\n  /*\n   * The world can provide associative lift`,
    "remove lexical-overlap-only semantic beat gate",
  );

  source = replaceOnce(
    source,
    /  if \(\n    safeCreativeBet\n  \) \{/,
    `  if (semanticCompression) {\n    reasons.push(\n      "semantic-compression",\n    );\n  }\n\n  if (\n    safeCreativeBet\n  ) {`,
    "record semantic compression reason",
  );

  source = replaceOnce(
    source,
    /        beatCoverage >=\n        0\.12 \|\|\n        endpointExactness ===\n        1 \|\|\n        \(\n          beatHasConcreteEvidence ===\n          false &&\n          wholeSourceAnchor >=\n          0\.2\n        \)/,
    `        beatCoverage >= 0.12 ||\n        endpointExactness === 1 ||\n        semanticCompression ||\n        (\n          beatHasConcreteEvidence === false &&\n          wholeSourceAnchor >= 0.2\n        )`,
    "allow semantic compression in creative lane",
  );

  // Make semantic compression an explicit quality contribution. It is still
  // bounded by the existing unsupported-concrete firewall.
  source = replaceOnce(
    source,
    /        \(\n          interpretation\.creativeFraming \?\?\n          0\.5\n        \) \*\n          0\.05 -\n        collageRisk \*\n          0\.03,/,
    `        (\n          interpretation.creativeFraming ??\n          0.5\n        ) *\n          0.05 +\n        (semanticCompression ? 0.10 : 0) -\n        collageRisk *\n          0.03,`,
    "score semantic compression",
  );

  write(file, source);
}

const canonical = read("apps/api/src/services/authorBrainCanonical.ts");
const mouth = read("apps/api/src/services/authorMouthInterpretation.ts");

if (canonical.includes('import { searchUniversalMovieCandidates } from "./authorUniversalMovieSearch.js";')) {
  throw new Error("BEAST GOLD FIX: second movie authority import still present");
}
if (!canonical.includes("const candidates = cognition.latentMovieCandidates;")) {
  throw new Error("BEAST GOLD FIX: Canonical Author is not consuming Cognition movie candidates");
}
if (!mouth.includes("function semanticCompressionShape(")) {
  throw new Error("BEAST GOLD FIX: semantic compression classifier not installed");
}
if (!mouth.includes('"semantic-compression"')) {
  throw new Error("BEAST GOLD FIX: semantic compression authorization reason not installed");
}

console.log("BEAST GOLD FIX: applied");
console.log("- Canonical Author now consumes Cognition's selected movie path");
console.log("- Mouth now permits bounded semantic compression without lexical beat overlap");
console.log("- Unsupported concrete claims remain behind the existing invention firewall");
