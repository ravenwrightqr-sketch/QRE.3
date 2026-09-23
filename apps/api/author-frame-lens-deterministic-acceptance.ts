import {
  deriveAuthorCreativeFrameCandidates,
  selectAuthorCreativeFrame,
  type AuthorCreativeEvent,
  type AuthorCreativeFrameCandidate,
} from "./src/services/authorCreative.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FRAME LENS DETERMINISTIC ACCEPTANCE FAILED: ${message}`);
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
  candidates: AuthorCreativeFrameCandidate[];
  selected: AuthorCreativeFrameCandidate;
} {
  const candidates = deriveAuthorCreativeFrameCandidates({
    suppliedReality: events(input.suppliedReality),
    domainContext: input.domainContext,
  });
  const choice = selectAuthorCreativeFrame({ candidates });

  console.log(`${input.name}: ${choice.frame} (${choice.confidence})`);
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
assert(coco.selected.frame === "negotiation", `COCO expected negotiation, got ${coco.selected.frame}`);

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
  housekeeping.selected.frame === "operation",
  `HOUSEKEEPING expected operation, got ${housekeeping.selected.frame}`,
);

const moving = selected({
  name: "MOVING",
  suppliedReality: [
    "The move took three days",
    "The kitchen was packed first",
    "One mystery box was still missing at the end",
  ],
});
assert(moving.selected.frame === "investigation", `MOVING expected investigation, got ${moving.selected.frame}`);

const memorial = selected({
  name: "MEMORIAL",
  suppliedReality: [
    "She loved old records",
    "She kept every birthday card",
    "She played the same song on Sundays",
  ],
});
assert(
  memorial.selected.frame === "refrain" || memorial.selected.frame === "quiet observation",
  `MEMORIAL expected refrain or quiet observation, got ${memorial.selected.frame}`,
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
assert(blandService.selected.frame === "NONE", `bland service expected NONE, got ${blandService.selected.frame}`);

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
  serviceContextOnly.selected.frame === "NONE",
  `service context alone expected NONE, got ${serviceContextOnly.selected.frame}`,
);

const generic = selectAuthorCreativeFrame({
  candidates: [
    { frame: "game", reason: "generic skin", confidence: 1 },
    { frame: "journey", reason: "generic arc", confidence: 0.99 },
    { frame: "mission", reason: "generic assignment", confidence: 0.98 },
    { frame: "story", reason: "generic narrative", confidence: 0.97 },
    { frame: "experience", reason: "generic label", confidence: 0.96 },
    { frame: "transformation", reason: "generic before after", confidence: 0.95 },
  ],
});
assert(generic.frame === "NONE", `generic frames should be rejected, got ${generic.frame}`);

for (const report of [coco, housekeeping, moving, memorial, blandService, serviceContextOnly]) {
  assert(
    !/\b(?:came in nervous|got a bath|stole a blue bow|cleaned the kitchen|mystery box|same song on Sundays)\b/i.test(
      report.selected.frame,
    ),
    `selected frame leaked event text: ${JSON.stringify(report.selected)}`,
  );
  assert(
    !/\b(?:hook|build|turn|payoff|scene|beat|cut)\b/i.test(report.selected.frame),
    `selected frame contains sequence language: ${JSON.stringify(report.selected)}`,
  );
}

console.log("FRAME LENS DETERMINISTIC ACCEPTANCE: PASS");
