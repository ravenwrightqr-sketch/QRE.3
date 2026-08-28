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
// 1. Canonical movie authority: Cognition already searched + reranked the
// movie. Canonical Author must consume that result instead of searching again.
// ---------------------------------------------------------------------------
{
  const file = "apps/api/src/services/authorBrainCanonical.ts";
  let source = read(file);

  source = replaceOnce(
    source,
    /import \{ searchUniversalMovieCandidates \} from "\.\/authorUniversalMovieSearch\.js";\n/,
    "",
    "remove second movie-authority import",
  );

  source = replaceOnce(
    source,
    /function chooseMovie\(\n  input: AuthorBrainTruth,\n  graph: ReturnType<typeof buildAuthorRealityGraph>,\n  lens: string,\n  realizationMode: AuthorRealizationMode,\n\): LatentMovieCandidate \| undefined \{/,
    `function chooseMovie(\n  input: AuthorBrainTruth,\n  graph: ReturnType<typeof buildAuthorRealityGraph>,\n  lens: string,\n  realizationMode: AuthorRealizationMode,\n  cognition: ReturnType<typeof buildAuthorCognitivePlan>,\n): LatentMovieCandidate | undefined {`,
    "pass Cognition to movie chooser",
  );

  source = replaceOnce(
    source,
    /  const candidates = searchUniversalMovieCandidates\(\{\n    graph,\n    subject: clean\(input\.subject\),\n    lens,\n    limit: 8,\n  \}\);/,
    `  const candidates = cognition.latentMovieCandidates;`,
    "consume Cognition movie candidates",
  );

  source = replaceOnce(
    source,
    /      realizationMode,\n    \);/,
    `      realizationMode,\n      cognition,\n    );`,
    "pass Cognition movie result",
  );

  write(file, source);
}

// ---------------------------------------------------------------------------
// 2. Mouth semantic-compression lane.
//
// The existing doctrine explicitly allows meaning-preserving compression even
// when the final words do not overlap the source. The evaluator was silently
// contradicting that doctrine by requiring beat lexical overlap. Add a small
// language-level compression shape instead of a domain phrase dictionary.
// ---------------------------------------------------------------------------
{
  const file = "apps/api/src/services/authorMouthInterpretation.ts";
  let source = read(file);

  source = replaceOnce(
    source,
    /\|danger|victory\|/,
    "|danger|victory|complimentary|",
    "add generic rhetorical realization signal",
  );

  source = replaceOnce(
    source,
    /function compactRhetoricalShape\(text: string\): boolean \{[\s\S]*?\n\}\nexport function evaluateMouthInterpretation/,
    `const SEMANTIC_COMPRESSION_VERBS = new Set([\n  "stay",\n  "stayed",\n  "stays",\n  "remain",\n  "remained",\n  "remains",\n  "keep",\n  "kept",\n  "keeps",\n  "continued",\n  "continue",\n  "continues",\n  "knew",\n  "know",\n  "knows",\n  "felt",\n  "feel",\n  "feels",\n  "waited",\n  "wait",\n  "waits",\n]);\n\nconst FUNCTION_WORDS = new Set([\n  "the",\n  "a",\n  "an",\n  "we",\n  "us",\n  "i",\n  "you",\n  "he",\n  "she",\n  "they",\n  "it",\n  "our",\n  "my",\n  "your",\n  "their",\n  "still",\n  "just",\n  "finally",\n  "again",\n  "already",\n  "apparently",\n]);\n\nfunction compactRhetoricalShape(text: string): boolean {\n  const wordCount = text.split(/\\s+/).filter(Boolean).length;\n  if (!wordCount || wordCount > 12) return false;\n\n  const terminal = /[.!?]$/.test(text);\n  const fragment = !CLAUSE_SUBJECT_MARKER.test(text) && wordCount <= 6;\n  const framing = ABSTRACT_FRAMING.test(text);\n  return terminal && (fragment || framing);\n}\n\nfunction semanticCompressionShape(\n  text: string,\n  sourceLabels: readonly string[],\n): boolean {\n  const wordCount = text.split(/\\s+/).filter(Boolean).length;\n  if (wordCount === 0 || wordCount > 7) return false;\n  if (CONCRETE_CLAIM.test(text) || EXTERNAL_STATE_CLAIM.test(text)) return false;\n\n  const current = tokens(text);\n  const source = tokens(sourceLabels.join(" "));\n  const significant = [...current].filter((token) => !FUNCTION_WORDS.has(token));\n\n  const compressionVerb = significant.some((token) =>\n    SEMANTIC_COMPRESSION_VERBS.has(token),\n  );\n  const framing = ABSTRACT_FRAMING.test(text);\n  if (!compressionVerb && !framing) return false;\n\n  const unknown = significant.filter(\n    (token) =>\n      !source.has(token) &&\n      !SEMANTIC_COMPRESSION_VERBS.has(token) &&\n      !ABSTRACT_FRAMING.test(token),\n  );\n\n  const touchesBeat = overlap(current, source) >= 0.04;\n\n  // A source-backed noun plus an unsupported evaluative property is not a\n  // free creative pass (e.g. "Coffee shop. Already strange.").\n  if (touchesBeat) return unknown.length === 0;\n\n  // When the line carries no concrete claim and reads as pure attitude or\n  // semantic compression, one non-signal rhetorical noun may still be a\n  // legitimate creative realization (e.g. "A joyous tumble.").\n  return unknown.length <= 1;\n}\nexport function evaluateMouthInterpretation`,
    "add language-level semantic compression classifier",
  );

  source = replaceOnce(
    source,
    /  const semanticBeatSupport =\n    hasBeatSource\n      \? \(\n          beatTouchesLanguage \|\|\n          literalRestatement ===\n            1 \|\|\n          \(\n            frameSignal &&\n            sourceAnchor >=\n              0\.04\n          \)\n        \)\n      : \(\n          wholeSourceAnchor >=\n            0\.08 \|\|\n          frameSignal\n        \);/,
    `  const semanticCompression = semanticCompressionShape(\n    text,\n    input.sourceLabels,\n  );\n\n  const semanticBeatSupport =\n    hasBeatSource\n      ? (\n          beatTouchesLanguage ||\n          literalRestatement === 1 ||\n          semanticCompression ||\n          (\n            frameSignal &&\n            sourceAnchor >= 0.04\n          )\n        )\n      : (\n          wholeSourceAnchor >= 0.08 ||\n          frameSignal\n        );`,
    "remove lexical-overlap-only beat gate",
  );

  source = replaceOnce(
    source,
    /  if \(\n    safeCreativeBet\n  \) \{/,
    `  if (semanticCompression) {\n    reasons.push(\n      "semantic-compression",\n    );\n  }\n\n  if (\n    safeCreativeBet\n  ) {`,
    "record semantic compression authorization",
  );

  source = replaceOnce(
    source,
    /      \(\n          beatCoverage >=\n        0\.12 \|\|\n      endpointExactness ===\n        1 \|\|\n      \(\n        beatHasConcreteEvidence ===\n          false &&\n        wholeSourceAnchor >=\n          0\.2\n      \)\n    \);/,
    `      (\n        beatCoverage >= 0.12 ||\n        endpointExactness === 1 ||\n        semanticCompression ||\n        (\n          beatHasConcreteEvidence === false &&\n          wholeSourceAnchor >= 0.2\n        )\n      );`,
    "permit authorized semantic compression in creative lane",
  );

  source = replaceOnce(
    source,
    /          beatCoverage \*\n            0\.72 \+\n          \(\n              supportedEventIds\.length\n                \? 0\.28\n                : 0\n            \),/,
    `          beatCoverage *\n            0.62 +\n          (\n            supportedEventIds.length\n              ? 0.18\n              : 0\n          ) +\n          (semanticCompression ? 0.20 : 0),`,
    "give semantic compression explicit beat obligation",
  );

  write(file, source);
}

console.log("BEAST GOLD FIX: applied");
console.log("- Canonical Author now consumes Cognition's selected movie path");
console.log("- Mouth can authorize grounded semantic compression without lexical overlap");
console.log("- Concrete / externally observable invention remains blocked");
