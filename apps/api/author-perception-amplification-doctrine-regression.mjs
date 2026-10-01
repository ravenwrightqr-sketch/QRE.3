import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./src/services/authorCreative.ts", import.meta.url), "utf8");

function sliceBetween(startNeedle, endNeedle, label) {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start);
  assert.ok(start >= 0, `${label} start not found`);
  assert.ok(end > start, `${label} end not found`);
  return source.slice(start, end);
}

const mouthPrompt = sliceBetween(
  '"You are QRE Mouth."',
  "...(presentationContext ? [presentationContext] : [])",
  "Mouth prompt",
);
const directAuthorPromptRegion = sliceBetween(
  "export function buildDirectAuthorMemoryMessages",
  "function buildDeterministicMouthFallback",
  "Direct Creative Author prompt",
);
const claimAuditorPrompt = sliceBetween(
  "async function editDirectAuthorReality",
  "async function assignDirectAuthorProductionProvenance",
  "Claim Auditor prompt",
);

const mojibakePattern = new RegExp(`[${String.fromCharCode(226)}${String.fromCharCode(65533)}]`);
const forbiddenPhrasePattern = (parts) => new RegExp(parts.join(""), "i");

for (const badPattern of [
  mojibakePattern,
  forbiddenPhrasePattern(["what-the", "-fuck"]),
  forbiddenPhrasePattern(["Reject only", " when"]),
  forbiddenPhrasePattern(["Mouth owns language", " and sequence"]),
  forbiddenPhrasePattern(["short", " realizations"]),
]) {
  assert.doesNotMatch(mouthPrompt, badPattern, `Mouth prompt must not contain ${badPattern}`);
}

assert.match(
  mouthPrompt,
  /Rhetorical transformation is wide open\./,
  "Mouth must allow expressive nonliteral framing",
);
assert.match(
  mouthPrompt,
  /Keep the rhetorical world in expression and every concrete world commitment inside supplied evidence\./,
  "Mouth must distinguish expressive language from concrete occurrence",
);
assert.match(
  mouthPrompt,
  /Keep concrete participants, actions, states, chronology, and outcomes inside the cited facts\./,
  "Mouth must preserve the general rhetorical-frame invariant",
);
assert.match(
  mouthPrompt,
  /Discover aggressively, interpret boldly, compress freely, and give disproportionate attention to the interesting thing\./,
  "Mouth must use positive generative language",
);
assert.match(
  mouthPrompt,
  /Surprise must be discovered from the material rather than cosmetically added\./,
  "Mouth must not carry a standing instruction to manufacture weirdness",
);
assert.match(
  mouthPrompt,
  /Structure Planner may provide structural and ordering affordances\./,
  "Mouth prompt must preserve Structure Planner ownership",
);
assert.match(
  mouthPrompt,
  /Creative cognition discovers relationships and perception movement\./,
  "Mouth prompt must preserve Creative cognition ownership",
);
assert.match(
  mouthPrompt,
  /Mouth owns final verbal realization and may compress, combine, omit, or express selectively inside those constraints\./,
  "Mouth must own realization without owning factual chronology",
);
assert.match(
  mouthPrompt,
  /Use no more language than the realization earns\./,
  "Mouth must not optimize for shortness itself",
);
assert.match(
  mouthPrompt,
  /A tiny line may be right\. A complete sentence may be right\. A longer turn may be right when the thought requires it\./,
  "Mouth must allow variable earned length",
);
assert.match(
  mouthPrompt,
  /A sequence is complete when its supported perception lands\. All unused supplied facts remain preserved in provenance\./,
  "Mouth continuation must seek information gain rather than unused-fact coverage",
);
assert.match(
  mouthPrompt,
  /Keep factual chronology fixed\. Expressive attention may compress, combine, omit, or select without tracking beat-by-beat chronology\./,
  "Mouth must not rewrite factual chronology",
);
assert.match(
  mouthPrompt,
  /Amplify the supported meaning through rhetorical scale, perspective, status, double meaning, or personification\./,
  "Mouth must keep rhetorical-frame vocabulary in language",
);

assert.match(
  directAuthorPromptRegion,
  /Facts are material, not output slots\./,
  "Direct Author must preserve fact count != move count",
);
assert.match(
  directAuthorPromptRegion,
  /Notice something worth saying\./,
  "Direct Author must target noticing over fact enumeration",
);
assert.match(
  directAuthorPromptRegion,
  /Change perspective while keeping concrete occurrence inside supplied reality\./,
  "Direct Author must carry the perspective/reality distinction",
);
assert.match(
  directAuthorPromptRegion,
  /Keep every concrete participant, event, action, interaction, object, place, physical behavior, observation, mental state, sensory fact, causality, and outcome inside supplied reality\./,
  "Direct Author must not be authorized to invent concrete actions or events",
);
assert.equal(
  createHash("sha256").update(directAuthorPromptRegion).digest("hex"),
  "b96580a5720514b3c3755ced9a5a75d69abe153f16d45f84c428e04ecccfe441",
  "Direct Author prompt hash must match the perception/amplification doctrine revision",
);

assert.match(
  claimAuditorPrompt,
  /You are the Claim Auditor\./,
  "Claim Auditor must retain downstream truth authority",
);
assert.match(
  claimAuditorPrompt,
  /Classify each span as exactly SUPPORTED_REALITY, KEEP_EXPRESSION, or UNSUPPORTED_REALITY\./,
  "Claim Auditor classifications must remain authoritative",
);
assert.match(
  claimAuditorPrompt,
  /Do not rewrite, improve, summarize, paraphrase, replace, repair, or create prose\./,
  "Reality Editor must not become an authoring layer",
);

console.log("AUTHOR PERCEPTION/AMPLIFICATION DOCTRINE GREEN - POSSIBILITY IN MOUTH - AUTHORITY DOWNSTREAM");
