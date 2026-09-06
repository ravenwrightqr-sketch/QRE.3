import "dotenv/config";
import assert from "node:assert/strict";
import { authorBrainCanonical } from "./src/services/authorBrainCanonical.js";
import type { AuthorDomainContext } from "@qre/contracts";

const business: AuthorDomainContext = {
  category: "pet care",
  businessType: "dog grooming",
  businessName: "Elm St Dog Grooming",
  businessDescription: "A dog grooming business specializing in grooming transformations and take-home presentation.",
  serviceType: "grooming",
  serviceName: "dog grooming",
  subjectKind: "dog",
  knownCapabilities: ["bath", "grooming", "brush", "dry", "bows"],
  contextualSignals: ["before and after", "freshly groomed", "polished", "take-home transformation"],
};

const reality = {
  prompt: "Create a customer-facing experience for Coco's visit. The business identity is part of the arena. Surface the business name once when it helps establish where this happened.",
  subject: "Coco",
  facts: [
    "Coco arrived looking rough",
    "Coco received the service",
    "Coco left looking polished",
  ],
  sourceMoments: [],
  memoryContext: [],
  trajectory: [],
  creativeLearningContext: [],
  movieMode: true,
};

const withBusiness = await authorBrainCanonical({ ...reality, domainContext: business });
const withoutBusiness = await authorBrainCanonical(reality);

function output(result: typeof withBusiness): string {
  return result.scenes.map((scene) => scene.text).filter(Boolean).join(" ");
}

const contextualText = output(withBusiness);
const contextlessText = output(withoutBusiness);

console.log("=== AUTHOR BUSINESS CONTEXT ACCEPTANCE ===");
console.log(`BUSINESS: ${business.businessName}`);
console.log(`TYPE: ${business.businessType}`);
console.log(`SUBJECT: ${reality.subject}`);
console.log(`WITH CONTEXT: ${contextualText}`);
console.log(`WITHOUT CONTEXT: ${contextlessText}`);
console.log(`WITH MOVIE: ${withBusiness.movie?.id ?? "none"}`);
console.log(`WITH SCORE: ${withBusiness.diagnostics.selectedScore}`);

assert.equal(withBusiness.diagnostics.qualityStatus, "ACCEPTED");
assert.equal(withBusiness.diagnostics.renderable, true);
assert.equal(withBusiness.diagnostics.complete, true);
assert.ok(withBusiness.movie);
assert.ok(withBusiness.sequence.cuts.length >= 2);
assert.match(contextualText, /Elm St Dog Grooming/i, "learned business name did not reach visible Author realization");
assert.match(contextualText, /groom|grooming/i, "learned business type did not shape the visible realization");
assert.match(contextualText, /Coco|rough|polished|service/i, "contextual realization lost the supplied subject/reality");
assert.doesNotMatch(contextualText, /bath completed|nail trim completed|employee|groomer smiled|owner watched/i, "business context invented a concrete event/actor");
assert.doesNotMatch(contextlessText, /Elm St Dog Grooming/i, "business identity leaked without business context");

console.log("PASS · learned business context changes the Author world without becoming invented reality");
