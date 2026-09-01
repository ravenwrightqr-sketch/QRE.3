import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { rankLensOpportunities } from "./src/services/authorCharacterLensEngine.js";

const CANONICAL_FRAMES = new Set([
  "comedy",
  "romance",
  "horror",
  "tenderness",
  "nostalgia",
  "chaos",
  "fierce",
  "absurd",
  "dramatic",
  "quiet",
  "game",
  "spy",
  "heist",
  "courtroom",
  "noir",
  "documentary",
  "mockumentary",
  "military",
  "western",
  "detective",
  "thriller",
  "survival",
  "expedition",
  "royal",
  "competition",
  "procedural",
  "fairytale",
  "deadpan",
  "service",
  "hospitality",
  "craft",
  "concierge",
  "ritual",
  "transformation",
  "NONE",
]);

const ENTERPRISE_LENSES = new Set([
  "service",
  "hospitality",
  "craft",
  "concierge",
  "ritual",
  "transformation",
]);

type Fixture = {
  name: string;
  subject: string;
  facts: string[];
};

const fixtures: Fixture[] = [
  {
    name: "pet service",
    subject: "Coco",
    facts: [
      "Coco arrived nervous",
      "grooming started",
      "the bows were approved",
      "the mirror approved",
      "Coco left fabulous",
      "Coco returned again",
    ],
  },
  {
    name: "hotel stay",
    subject: "Maria",
    facts: [
      "Maria arrived at the hotel",
      "the room was quiet",
      "the host welcomed Maria",
      "breakfast was ready",
      "Maria returned the next morning",
      "Maria checked out",
    ],
  },
  {
    name: "repair shop",
    subject: "Watch",
    facts: [
      "the watch arrived broken",
      "the case was opened",
      "the movement was repaired",
      "the watch was tested",
      "the watch left working",
      "the customer returned later",
    ],
  },
  {
    name: "concierge",
    subject: "Daniel",
    facts: [
      "Daniel asked for a table",
      "the reservation was arranged",
      "the hotel confirmed the room",
      "the itinerary was updated",
      "access was ready",
      "Daniel left with the keys",
    ],
  },
  {
    name: "salon routine",
    subject: "Avery",
    facts: [
      "Avery arrived for an appointment",
      "the same stylist worked with Avery",
      "the haircut started",
      "the finish looked sharp",
      "Avery returned weekly",
      "the appointment was finished",
    ],
  },
  {
    name: "custom maker",
    subject: "Table",
    facts: [
      "the wood was selected",
      "the boards were cut",
      "the joints were shaped",
      "the surface was polished",
      "the table was finished",
      "the table was delivered",
    ],
  },
];

const results = fixtures.map((fixture) => {
  const graph = buildAuthorRealityGraph({
    prompt: "Find the strongest creative treatment in this supplied reality.",
    subject: fixture.subject,
    facts: fixture.facts,
    sourceMoments: fixture.facts,
  });

  const envelope = buildAuthorRealityEnvelope({
    graph,
    subject: fixture.subject,
  });

  const ranking = rankLensOpportunities(envelope);
  const winner = ranking[0];
  const topEight = ranking.slice(0, 8);
  const enterpriseFrames = topEight.filter((item) => ENTERPRISE_LENSES.has(item.frame));

  if (!winner) {
    throw new Error(`UNIVERSAL LENS ACCEPTANCE FAILED: ${fixture.name} returned no lens opportunity`);
  }

  if (!CANONICAL_FRAMES.has(winner.frame)) {
    throw new Error(`UNIVERSAL LENS ACCEPTANCE FAILED: ${fixture.name} returned non-canonical frame ${winner.frame}`);
  }

  if (winner.confidence < 0.25) {
    throw new Error(
      `UNIVERSAL LENS ACCEPTANCE FAILED: ${fixture.name} winner ${winner.frame} confidence ${winner.confidence} is too weak`,
    );
  }

  const sourceLabels = fixture.facts;
  const graphLabels = graph.events.map((event) => event.label);
  if (graphLabels.join("|") !== sourceLabels.join("|")) {
    throw new Error(`UNIVERSAL LENS ACCEPTANCE FAILED: ${fixture.name} reality labels changed`);
  }

  return {
    fixture: fixture.name,
    winner: winner.frame,
    confidence: winner.confidence,
    topThree: topEight.slice(0, 3),
    enterpriseFrames,
    relationKinds: [...new Set(envelope.relations.map((relation) => relation.kind))],
    recurringSignals: envelope.recurringSignals,
    truthEvents: graph.events.length,
  };
});

const distinctWinners = new Set(results.map((result) => result.winner));
if (distinctWinners.size < 3) {
  throw new Error(
    `UNIVERSAL LENS ACCEPTANCE FAILED: only ${distinctWinners.size} distinct winning frames across ${fixtures.length} unrelated realities`,
  );
}

console.log("=".repeat(72));
console.log("QRE AUTHOR UNIVERSAL LENS ACCEPTANCE · RAW REALITY / AUTO TREATMENT");
console.log("=".repeat(72));

for (const result of results) {
  console.log(`\n--- ${result.fixture.toUpperCase()} ---`);
  console.log(`WINNER: ${result.winner}`);
  console.log(`CONFIDENCE: ${result.confidence}`);
  console.log(`TOP 3: ${result.topThree.map((item) => `${item.frame}:${item.confidence}`).join(" | ")}`);
  console.log(`ENTERPRISE TOP 8: ${result.enterpriseFrames.map((item) => `${item.frame}:${item.confidence}`).join(" | ") || "none"}`);
  console.log(`RELATIONS: ${result.relationKinds.join(", ") || "none"}`);
  console.log(`RECURRING: ${result.recurringSignals.join(" | ") || "none"}`);
  console.log(`TRUTH EVENTS: ${result.truthEvents}`);
}

console.log("\nSTATUS: ACCEPTED");
console.log(`DISTINCT WINNERS: ${distinctWinners.size}`);
console.log("LENS PATH: supplied reality -> RealityGraph -> RealityEnvelope -> universal lens ranking");
