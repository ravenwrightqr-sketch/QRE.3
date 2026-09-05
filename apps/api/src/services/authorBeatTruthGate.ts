/**
 * QRE AUTHOR BEAT TRUTH GATE
 *
 * The upstream movie planner is a hypothesis generator, never source reality.
 * This gate licenses supplied evidence and preserves creative framing without
 * allowing unsupported concrete claims to become viewer-facing reality.
 */
import { localModelGenerate } from "./localModelRuntime.js";

export type GroundedBeat = {
  order: number;
  role: string;
  gainKind: string;
  approvedEvidence: string[];
  creativeOpportunity: string;
  forbiddenClaims: string[];
  sourceBoundary: string;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function parse(raw: string): Record<string, unknown> | undefined {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(text) as Record<string, unknown>;
    return value && typeof value === "object" ? value : undefined;
  } catch {
    return undefined;
  }
}

function normalizeEvidence(values: string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))].slice(0, 32);
}

export async function groundAuthorBeat(input: {
  subject?: string;
  facts: string[];
  moments: string[];
  memory: string[];
  beat: {
    order: number;
    role: string;
    gainKind?: string;
    change?: string;
    frontier?: string;
    nextNeed?: string;
    necessity?: string;
  };
}): Promise<GroundedBeat> {
  const approvedEvidence = normalizeEvidence([...input.facts, ...input.moments, ...input.memory]);
  const identityPattern = /^(?:male|female|man|woman|boy|girl|gender|he|she|him|her|his|hers)$/i;
  const narrativeEvidence = approvedEvidence.filter((item) => !identityPattern.test(item));

  const system = [
    "You are QRE's AUTHOR BEAT TRUTH GATE.",
    "The upstream beat is hypothesis, not evidence.",
    "Select evidence only from SUPPLIED_EVIDENCE by integer index. Never create or embellish facts.",
    "Stable identity metadata is subject context by default, not a second character or plot device.",
    "CreativeOpportunity must describe a relationship among supplied evidence: contrast, collision, double meaning, juxtaposition, status tension, callback, repetition, or absurdity.",
    "CreativeOpportunity must not assert a new action, event, location, body position, reaction, outcome, dialogue, chronology, or causal explanation.",
    "Classify unsupported upstream claims as forbiddenClaims.",
    "Preserve the complete supplied evidence set in approvedEvidence. The chosen indices only identify the strongest evidence for this beat.",
    "Return JSON: evidenceIndices, creativeOpportunity, forbiddenClaims.",
  ].join("\n");

  const result = await localModelGenerate([
    { role: "system", content: system },
    { role: "user", content: JSON.stringify({
      SUBJECT: input.subject ?? "",
      SUPPLIED_EVIDENCE: approvedEvidence.map((text, index) => ({ index, text })),
      NARRATIVE_EVIDENCE: narrativeEvidence,
      UPSTREAM_BEAT: input.beat,
    }) },
  ], "json", { numPredict: 360, temperature: 0.05 });

  const parsed = parse(result.text);
  const indices = Array.isArray(parsed?.evidenceIndices)
    ? [...new Set(parsed.evidenceIndices.map(Number).filter((index) => Number.isInteger(index) && index >= 0 && index < approvedEvidence.length))]
    : [];
  const selected = indices.map((index) => approvedEvidence[index]).filter(Boolean).filter((item) => !identityPattern.test(item));

  const forbidden = Array.isArray(parsed?.forbiddenClaims)
    ? parsed.forbiddenClaims.map(clean).filter(Boolean).slice(0, 16)
    : [];
  const modelOpportunity = clean(parsed?.creativeOpportunity);
  const unsafeOpportunity = /\b(?:wears?|wearing|dances?|dancing|holds?|holding|walks?|walking|runs?|running|sits?|sitting|stands?|standing|arrives?|arriving|everyone|someone|nobody|surprised|shocked|laughs?|laughing|catches?|caught)\b/i.test(modelOpportunity);
  const fallback = selected.length ? selected : narrativeEvidence;
  const creativeOpportunity = modelOpportunity && !unsafeOpportunity
    ? modelOpportunity
    : `Find the sharpest relationship among: ${fallback.join("; ")}`;

  return {
    order: input.beat.order,
    role: clean(input.beat.role) || "discovery",
    gainKind: clean(input.beat.gainKind) || "discovery",
    approvedEvidence,
    creativeOpportunity,
    forbiddenClaims: forbidden,
    sourceBoundary: "The upstream beat is never evidence. Supplied evidence is preserved in full. Creative language may reframe relationships but may not add concrete events, actions, physical states, reactions, outcomes, or locations.",
  };
}
