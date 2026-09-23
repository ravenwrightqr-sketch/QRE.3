import type { AuthorDomainContext } from "@qre/contracts";
import {
  deriveAuthorCreativeFrameCandidates,
  searchAuthorCreativeLensTreatments,
  selectAuthorCreativeFrame,
  type AuthorCreativeEvent,
  type AuthorCreativeTreatment,
  type AuthorSemanticPlan,
} from "./src/services/authorCreative.js";

const suppliedReality: AuthorCreativeEvent[] = [
  { id: "event-1", text: "arrived at 9:04" },
  { id: "event-2", text: "cleaned the kitchen" },
  { id: "event-3", text: "cleaned two bathrooms" },
  { id: "event-4", text: "finished at 11:47" },
];

const domainContext: AuthorDomainContext = {
  experienceMode: "MEMORY",
  category: "SERVICE",
  serviceType: "HOUSEKEEPING",
};

const frameCandidates = deriveAuthorCreativeFrameCandidates({
  subject: "housekeeping service",
  suppliedReality,
  domainContext,
});

const selectedFrame = selectAuthorCreativeFrame({
  candidates: frameCandidates,
});

if (selectedFrame.frame !== "operation") {
  throw new Error(`Expected deterministic selectedFrame=operation, got ${selectedFrame.frame}`);
}

const plan: AuthorSemanticPlan = {
  thesis: "Bounded housekeeping work progresses from arrival through completed tasks to finish time.",
  beats: suppliedReality.map((event, index) => ({
    order: index + 1,
    role:
      index === 0
        ? "HOOK"
        : index === suppliedReality.length - 1
          ? "PAYOFF"
          : "BUILD",
    eventIds: [event.id],
    attention: event.text,
    change: "Use this supplied housekeeping event as operational material without adding facts.",
  })),
};

function printTreatment(index: number, treatment: {
  treatment: string;
  devices: readonly string[];
  intensity: string;
}): void {
  console.log(`${index}. ${treatment.treatment}`);
  console.log(`   devices: ${treatment.devices.join(", ")}`);
  console.log(`   intensity: ${treatment.intensity}`);
}

console.log("=== LENS CALIBRATION: HOUSEKEEPING ===");
console.log("");
console.log("SELECTED FRAME");
console.log(selectedFrame.frame);

const lens = await searchAuthorCreativeLensTreatments({
  subject: "housekeeping service",
  suppliedReality,
  plan,
  creativeOpportunity: "The supplied work has a bounded operational progression.",
  relation: "arrival, task completion, and finish time make the service read as a contained operation.",
  experienceMode: domainContext.experienceMode,
  requestedLens: undefined,
  domainContext,
  selectedFrame,
  frameCandidates,
});

console.log("");
console.log("RAW TREATMENT RESPONSE");
console.log(lens.rawTreatmentResponse);

console.log("");
console.log("ACCEPTED TREATMENTS");
lens.acceptedTreatments.forEach((treatment, index) => printTreatment(index + 1, treatment));

console.log("");
console.log("REJECTED TREATMENTS");
if (!lens.rejectedTreatments.length) {
  console.log("- none");
} else {
  for (const rejected of lens.rejectedTreatments) {
    const treatment: AuthorCreativeTreatment = rejected.treatment;
    console.log(`- ${treatment.treatment} / ${rejected.reason}`);
  }
}

console.log("");
console.log("MODEL CALLS");
console.log(lens.modelCalls);
