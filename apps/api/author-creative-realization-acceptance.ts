import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorCognitivePlan } from "./src/services/authorCognition.js";
import { localModelGenerate } from "./src/services/localModelRuntime.js";
import {
  buildCreativeRealizationContract,
  evaluateCreativeRealization,
} from "./src/services/authorCreativeRealization.js";

const prompt = process.argv[2] ?? "Dog grooming service receipt";
const subject = process.argv[3] ?? "Coco";
const facts = (process.argv[4] ?? "poodle, nervous, fierce, cool").split(",").map((value) => value.trim()).filter(Boolean);
const sourceMoments = (process.argv[5] ?? "came in nervous, got a bath, stole a blue bow, left looking fabulous").split(",").map((value) => value.trim()).filter(Boolean);

const realityGraph = buildAuthorRealityGraph({ prompt, subject, facts, sourceMoments });
const cognition = buildAuthorCognitivePlan({
  prompt,
  lens: "",
  subject,
  place: "",
  facts,
  sourceMoments,
  memoryContext: [],
  priorScenes: [],
  priorStrategies: [],
  round: 1,
  realityGraph,
});

const contract = buildCreativeRealizationContract({
  realityGraph,
  subject,
  facts,
  sourceMoments,
  characterRead: cognition.characterRead,
});

const messages = [
  {
    role: "system" as const,
    content: [
      "You are QRE's universal creative realization engine.",
      "Find ONE memorable interpretive statement inside the supplied reality.",
      "The statement may reframe status, attitude, contradiction, object meaning, social dynamics, or emotional posture.",
      "It may use metaphor, personification, implication, double meaning, comic framing, understatement, or rhetorical game language.",
      "It MUST NOT invent a new concrete event, person, object, location, dialogue, reaction, physical action, or outcome.",
      "The meaning must be recoverable from supplied reality plus the supplied character/frame read.",
      "Do not explain the realization. Return only the line as JSON.",
      "Target the creative class of: 'Coco arrived ready to negotiate.' Do not copy that line unless independently warranted.",
      `CONTRACT=${JSON.stringify(contract)}`,
      'Output exactly {"text":"..."}',
    ].join("\n"),
  },
  { role: "user" as const, content: JSON.stringify({ prompt, subject, facts, sourceMoments }) },
];

const result = await localModelGenerate(messages, "json", { numPredict: 160, temperature: 0.82 });
let parsed: unknown = null;
try { parsed = JSON.parse(result.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()); } catch {}
const text = parsed && typeof parsed === "object" && "text" in parsed ? String((parsed as { text?: unknown }).text ?? "") : result.text;
const evaluated = evaluateCreativeRealization(text, {
  realityGraph,
  subject,
  facts,
  sourceMoments,
  characterRead: cognition.characterRead,
});

console.log("=".repeat(80));
console.log("QRE GROUNDED CREATIVE REALIZATION ACCEPTANCE");
console.log("=".repeat(80));
console.log(`SUBJECT: ${subject}`);
console.log(`FACTS: ${facts.join(" | ")}`);
console.log(`SOURCE MOMENTS: ${sourceMoments.join(" | ")}`);
console.log(`CHARACTER READ: ${JSON.stringify(cognition.characterRead, null, 2)}`);
console.log(`RAW REALIZATION: ${text}`);
console.log(`GROUNDING: ${evaluated ? JSON.stringify(evaluated, null, 2) : "REJECTED"}`);
if (!evaluated) {
  throw new Error("CREATIVE REALIZATION INVARIANT FAILED");
}
console.log("INVARIANT: PASS — memorable interpretation is grounded without a new concrete event");
