import assert from "node:assert/strict";
import type { IdentityState } from "@qre/contracts";
import { buildAuthorProvenanceFacts } from "./src/services/authorProvenanceSource.js";

const identityState = {
  identityId: "acceptance-identity",
  kind: "pet",
  subject: { value: "Coco", confidence: 1 },
  canonicalFacts: [
    {
      text: "Coco got a bath",
      source: "memory",
      confidence: 0.95,
      observedAt: "2026-08-21T17:30:00-07:00",
    },
    {
      text: "Coco prefers blue bows",
      source: "memory",
      confidence: 0.9,
    },
  ],
  currentState: [],
  traits: [],
  preferences: [],
  activities: [],
  relationships: [],
  history: [],
  recentEvents: [],
  recurringPatterns: [],
  goals: [],
  intentions: [],
  unresolvedQuestions: [],
  locations: [],
  activeContext: "groomer",
  behavioralLearning: { accepted: [], rejected: [] },
  creativeLearning: { accepted: [], rejected: [], preferences: [], avoidedPatterns: [] },
  entityStates: [],
  sourceMemoryCount: 2,
  sourceEventCount: 0,
  confidence: 0.95,
  generatedAt: "2026-08-21T18:00:00-07:00",
} satisfies IdentityState;

const facts = buildAuthorProvenanceFacts(identityState, "Coco");

assert.equal(facts.length, 2);
assert.equal(facts[0]?.text, "Coco got a bath");
assert.equal(facts[0]?.provenance.source, "memory");
assert.equal(facts[0]?.provenance.observedAt, "2026-08-21T17:30:00-07:00");
assert.ok(facts.every((fact) => fact.provenance.forbiddenExpansions.includes("invent_object")));
assert.ok(facts.every((fact) => fact.provenance.forbiddenExpansions.includes("invent_person")));
assert.ok(facts[1]?.provenance.permissions.includes("callback"));

console.log("AUTHOR LIVE PROVENANCE ACCEPTANCE: PASS");
console.log(`facts=${facts.length}`);
console.log(`sources=${facts.map((fact) => fact.provenance.source).join(",")}`);
console.log(`forbiddenReality=${facts.every((fact) => fact.provenance.forbiddenExpansions.includes("invent_object"))}`);
