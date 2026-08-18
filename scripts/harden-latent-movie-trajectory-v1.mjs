import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "apps/api/src/services/authorLatentMovieSearch.ts");
const backup = `${target}.trajectory-v1.bak`;

let source = fs.readFileSync(target, "utf8");

const anchor = `  if (\n    trajectory.length < 3 &&\n    convergence.backwardPath.length\n  ) {`;

if (!source.includes(anchor)) {
  throw new Error("Could not find latent trajectory recovery anchor.");
}

const helperAnchor = `function buildTrajectory(\n`;

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
  "  const existing = new Set(",
  "    trajectory.flatMap((step) => step.eventIds),",
  "  );",
  "",
  "  const candidates: Array<{",
  "    from: string;",
  "    to: string;",
  "    relation: RealityRelation;",
  "    score: number;",
  "  }> = [];",
  "",
  "  for (const relation of graph.relations) {",
  "    if (preferredKind && relation.kind !== preferredKind) continue;",
  "    if (relation.from === endpointId || relation.to === endpointId) continue;",
  "",
  "    const fromKnown = existing.has(relation.from);",
  "    const toKnown = existing.has(relation.to);",
  "    if (fromKnown === toKnown) continue;",
  "",
  "    const from = fromKnown ? relation.from : relation.to;",
  "    const to = fromKnown ? relation.to : relation.from;",
  "",
  "    const priority =",
  '      relation.kind === "contrasts" ? 1 :',
  '      relation.kind === "recontextualizes" ? 0.96 :',
  '      relation.kind === "changes" ? 0.9 :',
  '      relation.kind === "repeats" ? 0.82 :',
  '      relation.kind === "converges" ? 0.72 :',
  '      relation.kind === "before" || relation.kind === "after" ? 0.66 :',
  "      0.5;",
  "",
  "    candidates.push({",
  "      from,",
  "      to,",
  "      relation,",
  "      score: relation.strength * 0.75 + priority * 0.25,",
  "    });",
  "  }",
  "",
  "  return candidates.sort((a, b) => b.score - a.score)[0];",
  "}",
  "",
].join("\n");

if (!source.includes("function chooseIntermediateRelationship(")) {
  if (!source.includes(helperAnchor)) {
    throw new Error("Could not find buildTrajectory helper anchor.");
  }
  source = source.replace(helperAnchor, `${helper}${helperAnchor}`);
}

const recovery = [
  "  // Keep a strong intermediate relationship when convergence otherwise",
  "  // collapses the movie to establish -> payoff. This is structural recovery,",
  "  // not domain-specific story logic.",
  "  if (trajectory.length < 3) {",
  "    const intermediate = chooseIntermediateRelationship(",
  "      graph,",
  "      trajectory,",
  "      endpointId,",
  "      focus,",
  "    ) ?? chooseIntermediateRelationship(",
  "      graph,",
  "      trajectory,",
  "      endpointId,",
  "    );",
  "",
  "    if (intermediate) {",
  "      const from = eventById(graph, intermediate.from);",
  "      const to = eventById(graph, intermediate.to);",
  "",
  "      if (from && to) {",
  '        const payoffIndex = trajectory.findIndex((step) => step.operation === "payoff");',
  "        const insertAt = payoffIndex >= 0 ? payoffIndex : trajectory.length;",
  "",
  "        trajectory.splice(insertAt, 0, {",
  "          order: insertAt + 1,",
  "          operation: operationForRelation(intermediate.relation.kind),",
  "          eventIds: [intermediate.from, intermediate.to],",
  '          viewerChange: `${intermediate.relation.kind}: ${from.label} -> ${to.label}.`,',
  "          nextQuestion:",
  '            intermediate.relation.kind === "contrasts"',
  '              ? "What expectation changes here?"',
  '              : "What does this relationship make newly meaningful?",',
  "        });",
  "",
  "        trajectory.forEach((step, index) => {",
  "          step.order = index + 1;",
  "        });",
  "      }",
  "    }",
  "  }",
  "",
].join("\n");

source = source.replace(anchor, `${recovery}${anchor}`);

fs.writeFileSync(backup, fs.readFileSync(target, "utf8"), "utf8");
fs.writeFileSync(target, source, "utf8");

console.log("Latent movie trajectory hardening applied.");
console.log(`Backup: ${path.relative(root, backup)}`);
