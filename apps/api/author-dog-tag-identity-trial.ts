import { discoverAuthorCreativeDirection } from "./src/services/authorCreativeDiscovery.js";
import { createAuthorExperience } from "./src/services/authorCreative.js";

const suppliedReality = [
  { id: "identity-name", text: "Name: Milo." },
  { id: "identity-species", text: "Species: dog." },
  { id: "identity-like-walks", text: "Milo loves walks." },
  { id: "identity-like-bacon", text: "Milo loves bacon." },
  { id: "identity-like-small-dogs", text: "Milo loves small dogs." },
] as const;

const domainContext = {
  experienceMode: "IDENTITY",
  category: "PET_IDENTITY",
};

console.log("\n============================================================");
console.log("QRE DOG TAG IDENTITY TRIAL");
console.log("QUESTION: Can simultaneous supplied truths become character");
console.log("without inventing an event, biography, motive, or history?");
console.log("============================================================\n");

console.log("SUPPLIED REALITY");
for (const fact of suppliedReality) {
  console.log(`- ${fact.id}: ${fact.text}`);
}

const discoveryResult = await discoverAuthorCreativeDirection({
  events: suppliedReality,
  domainContext,
});

console.log("\nDISCOVERY");
console.log(JSON.stringify(discoveryResult.discovery, null, 2));

const experience = await createAuthorExperience({
  subject: "Milo",
  suppliedReality,
  creativeDiscovery: discoveryResult.discovery,
  domainContext,
});

console.log("\nSEMANTIC PLAN");
console.log(JSON.stringify(experience.diagnostics.plan, null, 2));

console.log("\nCREATIVE NOTICE");
console.log(JSON.stringify(experience.diagnostics.creativeNotice, null, 2));

console.log("\nCREATIVE TREATMENTS");
console.log(JSON.stringify(experience.diagnostics.creativeTreatments, null, 2));

console.log("\nWHOLE PRODUCTIONS");
console.log(JSON.stringify(experience.diagnostics.memoryProductions ?? [], null, 2));

console.log("\nSELECTED PRODUCTION");
console.log(experience.diagnostics.selectedProduction ?? "NONE");

console.log("\nFINAL SCENES");
for (const scene of experience.scenes) {
  console.log(`- ${scene.text ?? scene.description ?? scene.title ?? ""}`);
}

const suppliedIds = new Set(suppliedReality.map((fact) => fact.id));
const provenanceViolations = experience.scenes
  .flatMap((scene) => scene.sourceEventIds)
  .filter((id) => !suppliedIds.has(id));

if (provenanceViolations.length) {
  console.error("\nFAIL | invented provenance ids");
  console.error(provenanceViolations);
  process.exitCode = 1;
} else {
  console.log("\nPASS | all scene provenance stays inside supplied identity facts");
}

console.log("\nHUMAN-EYE BAR");
console.log("- Does this feel like Milo rather than a prettier list?");
console.log("- Did QRE discover a character perception from the combination?");
console.log("- Did it avoid inventing a walk, bacon incident, dog encounter, routine, or biography?");
console.log("- Can the viewer construct part of Milo themselves?");
console.log("- Did QRE stop before explaining the joke/meaning?");
console.log("- Would removing one of the preference facts materially change the conception?");
