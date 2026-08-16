/**
 * QRE AUTHOR BEAT TRUTH GATE
 *
 * Separates the approved movie/beat's creative intent from claims that the
 * upstream planner accidentally invented. The gate never invents evidence:
 * it may only select supplied evidence and describe the relationship between
 * those evidence items as an interpretation for the mouth to explore.
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

  const fallbackEvidence = evidence.slice(0, 8);
  const system = [
    "You are QRE's AUTHOR BEAT TRUTH GATE.",
    "The upstream movie planner may have mixed real evidence with invented interpretation.",
    "Your job is epistemic separation, not writing.",
    "You MUST select evidence only by index from SUPPLIED_EVIDENCE. Never create a new fact.",
    "The creativeOpportunity is allowed to describe a relationship or contrast among selected evidence, but must not assert a new event, object, location, reaction, body position, wardrobe placement, dialogue, outcome, or physical action.",
    "forbiddenClaims should identify concrete claims from the upstream beat that are not licensed by supplied evidence.",
    "Do not decide whether the eventual sentence is funny. Preserve creative possibility while protecting truth.",
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
    { numPredict: 300, temperature: 0.08 },
  );

  const parsed = parse(result.text);
  const indices = normalizeIndices(parsed?.evidenceIndices, evidence.length);
  const approvedEvidence = indices.length
    ? indices.map((index) => evidence[index])
    : fallbackEvidence;

  const creativeOpportunity = clean(parsed?.creativeOpportunity) ||
    `Find an unexpected relationship among these supplied details: ${approvedEvidence.join("; ")}`;
  const forbiddenClaims = Array.isArray(parsed?.forbiddenClaims)
    ? parsed!.forbiddenClaims.map(clean).filter(Boolean).slice(0, 12)
    : [];

  return {
    order: input.beat.order,
    role: input.beat.role,
    gainKind: input.beat.gainKind,
    approvedEvidence,
    creativeOpportunity,
    forbiddenClaims,
    sourceBoundary: "Only approved evidence may become a concrete factual claim. Creative phrasing may reinterpret relationships but may not add concrete events or physical facts.",
  };
}
