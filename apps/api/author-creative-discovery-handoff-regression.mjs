import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Execute the actual source with only the model transport replaced. Never load
// localModelRuntime or make network calls, even when live credentials exist.
function loadService(name, generate, extraExports = "") {
  const source = readFileSync(new URL(`./src/services/${name}.ts`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(`${source}\n${extraExports}`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: `${name}.ts`,
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    process: { env: {} },
    require(specifier) {
      if (specifier === "./localModelRuntime.js") return { localModelGenerate: generate };
      if (["./authorCutFloor.js", "./authorCreativeDoctrine.js", "./authorBehaviorProfile.js", "./authorDerivedMeaning.js"].includes(specifier)) {
        return loadService(specifier.slice(2, -3), generate);
      }
      throw new Error(`Unexpected regression dependency: ${specifier}`);
    },
  }, { filename: `${name}.ts` });
  return exports;
}

const plain = (value) => JSON.parse(JSON.stringify(value));
const events = [
  { id: "e1", text: "Dropped off at 9:00 AM." },
  { id: "e2", text: "Bath." },
  { id: "e3", text: "Blue bows." },
  { id: "e4", text: "Tried to remove the bows." },
  { id: "e5", text: "Happy at pickup." },
];
const eventIds = events.map((event) => event.id);
const businessMemory = { experienceMode: "MEMORY", serviceType: "GROOMING" };
const makeCandidate = (id = "notice", evidenceEventIds = ["e4"]) => ({
  id,
  perception: "Adornment meets refusal.",
  relationship: "An addition becomes a constraint.",
  evidenceEventIds,
});
const answer = (candidates = [makeCandidate()], overrides = {}) => ({
  candidates,
  selectedCandidateId: candidates[0]?.id ?? "",
  confidence: 0.8,
  selectionReason: "The supplied attempt changes the significance.",
  risk: "",
  ...overrides,
});

async function discover({
  response = answer(),
  domainContext = businessMemory,
  requestedLens = "HORROR",
  suppliedEvents = events,
  memory = [],
  rejectedIds = [],
  repaired = [],
} = {}) {
  const requests = [];
  const service = loadService("authorCreativeDiscovery", async (messages, format, options) => {
    const payload = JSON.parse(messages[1].content);
    requests.push({ messages, format, options, payload });
    let result;
    if (payload.CURRENT_REALITY) result = response;
    else if (payload.CANDIDATES) {
      result = { verifications: payload.CANDIDATES.map(({ id }) => ({
        candidateId: id,
        grounded: !rejectedIds.includes(id),
        unsupportedClaims: rejectedIds.includes(id) ? ["unsupported premise"] : [],
      })) };
    } else if (payload.FAILED_DISCOVERY) result = { candidates: repaired };
    else if (payload.SUPPLIED_REALITY) result = { kind: "DERIVED_MEANING", relations: [] };
    else throw new Error("Unexpected Discovery model request");
    return { text: JSON.stringify(result), model: "offline-stub" };
  });
  const input = { events: structuredClone(suppliedEvents), domainContext, requestedLens, memory };
  const before = structuredClone(input);
  const result = plain(await service.discoverAuthorCreativeDirection(input));
  assert.deepEqual(input, before, "Discovery must not mutate supplied reality");
  assert.equal(result.modelCalls, requests.length, "Model accounting must include Discovery and authority");
  assert.ok(requests[0]?.payload.CURRENT_REALITY, "MEMORY must run Discovery, never bypass it");
  assert.deepEqual(requests[0].payload.MEMORY, memory.slice(0, 12), "Stored history must still reach Discovery");
  const { jsonSchema } = requests[0].options;
  assert.equal(jsonSchema.properties.candidates.minItems, 0);
  assert.equal(jsonSchema.properties.candidates.maxItems, 4);
  for (const field of ["playableEventIds", "backgroundEventIds", "experienceShape"]) {
    assert.equal(field in jsonSchema.properties, false);
    assert.equal(jsonSchema.required.includes(field), false);
    assert.equal(requests[0].messages.some(({ content }) => content.includes(field)), false);
  }
  assert.equal("CREATIVE_INTENT" in requests[0].payload, false);
  assert.deepEqual(result.discovery.experienceShape, [], "Legacy shape hints must never survive Discovery");
  assert.equal(result.discovery.lens, requestedLens || "NONE");
  return { ...result, requests };
}

// One fact may carry meaning while every supplied fact stays available. This
// includes explicit NONE, automatic treatment, and non-business memories.
let approvedDiscovery;
for (const domainContext of [businessMemory, { experienceMode: "MEMORY" }]) {
  for (const requestedLens of ["HORROR", "NONE", ""]) {
    const { discovery, requests } = await discover({ domainContext, requestedLens });
    assert.equal(discovery.selected.id, "notice");
    assert.equal(discovery.candidates.length, 1);
    assert.deepEqual(discovery.selected.evidenceEventIds, ["e4"]);
    assert.deepEqual(discovery.playableEventIds, eventIds);
    assert.deepEqual(discovery.backgroundEventIds, []);
    assert.equal(requests.length, 3, "Discovery verifies its primary read and runs relational abstraction");
    approvedDiscovery = discovery;
  }
}

const continued = await discover({ memory: [
  "Prior visit: Coco tried to remove the blue bows.",
  "Prior expressive framing: War of the Bows.",
] });
// Repeated subjects and shared objects must not be mistaken for reliance on
// uncited events. This reproduces the live Coco primary-read disappearance.
const repeatedSubjectEvents = [
  { id: "n", text: "Coco was nervous." },
  { id: "b", text: "Coco got a bath." },
  { id: "a", text: "A bow was added." },
  { id: "r", text: "Coco tried to remove the bow." },
  { id: "h", text: "Coco left happy." },
];
const bowRead = { id: "bow-read", perception: "The bow becomes something Coco resists.",
  relationship: "Addition and attempted removal put the decoration in contention.",
  evidenceEventIds: ["a", "r"] };
const sharedSubject = await discover({ suppliedEvents: repeatedSubjectEvents, response: answer([bowRead]) });
assert.equal(sharedSubject.discovery.selected.id, "bow-read");
assert.ok(sharedSubject.requests.some(({ payload }) => payload.CANDIDATES?.some(({ id }) => id === "bow-read")),
  "A read with shared vocabulary must reach semantic authority");
const rejectedShared = await discover({ suppliedEvents: repeatedSubjectEvents,
  response: answer([bowRead]), rejectedIds: ["bow-read"] });
assert.equal(rejectedShared.discovery.selected.id, "reality-direct",
  "Shared vocabulary never bypasses semantic rejection");
const uncitedState = await discover({ suppliedEvents: repeatedSubjectEvents,
  response: answer([{ ...bowRead, perception: "Coco was nervous about the bow." }]) });
assert.equal(uncitedState.discovery.selected.id, "reality-direct",
  "Vocabulary exclusive to an uncited fact must still fail the deterministic check");
assert.deepEqual(continued.requests[0].payload.CURRENT_REALITY, events);
assert.deepEqual(continued.discovery.playableEventIds, eventIds,
  "Remembered visits must not become new occurrences in the current corridor");
await discover({ response: answer([makeCandidate()], { experienceShape: ["callback", "status tension"] }) });
await discover({
  response: answer([makeCandidate()], { experienceShape: ["again"] }),
  rejectedIds: ["notice"],
});

// A two-fact read and a zero-read fallback both keep the full corridor.
for (const candidates of [[makeCandidate("pair", ["e3", "e4"])], []]) {
  const { discovery } = await discover({ response: answer(candidates) });
  assert.deepEqual(discovery.playableEventIds, eventIds);
  assert.deepEqual(discovery.backgroundEventIds, []);
  assert.equal(discovery.selected.id, candidates.length ? "pair" : "reality-direct");
  assert.equal(discovery.candidates.length, candidates.length);
}

// A rejected selection may be replaced, repaired, or fall back without losing
// real material. Unsupported model IDs can never expand the supplied corridor.
const replacement = makeCandidate("other", ["e3"]);
for (const [candidates, repaired, expectedId] of [
  [[makeCandidate(), replacement], [], "other"],
  [[makeCandidate()], [makeCandidate("notice-repair")], "notice-repair"],
  [[makeCandidate()], [], "reality-direct"],
]) {
  const { discovery } = await discover({
    response: answer(candidates, {
      playableEventIds: ["e4", "invented"],
      backgroundEventIds: ["invented"], // Ignore stale or unsolicited model output.
    }),
    rejectedIds: ["notice"],
    repaired,
  });
  assert.equal(discovery.selected.id, expectedId);
  assert.deepEqual(discovery.playableEventIds, eventIds);
  assert.deepEqual(discovery.backgroundEventIds, []);
}

// The runtime corridor is not capped by either model-authored ID array.
const manyEvents = Array.from({ length: 70 }, (_, i) => ({ id: `event-${i}`, text: `Supplied item ${i}.` }));
const many = await discover({
  suppliedEvents: manyEvents,
  response: answer([makeCandidate("one", ["event-69"])], { playableEventIds: [] }),
});
assert.deepEqual(many.discovery.playableEventIds, manyEvents.map(({ id }) => id));
const empty = await discover({ suppliedEvents: [], response: answer([]) });
assert.deepEqual(empty.discovery.playableEventIds, []);

// Non-MEMORY authorizes the final approved evidence, regardless of stale model
// partitions. Unknown and uncited IDs cannot expand the approved evidence.
for (const overrides of [{}, { playableEventIds: [] }, {
  playableEventIds: ["e4", "invented", "e1"], backgroundEventIds: ["e1"],
}]) {
  const { discovery } = await discover({
    domainContext: { experienceMode: "IDENTITY" },
    response: answer([makeCandidate("pair", ["e3", "e4"])], overrides),
  });
  assert.deepEqual(discovery.playableEventIds, ["e3", "e4"]);
  assert.deepEqual(discovery.backgroundEventIds, []);
}

const replacedIdentity = await discover({
  domainContext: { experienceMode: "IDENTITY" },
  response: answer([makeCandidate(), replacement], { playableEventIds: ["e4", "e5"] }),
  rejectedIds: ["notice"],
});
assert.equal(replacedIdentity.discovery.selected.id, "other");
assert.deepEqual(replacedIdentity.discovery.playableEventIds, ["e3"]);
const identityFallback = await discover({
  domainContext: { experienceMode: "IDENTITY" }, response: answer([]),
});
assert.deepEqual(identityFallback.discovery.playableEventIds, eventIds);

// Exercise downstream production helpers without changing their public API.
const stopAtStructure = new Error("Captured Structure request");
let structurePayload;
let structureSchema;
const creative = loadService("authorCreative", async (messages, format, options) => {
  structurePayload = JSON.parse(messages[1].content);
  structureSchema = options.jsonSchema;
  throw stopAtStructure;
}, "export { fallbackPlan, normalizePlan, enforceMemoryStructure, lockPlanToApprovedMeaning, ensurePostLockMemoryCanvas };");
await assert.rejects(creative.createAuthorExperience({
  subject: "Coco",
  suppliedReality: events,
  creativeDiscovery: approvedDiscovery,
  domainContext: businessMemory,
  requestedLens: "HORROR",
}), (error) => error === stopAtStructure);
assert.deepEqual(structurePayload.AUTHORIZED_EVIDENCE, events, "All MEMORY facts must reach Structure");
assert.deepEqual(structurePayload.APPROVED_MEANING, {
  perception: approvedDiscovery.selected.perception,
  relationship: approvedDiscovery.selected.relationship,
  evidenceEventIds: approvedDiscovery.selected.evidenceEventIds,
});
assert.equal("EXPERIENCE_SHAPE" in structurePayload, false);
assert.ok(structureSchema.required.includes("revisitEventIds"));

const sparse = creative.fallbackPlan(events, approvedDiscovery);
assert.deepEqual(plain(sparse.beats.flatMap(({ eventIds }) => eventIds)), ["e4"]);
const complete = creative.enforceMemoryStructure(sparse, events);
const locked = creative.lockPlanToApprovedMeaning(complete, events, approvedDiscovery);
const restored = creative.ensurePostLockMemoryCanvas(locked, events);
assert.deepEqual(plain(restored.beats.flatMap(({ eventIds }) => eventIds)), eventIds);
assert.equal(restored.thesis, approvedDiscovery.selected.perception);

// Structure explicitly permits specific revisits. Discovery hint wording has
// no authority over either repetition or semantic mechanic inference.
const repeated = { thesis: "", beats: [sparse.beats[0], sparse.beats[0]] };
assert.equal(creative.lockPlanToApprovedMeaning(repeated, events, approvedDiscovery).beats.length, 1);
for (const experienceShape of [["callback"], ["no callback"], ["again"]]) {
  assert.equal(creative.lockPlanToApprovedMeaning(repeated, events, {
    ...approvedDiscovery, experienceShape,
  }).beats.length, 1);
}
const revisitedPlan = { ...repeated, revisitEventIds: ["e4"] };
const revisited = creative.lockPlanToApprovedMeaning(revisitedPlan, events, approvedDiscovery);
assert.equal(revisited.beats.length, 2);
assert.deepEqual(plain(revisited.revisitEventIds), ["e4"]);
const normalized = creative.normalizePlan({
  ...revisitedPlan, revisitEventIds: ["e4", "e4", "e3", "invented"],
}, new Set(eventIds));
assert.deepEqual(plain(normalized.revisitEventIds), ["e4"], "Only supplied IDs actually revisited across beats may be listed");
const undesignated = creative.normalizePlan(repeated, new Set(eventIds));
assert.deepEqual(plain(undesignated.revisitEventIds), []);
assert.equal(creative.lockPlanToApprovedMeaning(undesignated, events, approvedDiscovery).beats.length, 1);

const selectiveRevisit = creative.normalizePlan({
  thesis: "",
  revisitEventIds: ["e4"],
  beats: [
    { order: 1, eventIds: ["e3", "e4"] },
    { order: 2, eventIds: ["e3", "e4"] },
  ],
}, new Set(eventIds));
assert.deepEqual(plain(creative.lockPlanToApprovedMeaning(selectiveRevisit, events, approvedDiscovery)
  .beats.map(({ eventIds }) => eventIds)), [["e3", "e4"], ["e4"]]);
const restoredRevisit = creative.lockPlanToApprovedMeaning(
  creative.ensurePostLockMemoryCanvas(
    creative.lockPlanToApprovedMeaning(
      creative.enforceMemoryStructure({ ...complete, beats: [...complete.beats, sparse.beats[0]], revisitEventIds: ["e4"] }, events),
      events, approvedDiscovery,
    ), events,
  ), events, approvedDiscovery,
);
assert.deepEqual([...new Set(plain(restoredRevisit.beats.flatMap(({ eventIds }) => eventIds)))], eventIds);
assert.equal(restoredRevisit.beats.flatMap(({ eventIds }) => eventIds).filter((id) => id === "e4").length, 2);

const scopedIdentity = { ...approvedDiscovery, playableEventIds: ["e3"] };
const unapprovedRevisit = creative.lockPlanToApprovedMeaning(revisitedPlan, events, scopedIdentity);
assert.deepEqual(plain(unapprovedRevisit.revisitEventIds), []);
assert.equal(unapprovedRevisit.beats.some(({ eventIds }) => eventIds.includes("e4")), false);

const neutralEvents = [{ id: "n1", text: "The sample was blue." }];
const neutralDiscovery = { ...approvedDiscovery, selected: {
  ...approvedDiscovery.selected, perception: "The supplied hue earns attention.",
  relationship: "", evidenceEventIds: ["n1"],
} };
const neutralMechanics = (experienceShape, extra = {}) => plain(creative.deriveAuthorSemanticMechanicCandidates({
  suppliedReality: neutralEvents, creativeDiscovery: { ...neutralDiscovery, experienceShape }, ...extra,
}));
assert.deepEqual(neutralMechanics(["again", "status tension"]), neutralMechanics([]),
  "Legacy shape hints must not manufacture semantic mechanics");
assert.ok(neutralMechanics([], { memory: ["The same detail returned on a prior visit."] })
  .some(({ mechanic }) => mechanic === "recurrence"), "Stored history still contributes to grounded mechanic inference");

console.log("AUTHOR STRUCTURE OWNERSHIP GREEN - APPROVED MEANING - EXPLICIT REVISITS - SHAPE HINTS INERT - OFFLINE");

console.log("AUTHOR DISCOVERY HANDOFF GREEN - DISCOVERY ACTIVE - FULL MEMORY CORRIDOR - DETERMINISTIC PLAYABLE/BACKGROUND - OFFLINE");
