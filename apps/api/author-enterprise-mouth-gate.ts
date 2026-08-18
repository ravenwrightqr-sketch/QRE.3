import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import {
  scoreMouthCandidate,
} from "./src/services/authorMouthCandidateSearch.js";

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(
      `ENTERPRISE MOUTH GATE FAILED: ${message}`,
    );
  }
}

function runCase(input: {
  name: string;
  prompt: string;
  subject: string;
  facts: string[];
  moments: string[];
  good: string[];
  bad: string[];
}): void {
  const graph =
    buildAuthorRealityGraph({
      prompt: input.prompt,
      subject: input.subject,
      place: "",
      facts: input.facts,
      sourceMoments:
        input.moments,
      memoryContext: [],
      trajectory: [],
    });

  const envelope =
    buildAuthorRealityEnvelope({
      graph,
      subject: input.subject,
    });

  console.log(`CASE: ${input.name}`);

  for (const line of input.good) {
    const score =
      scoreMouthCandidate({
        text: line,
        beat: {
          order: 1,
          attentionFunction:
            "reframe",
          creativeMove:
            "recontextualization",
          realizationMode:
            "meaning_reframe",
          eventIds:
            graph.events.map(
              (event) =>
                event.id,
            ),
          change: line,
        },
        envelope,
      });

    console.log(
      `  GOOD ${JSON.stringify({ line, score: score.score, inventionRisk: score.inventionRisk })}`,
    );

    assert(
      score.inventionRisk < 0.8,
      `${input.name}: supplied realization scored as invented: ${line}`,
    );
  }

  for (const line of input.bad) {
    const score =
      scoreMouthCandidate({
        text: line,
        beat: {
          order: 1,
          attentionFunction:
            "reframe",
          creativeMove:
            "recontextualization",
          realizationMode:
            "meaning_reframe",
          eventIds: [],
          change: line,
        },
        envelope,
      });

    console.log(
      `  BAD  ${JSON.stringify({ line, score: score.score, inventionRisk: score.inventionRisk })}`,
    );

    assert(
      score.inventionRisk >= 0.45,
      `${input.name}: unsupported realization was not penalized: ${line}`,
    );
  }
}

runCase({
  name: "dog-grooming",
  prompt: "Dog grooming service receipt",
  subject: "Coco",
  facts: [
    "poodle",
    "nervous",
    "fierce",
    "cool",
    "came in nervous",
    "got a bath",
    "stole a blue bow",
    "left looking fabulous",
  ],
  moments: [
    "came in nervous",
    "got a bath",
    "stole a blue bow",
    "left looking fabulous",
  ],
  good: [
    "Still fierce after the bath.",
    "That blue bow mattered.",
  ],
  bad: [
    "Coco barked at the groomer.",
    "The salon scissors flashed.",
  ],
});

runCase({
  name: "wedding",
  prompt: "Wedding memory",
  subject: "Maya and Alex",
  facts: [
    "first dance",
    "exchanged vows",
    "rain started",
    "everyone laughed",
    "left married",
  ],
  moments: [
    "exchanged vows",
    "rain started",
    "everyone laughed",
    "left married",
  ],
  good: [
    "Then the rain started.",
    "They left married.",
  ],
  bad: [
    "The photographer cried.",
    "Champagne spilled everywhere.",
  ],
});

runCase({
  name: "restaurant",
  prompt: "Restaurant service receipt",
  subject: "Table 12",
  facts: [
    "party arrived",
    "ordered pasta",
    "dessert was shared",
    "bill paid",
    "left smiling",
  ],
  moments: [
    "ordered pasta",
    "dessert was shared",
    "bill paid",
    "left smiling",
  ],
  good: [
    "Dessert became the finale.",
    "The bill was paid.",
  ],
  bad: [
    "The chef sang.",
    "The waiter dropped a plate.",
  ],
});

console.log("ENTERPRISE MOUTH GATE: GREEN");
