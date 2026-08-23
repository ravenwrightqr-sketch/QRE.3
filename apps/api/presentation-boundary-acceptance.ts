import { presentExperienceForClient } from "./src/middleware/presentationBoundary.js";

const polluted = presentExperienceForClient({
  title: "Coco",
  blueprint: { metadata: { cognitiveAuthorContext: "HIDDEN" } },
  cognition: { intent: "HIDDEN" },
  moments: [
    { type: "message", order: 0, text: "INTENT: make a living dog tag for coco | KNOWN ASSET FACTS: nonsense" },
  ],
  cinematicScenes: [
    {
      id: "bad-1",
      duration: 1400,
      moment: {
        type: "message",
        text: "make a living dog tag for coco: pet:: dog: story: cinematic_video: cinematic:: CURRENT FACTS: garbage",
        meta: { diagnostics: "must never reach client" },
      },
    },
    {
      id: "good-1",
      duration: 1400,
      moment: {
        type: "message",
        text: "Coco arrived nervous.",
        meta: { realityEventId: "hidden" },
      },
    },
  ],
});

if (polluted.cinematicScenes.length !== 1) {
  throw new Error("PRESENTATION BOUNDARY FAILED: polluted scene was not removed");
}
if (polluted.cinematicScenes[0]?.moment?.text !== "Coco arrived nervous.") {
  throw new Error("PRESENTATION BOUNDARY FAILED: clean scene was altered");
}
if ("blueprint" in polluted || "cognition" in polluted) {
  throw new Error("PRESENTATION BOUNDARY FAILED: internal payload leaked");
}

console.log("PRESENTATION BOUNDARY ACCEPTANCE: PASS");
