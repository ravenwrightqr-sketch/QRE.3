/**
 * QRE AUTHOR BEAT TRUTH GATE
 *
 * The upstream movie planner is a hypothesis generator. It is NOT a source of
 * facts. This gate converts a beat from free-form narrative claims into a
 * licensed evidence set plus a creative relationship. The mouth is allowed to
 * be inventive only inside that boundary.
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

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function words(value: string): Set<string> {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 3));
}

function parse(raw: string): {
  evidenceIndices?: unknown;
  creativeOpportunity?: unknown;
  forbiddenClaims?: unknown;
} | undefined {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(text) as Record<string, unknown>;
    return value && typeof value === "object" ? value : undefined;
  } catch {
    return undefined;
  }
}

function normalizeIndices(value: unknown, size: number): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item < size))];
}

function normalizeEvidence(evidence: string[]): string[] {
  return [...new Set(evidence.map(clean).filter(Boolean))].slice(0, 16);
}

export async function groundAuthorBeat(input: {
  subject?: string;
  facts: string[];
  moments: string[];
  memory: string[];
  beat: {
    order: number;
    role: string;
    gainKind: string;
    change?: string;
    frontier?: string;
    nextNeed?: string;
    necessity?: string;
  };
}): Promise<GroundedBeat> {
  // Stable identity attributes remain attached to the subject. They do not
  // become independent story entities unless the actual prompt/memory makes
  // the attribute narratively relevant.
  const genderPattern = /^(?:male|female|man|woman|boy|girl|gender|he|she|him|her|his|hers)$/i;
  const rawEvidence = normalizeEvidence([...input.facts, ...input.moments, ...input.memory]);
  const identityEvidence = rawEvidence.filter((item) => genderPattern.test(item));
  const narrativeEvidence = rawEvidence.filter((item) => !genderPattern.test(item));

  const system = [
    "You are QRE's AUTHOR BEAT TRUTH GATE.",
    "This is an epistemic firewall between a generative movie planner and the final author.",
    "The upstream beat is a HYPOTHESIS, never evidence. Treat every concrete claim inside it as untrusted until licensed by SUPPLIED_EVIDENCE.",
    "You MUST select evidence only by integer index from SUPPLIED_EVIDENCE. Never create, merge, embellish, or paraphrase a new fact.",
    "Do not use the gate to delete source evidence. SUPPLIED_EVIDENCE is the complete available truth set. The creative author decides which evidence matters for a specific line.",
    "SUBJECT IDENTITY RULE: gender/sex labels are neutral subject metadata by default, not a second character, plot device, theme, conflict, or creative relationship. Never invent a 'male character', 'female character', 'male pride', 'female energy', romance, masquerade, or identity conflict from a gender attribute alone.",
    "If the prompt does not explicitly make gender narratively meaningful, ignore it for creative search. The subject remains fully itself regardless of gender.",
    "Breed, coat color, name, size, or other stable identity metadata should likewise remain subject context unless the supplied reality or prompt makes the attribute materially relevant to the chosen movie.",
    "Classify unsupported upstream claims as forbiddenClaims. Examples: 'returns in a bow tie' is unsupported if the source separately says returned, bows, ties but never says they are worn together; 'dances with a ball' is unsupported if no dance is supplied; 'everyone is surprised' is unsupported if no reaction is supplied.",
    "CreativeOpportunity is NOT a scene description. It must be a relationship between narrative evidence items: collision, contrast, double meaning, juxtaposition, status tension, repetition, callback, or character-specific absurdity.",
    "CreativeOpportunity must NOT assert an action, event, location, body position, wardrobe placement, reaction, outcome, dialogue, chronology, or causal explanation.",
    "Good creativeOpportunity: 'bows + balls create a comic word collision'. Good: 'returned + happy gives the arrival a buoyant tone'. Good: 'ties + bows create a double-meaning opportunity'.",
    "Bad creativeOpportunity: 'Coco dances with a ball'. Bad: 'Coco wears a bow tie'. Bad: 'everyone is surprised'. Bad: 'male pride'. Bad: 'male character'.",
    "Do not judge the final sentence. Preserve the strongest creative possibility that remains true.",
    "If the upstream beat is poisoned, discard the poisoned claim. Do NOT try to rescue it by guessing what probably happened.",
    "Return JSON with evidenceIndices, creativeOpportunity, forbiddenClaims.",
  ].join("\n");

  const user = JSON.stringify({
    SUBJECT: input.subject ?? "",
    SUPPLIED_EVIDENCE: rawEvidence.map((text, index) => ({ index, text })),
    NARRATIVE_EVIDENCE: narrativeEvidence,
    IDENTITY_METADATA: identityEvidence,
    UPSTREAM_BEAT: input.beat,
  });

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    "json",
    { numPredict: 360, temperature: 0.05 },
  );

  const parsed = parse(result.text);
  const indices = normalizeIndices(parsed?.evidenceIndices, rawEvidence.length);
  const approvedEvidence = rawEvidence;
  const selectedNarrative = indices
    .map((index) => rawEvidence[index])
    .filter(Boolean)
    .filter((item) => !genderPattern.test(item));

  const modelOpportunity = clean(parsed?.creativeOpportunity);
  const forbiddenIdentityPattern = /\b(?:male|female|man|woman|boy|girl|gender|masquerade|pride|traditional|modern|camaraderie|romantic relationship|male character|female character)\b/i;
  const concreteClaimPattern = /\b(?:wears?|wearing|dances?|dancing|holds?|holding|walks?|walking|runs?|running|sits?|sitting|stands?|standing|returns? in|comes? home|arrives?|arriving|everyone|someone|nobody|surprised|shocked|laughs?|laughing|catches?|caught|ties? (?:a|the) knot)\b/i;
  const fallbackPool = selectedNarrative.length ? selectedNarrative : narrativeEvidence;
  const creativeOpportunity = modelOpportunity && !concreteClaimPattern.test(modelOpportunity) && !forbiddenIdentityPattern.test(modelOpportunity)
    ? modelOpportunity
    : `Find the sharpest relationship among: ${fallbackPool.join("; ")}`;

  const forbiddenClaims = Array.isArray(parsed?.forbiddenClaims)
    ? parsed!.forbiddenClaims.map(clean).filter(Boolean).slice(0, 16)
    : [];

  return {
    order: input.beat.order,
    role: input.beat.role,
    gainKind: input.beat.gainKind,
    approvedEvidence,
    creativeOpportunity,
    forbiddenClaims,
    sourceBoundary: "Approved evidence is the complete supplied truth set. Stable identity metadata is subject context by default, not an independent character or plot driver. The upstream beat is never evidence. Creative phrasing may reinterpret relationships but may not add concrete events, actions, physical states, reactions, or outcomes.",
  };
}
