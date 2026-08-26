import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const graphFile = path.join(root, "apps/api/src/services/authorRealityGraph.ts");
const movieFile = path.join(root, "apps/api/src/services/authorUniversalMovieSearch.ts");

function replaceOnce(file, source, from, to, label) {
  if (!source.includes(from)) {
    if (source.includes(to)) {
      console.log(`Already applied: ${label}`);
      return source;
    }
    throw new Error(`Missing expected block for ${label}; refusing to patch ${file}`);
  }
  return source.replace(from, to);
}

let graph = fs.readFileSync(graphFile, "utf8");

graph = replaceOnce(
  graph,
  graph,
  `function sharedDistinctiveTokens(a: string, b: string): string[] {\n  const left = new Set(contentTokens(a));\n  const right = new Set(contentTokens(b));\n  return [...left].filter((token) => right.has(token));\n}\n\nfunction specificityScore(event: RealityEvent): number {`,
  `function sharedDistinctiveTokens(\n  a: string,\n  b: string,\n  blockedTokens: ReadonlySet<string> = new Set(),\n): string[] {\n  const left = new Set(contentTokens(a));\n  const right = new Set(contentTokens(b));\n  return [...left].filter((token) => right.has(token) && !blockedTokens.has(token));\n}\n\nfunction sharedTokenFrequency(events: readonly RealityEvent[]): Map<string, number> {\n  const frequency = new Map<string, number>();\n  for (const item of events) {\n    for (const token of new Set(contentTokens(item.label))) {\n      frequency.set(token, (frequency.get(token) ?? 0) + 1);\n    }\n  }\n  return frequency;\n}\n\nfunction specificityScore(event: RealityEvent): number {`,
  "distinct token helper",
);

graph = replaceOnce(
  graph,
  graph,
  `function buildRelationships(events: RealityEvent[], subject?: string): RealityRelation[] {\n  const relations: RealityRelation[] = [];\n  const subjectText = lower(subject ?? "");`,
  `function buildRelationships(events: RealityEvent[], subject?: string): RealityRelation[] {\n  const relations: RealityRelation[] = [];\n  const subjectText = lower(subject ?? "");\n  const subjectTokens = new Set(contentTokens(subjectText));\n  const tokenFrequency = sharedTokenFrequency(events);\n  const commonTokens = new Set(\n    [...tokenFrequency.entries()]\n      .filter(([, count]) => count >= Math.max(2, Math.ceil(events.length * 0.5)))\n      .map(([token]) => token),\n  );\n  const blockedConvergenceTokens = new Set([\n    ...subjectTokens,\n    ...commonTokens,\n  ]);`,
  "blocked lexical convergence",
);

graph = replaceOnce(
  graph,
  graph,
  `    if (subjectText && currentText.includes(subjectText)) {\n      for (let j = 0; j < events.length; j += 1) {\n        if (i === j) continue;\n        if (lower(events[j].label).includes(subjectText)) addRelation(relations, current.id, events[j].id, "involves", 0.62);\n      }\n    }\n\n`,
  "",
  "remove subject-to-subject event involves edges",
);

graph = replaceOnce(
  graph,
  graph,
  `      const shared = sharedDistinctiveTokens(current.label, other.label);`,
  `      const shared = sharedDistinctiveTokens(\n        current.label,\n        other.label,\n        blockedConvergenceTokens,\n      );`,
  "distinct convergence relation",
);

fs.writeFileSync(graphFile, graph, "utf8");

let movie = fs.readFileSync(movieFile, "utf8");

const orderedHelper = [
  "function buildOrderedSeedCandidate(\n",
  "  graph: RealityGraph,\n",
  "  lens?: string,\n",
  "): LatentMovieCandidate | undefined {\n",
  "  const orderedEvents = graph.events\n",
  "    .filter((item) => clean(item.label))\n",
  "    .slice(0, 7);\n",
  "\n",
  "  if (orderedEvents.length < 3) return undefined;\n",
  "\n",
  "  const trajectory: LatentMovieTrajectoryStep[] = orderedEvents.map((item, index) => {\n",
  "    const isFirst = index === 0;\n",
  "    const isLast = index === orderedEvents.length - 1;\n",
  "    return {\n",
  "      order: index + 1,\n",
  "      operation: isFirst ? \"establish\" : isLast ? \"payoff\" : \"reveal\",\n",
  "      eventIds: [item.id],\n",
  "      viewerChange: isFirst\n",
  "        ? `Establish supplied opening: ${item.label}.`\n",
  "        : isLast\n",
  "          ? `Land on the supplied endpoint: ${item.label}.`\n",
  "          : `Advance to the next supplied detail: ${item.label}.`,\n",
  "      nextQuestion: isLast\n",
  "        ? \"What is now true at the supplied ending?\"\n",
  "        : \"What should the next supplied detail change?\",\n",
  "    };\n",
  "  });\n",
  "\n",
  "  const evidence = orderedEvents.map((item) => clean(item.label)).filter(Boolean);\n",
  "  const specificity = metric(\n",
  "    evidence.reduce((sum, label) => {\n",
  "      const eventId = graph.events.find((item) => item.label === label)?.id ?? \"\";\n",
  "      return sum + eventSpecificity(graph, eventId);\n",
  "    }, 0) / Math.max(1, evidence.length),\n",
  "  );\n",
  "  const pathLength = metric(Math.min(1, trajectory.length / 5));\n",
  "\n",
  "  return {\n",
  "    id: \"movie-ordered-seed\",\n",
  "    lens: clean(lens) || \"neutral\",\n",
  "    anchorEventIds: orderedEvents.length >= 2\n",
  "      ? [orderedEvents[0].id, orderedEvents[orderedEvents.length - 1].id]\n",
  "      : [orderedEvents[0].id],\n",
  "    supportingRelationKinds: [],\n",
  "    trajectory,\n",
  "    payoff: clean(orderedEvents[orderedEvents.length - 1]?.label),\n",
  "    unresolvedQuestion: \"What becomes newly meaningful?\",\n",
  "    evidence,\n",
  "    hypothesis: [\n",
  "      \"This seed preserves supplied order as presentation order only.\",\n",
  "      \"Input order is not treated as proof of chronology.\",\n",
  "      \"The Mouth may realize the ordered supplied details without inventing a bridge event.\",\n",
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
  movie,
  `export function searchUniversalMovieCandidates(\n`,
  orderedHelper + `export function searchUniversalMovieCandidates(\n`,
  "ordered seed helper",
);

const insertionAnchor = `  /*\n   * Exact graph-path duplicates are never allowed.\n`;
const orderedInsertion = `  /*\n   * Sparse first memories may contain excellent authored order but no semantic relation edge.\n   * Preserve that order as a presentation seed without inventing chronology or a graph relation.\n   */\n  if (rawCandidates.length === 0) {\n    const orderedSeed = buildOrderedSeedCandidate(\n      input.graph,\n      input.lens,\n    );\n    if (orderedSeed) rawCandidates.push(orderedSeed);\n  }\n\n${insertionAnchor}`;

movie = replaceOnce(
  movie,
  movie,
  insertionAnchor,
  orderedInsertion,
  "ordered seed fallback",
);

fs.writeFileSync(movieFile, movie, "utf8");

console.log(`Patched ${path.relative(root, graphFile)}`);
console.log(`Patched ${path.relative(root, movieFile)}`);
console.log("QRE sequence foundation fix applied: common lexical tokens no longer create convergence, subject-only edges removed, sparse ordered facts get a non-chronological seed trajectory.");
