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

function rankEvidence(evidence: string[], beat: GroundedBeat["order"] extends number ? { change?: string; frontier?: string; nextNeed?: string; necessity?: string } : never): number[] {
  const query = words([beat.change ?? "", beat.frontier ?? "", beat.nextNeed ?? "", beat.necessity ?? ""].join(" "));
  const ranked = evidence.map((text, index) => {
    const candidate = words(text);
    let overlap = 0;
    for (const word of query) if (candidate.has(word)) overlap += 1;
    return { index, score: overlap / Math.max(1, candidate.size) };
  });
  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  const useful = ranked.filter((item) => item.score > 0).slice(0, 4).map((item) => item.index);
  return useful.length ? useful : evidence.slice(0, Math.min(3, evidence.length)).map((_, index) => index);
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
  const evidence = [...input.facts, ...input.moments, ...input.memory]
    .map(clean)
    .filter(Boolean);

  const fallbackIndices = rankEvidence(evidence, input.beat);
  const fallbackEvidence = fallbackIndices.map((index) => evidence[index]).filter(Boolean);

  const system = [
    "You are QRE's AUTHOR BEAT TRUTH GATE.",
    "This is an epistemic firewall between a generative movie planner and the final author.",
    "The upstream beat is a HYPOTHESIS, never evidence. Treat every concrete claim inside it as untrusted until licensed by SUPPLIED_EVIDENCE.",
    "You MUST select evidence only by integer index from SUPPLIED_EVIDENCE. Never create, merge, embellish, or paraphrase a new fact.",
    "Classify unsupported upstream claims as forbiddenClaims. Examples: 'returns in a bow tie' is unsupported if the source separately says returned, bows, ties but never says they are worn together; 'dances with a ball' is unsupported if no dance is supplied; 'everyone is surprised' is unsupported if no reaction is supplied.",
    "CreativeOpportunity is NOT a scene description. It must be a relationship between selected evidence items: collision, contrast, double meaning, juxtaposition, status tension, repetition, callback, or character-specific absurdity.",
    "CreativeOpportunity must NOT assert an action, event, location, body position, wardrobe placement, reaction, outcome, dialogue, chronology, or causal explanation.",
    "Good creativeOpportunity: 'bows + balls create a comic word collision'. Good: 'male identity changes how bows and ties read'. Good: 'returned + happy gives the arrival a buoyant tone'.",
    "Bad creativeOpportunity: 'Coco dances with a ball'. Bad: 'Coco wears a bow tie'. Bad: 'everyone is surprised'.",
    "Do not judge the final sentence. Preserve the strongest creative possibility that remains true.",
    "If the upstream beat is poisoned, discard the poisoned claim. Do NOT try to rescue it by guessing what probably happened.",
    "Return JSON with evidenceIndices, creativeOpportunity, forbiddenClaims.",
  ].join("\n");

  const user = JSON.stringify({
    SUBJECT: input.subject ?? "",
    SUPPLIED_EVIDENCE: evidence.map((text, index) => ({ index, text })),
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
  const selectedIndices = indices.length ? indices : fallbackIndices;
  const approvedEvidence = selectedIndices.map((index) => evidence[index]).filter(Boolean).slice(0, 5);

  const modelOpportunity = clean(parsed?.creativeOpportunity);
  const concreteClaimPattern = /\b(?:wears?|wearing|dances?|dancing|holds?|holding|walks?|walking|runs?|running|sits?|sitting|stands?|standing|returns? in|comes? home|arrives?|arriving|everyone|someone|nobody|surprised|shocked|laughs?|laughing|catches?|caught|ties? (?:a|the) knot)\b/i;
  const creativeOpportunity = modelOpportunity && !concreteClaimPattern.test(modelOpportunity)
    ? modelOpportunity
    : `Find the sharpest relationship among: ${approvedEvidence.join("; ")}`;

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
    sourceBoundary: "Only approved evidence may become a concrete factual claim. The upstream beat is never evidence. Creative phrasing may reinterpret relationships but may not add concrete events, actions, physical states, reactions, or outcomes.",
  };
}
