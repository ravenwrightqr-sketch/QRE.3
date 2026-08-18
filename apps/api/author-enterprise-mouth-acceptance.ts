import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { searchLatentMovieCandidates } from "./src/services/authorLatentMovieSearch.js";
import { realizeEnterpriseMouth } from "./src/services/authorEnterpriseMouth.js";

const prompt = process.argv[2] ?? "Dog grooming service receipt";
const subject = process.argv[3] ?? "Coco";
const facts = (process.argv[4] ?? "poodle|nervous|fierce|cool|came in nervous|got a bath|stole a blue bow|left looking fabulous")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);
const moments = (process.argv[5] ?? "came in nervous|got a bath|stole a blue bow|left looking fabulous")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);

const graph = buildAuthorRealityGraph({
  prompt,
  subject,
  place: "",
  facts,
  sourceMoments: moments,
  memoryContext: [],
  trajectory: [],
});

const movie = searchLatentMovieCandidates({
  graph,
  subject,
  limit: 1,
})[0];

if (!movie) {
  throw new Error("ENTERPRISE MOUTH ACCEPTANCE FAILED: no latent movie candidate");
}

const labelFor = (id: string): string =>
  graph.events.find((event) => event.id === id)?.label ?? id;

const beats = movie.trajectory.map((step) => ({
  order: step.order,
  role:
    step.operation === "establish"
      ? "arrival"
      : step.operation === "payoff"
        ? "payoff"
        : step.operation === "escalate"
          ? "escalation"
          : "reframe",
  attentionFunction:
    step.operation === "establish"
      ? "hook"
      : step.operation === "payoff"
        ? "payoff"
        : step.operation === "escalate"
          ? "escalation"
          : step.operation === "contrast"
            ? "reframe"
            : "turn",
  creativeMove:
    step.operation === "contrast"
      ? "contrast"
      : step.operation === "reframe"
        ? "recontextualization"
        : step.operation === "recur"
          ? "callback"
          : "none",
  realizationMode:
    step.operation === "establish"
      ? "direct_grounded_realization"
      : step.operation === "payoff"
        ? "payoff_compression"
        : step.operation === "contrast"
          ? "semantic_contrast"
          : step.operation === "reframe"
            ? "meaning_reframe"
            : "meaning_turn",
  eventIds: [...step.eventIds],
  change: step.viewerChange,
  next: step.nextQuestion,
  frontier: step.nextQuestion,
  setsUp: step.eventIds.map(labelFor),
  paysOff:
    step.operation === "payoff"
      ? [movie.payoff]
      : [],
}));

console.log("=".repeat(80));
console.log("QRE ENTERPRISE MOUTH ACCEPTANCE");
console.log("REALITY → MOVIE → ENVELOPE → CANDIDATES → BEAM → SELECTED");
console.log("=".repeat(80));
console.log(`PROMPT: ${prompt}`);
console.log(`SUBJECT: ${subject}`);
console.log(`FACTS: ${facts.join(" | ")}`);
console.log(`MOMENTS: ${moments.join(" | ")}`);
console.log(`MOVIE: ${movie.id} · ${movie.lens}`);
console.log("=".repeat(80));

const result = await realizeEnterpriseMouth({
  graph,
  subject,
  lens: movie.lens,
  beats,
});

console.log("\n--- REALITY ENVELOPE ---");
console.log(JSON.stringify(result.envelope, null, 2));

console.log("\n--- RAW CANDIDATE MODEL ---");
console.log(result.rawModelText);

console.log("\n--- SELECTED SEQUENCE ---");
result.candidates.forEach((candidate) => {
  console.log(
    `[${candidate.beatOrder}] ${candidate.text}`,
    `score=${candidate.score}`,
    `grounding=${candidate.groundingScore}`,
    `meaning=${candidate.meaningScore}`,
    `cohesion=${candidate.cohesionScore}`,
    `novelty=${candidate.noveltyScore}`,
    `compression=${candidate.compressionScore}`,
    `invention=${candidate.inventionRisk}`,
    `repetition=${candidate.repetitionRisk}`,
  );
});

console.log("\n--- BEAM ---");
console.log(JSON.stringify({
  texts: result.texts,
  beamScore: result.beamScore,
}, null, 2));

if (
  result.texts.length !== beats.length ||
  result.texts.some((text) => !text)
) {
  throw new Error("ENTERPRISE MOUTH ACCEPTANCE FAILED: incomplete realization");
}

console.log("\nENTERPRISE MOUTH ACCEPTANCE: PASS");
