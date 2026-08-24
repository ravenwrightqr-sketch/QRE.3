import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";
import { buildAuthorRealityEnvelope } from "./src/services/authorRealityEnvelope.js";
import { buildGroundedAuthorSequence } from "./src/services/authorSequencePlanner.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR SEQUENCE ACCEPTANCE FAILED: ${message}`);
}

const graph = buildAuthorRealityGraph({
  prompt: "Make a short living memory for Coco.",
  subject: "Coco",
  facts: [
    "poodle",
    "hates bows",
    "loves treats",
    "scared at first",
    "happy after",
    "grooming visit",
    "pink bow",
  ],
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
});

const envelope = buildAuthorRealityEnvelope({
  graph,
  subject: "Coco",
});

const plan = buildGroundedAuthorSequence({
  graph,
  envelope,
  subject: "Coco",
  lens: "funny, affectionate, slightly fierce",
});

assert(plan, "planner returned no plan");
assert(plan.beats.length >= 3, `rich Coco reality collapsed to ${plan.beats.length} beats`);
assert(plan.beats.length <= 6, `planner produced ${plan.beats.length} beats; short-film cap drifted`);
assert(plan.beats.at(-1)?.eventIds.includes(envelope.endpointEventId), "source-derived endpoint is not the final beat");
assert(plan.beats.at(-1)?.attentionFunction === "payoff", "final beat is not a payoff");
assert(plan.beats.every((beat) => beat.eventIds.every((id) => graph.events.some((event) => event.id === id))), "planner emitted an unknown reality event id");

const withPresence = buildGroundedAuthorSequence({
  graph,
  envelope,
  subject: "Coco",
  lens: "funny, affectionate, slightly fierce",
  presenceSummary: [
    "checkin 9:04 AM · geolocation pinned · 133 Elm St",
    "checkout 11:47 AM",
  ],
});

assert(withPresence, "presence planner returned no plan");
assert(withPresence.beats.some((beat) => beat.role === "arrival" || beat.role === "location"), "authorized check-in/geolocation did not become a film cut");
assert(withPresence.beats.some((beat) => beat.role === "release"), "authorized checkout did not become a release film cut");
assert(withPresence.beats.at(-1)?.eventIds.includes(envelope.endpointEventId), "presence insertion displaced the source-derived endpoint");
assert(withPresence.beats.length <= 6, `presence composition produced ${withPresence.beats.length} beats`);

console.log("AUTHOR SEQUENCE PLANNER ACCEPTANCE: PASS");
console.log(`Coco beats=${plan.beats.length}`);
console.log(`Coco arc=${plan.attentionArc}`);
console.log(`Presence beats=${withPresence.beats.length}`);
console.log(`Presence roles=${withPresence.beats.map((beat) => beat.role).join(" → ")}`);
console.log(`Endpoint=${envelope.endpointEventId}`);
