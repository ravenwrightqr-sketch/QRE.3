/**
 * QRE AUTHOR BEAT TRUTH GATE
 *
 * The upstream movie planner is a hypothesis generator, never a source of
 * facts. This gate also keeps subject attributes (for example `male`) attached
 * to the subject instead of allowing them to become a second character,
 * object, or free-floating creative theme.
 */
import { localModelGenerate } from "./localModelRuntime.js";

export type GroundedBeat = {
  order: number;
  role: string;
  gainKind: string;
  approvedEvidence: string[];
  subjectAttributes: string[];
  creativeOpportunity: string;
  forbiddenClaims: string[];
  sourceBoundary: string;
};

const SUBJECT_ATTRIBUTES = new Set([
  "male", "female", "man", "woman", "boy", "girl", "he", "she", "his", "her",
]);

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function key(value: string): string {
  return clean(value).toLowerCase().replace(/[“”‘’]/g, "'");
}

function words(value: string): Set<string> {
  return new Set(key(value).split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 3));
}

function isSubjectAttribute(value: string, subject: string): boolean {
  const normalized = key(value);
  if (SUBJECT_ATTRIBUTES.has(normalized)) return true;
  const subjectKey = key(subject);
  return Boolean(subjectKey) && new RegExp(`^${subjectKey}\\s+(?:is|was|(?:a|the)\\s+)?(?:male|female|man|woman|boy|girl)$`, "i").test(normalized);
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values.map(clean).filter(Boolean)) {
    const normalized = key(value);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(value);
  }
  return output;
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
  const subject = clean(input.subject);
  const evidence = dedupe([...input.facts, ...input.moments, ...input.memory]);
  const subjectAttributes = dedupe(evidence.filter((item) => isSubjectAttribute(item, subject)));
  const creativeEvidence = evidence.filter((item) => !isSubjectAttribute(item, subject));

  const fallbackIndices = rankEvidence(creativeEvidence.length ? creativeEvidence : evidence, input.beat);
  const fallbackPool = creativeEvidence.length ? creativeEvidence : evidence;
  const fallbackEvidence = fallbackIndices.map((index) => fallbackPool[index]).filter(Boolean).slice(0, 5);

  const system = [
    "You are QRE's AUTHOR BEAT TRUTH GATE.",
    "This is an epistemic firewall between a generative movie planner and the final author.",
    "The upstream beat is a HYPOTHESIS, never evidence. Treat every concrete claim inside it as untrusted until licensed by SUPPLIED_EVIDENCE.",
    "The SUBJECT is one entity. SUBJECT_ATTRIBUTES describe that entity. Never reinterpret a standalone attribute such as 'male' as a second person, character, relationship, event, or theme.",
    "Creative evidence is the material the mouth should search. Subject attributes are metadata and should remain quiet unless the approved beat genuinely benefits from the subject's identity.",
    "You MUST select creative evidence only by integer index from CREATIVE_EVIDENCE. Never create, merge, embellish, or paraphrase a new fact.",
    "Unsupported upstream claims belong in forbiddenClaims.",
    "CreativeOpportunity is NOT a scene description. It must be a compact relationship between supplied creative evidence. It may reference a subject attribute only as a modifier of the subject; never as another character.",
    "Allowed relationship types: collision, contrast, double meaning, juxtaposition, repetition, callback, status tension, character-specific absurdity, or recontextualization.",
    "Do NOT invent celebrations, traditions, symbolism, themes, emotional journeys, social reactions, causes, settings, or events unless explicitly supplied.",
    "Bad: 'Coco and the male character...' because male is an attribute of Coco. Bad: 'traditional vs modern' when no such categories were supplied.",
    "Good: 'bows + balls create a comic word collision'. Good: 'returned + bows make the arrival newly specific'.",
    "Return JSON with evidenceIndices, creativeOpportunity, forbiddenClaims.",
  ].join("\n");

  const user = JSON.stringify({
    SUBJECT: subject,
    SUBJECT_ATTRIBUTES: subjectAttributes,
    CREATIVE_EVIDENCE: fallbackPool.map((text, index) => ({ index, text })),
    UPSTREAM_BEAT: input.beat,
  });

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    "json",
    { numPredict: 320, temperature: 0.03 },
  );

  const parsed = parse(result.text);
  const indices = normalizeIndices(parsed?.evidenceIndices, fallbackPool.length);
  const selectedIndices = indices.length ? indices : fallbackIndices;
  const approvedEvidence = selectedIndices.map((index) => fallbackPool[index]).filter(Boolean).slice(0, 5);

  const modelOpportunity = clean(parsed?.creativeOpportunity);
  const forbiddenOpportunity = /\b(?:male character|female character|celebration|significant event|traditional|modern|symbolic|symbolism|emotional journey|camaraderie|mutual interest|thematic contrast|theme)\b/i.test(modelOpportunity);
  const concreteClaimPattern = /\b(?:wears?|wearing|dances?|dancing|holds?|holding|walks?|walking|runs?|running|sits?|sitting|stands?|standing|returns? in|comes? home|arrives?|arriving|everyone|someone|nobody|surprised|shocked|laughs?|laughing|catches?|caught|ties? (?:a|the) knot)\b/i;
  const creativeOpportunity = modelOpportunity && !forbiddenOpportunity && !concreteClaimPattern.test(modelOpportunity)
    ? modelOpportunity
    : `Find the sharpest relationship among: ${approvedEvidence.join("; ")}`;

  const forbiddenClaims = Array.isArray(parsed?.forbiddenClaims)
    ? dedupe(parsed!.forbiddenClaims.map(clean).filter(Boolean)).slice(0, 16)
    : [];

  return {
    order: input.beat.order,
    role: input.beat.role,
    gainKind: input.beat.gainKind,
    approvedEvidence,
    subjectAttributes,
    creativeOpportunity,
    forbiddenClaims,
    sourceBoundary: "The subject is one entity. Subject attributes modify that entity and do not create new characters. Only approved creative evidence may become concrete factual claims. Creative phrasing may reinterpret relationships but may not add concrete events, actions, physical states, reactions, settings, or outcomes.",
  };
}
