import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Real production source, offline transport only. Never load the live runtime.
function load(name, generate) {
  const source = readFileSync(new URL(`./src/services/${name}.ts`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, process: { env: {} },
    require(specifier) {
      if (specifier === "./localModelRuntime.js") return { localModelGenerate: generate };
      if (["./authorDerivedMeaning.js", "./authorCutFloor.js", "./authorCreativeDoctrine.js"].includes(specifier)) {
        return load(specifier.slice(2, -3), generate);
      }
      throw new Error(`Unexpected dependency: ${specifier}`);
    },
  });
  return exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const events = [
  { id: "a", text: "A blue bow was added." },
  { id: "b", text: "Coco tried to remove the bow." },
  { id: "c", text: "Happy at pickup." },
  { id: "d", text: "Bath." },
];
const empty = { kind: "DERIVED_MEANING", relations: [] };
const meaning = { kind: "DERIVED_MEANING", relations: [
  { id: "adornment-refusal", relation: "An added adornment meets an attempt to remove it.",
    groundingEventIds: ["a", "b"], interpretations: [
      { id: "decoration-contested", interpretation: "Decoration becomes contested.", derivation: "Addition and attempted removal pull in opposite directions." },
      { id: "presentation-resistance", interpretation: "Presentation meets resistance.", derivation: "The attempt puts the added adornment in tension with its removal." },
      { id: "private-motive", interpretation: "Coco intends to punish the groomer.", derivation: "The removal attempt was planned revenge." },
    ] },
  { id: "invented-cause", relation: "The bath caused a lifelong fear of bows.", groundingEventIds: ["b", "d"],
    interpretations: [{ id: "fear", interpretation: "Fear controls the visit.", derivation: "The bath changed Coco permanently." }] },
] };
const approved = structuredClone(meaning);
approved.relations = [approved.relations[0]];
approved.relations[0].interpretations.pop();

async function derive({ output = meaning, rejected = ["r0i2", "r1"], verification, failAt, supplied = events } = {}) {
  const requests = [];
  const service = load("authorCreativeDiscovery", async (messages, format, options) => {
    const payload = JSON.parse(messages[1].content);
    requests.push({ messages, payload, options });
    if (requests.length === failAt) throw new Error("Transport unavailable");
    const response = payload.DERIVED_MEANING_CLAIMS
      ? { verifications: verification ?? payload.DERIVED_MEANING_CLAIMS.map(({ id }) => ({
          claimId: id, grounded: !rejected.includes(id),
          unsupportedClaims: rejected.includes(id) ? ["Unsupported premise"] : [],
        })) }
      : output;
    return { text: typeof response === "string" ? response : JSON.stringify(response), model: "offline" };
  });
  const before = structuredClone(supplied);
  const result = plain(await service.discoverAuthorDerivedMeaning(supplied));
  assert.deepEqual(supplied, before, "Cognition must never mutate facts");
  assert.equal(result.modelCalls, requests.length);
  for (const { payload, messages } of requests) {
    assert.equal("REQUESTED_LENS" in payload, false);
    assert.equal("MEMORY" in payload, false, "Remembered occurrences are not current relational evidence");
    assert.doesNotMatch(messages[0].content, /Coco|groomer|war of the bows/i, "Production prompts must remain universal");
  }
  return { ...result, requests };
}

const grounded = await derive();
assert.equal(JSON.stringify(grounded.requests[0].options.jsonSchema).includes('"uniqueItems"'), false,
  "Discovery schema must avoid the provider-rejected uniqueItems keyword; validation enforces distinct IDs");
assert.deepEqual(grounded.derivedMeaning, approved, "Keep grounded alternatives, reject bad relation and bad sibling");
assert.equal(grounded.modelCalls, 2);
const single = structuredClone(approved);
single.relations[0].interpretations = single.relations[0].interpretations.slice(0, 1);
assert.deepEqual((await derive({ output: single, rejected: [] })).derivedMeaning, single,
  "One earned interpretation is valid; multiple alternatives must never be forced");
assert.deepEqual(grounded.requests[1].payload.DERIVED_MEANING_CLAIMS[0].evidence, events.slice(0, 2),
  "Authority receives only cited facts for each claim");
assert.match(grounded.requests[0].messages[0].content, /an ending state can coexist with a local conflict/i);
assert.match(grounded.requests[1].messages[0].content, /Check each causal and temporal commitment independently/);
assert.match(grounded.requests[1].messages[0].content, /do not establish what caused either state/);
assert.equal(grounded.requests[1].payload.DERIVED_MEANING_CLAIMS[3].derivation, "The removal attempt was planned revenge.",
  "Derivations must be audited, not merely interpretations");

for (const mutate of [
  (value) => { value.relations[0].groundingEventIds = ["a", "invented"]; },
  (value) => { value.relations[0].groundingEventIds = ["a", "a"]; },
  (value) => { value.relations[0].groundingEventIds = ["a"]; },
  (value) => { value.relations[0].text = "An invented event field"; },
  (value) => { value.relations[0].interpretations[1].id = value.relations[0].interpretations[0].id; },
]) {
  const invalid = structuredClone(meaning);
  mutate(invalid);
  const result = await derive({ output: invalid });
  assert.deepEqual(result.derivedMeaning, empty);
  assert.equal(result.modelCalls, 1, "Invalid structure cannot reach semantic authority");
}
for (const config of [{ output: empty }, { output: "not json" }, { failAt: 1 }, { failAt: 2 },
  { verification: [] }, { rejected: ["r0", "r1"] },
  { verification: [{ claimId: "r0", grounded: true }] },
  { verification: [
    { claimId: "r0", grounded: true, unsupportedClaims: [] },
    { claimId: "r0", grounded: false, unsupportedClaims: ["contradiction"] },
    { claimId: "r0i0", grounded: true, unsupportedClaims: [] },
  ] },
]) assert.deepEqual((await derive(config)).derivedMeaning, empty, "Absent, malformed or contradictory authority fails closed");
for (const supplied of [[], events.slice(0, 1)]) {
  const result = await derive({ supplied });
  assert.equal(result.modelCalls, 0, "A single fact does not require a relational call");
  assert.deepEqual(result.derivedMeaning, empty);
}

// Exercise the complete normal Discovery path, including memory preservation
// and a narrow primary read whose relation requires additional evidence.
let discovery;
for (const experienceMode of ["MEMORY", "IDENTITY"]) {
  const requests = [];
  const service = load("authorCreativeDiscovery", async (messages) => {
    const payload = JSON.parse(messages[1].content);
    requests.push(payload);
    let response;
    if (payload.CURRENT_REALITY) response = {
      candidates: [{ id: "notice", perception: "An adornment is contested.", relationship: "",
        evidenceEventIds: ["b"] }], selectedCandidateId: "notice",
    };
    else if (payload.CANDIDATES) response = { verifications: payload.CANDIDATES.map(({ id }) => ({
      candidateId: id, grounded: true, unsupportedClaims: [],
    })) };
    else if (payload.DERIVED_MEANING_CLAIMS) response = { verifications: payload.DERIVED_MEANING_CLAIMS.map(({ id }) => ({
      claimId: id, grounded: true, unsupportedClaims: [],
    })) };
    else if (payload.SUPPLIED_REALITY) response = approved;
    else throw new Error("Unexpected model request");
    return { text: JSON.stringify(response), model: "offline" };
  });
  const memory = ["Prior visit: War of the Bows."];
  const result = plain(await service.discoverAuthorCreativeDirection({
    events, memory, requestedLens: "HORROR", domainContext: { experienceMode },
  }));
  assert.equal(result.modelCalls, 4);
  assert.deepEqual(result.discovery.derivedMeaning, approved);
  assert.deepEqual(requests[0].MEMORY, memory, "Stored memory still reaches primary Discovery");
  assert.deepEqual(result.discovery.selected.evidenceEventIds, ["b"], "Derived evidence must not rewrite primary evidence");
  assert.deepEqual(result.discovery.playableEventIds, experienceMode === "MEMORY" ? ["a", "b", "c", "d"] : ["b", "a"]);
  if (experienceMode === "MEMORY") discovery = result.discovery;
}

// Capture actual downstream prompts. Meaning stays separate from supplied facts.
const stop = new Error("Captured Structure");
let structure;
await assert.rejects(load("authorCreative", async (messages) => {
  structure = JSON.parse(messages[1].content);
  throw stop;
}).createAuthorExperience({ subject: "Coco", suppliedReality: events, creativeDiscovery: discovery,
  domainContext: { experienceMode: "MEMORY" }, requestedLens: "NONE" }), (error) => error === stop);
assert.deepEqual(structure.DERIVED_MEANING, approved);
assert.deepEqual(structure.AUTHORIZED_EVIDENCE, events);

let search;
await load("authorCreative", async (messages) => {
  search = JSON.parse(messages[1].content);
  return { text: '{"notices":[]}', model: "offline" };
}).searchAuthorCreativeLensTreatments({ subject: "Coco", suppliedReality: events, plan: { thesis: "", beats: [] },
  creativeOpportunity: discovery.selected.perception, relation: discovery.selected.relationship,
  derivedMeaning: approved, requestedLens: "HORROR", experienceMode: "MEMORY",
  semanticMechanic: { id: "none", kind: "NONE", evidenceEventIds: [], pressure: "", reason: "" },
  semanticMechanicCandidates: [],
});
assert.deepEqual(search.DERIVED_MEANING, approved, "Lens must consume approved relational cognition");
assert.deepEqual(search.APPROVED_MEANING.perception, discovery.selected.perception);
assert.ok(search.SUPPLIED_REALITY.every((event) => !("interpretations" in event)));

const mouthRequests = [];
const mouthSystems = [];
await load("authorCreative", async (messages) => {
  const payload = JSON.parse(messages[1].content);
  mouthRequests.push(payload);
  if (payload.CREATIVE_TREATMENTS) mouthSystems.push(messages[0].content);
  throw new Error("Offline Mouth fallback");
}).createAuthorExperience({ subject: "Coco", suppliedReality: events.slice(0, 2),
  creativeDiscovery: { ...discovery, playableEventIds: ["a", "b"] },
  domainContext: { experienceMode: "MEMORY" }, requestedLens: "NONE" });
const mouth = mouthRequests.find((payload) => payload.CREATIVE_TREATMENTS);
assert.ok(mouth, "Normal Mouth must receive derived meaning");
assert.deepEqual(mouth.DERIVED_MEANING, approved);
assert.deepEqual(mouth.SUPPLIED_REALITY, events.slice(0, 2));
assert.equal("APPROVED_BEATS" in mouth, false, "MEMORY writing must not be assigned beat-by-beat public coverage");
assert.equal("STORY_GRAVITY" in mouth, false, "A HARD metadata endpoint must not dictate the expressive landing");
assert.match(mouthSystems[0], /Use a name when identity, contrast, or emphasis earns it/);
assert.match(mouthSystems[0], /Make the meaning felt through the writing itself/);
assert.match(mouthSystems[0], /Maximize meaningful inference while maintaining grounding/);
assert.match(mouthSystems[0], /Each public line is a moving-text cut/);
assert.match(mouthSystems[0], /One word may establish the charged detail/);
assert.match(mouthSystems[0], /Keep the explanation of how the evidence supports it in private reasoning/);
assert.match(mouthSystems[0], /A supplied ending state may be used, omitted, or placed earlier/);
assert.match(mouthSystems[0], /Expand what a truth can mean without expanding what happened/);
assert.match(mouthSystems[0], /a supplied entity, a rhetorical speaker, or a category already made relevant by the facts/);
assert.match(mouthSystems[0], /stop cutting when the inference, character, rhythm, or tension gets weaker/);
assert.doesNotMatch(mouthSystems[0], /Do not|Never/i, "Mouth should direct creation positively");
assert.doesNotMatch(mouthSystems[0], /Coco|War of the Bows|Peace is temporary/i,
  "Taste references must remain outside production instructions");

// Capture the actual expressive request, including its schema. D is a runtime
// control, so the writer should receive neither its prose nor endpoint pressure.
const timedEvents = [events[0], { ...events[1], text: "At 5:00 PM, Coco tried to remove the bow." }];
let expressiveRequest;
let lensEvidence;
const expressiveFallback = await load("authorCreative", async (messages, format, options) => {
  const payload = JSON.parse(messages[1].content);
  if (payload.CREATIVE_TREATMENTS) {
    expressiveRequest = { payload, system: messages[0].content, options };
    throw new Error("Captured expressive Mouth");
  }
  lensEvidence = payload.SUPPLIED_REALITY;
  return { model: "offline", text: JSON.stringify({ notices: [
    { conception: "Adornment becomes contested.", evidenceEventIds: ["a", "b"] },
    { conception: "An addition meets refusal.", evidenceEventIds: ["a", "b"] },
    { conception: "Presentation has a rival.", evidenceEventIds: ["a", "b"] },
  ] }) };
}).createAuthorExperience({ subject: "Coco", suppliedReality: timedEvents,
  creativeDiscovery: { ...discovery, playableEventIds: ["a", "b"] },
  domainContext: { experienceMode: "MEMORY" }, requestedLens: "HORROR" });
assert.deepEqual(lensEvidence, timedEvents, "Lens must receive supplied specificity, including exact clock times");
assert.ok(expressiveRequest, "Expressive Mouth request must be captured");
assert.deepEqual(expressiveRequest.payload.SUPPLIED_REALITY, timedEvents);
assert.equal("APPROVED_BEATS" in expressiveRequest.payload, false);
assert.equal("STORY_GRAVITY" in expressiveRequest.payload, false);
assert.deepEqual(expressiveRequest.payload.CREATIVE_TREATMENTS.map(({ production }) => production), ["A", "B", "C"]);
for (const treatment of expressiveRequest.payload.CREATIVE_TREATMENTS) {
  assert.deepEqual(Object.keys(treatment).sort(), ["conception", "evidenceEventIds", "production"]);
}
assert.equal(expressiveRequest.options.jsonSchema.properties.productions.minItems, 3);
assert.equal(expressiveRequest.options.jsonSchema.properties.productions.items.properties.lines.minItems, 3,
  "Normal expressive production must request at least three moving-text cuts independently of fact count");
assert.equal(expressiveRequest.options.numPredict, 1600, "Three developed productions need room in the generation budget");
assert.ok(expressiveRequest.options.jsonSchema.properties.productions.items.properties.lines.maxItems > timedEvents.length,
  "A supplied detail may support more than one expressive cut; event count is not cut count");
assert.deepEqual(plain(expressiveRequest.options.jsonSchema.properties.productions.items.properties.production.enum), ["A", "B", "C"]);
assert.equal(expressiveFallback.diagnostics.selectedProduction, "D",
  "Failure of expressive writing must retain the deterministic D fallback");
assert.deepEqual(plain(expressiveFallback.scenes.flatMap(({ sourceEventIds }) => sourceEventIds)), ["a", "b"],
  "Model failure must preserve the complete supplied corridor in factual fallback");

const directMessages = load("authorCreative", () => { throw new Error("No live calls"); })
  .buildDirectAuthorMemoryMessages({ subject: "Coco", suppliedReality: events });
assert.match(directMessages[0].content, /Make the meaning felt through the writing itself/);
assert.match(directMessages[0].content, /keeping concrete occurrence inside supplied reality/);
assert.doesNotMatch(directMessages[0].content, /Coco|War of the Bows|Peace is temporary/i);
assert.equal(JSON.parse(directMessages[1].content).SUBJECT, "Coco",
  "Direct writing keeps its own reality payload and output contract");

let groundingPayload;
await load("authorCreativeGroundingVerifier", async (messages) => {
  groundingPayload = JSON.parse(messages[1].content);
  return { text: '{"verifications":[]}', model: "offline" };
}).verifyAuthorCreativeGrounding({ scenes: [{ text: "Decoration contested.", sourceEventIds: ["a", "b"] }],
  suppliedReality: events, derivedMeaning: approved });
assert.deepEqual(groundingPayload.DERIVED_MEANING, approved);
assert.deepEqual(groundingPayload.SUPPLIED_REALITY, events);

console.log("AUTHOR DERIVED MEANING GREEN - RELATIONAL ABSTRACTION - SEMANTIC AUTHORITY - FULL MEMORY - LENS HANDOFF - OFFLINE");
