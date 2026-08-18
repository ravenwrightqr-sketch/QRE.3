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

const helper = `function chooseIntermediateRelationship(\n  graph: RealityGraph,\n  trajectory: readonly LatentMovieTrajectoryStep[],\n  endpointId: string,\n  preferredKind?: RealityRelation["kind"],\n): {\n  from: string;\n  to: string;\n  relation: RealityRelation;\n} | undefined {\n  const existing = new Set(\n    trajectory.flatMap((step) => step.eventIds),\n  );\n\n  const candidates: Array<{\n    from: string;\n    to: string;\n    relation: RealityRelation;\n    score: number;\n  }> = [];\n\n  for (const relation of graph.relations) {\n    if (preferredKind && relation.kind !== preferredKind) continue;\n    if (relation.from === endpointId || relation.to === endpointId) continue;\n\n    const fromKnown = existing.has(relation.from);\n    const toKnown = existing.has(relation.to);\n    if (fromKnown === toKnown) continue;\n\n    const from = fromKnown ? relation.from : relation.to;\n    const to = fromKnown ? relation.to : relation.from;\n\n    const priority =\n      relation.kind === "contrasts" ? 1 :\n      relation.kind === "recontextualizes" ? 0.96 :\n      relation.kind === "changes" ? 0.9 :\n      relation.kind === "repeats" ? 0.82 :\n      relation.kind === "converges" ? 0.72 :\n      relation.kind === "before" || relation.kind === "after" ? 0.66 :\n      0.5;\n\n    candidates.push({\n      from,\n      to,\n      relation,\n      score: relation.strength * 0.75 + priority * 0.25,\n    });\n  }\n\n  return candidates.sort((a, b) => b.score - a.score)[0];\n}\n\n`;

if (!source.includes("function chooseIntermediateRelationship(")) {
  if (!source.includes(helperAnchor)) {
    throw new Error("Could not find buildTrajectory helper anchor.");
  }
  source = source.replace(helperAnchor, helper + helperAnchor);
}

const recovery = `  // Keep a strong intermediate relationship when convergence otherwise\n  // collapses the movie to establish -> payoff. This is structural recovery,\n  // not domain-specific story logic.\n  if (trajectory.length < 3) {\n    const intermediate = chooseIntermediateRelationship(\n      graph,\n      trajectory,\n      endpointId,\n      focus,\n    ) ?? chooseIntermediateRelationship(\n      graph,\n      trajectory,\n      endpointId,\n    );\n\n    if (intermediate) {\n      const from = eventById(graph, intermediate.from);\n      const to = eventById(graph, intermediate.to);\n\n      if (from && to) {\n        const payoffIndex = trajectory.findIndex((step) => step.operation === "payoff");\n        const insertAt = payoffIndex >= 0 ? payoffIndex : trajectory.length;\n\n        trajectory.splice(insertAt, 0, {\n          order: insertAt + 1,\n          operation: operationForRelation(intermediate.relation.kind),\n          eventIds: [intermediate.from, intermediate.to],\n          viewerChange: `${intermediate.relation.kind}: ${from.label} -> ${to.label}.`,\n          nextQuestion:\n            intermediate.relation.kind === "contrasts"\n              ? "What expectation changes here?"\n              : "What does this relationship make newly meaningful?",\n        });\n\n        trajectory.forEach((step, index) => {\n          step.order = index + 1;\n        });\n      }\n    }\n  }\n\n${anchor}`;

source = source.replace(anchor, recovery);

fs.writeFileSync(backup, fs.readFileSync(target, "utf8"), "utf8");
fs.writeFileSync(target, source, "utf8");

console.log("Latent movie trajectory hardening applied.");
console.log(`Backup: ${path.relative(root, backup)}`);
