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

function rankEvidence(evidence: string[], beat: { change?: string; frontier?: string; nextNeed?: string; necessity?: string }): number[] {
  const query = words([beat.change ?? "", beat.frontier ?? "", beat.nextNeed ?? "", beat.necessity ?? ""].join(" "));
  const ranked = evidence.map((text, index) => {
    const candidate = words(text);
    let overlap = 0;
    for (const word of query) if (candidate.has(word)) overlap += 1;
    return { index, score: overlap / Math.max(1, candidate.size) };
  });
  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  const useful = ranked.filter((item) => item.score > 0).slice(0, 6).map((item) => item.index);
  return useful.length ? useful : evidence.slice(0, Math.min(6, evidence.length)).map((_, index) => index);
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
  const genderPattern = /^(?:male|female|man|woman|boy|girl|gender|he|she|him|her|his|hers)$/i;
  const rawEvidence = normalizeEvidence([...input.facts, ...input.moments, ...input.memory]);
  const narrativeEvidence = rawEvidence.filter((item) => !genderPattern.test(item));
  const identityEvidence = rawEvidence.filter((item) => genderPattern.test(item));
  const evidence = narrativeEvidence.length ? narrativeEvidence : rawEvidence;

  const fallbackIndices = rankEvidence(evidence, input.beat);
  const fallbackEvidence = fallbackIndices.map((index) => evidence[index]).filter(Boolean);

  const system = [
    "You are QRE's AUTHOR BEAT TRUTH GATE.",
    "This is an epistemic firewall between a generative movie planner and the final author.",
    "The upstream beat is a HYPOTHESIS, never evidence. Treat every concrete claim inside it as untrusted until licensed by SUPPLIED_EVIDENCE.",
    "You MUST select evidence only by integer index from SUPPLIED_EVIDENCE. Never create, merge, embellish, or paraphrase a new fact.",
    "Do not throw away supplied narrative evidence merely because the current beat does not mention it. The complete narrative evidence remains eligible for later creative search.",
    "SUBJECT IDENTITY RULE: gender/sex labels are neutral subject metadata by default, not a second character, plot device, theme, conflict, or creative relationship.",
    "If the prompt does not explicitly make gender narratively meaningful, ignore it for creative search. The subject remains fully itself regardless of gender.",
    "Breed, coat color, name, size, or other stable identity metadata should likewise remain subject context unless the supplied reality or prompt makes the attribute materially relevant to the chosen movie.",
    "Classify unsupported upstream claims as forbiddenClaims. Examples: 'returns in a bow tie' is unsupported if the source separately says returned, bows, ties but never says they are worn together; 'dances with a ball' is unsupported if no dance is supplied; 'everyone is surprised' is unsupported if no reaction is supplied.",
    "CREATIVE OPPORTUNITY is not a factual event. It may identify a latent relationship, character attitude, social stance, status framing, comparison, contrast, double meaning, or comic potential implied by supplied context.",
    "Character attitude is specifically allowed when it is grounded in supplied personality + situation. Example: 'fierce + grooming context suggests playful adversarial attitude toward the appointment.' This does NOT claim that an eyebrow was raised, a lawyer was hired, or any other event occurred.",
    "A social-frame opportunity may describe a possible COMPARISON or STANCE, not a literal event. Example: 'fierce + groomer lends itself to mock courtroom/negotiation framing.'",
    "Do not turn a creative opportunity into a scene description. It must remain a search direction for the mouth.",
    "Good creativeOpportunity: 'fierce + groomer lends itself to playful adversarial framing'. Good: 'returned + happy creates a buoyant comeback stance'. Good: 'bows + balls create a comic collision'.",
    "Bad creativeOpportunity: 'Coco raises an eyebrow'. Bad: 'Coco's groomer calls a lawyer'. Bad: 'everyone is surprised'. Bad: 'male pride'.",
    "Do not judge the final sentence. Preserve the strongest creative possibility that remains true.",
    "If the upstream beat is poisoned, discard the poisoned claim. Do NOT try to rescue it by guessing what probably happened.",
    "Return JSON with evidenceIndices, creativeOpportunity, forbiddenClaims.",
  ].join("\n");

  const user = JSON.stringify({
    SUBJECT: input.subject ?? "",
    SUPPLIED_EVIDENCE: evidence.map((text, index) => ({ index, text })),
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
  const indices = normalizeIndices(parsed?.evidenceIndices, evidence.length);

  const selectedIndices = evidence.length <= 12
    ? evidence.map((_, index) => index)
    : [...new Set([...indices, ...fallbackIndices])].slice(0, 12);
  const approvedEvidence = selectedIndices.map((index) => evidence[index]).filter(Boolean);

  const modelOpportunity = clean(parsed?.creativeOpportunity);
  const forbiddenIdentityPattern = /\b(?:male|female|man|woman|boy|girl|gender|masquerade|male pride|female energy|romantic relationship|male character|female character)\b/i;
  const concreteEventPattern = /\b(?:raises?|raised|eyebrow|lawyer|calls?|called|dances?|dancing|wears?|wearing|holds?|holding|walks?|walking|runs?|running|sits?|sitting|stands?|standing|arrives?|arriving|everyone|someone|nobody|surprised|shocked|laughs?|laughing|catches?|caught|ties? (?:a|the) knot)\b/i;
  const opportunitySignalPattern = /\b(?:attitude|stance|framing|comparison|contrast|collision|double meaning|status|social|personification|playful|adversarial|negotiation|comedic|absurd|reframe|relationship|tension|callback|comeback|buoyant|specific)\b/i;
  const creativeOpportunity = modelOpportunity && !concreteEventPattern.test(modelOpportunity) && !forbiddenIdentityPattern.test(modelOpportunity) && opportunitySignalPattern.test(modelOpportunity)
    ? modelOpportunity
    : `Find a characterful stance or social framing from: ${approvedEvidence.join("; ")}`;

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
    sourceBoundary: "Only approved narrative evidence may become a concrete factual claim. Stable identity metadata is subject context by default, not an independent character or plot driver. The upstream beat is never evidence. Creative phrasing may reinterpret relationships but may not add concrete events, actions, physical states, reactions, or outcomes as literal facts.",
  };
}
