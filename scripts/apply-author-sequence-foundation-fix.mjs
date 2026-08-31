import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const graphFile = path.join(root, "apps/api/src/services/authorRealityGraph.ts");
const movieFile = path.join(root, "apps/api/src/services/authorUniversalMovieSearch.ts");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function replaceOnce(source, from, to, label) {
  const index = source.indexOf(from);
  assert(index >= 0, `Missing stable anchor for ${label}; refusing to patch.`);
  return source.slice(0, index) + to + source.slice(index + from.length);
}

function replaceRegexOnce(source, regex, replacement, label) {
  assert(regex.test(source), `Missing stable symbol for ${label}; refusing to patch.`);
  return source.replace(regex, replacement);
}

/*
 * QRE FILE ROLE: RealityGraph construction.
 * AUTHORITY: supplied reality only.
 * ALLOWED: derive explicit, explainable semantic relations.
 * FORBIDDEN: treating shared subject/predicate boilerplate as convergence evidence.
 */

let graph = fs.readFileSync(graphFile, "utf8");

const sharedHelper = `function sharedDistinctiveTokens(a: string, b: string): string[] {
  const left = new Set(contentTokens(a));
  const right = new Set(contentTokens(b));
  return [...left].filter((token) => right.has(token));
}`;

const sharedReplacement = `function sharedDistinctiveTokens(
  a: string,
  b: string,
  blockedTokens: ReadonlySet<string> = new Set(),
): string[] {
  const left = new Set(contentTokens(a));
  const right = new Set(contentTokens(b));
  return [...left].filter((token) => right.has(token) && !blockedTokens.has(token));
}`;

if (graph.includes(sharedHelper)) {
  graph = replaceOnce(graph, sharedHelper, sharedReplacement, "distinct convergence helper");
} else {
  assert(graph.includes("function sharedDistinctiveTokens("), "Missing sharedDistinctiveTokens function; refusing to patch.");
}

const blockedSetup = `  const subjectText = lower(subject ?? "");
  const subjectTokens = new Set(contentTokens(subjectText));
  const blockedConvergenceTokens = subjectTokens;`;

if (!graph.includes(blockedSetup)) {
  graph = replaceOnce(
    graph,
    `  const subjectText = lower(subject ?? "");`,
    `  const subjectText = lower(subject ?? "");
  const subjectTokens = new Set(contentTokens(subjectText));
  const blockedConvergenceTokens = subjectTokens;`,
    "blocked convergence token setup",
  );
}

graph = replaceRegexOnce(
  graph,
  /\n    if \(subjectText && currentText\.includes\(subjectText\)\) \{[\s\S]*?\n    \}\n\n(?=    for \(let j = i \+ 1;)/,
  "\n",
  "remove subject-only event edges",
);

graph = replaceOnce(
  graph,
  `const shared = sharedDistinctiveTokens(current.label, other.label);`,
  `const shared = sharedDistinctiveTokens(
        current.label,
        other.label,
        blockedConvergenceTokens,
      );`,
  "distinct convergence call",
);

fs.writeFileSync(graphFile, graph, "utf8");

/*
 * QRE FILE ROLE: Universal latent-movie search.
 * AUTHORITY: immutable RealityGraph plus author-provided presentation context.
 * ALLOWED: search grounded trajectories and preserve supplied order as presentation seed.
 * FORBIDDEN: inventing chronology or graph relations to make a movie.
 */

let movie = fs.readFileSync(movieFile, "utf8");

if (!movie.includes("function buildOrderedSeedCandidate(")) {
  const orderedHelper = [
    "function buildOrderedSeedCandidate(\n",
    "  graph: RealityGraph,\n",
    "  lens?: string,\n",
    "): LatentMovieCandidate | undefined {\n",
    "  const orderedEvents = graph.events.filter((item) => clean(item.label)).slice(0, 7);\n",
    "  if (orderedEvents.length < 3) return undefined;\n",
    "  const trajectory: LatentMovieTrajectoryStep[] = orderedEvents.map((item, index) => {\n",
    "    const isFirst = index === 0;\n",
    "    const isLast = index === orderedEvents.length - 1;\n",
    "    return {\n",
    "      order: index + 1,\n",
    "      operation: isFirst ? \"establish\" : isLast ? \"payoff\" : \"reveal\",\n",
    "      eventIds: [item.id],\n",
    "      viewerChange: isFirst ? \"Establish the supplied opening.\" : isLast ? \"Land on the supplied endpoint.\" : \"Advance to the next supplied detail.\",\n",
    "      nextQuestion: isLast ? \"What is now true at the supplied ending?\" : \"What should the next supplied detail change?\",\n",
    "    };\n",
    "  });\n",
    "  const evidence = orderedEvents.map((item) => clean(item.label)).filter(Boolean);\n",
    "  const specificity = metric(evidence.reduce((sum, label) => {\n",
    "    const eventId = graph.events.find((item) => item.label === label)?.id ?? \"\";\n",
    "    return sum + eventSpecificity(graph, eventId);\n",
    "  }, 0) / Math.max(1, evidence.length));\n",
    "  const pathLength = metric(Math.min(1, trajectory.length / 5));\n",
    "  return {\n",
    "    id: \"movie-ordered-seed\",\n",
    "    lens: clean(lens) || \"neutral\",\n",
    "    anchorEventIds: [orderedEvents[0].id, orderedEvents[orderedEvents.length - 1].id],\n",
    "    supportingRelationKinds: [],\n",
    "    trajectory,\n",
    "    payoff: clean(orderedEvents[orderedEvents.length - 1]?.label),\n",
    "    unresolvedQuestion: \"What becomes newly meaningful?\",\n",
    "    evidence,\n",
    "    hypothesis: [\n",
    "      \"This seed preserves supplied order as presentation order only.\",\n",
    "      \"Input order is not treated as proof of chronology.\",\n",
    "      \"The Mouth may realize supplied details without inventing a bridge event.\",\n",
    "    ],\n",
    "    truthRisk: 0.02,\n",
    "    novelty: metric(0.45 + specificity * 0.25),\n",
    "    specificity,\n",
    "    informationValue: metric(0.48 + specificity * 0.35),\n",
    "    uncertainty: metric(0.25 + pathLength * 0.2),\n",
    "    attentionPotential: metric(0.38 + pathLength * 0.34),\n",
    "    consequencePotential: metric(0.18 + pathLength * 0.28),\n",
    "    callbackPotential: 0.08,\n",
    "    compressionPotential: metric(0.52 + specificity * 0.2),\n",
    "    repetitionRisk: 0.02,\n",
    "    distinctiveness: 1,\n",
    "    score: metric(0.46 + specificity * 0.24 + pathLength * 0.18),\n",
    "  };\n",
    "}\n\n",
  ].join("");

  movie = replaceOnce(
    movie,
    "export function searchUniversalMovieCandidates(\n",
    `${orderedHelper}export function searchUniversalMovieCandidates(\n`,
    "ordered seed helper insertion",
  );
}

if (!movie.includes("const orderedSeed = buildOrderedSeedCandidate(")) {
  const anchor = "  const exactDeduped =\n";
  const insertion = [
    "  /*\n",
    "   * Sparse memories may have excellent supplied order without graph relations.\n",
    "   * Preserve that order as presentation context only; never infer chronology.\n",
    "   */\n",
    "  if (rawCandidates.length === 0) {\n",
    "    const orderedSeed = buildOrderedSeedCandidate(input.graph, input.lens);\n",
    "    if (orderedSeed) rawCandidates.push(orderedSeed);\n",
    "  }\n\n",
    anchor,
  ].join("");

  movie = replaceOnce(movie, anchor, insertion, "ordered seed fallback insertion");
}

fs.writeFileSync(movieFile, movie, "utf8");

console.log(`Patched ${path.relative(root, graphFile)}`);
console.log(`Patched ${path.relative(root, movieFile)}`);
console.log("QRE sequence foundation fix applied.");
console.log("- subject identity no longer counts as convergence evidence");
console.log("- subject-only event edges are removed");
console.log("- sparse ordered facts can seed a presentation trajectory without inventing chronology");
