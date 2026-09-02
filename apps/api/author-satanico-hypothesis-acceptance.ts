import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { searchUniversalMovieCandidates } from "./src/services/authorUniversalMovieSearch.js";
import { discoverSatanicoInferenceOpportunities } from "./src/services/authorSatanicoEvidenceSearch.js";
import { rankSatanicoHypotheses } from "./src/services/authorSatanicoHypothesis.js";

const cases = [
  {
    name: "PERSON",
    subject: "Mara",
    facts: [
      "Mara started nervous.",
      "Mara always chose the same red notebook.",
      "Mara took the notebook to every meeting.",
      "The room changed completely over the year.",
      "The red notebook was still there at the end.",
    ],
  },
  {
    name: "PLACE",
    subject: "Harbor table",
    facts: [
      "The Harbor table was empty at first.",
      "The restaurant changed its chairs.",
      "The menu changed twice.",
      "The Harbor table stayed by the window.",
      "Years later the Harbor table was still there.",
    ],
  },
  {
    name: "OBJECT",
    subject: "blue surfboard",
    facts: [
      "The blue surfboard was bought first.",
      "The blue surfboard was taken to three beaches.",
      "The owner broke an arm.",
      "The owner returned to the water.",
      "The blue surfboard was still in the garage.",
    ],
  },
];

const winnerKinds = new Set<string>();

for (const test of cases) {
  const graph = buildAuthorRealityGraph({
    prompt: "Find the strongest latent relationship without inventing facts.",
    subject: test.subject,
    facts: test.facts,
    sourceMoments: test.facts,
  });

  const candidates = searchUniversalMovieCandidates({
    graph,
    subject: test.subject,
    lens: "NONE",
    limit: 4,
  });

  const candidate = candidates[0];
  if (!candidate) throw new Error(`Satanico hypothesis acceptance failed: ${test.name} produced no candidate`);

  const hypotheses = rankSatanicoHypotheses(
    graph,
    candidate,
    discoverSatanicoInferenceOpportunities(graph, 64),
  );

  if (hypotheses.length < 2) throw new Error(`Satanico hypothesis acceptance failed: ${test.name} produced fewer than two competing hypotheses`);
  if (!hypotheses[0]!.evidenceEventIds.length) throw new Error(`Satanico hypothesis acceptance failed: ${test.name} winner has no evidence`);
  if (hypotheses[0]!.unsupportedAssumptionRisk > 0.55) throw new Error(`Satanico hypothesis acceptance failed: ${test.name} winner is assumption-heavy`);

  const distinctKinds = new Set(hypotheses.slice(0, 4).map((hypothesis) => hypothesis.kind));
  if (distinctKinds.size < 2) throw new Error(`Satanico hypothesis acceptance failed: ${test.name} top hypotheses collapse to one mechanism`);

  const winnerIds = new Set(hypotheses[0]!.evidenceEventIds);
  const runnerOverlap = hypotheses.slice(1, 4).map((hypothesis) => {
    const overlap = hypothesis.evidenceEventIds.filter((id) => winnerIds.has(id)).length;
    return overlap / Math.max(1, Math.min(winnerIds.size, hypothesis.evidenceEventIds.length));
  });
  const maxRunnerOverlap = Math.max(0, ...runnerOverlap);
  if (maxRunnerOverlap > 0.94 && distinctKinds.size < 3) {
    throw new Error(`Satanico hypothesis acceptance failed: ${test.name} top hypotheses are evidence-clones`);
  }

  winnerKinds.add(hypotheses[0]!.kind);

  console.log(`CASE=${test.name}`);
  console.log(`CANDIDATES=${candidates.length}`);
  console.log(`HYPOTHESES=${hypotheses.length}`);
  console.log(`TOP_KINDS=${[...distinctKinds].join(",")}`);
  console.log(`WINNER=${hypotheses[0]!.kind}`);
  console.log(`WINNER_SCORE=${hypotheses[0]!.score}`);
  console.log(`OBSERVER_GAP=${hypotheses[0]!.observerGap}`);
  console.log(`ASSUMPTION_RISK=${hypotheses[0]!.unsupportedAssumptionRisk}`);
  console.log(`COUNTER_EVIDENCE=${hypotheses[0]!.counterEvidence}`);
  console.log(`RUNNER_OVERLAP=${maxRunnerOverlap.toFixed(3)}`);
}

if (winnerKinds.size < 2) {
  throw new Error(`Satanico hypothesis acceptance failed: universal suite has one dominant hypothesis kind (${[...winnerKinds].join(",")})`);
}

console.log("QRE SATANICO HYPOTHESIS ACCEPTANCE · PASS");
console.log("UNIVERSAL=person/place/object");
console.log("COMPETITION=multiple latent hypotheses");
console.log("GROUNDING=evidence-backed");
console.log("DISTINCTION=top hypotheses are not evidence-clones");
console.log("OBSERVER_GAP=ranked");
