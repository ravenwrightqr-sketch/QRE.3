import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorLatentMovieSearch.ts");
const backup = `${target}.trajectory-v2.bak`;

let source = fs.readFileSync(target, "utf8");

const buildStart = "function buildTrajectory(";
const returnMarker = "  return trajectory.slice(0, 6);";
const functionEndMarker = "}\n\nfunction candidateScore";

const buildIndex = source.indexOf(buildStart);
if (buildIndex < 0) {
  throw new Error("Could not locate buildTrajectory function.");
}

if (!source.includes("function chooseIntermediateRelationship(")) {
  const helper = [
    "function chooseIntermediateRelationship(",
    "  graph: RealityGraph,",
    "  trajectory: readonly LatentMovieTrajectoryStep[],",
    "  endpointId: string,",
    "  preferredKind?: RealityRelation[\"kind\"],",
    "): {",
    "  from: string;",
    "  to: string;",
    "  relation: RealityRelation;",
    "} | undefined {",
    "  const existing = new Set(trajectory.flatMap((step) => step.eventIds));",
    "  const priority = (kind: RealityRelation[\"kind\"]): number => {",
    "    switch (kind) {",
    "      case \"contrasts\": return 1;",
    "      case \"recontextualizes\": return 0.96;",
    "      case \"changes\": return 0.9;",
    "      case \"repeats\": return 0.82;",
    "      case \"converges\": return 0.72;",
    "      case \"before\":",
    "      case \"after\": return 0.66;",
    "      default: return 0.5;",
    "    }",
    "  };",
    "  const candidates: Array<{ from: string; to: string; relation: RealityRelation; score: number }> = [];",
    "  for (const relation of graph.relations) {",
    "    if (preferredKind && relation.kind !== preferredKind) continue;",
    "    if (relation.from === endpointId || relation.to === endpointId) continue;",
    "    const fromKnown = existing.has(relation.from);",
    "    const toKnown = existing.has(relation.to);",
    "    if (fromKnown === toKnown) continue;",
    "    const from = fromKnown ? relation.from : relation.to;",
    "    const to = fromKnown ? relation.to : relation.from;",
    "    candidates.push({ from, to, relation, score: relation.strength * 0.75 + priority(relation.kind) * 0.25 });",
    "  }",
    "  return candidates.sort((a, b) => b.score - a.score)[0];",
    "}",
    "",
  ].join("\n");
  source = source.slice(0, buildIndex) + helper + source.slice(buildIndex);
}

const freshBuildIndex = source.indexOf(buildStart);
const returnIndex = source.indexOf(returnMarker, freshBuildIndex);
if (returnIndex < 0) {
  throw new Error("Could not locate buildTrajectory return marker.");
}

const recovery = [
  "",
  "  // Prevent a rich evidence graph from collapsing into establish -> payoff",
  "  // when a strong intermediate relationship is already supported by reality.",
  "  if (trajectory.length < 3 && trajectory.some((step) => step.operation === \"payoff\")) {",
  "    const intermediate =",
  "      chooseIntermediateRelationship(graph, trajectory, endpointId, focus) ??",
  "      chooseIntermediateRelationship(graph, trajectory, endpointId);",
  "",
  "    if (intermediate) {",
  "      const from = eventById(graph, intermediate.from);",
  "      const to = eventById(graph, intermediate.to);",
  "      const payoffIndex = trajectory.findIndex((step) => step.operation === \"payoff\");",
  "",
  "      if (from && to && payoffIndex >= 0) {",
  "        trajectory.splice(payoffIndex, 0, {",
  "          order: payoffIndex + 1,",
  "          operation: operationForRelation(intermediate.relation.kind),",
  "          eventIds: [intermediate.from, intermediate.to],",
  "          viewerChange: intermediate.relation.kind + \": \" + from.label + \" -> \" + to.label + \".",
  "          nextQuestion:",
  "            intermediate.relation.kind === \"contrasts\"",
  "              ? \"What expectation changes here?\"",
  "              : \"What does this relationship make newly meaningful?\",",
  "        });",
  "        trajectory.forEach((step, index) => {",
  "          step.order = index + 1;",
  "        });",
  "      }",
  "    }",
  "  }",
].join("\n");

source = source.slice(0, returnIndex) + recovery + "\n" + source.slice(returnIndex);

fs.writeFileSync(backup, fs.readFileSync(target, "utf8"), "utf8");
fs.writeFileSync(target, source, "utf8");

console.log("Latent movie trajectory hardening applied.");
console.log(`Backup: ${path.relative(root, backup)}`);
