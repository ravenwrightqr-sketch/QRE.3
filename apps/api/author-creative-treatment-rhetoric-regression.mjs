import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");

assert.match(
  source,
  /required:\s*\["notices", "treatments"\]/,
  "Creative Search must return private conceptions and separate public treatments",
);

assert.match(
  source,
  /const rawTreatmentAssignments = Array\.isArray\(parsedLens\?\.treatments\)/,
  "Creative Search must parse model-authored treatment assignments",
);

assert.match(
  source,
  /A treatment is not the conception repeated\./,
  "Creative Search prompt must forbid conception/treatment collapse",
);

assert.match(
  source,
  /collapsedTreatment[\s\S]*?directRhetoricalTreatmentLabel\(\)/,
  "Collapsed conception/treatment/pressure fields must be repaired deterministically",
);

assert.match(
  source,
  /creativePressure:\s*directRhetoricalPressure\(privateConception\.conception\)/,
  "Fallback treatments must keep the conception as pressure instead of copying it into every field",
);

assert.match(
  source,
  /treatment:\s*directRhetoricalTreatmentLabel\(\)/,
  "Fallback treatments must use a rhetorical treatment identity rather than the conception text",
);

assert.doesNotMatch(
  source,
  /creativePressure:\s*privateConception\.conception,/,
  "Creative pressure must not directly copy private conception text",
);

assert.doesNotMatch(
  source,
  /treatment:\s*privateConception\.conception,/,
  "Treatment must not directly copy private conception text",
);

assert.match(
  source,
  /CREATIVE_TREATMENTS:\s*isMemoryMode\s*\?\s*writingTreatmentAssignments\.map\(\(assignment\) => \(\{[\s\S]*?creativePressure: assignment\.creativePressure,[\s\S]*?perceptionDelta: assignment\.perceptionDelta,[\s\S]*?expressiveBehaviors: assignment\.expressiveBehaviors,/,
  "Production-major Memory Mouth must receive treatment pressure and expressive behaviors",
);

console.log("AUTHOR CREATIVE TREATMENT RHETORIC GREEN - TREATMENTS SEPARATE FROM PRIVATE CONCEPTIONS");
