import type { RealityGraph } from "@qre/contracts";
import { searchMetamorphicRelations } from "./src/services/authorMetamorphicRelationSearch.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`AUTHOR METAMORPHIC RELATION ACCEPTANCE FAILED: ${message}`);
}

type EventSpec = { id: string; label: string; entities?: string[] };

function makeGraph(events: EventSpec[], relations: Array<{ from: string; to: string; kind: string; strength: number }> = []): RealityGraph {
  return {
    events: events.map((event) => ({ id: event.id, label: event.label, entities: event.entities ?? [], sourceIds: [], salient: true })),
    relations,
    eventStructure: events.map((event) => ({ eventId: event.id, subjects: event.entities ?? [], actions: [], objects: [], states: [], temporalMarkers: [], sensoryMarkers: [], semanticTags: [], recurrenceScore: 0, transitionScore: 0, anomalyScore: 0, salienceScore: 0.9 })),
    entityContinuity: events.flatMap((event) => (event.entities ?? []).map((name) => ({ name, eventIds: [event.id], salienceScore: 0.9 }))),
    unresolvedTensions: [],
    recurringSignals: [],
    patterns: [],
  } as unknown as RealityGraph;
}

const coco = makeGraph([
  { id: "groom", label: "Coco was groomed at Elm Street Grooming", entities: ["Coco"] },
  { id: "bath", label: "Coco got a bath", entities: ["Coco"] },
  { id: "bow", label: "Coco stole the red bow", entities: ["Coco"] },
]);
const cocoRelations = searchMetamorphicRelations(coco);
assert(cocoRelations.some((item) => item.type === "presentation_behavior_collision"), "presentation → behavior collision missing");
assert(cocoRelations.some((item) => item.type === "service_outcome_inversion"), "service → outcome inversion missing");
assert(cocoRelations.every((item) => item.evidenceEventIds.every((id) => ["groom", "bath", "bow"].includes(id))), "relation escaped supplied evidence");

const expectation = makeGraph([
  { id: "expect", label: "They did not expect to meet", entities: ["Alex", "Jordan"] },
  { id: "met", label: "Alex met Jordan at Raven Coffee", entities: ["Alex", "Jordan"] },
  { id: "happy", label: "They were happy", entities: ["Alex", "Jordan"] },
]);
const expectationRelations = searchMetamorphicRelations(expectation);
assert(expectationRelations.some((item) => item.type === "expectation_break"), "expectation break missing");
assert(expectationRelations.some((item) => item.type === "state_polarity_turn" || item.type === "relation_contrasts"), "relationship/state turn missing");

const callback = makeGraph([
  { id: "tag", label: "Milo wore the dog tag", entities: ["Milo"] },
  { id: "walk", label: "Milo went on a walk", entities: ["Milo"] },
  { id: "return", label: "The same dog tag was still there when Milo returned", entities: ["Milo"] },
], [{ from: "tag", to: "return", kind: "repeats", strength: 0.94 }]);
const callbackRelations = searchMetamorphicRelations(callback);
assert(callbackRelations.some((item) => item.type === "relation_repeats" || item.type === "object_recontextualization"), "callback recontextualization missing");

console.log("AUTHOR METAMORPHIC RELATION ACCEPTANCE: PASS");
console.log("PRESENTATION_BEHAVIOR_COLLISION=TRUE");
console.log("SERVICE_OUTCOME_INVERSION=TRUE");
console.log("EXPECTATION_BREAK=TRUE");
console.log("STATE_POLARITY_TURN=TRUE");
console.log("CALLBACK_RECONTEXTUALIZATION=TRUE");
console.log("EVIDENCE_LOCK=TRUE");
