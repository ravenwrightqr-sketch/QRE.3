import {
  deriveAuthorSemanticMechanicCandidates,
  selectAuthorSemanticMechanic,
  type AuthorCreativeEvent,
  type AuthorSemanticMechanicCandidate,
} from "./src/services/authorCreative.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`SEMANTIC MECHANIC DETERMINISTIC ACCEPTANCE FAILED: ${message}`);
}

function events(values: readonly string[]): AuthorCreativeEvent[] {
  return values.map((text, index) => ({
    id: `event-${index + 1}`,
    text,
  }));
}

function selected(input: {
  name: string;
  suppliedReality: readonly string[];
  domainContext?: Record<string, unknown>;
}): {
  candidates: AuthorSemanticMechanicCandidate[];
  selected: AuthorSemanticMechanicCandidate;
} {
  const candidates = deriveAuthorSemanticMechanicCandidates({
    suppliedReality: events(input.suppliedReality),
    domainContext: input.domainContext,
  });
  const choice = selectAuthorSemanticMechanic({ candidates });

  console.log(`${input.name}: ${choice.mechanic} (${choice.confidence})`);
  return { candidates, selected: choice };
}

const coco = selected({
  name: "COCO",
  suppliedReality: [
    "Coco was a poodle",
    "Coco came in nervous",
    "Coco got a bath",
    "Coco stole a blue bow",
    "Coco left looking fabulous",
  ],
});
assert(coco.selected.mechanic === "status_tension", `COCO expected status_tension, got ${coco.selected.mechanic}`);

const housekeeping = selected({
  name: "HOUSEKEEPING",
  suppliedReality: [
    "Maria arrived at 9:04",
    "Maria cleaned the kitchen",
    "Maria cleaned two bathrooms",
    "Maria finished at 11:47",
  ],
  domainContext: {
    category: "business",
    serviceType: "housekeeping",
  },
});
assert(
  housekeeping.selected.mechanic === "bounded_progression",
  `HOUSEKEEPING expected bounded_progression, got ${housekeeping.selected.mechanic}`,
);

const moving = selected({
  name: "MOVING",
  suppliedReality: [
    "The move took three days",
    "The kitchen was packed first",
    "One mystery box was still missing at the end",
  ],
});
assert(moving.selected.mechanic === "unresolved_search", `MOVING expected unresolved_search, got ${moving.selected.mechanic}`);

const memorial = selected({
  name: "MEMORIAL",
  suppliedReality: [
    "She loved old records",
    "She kept every birthday card",
    "She played the same song on Sundays",
  ],
});
assert(
  memorial.selected.mechanic === "recurrence" || memorial.selected.mechanic === "reflective_observation",
  `MEMORIAL expected recurrence or reflective_observation, got ${memorial.selected.mechanic}`,
);

const blandService = selected({
  name: "BLAND_SERVICE",
  suppliedReality: [
    "Kitchen cleaned",
    "Bathroom cleaned",
  ],
  domainContext: {
    category: "business",
    serviceType: "housekeeping",
  },
});
assert(blandService.selected.mechanic === "NONE", `bland service expected NONE, got ${blandService.selected.mechanic}`);

const serviceContextOnly = selected({
  name: "SERVICE_CONTEXT_ONLY",
  suppliedReality: [
    "Service visit recorded",
  ],
  domainContext: {
    category: "business",
    serviceType: "housekeeping",
  },
});
assert(
  serviceContextOnly.selected.mechanic === "NONE",
  `service context alone expected NONE, got ${serviceContextOnly.selected.mechanic}`,
);

const generic = selectAuthorSemanticMechanic({
  candidates: [
    { mechanic: "game", reason: "generic skin", confidence: 1 },
    { mechanic: "journey", reason: "generic arc", confidence: 0.99 },
    { mechanic: "mission", reason: "generic assignment", confidence: 0.98 },
    { mechanic: "story", reason: "generic narrative", confidence: 0.97 },
    { mechanic: "experience", reason: "generic label", confidence: 0.96 },
    { mechanic: "transformation", reason: "generic before after", confidence: 0.95 },
  ],
});
assert(generic.mechanic === "NONE", `generic/styled mechanics should be rejected, got ${generic.mechanic}`);

for (const report of [coco, housekeeping, moving, memorial, blandService, serviceContextOnly]) {
  assert(
    !/\b(?:came in nervous|got a bath|stole a blue bow|cleaned the kitchen|mystery box|same song on Sundays)\b/i.test(
      report.selected.mechanic,
    ),
    `selected mechanic leaked event text: ${JSON.stringify(report.selected)}`,
  );
  assert(
    !/\b(?:hook|build|turn|payoff|scene|beat|cut)\b/i.test(report.selected.mechanic),
    `selected mechanic contains sequence language: ${JSON.stringify(report.selected)}`,
  );
}

console.log("SEMANTIC MECHANIC DETERMINISTIC ACCEPTANCE: PASS");
