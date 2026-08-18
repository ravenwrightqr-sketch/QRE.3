import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const brainPath = path.join(root, "apps/api/src/services/authorBrainUniversal.ts");
const thesisPath = path.join(root, "apps/api/src/services/authorLatentStoryThesis.ts");

function backup(pathname, suffix) {
  const backupPath = `${pathname}.${suffix}.bak`;
  fs.copyFileSync(pathname, backupPath);
  return backupPath;
}

function repairBrain() {
  let source = fs.readFileSync(brainPath, "utf8");
  const original = source;

  const replacements = [
    ["Coco got a bath", "the supplied event"],
    ["Coco stole a blue bow", "the supplied concrete detail"],
    ["'Coco got a bath'", "a supplied event"],
    ["'Coco stole a blue bow'", "a supplied concrete detail"],
    ["\"Coco got a bath\"", "\"a supplied event\""],
    ["\"Coco stole a blue bow\"", "\"a supplied concrete detail\""],
  ];

  for (const [from, to] of replacements) {
    source = source.split(from).join(to);
  }

  if (source === original) return false;

  const backupPath = backup(brainPath, "canonical-regression-repair");
  fs.writeFileSync(brainPath, source, "utf8");
  console.log(`REPAIRED authorBrainUniversal.ts`);
  console.log(`BACKUP ${path.relative(root, backupPath)}`);
  return true;
}

function repairThesis() {
  let source = fs.readFileSync(thesisPath, "utf8");
  const startMarker = "function chooseSealingIds(";
  const endMarker = "function buildPayoffDependency(";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start < 0 || end < 0 || end <= start) {
    throw new Error("PATCH MISS [authorLatentStoryThesis.ts] chooseSealingIds boundaries.");
  }

  const replacement = [
    "function chooseSealingIds(",
    "  graph: RealityGraph,",
    "  turn:",
    "    | {",
    "        step: LatentMovieTrajectoryStep;",
    "        index: number;",
    "        relation: RealityRelation;",
    "      }",
    "    | undefined,",
    "  carriers: readonly string[],",
    "  candidate: LatentMovieCandidate,",
    "): string[] {",
    "  if (!turn) return [];",
    "",
    "  const carrierSet = new Set(carriers);",
    "  const endpoint = endpointId(candidate);",
    "  const candidates: Array<{ id: string; score: number }> = [];",
    "  const pushCandidate = (id: string, score: number) => {",
    "    if (!id || carrierSet.has(id) || id === endpoint) return;",
    "    if (!candidates.some((item) => item.id === id)) candidates.push({ id, score });",
    "  };",
    "",
    "  // Prefer evidence that appears after the turn in the selected trajectory.",
    "  for (let index = turn.index + 1; index < candidate.trajectory.length; index += 1) {",
    "    const step = candidate.trajectory[index];",
    "    for (const id of step.eventIds) {",
    "      const carrierRelation = carriers.some((carrier) => Boolean(relationBetween(graph, carrier, id)));",
    "      pushCandidate(",
    "        id,",
    "        (step.operation === \"payoff\" ? 0.2 : 0.7) + (carrierRelation ? 0.3 : 0),",
    "      );",
    "    }",
    "  }",
    "",
    "  // When the selected trajectory is only establish -> turn -> payoff,",
    "  // recover a distinct sealing event from source evidence instead of failing the thesis.",
    "  if (!candidates.length) {",
    "    const trajectoryIds = new Set(candidate.trajectory.flatMap((step) => step.eventIds));",
    "    for (const relation of graph.relations) {",
    "      const touchesCarrier = carriers.some((carrier) => relation.from === carrier || relation.to === carrier);",
    "      if (!touchesCarrier) continue;",
    "",
    "      const otherId = carriers.includes(relation.from) ? relation.to : relation.from;",
    "      if (trajectoryIds.has(otherId) || otherId === endpoint) continue;",
    "",
    "      pushCandidate(otherId, relation.strength * 0.75 + relationPriority(relation.kind) * 0.25);",
    "    }",
    "  }",
    "",
    "  return candidates",
    "    .sort((a, b) => b.score - a.score)",
    "    .map((item) => item.id)",
    "    .slice(0, 2);",
    "}",
    "",
  ].join("\n");

  const updated = `${source.slice(0, start)}${replacement}${source.slice(end)}`;
  const backupPath = backup(thesisPath, "canonical-regression-repair");
  fs.writeFileSync(thesisPath, updated, "utf8");
  console.log(`REPAIRED authorLatentStoryThesis.ts`);
  console.log(`BACKUP ${path.relative(root, backupPath)}`);
}

repairBrain();
repairThesis();
console.log("Canonical author regression repair applied.");
console.log("- universal author examples removed from live source/prompt text");
console.log("- latent thesis sealing recovery restored for short trajectories");
