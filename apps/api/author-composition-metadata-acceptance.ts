import { buildAuthorRealityGraph } from "./src/services/authorRealityGraph.js";

const graph = buildAuthorRealityGraph({
  prompt: "Housekeeping reset",
  subject: "Maria",
  place: "555 Elm St",
  facts: [
    "9:04",
    "Maria cleaned the kitchen",
    "Maria cleaned bathroom one",
    "Maria cleaned bathroom two",
    "11:47",
  ],
  sourceMoments: ["photo 1", "33.9812, -117.3755"],
});

const labels = graph.events.map((event) => event.label);
const forbidden = labels.filter((label) => /^(?:(?:at|@)\s*)?(?:\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|today|yesterday|tomorrow)$/i.test(label));
if (forbidden.length) throw new Error(`METADATA BECAME SEQUENCE EVENT: ${forbidden.join(" | ")}`);
if (graph.events.length !== 3) throw new Error(`EXPECTED 3 composition events, got ${graph.events.length}`);
if (graph.evidence.length !== 7) throw new Error(`EXPECTED all supplied evidence to remain preserved, got ${graph.evidence.length}`);
if (!graph.evidence.some((item) => item.text === "9:04")) throw new Error("TIMESTAMP LOST FROM EVIDENCE");
if (!graph.evidence.some((item) => item.text === "photo 1")) throw new Error("PHOTO METADATA LOST FROM EVIDENCE");
if (!graph.evidence.some((item) => item.text === "33.9812, -117.3755")) throw new Error("GEO METADATA LOST FROM EVIDENCE");
console.log("METADATA PRESERVED AS EVIDENCE: PASS");
console.log("TIMES DO NOT CONSUME MOVIE BEATS: PASS");
console.log("GEO/PHOTO DO NOT CONSUME MOVIE BEATS: PASS");
console.log("COMPOSITION METADATA BOUNDARY: COMPLETE");
