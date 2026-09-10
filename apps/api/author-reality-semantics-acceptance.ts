import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";

function fail(message: string): never {
  throw new Error(`REALITY SEMANTICS ACCEPTANCE FAILED: ${message}`);
}

function roleFor(text: string, subject = "Coco"): { role: string; eventAuthorized: boolean } {
  const graph = buildAuthorRealityGraph({
    prompt: text,
    subject,
    facts: [text],
    sourceMoments: [],
    memoryContext: [],
    trajectory: [],
  });
  const event = graph.events[0];
  const structure = event ? graph.eventStructure?.find((item) => item.eventId === event.id) : undefined;
  const tag = structure?.semanticTags.find((item) => item.startsWith("role:"));
  return {
    role: tag?.slice("role:".length) ?? "missing",
    eventAuthorized: structure?.semanticTags.includes("event-authorized") ?? false,
  };
}

const cases = [
  { text: "Coco walks in the park", role: "habit", authorized: false },
  { text: "Coco loves apples", role: "preference", authorized: false },
  { text: "Coco is a small dog", role: "attribute", authorized: false },
  { text: "Coco chases squirrels", role: "habit", authorized: false },
  { text: "Coco walked in the park for 45 minutes today", role: "observed-event", authorized: true },
  { text: "We walked Coco in the park", role: "observed-event", authorized: true },
  { text: "Coco arrived", role: "observed-event", authorized: true },
];

for (const test of cases) {
  const result = roleFor(test.text);
  if (result.role !== test.role) fail(`${test.text}: expected ${test.role}, got ${result.role}`);
  if (result.eventAuthorized !== test.authorized) fail(`${test.text}: expected eventAuthorized=${test.authorized}, got ${result.eventAuthorized}`);
  console.log(`${test.text} => ${result.role} / eventAuthorized=${result.eventAuthorized}`);
}

const graph = buildAuthorRealityGraph({
  prompt: "Milo world",
  subject: "Milo",
  facts: [
    "Milo is a small dog",
    "Milo loves bacon",
    "Milo walks in the park",
    "Milo walked in the park for 56 minutes today",
  ],
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
});

const authorized = graph.events.filter((event) => graph.eventStructure?.find((item) => item.eventId === event.id)?.semanticTags.includes("event-authorized"));
const descriptive = graph.events.filter((event) => !graph.eventStructure?.find((item) => item.eventId === event.id)?.semanticTags.includes("event-authorized"));
if (authorized.length !== 1) fail(`mixed Milo reality expected exactly 1 authorized occurrence, got ${authorized.length}`);
if (descriptive.length !== 3) fail(`mixed Milo reality expected 3 descriptive truths, got ${descriptive.length}`);

console.log(`\nUNIVERSAL REALITY SEMANTICS ACCEPTED: ${graph.events.length} supplied fragments, ${authorized.length} occurrence-authorized, ${descriptive.length} descriptive.`);
