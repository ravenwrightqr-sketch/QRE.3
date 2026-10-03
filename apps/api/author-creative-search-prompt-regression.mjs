import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");
const promptStart = source.indexOf('"You are QRE Creative Search."');
const promptEnd = source.indexOf('"Protect strange thinking; police factual invention later."', promptStart);

assert.ok(promptStart >= 0, "Creative Search prompt not found");
assert.ok(promptEnd > promptStart, "Creative Search prompt end not found");

const prompt = source.slice(promptStart, promptEnd + 80);
const userInstructionStart = source.indexOf("Return exactly eight independent notices", promptEnd);
assert.ok(userInstructionStart > promptEnd, "Creative Search user instruction not found");
const userInstruction = source.slice(userInstructionStart, userInstructionStart + 700);
const schemaStart = source.indexOf("jsonSchema:", userInstructionStart);
const schemaEnd = source.indexOf(").catch", schemaStart);
assert.ok(schemaStart > userInstructionStart, "Creative Search schema not found");
assert.ok(schemaEnd > schemaStart, "Creative Search schema end not found");
const schema = source.slice(schemaStart, schemaEnd);
const mouthPromptStart = source.indexOf('"You are QRE Mouth."');
const mouthPayloadStart = source.indexOf("content: JSON.stringify({", mouthPromptStart);
const mouthPayloadEnd = source.indexOf("instruction:", mouthPayloadStart);
const mouthSchemaStart = source.indexOf("jsonSchema:", mouthPayloadEnd);
const mouthSchemaEnd = source.indexOf(").catch", mouthSchemaStart);
assert.ok(mouthPromptStart >= 0, "Mouth prompt not found");
assert.ok(mouthPayloadStart > mouthPromptStart, "Mouth payload not found");
assert.ok(mouthPayloadEnd > mouthPayloadStart, "Mouth payload end not found");
assert.ok(mouthSchemaStart > mouthPayloadEnd, "Mouth schema not found");
assert.ok(mouthSchemaEnd > mouthSchemaStart, "Mouth schema end not found");
const mouthPromptAndPayload = source.slice(mouthPromptStart, mouthPayloadEnd + 1200);
const mouthPayload = source.slice(mouthPayloadStart, mouthPayloadEnd);
const mouthSchema = source.slice(mouthSchemaStart, mouthSchemaEnd);
const searchFunctionStart = source.indexOf("export async function searchAuthorCreativeLensTreatments");
const searchFunctionEnd = source.indexOf("const fallbackGravity", searchFunctionStart);
assert.ok(searchFunctionStart >= 0, "Creative Search function not found");
assert.ok(searchFunctionEnd > searchFunctionStart, "Creative Search function end not found");
const searchFunction = source.slice(searchFunctionStart, searchFunctionEnd);

function mustContain(text, pattern, label) {
  assert.match(text, pattern, label);
}

function mustNotContain(text, pattern, label) {
  assert.doesNotMatch(text, pattern, label);
}

mustContain(
  prompt,
  /Reality is evidence for thought\./,
  "Creative Search must frame reality as evidence for thought",
);
mustContain(
  searchFunction,
  /localModelGenerate\([\s\S]*?numPredict:\s*1200,/,
  "Creative Search generation allowance must be 1200",
);
mustNotContain(
  searchFunction,
  /localModelGenerate\([\s\S]*?numPredict:\s*520,/,
  "Creative Search generation allowance must not regress to 520",
);
mustContain(
  prompt,
  /Keep evidence description, semantic translation, and explanatory reasoning private\./,
  "Creative Search must not ask for evidence description",
);
mustContain(
  prompt,
  /Give the thought made possible by the evidence\./,
  "Creative Search must not ask for evidence explanation",
);
mustContain(
  prompt,
  /semantic translation, and explanatory reasoning private/,
  "Creative Search must reject semantic translation",
);
mustContain(
  prompt,
  /Think because of the evidence, then give the thought\./,
  "Creative Search must skip intermediate explanation",
);
mustContain(
  prompt,
  /One supplied atom may support an entire conception\./,
  "Creative Search must allow one supplied atom to support a whole conception",
);
mustContain(
  prompt,
  /Unused supplied facts are completely legal\./,
  "Creative Search must allow unused supplied facts",
);
mustContain(
  prompt,
  /do not need to divide or collectively cover the supplied reality/i,
  "Creative Search must not require A/B/C to divide or collectively cover evidence",
);
mustContain(
  prompt,
  /Multiple conceptions may use the same evidence/i,
  "Creative Search must allow conceptions to reuse the same evidence",
);
mustContain(
  prompt,
  /evidenceEventIds are provenance only/i,
  "Creative Search must treat evidenceEventIds as provenance",
);
mustContain(
  prompt,
  /not output slots, rewrite assignments, coverage obligations/i,
  "Creative Search must not treat evidence as output or coverage assignment",
);
mustContain(
  prompt,
  /perception that was not already contained in the supplied fact wording/i,
  "Creative Search must ask for new perception rather than source explanation",
);
mustContain(
  prompt,
  /Keep concrete participation and world commitments inside supplied evidence: participants, objects, places, physical actions, interactions, observations, sensory facts, measurements, motives, outcomes, recurrence, physical conditions, causality, and chronology/i,
  "Creative Search must preserve closed-world concrete reality protection",
);
mustContain(
  prompt,
  /For each notice, return only conception and evidenceEventIds/i,
  "Creative Search must keep private notice fields narrow",
);
mustContain(
  prompt,
  /A treatment is not the conception repeated/i,
  "Creative Search must distinguish treatment from private conception",
);
mustContain(
  prompt,
  /creativePressure says what Mouth should do differently/i,
  "Creative Search must ask for treatment pressure",
);
mustContain(
  prompt,
  /Do not write public copy in Creative Search/i,
  "Creative Search must not ask treatments to write final lines",
);
mustContain(
  prompt,
  /Transform the rhetorical world, not the factual world/i,
  "Creative Search must preserve rhetorical/factual boundary",
);
mustContain(
  userInstruction,
  /exactly eight independent notices and exactly three public treatments/i,
  "Creative Search must keep eight private notices and three public treatments",
);
mustContain(
  userInstruction,
  /Each notice must contain only conception and evidenceEventIds/i,
  "Creative Search user instruction must require only conception and evidenceEventIds",
);
mustContain(
  userInstruction,
  /Each treatment must transform a selected conception through a distinct rhetorical operating mode/i,
  "Creative Search user instruction must require rhetorical treatment transformation",
);
mustContain(prompt, /Let the discovered relationship supply the pressure and the treatment accelerate it/,
  "Treatment must amplify discovered meaning");
mustContain(
  schema,
  /required:\s*\["notices", "treatments"\]/,
  "Creative Search schema must require notices and treatments",
);
mustContain(
  schema,
  /minItems:\s*8,\s*\n\s*maxItems:\s*8,/,
  "Creative Search schema must require exactly eight private notices",
);
mustContain(
  schema,
  /required:\s*\["evidenceEventIds", "conception"\]/,
  "Creative Search notice schema must require evidenceEventIds and conception",
);
mustContain(
  schema,
  /treatments:\s*\{\s*type:\s*"array",\s*minItems:\s*3,\s*maxItems:\s*3,/s,
  "Creative Search schema must require exactly three public treatments",
);
mustContain(
  schema,
  /required:\s*\[\s*"sourceNoticeIndex",\s*"evidenceEventIds",\s*"treatment",\s*"creativePressure",\s*"perceptionDelta",\s*"expressiveBehaviors",\s*"intensity",\s*\]/s,
  "Creative Search treatment schema must require rhetorical treatment fields",
);
mustNotContain(schema, /\battention\b/, "Creative Search schema must not contain attention");

for (const field of [
  "observation",
  "meaning",
  "interpretation",
  "relation",
  "rationale",
  "explanation",
  "theme",
  "lens",
]) {
  mustNotContain(
    schema,
    new RegExp(`\\b${field}\\b`, "i"),
    `Creative Search schema must not add replacement field ${field}`,
  );
}

mustContain(
  source,
  /const sourceRelation = "model-selected rhetorical treatment from private conception";/,
  "Creative Search must keep neutral downstream sourceRelation compatibility for model treatments",
);
mustContain(
  source,
  /export type AuthorCreativePrivateConception = \{\s*id: string;\s*sourceCandidateId: string;\s*evidenceEventIds: string\[\];\s*conception: string;\s*\};/s,
  "Creative Search must expose a typed private conception record",
);
mustContain(
  source,
  /privateConceptions:\s*AuthorCreativePrivateConception\[\];/,
  "Creative Search result must carry privateConceptions",
);
mustContain(
  source,
  /const privateConceptions:\s*AuthorCreativePrivateConception\[\]\s*=\s*rawNotices[\s\S]*?\.slice\(0,\s*8\);/,
  "Creative Search parsing must preserve up to eight private conceptions",
);
mustContain(
  source,
  /const rawTreatmentAssignments = Array\.isArray\(parsedLens\?\.treatments\)/,
  "Public treatments must parse the model treatment assignments",
);
mustContain(
  source,
  /const parsedModelTreatments:\s*AuthorCreativeTreatment\[\]\s*=\s*rawTreatmentAssignments/,
  "Public treatments must derive from explicit treatment records",
);
mustContain(
  source,
  /collapsedTreatment/,
  "Creative Search parser must detect collapsed conception/treatment/pressure fields",
);
mustContain(
  source,
  /directRhetoricalTreatmentLabel\(\)/,
  "Collapsed or missing treatments must repair to direct rhetorical realization",
);
mustContain(
  source,
  /const generatedExpressiveCount = modelTreatments\.length;/,
  "Public expressive treatment width must be counted from public model treatments only",
);
mustContain(
  source,
  /const privateCreativeField = lensSearch\.privateConceptions\.map\(\(conception\) => \(\{\s*id: conception\.id,\s*sourceCandidateId: conception\.sourceCandidateId,\s*evidenceEventIds: \[\.\.\.conception\.evidenceEventIds\],\s*conception: conception\.conception,\s*\}\)\);/s,
  "Mouth handoff must normalize the shared private creative field without inventing provenance",
);
mustContain(
  source,
  /const parsedTreatments:\s*AuthorCreativeTreatment\[\]\s*=\s*lensSearchEnabled\s*\?\s*\[\.\.\.modelTreatments,\s*deterministicBareTreatment\]\s*:\s*\[\];/,
  "Bare D must remain a separate deterministic fourth treatment",
);
mustContain(
  source,
  /id:\s*"treatment-4",\s*[\r\n]+\s*sourceCandidateId:\s*"bare",/,
  "Bare D must keep deterministic treatment-4 identity",
);
mustContain(
  source,
  /const writingTreatmentAssignments = usesProductionMajorMouth && lensSearchEnabled\s*\?\s*expressiveMouthTreatmentAssignments\(\{\s*assignments: treatmentAssignmentsForMouth,\s*privateConceptions: lensSearch\.privateConceptions,\s*selected,\s*suppliedReality: input\.suppliedReality,\s*\}\)\s*: treatmentAssignmentsForMouth;/s,
  "Production-major Mouth must derive unconditional A/B/C writing identities independently of accepted treatment count",
);
mustContain(
  source,
  /const AUTHOR_EXPRESSIVE_PRODUCTIONS = \["A", "B", "C"\] as const;/,
  "Memory Lens Mouth must keep public expressive production identities fixed at A/B/C",
);
mustContain(
  source,
  /accepted \?\? fallbackMouthTreatmentAssignment/,
  "Rejected treatment metadata must not delete the public A/B/C Mouth slot",
);
mustContain(
  source,
  /CREATIVE_TREATMENTS:\s*isMemoryMode\s*\?\s*writingTreatmentAssignments\.map/,
  "Mouth-facing CREATIVE_TREATMENTS must still come from public writing assignments",
);
mustContain(
  mouthPayload,
  /\.\.\.\(usesProductionMajorMouth && lensSearchEnabled \? \{ PRIVATE_CREATIVE_FIELD: privateCreativeField \} : \{\}\),\s*CREATIVE_TREATMENTS:/,
  "Mouth payload must send PRIVATE_CREATIVE_FIELD as one shared top-level field before public treatments",
);
mustContain(
  mouthPayload,
  /CREATIVE_TREATMENTS:\s*isMemoryMode\s*\?\s*writingTreatmentAssignments\.map\(\(assignment\) => \(\{\s*production: assignment\.production,\s*conception: assignment\.treatment,\s*treatment: assignment\.treatment,\s*creativePressure: assignment\.creativePressure,\s*perceptionDelta: assignment\.perceptionDelta,\s*expressiveBehaviors: assignment\.expressiveBehaviors,\s*intensity: assignment\.intensity,\s*evidenceEventIds: assignment\.evidenceEventIds,\s*\}\)\)/s,
  "Mouth public treatment identities must carry rhetorical treatment pressure",
);
mustContain(
  source,
  /Nominate the strongest viable expressive production by its production letter: A, B, or C\./,
  "Mouth-facing expressive production contract must remain A/B/C",
);
mustContain(
  mouthSchema,
  /minItems: lensSearchEnabled \? 3 : 4,\s*maxItems: lensSearchEnabled \? 3 : 4,/,
  "Mouth output schema must request exactly A/B/C in Memory Lens mode regardless of accepted treatment count",
);
mustContain(
  mouthSchema,
  /production:\s*\{ type: "string", enum: lensSearchEnabled \? \["A", "B", "C"\] : \["A", "B", "C", "D"\] \}/,
  "Mouth output production enum must remain A/B/C when lens search is enabled",
);
mustContain(
  mouthSchema,
  /selectedProduction:\s*\{\s*type: "string",\s*enum: lensSearchEnabled \? \["A", "B", "C"\] : \["A", "B", "C", "D"\],\s*\}/,
  "Mouth selectedProduction enum must remain A/B/C when lens search is enabled",
);
mustContain(
  mouthSchema,
  /required: \["order", "text", "sourceEventIds"\]/,
  "Mouth lines must still declare their own sourceEventIds",
);
mustContain(
  mouthPromptAndPayload,
  /PRIVATE_CREATIVE_FIELD is shared across A\/B\/C; each production may combine, ignore, reinterpret, or recontextualize entries from the field\./,
  "Mouth prompt must make the private creative field shared across A/B/C",
);
mustContain(
  mouthPromptAndPayload,
  /PRIVATE_CREATIVE_FIELD is optional creative cognition\. Mouth may use it, combine it, ignore it, or discover a stronger rhetorical stance directly from SUPPLIED_REALITY\./,
  "Mouth prompt must make the private creative field optional rather than the sole creative source",
);
mustContain(
  mouthPromptAndPayload,
  /Before writing, silently choose the most interesting rhetorical stance available inside the authorized world\./,
  "Mouth prompt must restore the recent rhetorical stance operating condition",
);
mustContain(
  mouthPromptAndPayload,
  /A rhetorical speaker is not necessarily the factual actor\./,
  "Mouth prompt must distinguish rhetorical speaker from factual actor",
);
mustContain(
  mouthPromptAndPayload,
  /The subject, an object or detail already present in supplied reality, or an outside narrator may temporarily carry rhetorical attitude without becoming a literal factual speaker\./,
  "Mouth prompt must allow nonliteral rhetorical attitude carriers",
);
mustContain(
  mouthPromptAndPayload,
  /Rhetorical speech, personification, opinion, judgment, social observation, attitude, implication, comparison, and self-aware contradiction are discourse, not documentary events\./,
  "Mouth prompt must preserve discourse/documentary boundary",
);
mustContain(
  mouthPromptAndPayload,
  /Convert authorized meaning into attitude, humor, rhetorical POV, judgment, implication, contradiction, comparison, personification, object\/subject voice, generalized or social observation, or sharp observation when reality supports it\./,
  "Mouth prompt must restore attitude realization modes",
);
mustContain(
  mouthPromptAndPayload,
  /The viewer should experience the attitude, not receive an explanation of the attitude\./,
  "Mouth prompt must prefer performed attitude over explanation",
);
mustContain(
  mouthPromptAndPayload,
  /Prefer a line that has a point of view over a line that merely describes significance\./,
  "Mouth prompt must prefer point of view over significance explanation",
);
mustContain(
  mouthPromptAndPayload,
  /Prefer specific attitude arising from this event over generic cleverness\./,
  "Mouth prompt must prefer event-specific attitude",
);
mustContain(
  mouthPromptAndPayload,
  /Do not simply copy PRIVATE_CREATIVE_FIELD wording\./,
  "Mouth prompt must forbid copying private field wording as public copy",
);
mustContain(
  mouthPromptAndPayload,
  /public factual commitments remain controlled by SUPPLIED_REALITY and each line's sourceEventIds/,
  "Mouth prompt must keep factual authority on supplied reality and line sourceEventIds",
);
mustNotContain(
  mouthPromptAndPayload,
  /assigned conception/i,
  "Mouth prompt must not preserve one-assigned-conception exclusivity",
);
mustContain(
  source,
  /privateConceptions:\s*lensSearch\.privateConceptions,/,
  "Creative Search diagnostics must expose privateConceptions",
);
mustNotContain(
  source,
  /parsedTreatments[\s\S]{0,160}privateConceptions[\s\S]{0,80}deterministicBareTreatment/,
  "Private conceptions must not be promoted wholesale into public treatments",
);

console.log("AUTHOR CREATIVE SEARCH PROMPT GREEN - NO ATTENTION FIELD - PROVENANCE ONLY - EIGHT PRIVATE CONCEPTIONS - THREE PUBLIC TREATMENTS");
