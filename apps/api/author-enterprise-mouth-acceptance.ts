import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { realizeEnterpriseMouth } from "./src/services/authorEnterpriseMouth.js";

const prompt = process.argv[2] ?? "Dog grooming service receipt";
const subject = process.argv[3] ?? "Coco";
const facts = (process.argv[4] ?? "poodle,nervous,fierce,cool,came in nervous,got a bath,stole a blue bow,left looking fabulous")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);
const moments = (process.argv[5] ?? "came in nervous,got a bath,stole a blue bow,left looking fabulous")
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

const beats = graph.events.map((event, index) => ({
  order: index + 1,
  role: index === 0 ? "arrival" : index === graph.events.length - 1 ? "payoff" : "reframe",
  attentionFunction: index === 0 ? "hook" : index === graph.events.length - 1 ? "payoff" : "reframe",
  creativeMove: index === graph.events.length - 1 ? "recontextualization" : "contrast",
  realizationMode: index === 0 ? "direct_grounded_realization" : index === graph.events.length - 1 ? "payoff_compression" : "meaning_reframe",
  eventIds: [event.id],
  change: event.label,
  next: "",
  frontier: "",
  setsUp: index > 0 ? [graph.events[index - 1]?.label ?? ""] : [event.label],
  paysOff: index === graph.events.length - 1 ? [event.label] : [],
}));

console.log("=".repeat(80));
console.log("QRE ENTERPRISE MOUTH ACCEPTANCE");
console.log("REALITY → ENVELOPE → CANDIDATES → BEAM → SELECTED");
console.log("=".repeat(80));
console.log(`PROMPT: ${prompt}`);
console.log(`SUBJECT: ${subject}`);
console.log(`FACTS: ${facts.join(" | ")}`);
console.log(`MOMENTS: ${moments.join(" | ")}`);
console.log("=".repeat(80));

const result = await realizeEnterpriseMouth({
  graph,
  subject,
  lens: "funny, specific, affectionate, slightly fierce",
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
