import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { satanicoSubsetDiagnostics, searchSatanicoEvidenceSubsets } from "./src/services/authorSatanicoEvidenceSearch.js";

const graph = buildAuthorRealityGraph({
  prompt: "A house was emptied, renovated, and lived in again",
  subject: "the house",
  place: "",
  facts: [
    "The house was empty.",
    "The kitchen was painted green.",
    "Everything changed during the move.",
    "The old table remained.",
    "There were boxes everywhere.",
    "The first dinner happened at the old table.",
  ],
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
});

const subsets = searchSatanicoEvidenceSubsets(graph, 8);
const diagnostics = satanicoSubsetDiagnostics(graph, subsets);

console.log("SATANICO EVIDENCE-SUBSET SEARCH");
for (const item of diagnostics) {
  console.log(`score=${item.relationshipScore.toFixed(3)} span=${item.span.toFixed(3)}`);
  console.log(`  ${item.labels.join(" → ")}`);
}

const tableWords = ["table", "dinner", "changed", "move"];
const best = diagnostics[0];
const bestText = best?.labels.join(" ").toLowerCase() ?? "";
const containsTableThread = bestText.includes("table") && bestText.includes("dinner");
const containsChange = bestText.includes("changed") || bestText.includes("move");

if (!best || !containsTableThread || !containsChange) {
  throw new Error("Satanico evidence subset did not surface the persistent-table relationship");
}

void tableWords;
console.log("SATANICO EVIDENCE-SUBSET ACCEPTANCE · PASS");
