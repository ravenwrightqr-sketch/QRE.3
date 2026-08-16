/** QRE AUTHOR CRITIC · sentence-level cognitive judge */
import { localModelGenerate } from "./localModelRuntime.js";

export type MouthFailureCode =
  | "invented_concrete_detail"
  | "invented_reaction"
  | "invented_event"
  | "invented_identity"
  | "beat_poisoned"
  | "weak_beat_fit"
  | "generic_summary"
  | "overexplained"
  | "repetitive"
  | "weak_specificity"
  | "weak_creative_force"
  | "weak_afterimage"
  | "too_long";

export type MouthCritique = {
  decision: "accept" | "reject" | "retry";
  bestIndex: number;
  reason: string;
  failureCodes?: MouthFailureCode[];
  repairDirective?: string;
  scores?: {
    truth: number;
    beatFit: number;
    specificity: number;
    creativeForce: number;
    compression: number;
    character: number;
    surprise: number;
    afterimage: number;
  }[];
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function parse(raw: string): MouthCritique | undefined {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(text) as MouthCritique;
    if (!value || typeof value !== "object") return undefined;
    if (!Number.isInteger(value.bestIndex)) return undefined;
    if (!["accept", "reject", "retry"].includes(value.decision)) return undefined;
    if (value.failureCodes && !Array.isArray(value.failureCodes)) return undefined;
    return value;
  } catch {
    return undefined;
  }
}

export async function critiqueMouthCandidates(input: {
  prompt: string;
  lens?: string;
  subject?: string;
  facts: string[];
  moments: string[];
  memory: string[];
  moviePremise?: string;
  beat: unknown;
  candidates: string[];
  previousFailure?: string;
}): Promise<MouthCritique> {
  const system = [
    "You are QRE's AUTHOR CRITIC for short-form experience copy.",
    "You judge the finished line, not the architecture.",
    "The goal is a line a real business could send to a customer after a service: short, catchy, specific, human, and worth sharing.",
    "Do NOT demand a mini-story. A single sharp line can be the complete realization of a beat.",
    "SOURCE TRUTH IS ABSOLUTE: reject any concrete person, object, action, location, setting, dialogue, outcome, body position, wardrobe placement, event, or social reaction not supported by supplied evidence.",
    "TRUTH GATE BOUNDARY: approvedEvidence is the only material that may be asserted as concrete reality. forbiddenClaims are prohibited. creativeOpportunity is an interpretive search direction, not a fact.",
    "Do not punish creative phrasing, metaphor, idiom, implication, juxtaposition, wordplay, or personification when it is clearly a creative interpretation rather than a new factual event.",
    "Idiomatic compression is explicitly allowed. Example: 'kept the groomer in knots' can be excellent when groomer + supplied details support the joke; interpret it as figurative unless the source explicitly makes a literal knot event.",
    "A strong line does NOT need to mention every approved fact. Prefer one or two high-value source details fused into a memorable line over a checklist of nouns.",
    "Source-specific wordplay is HIGH specificity when the turn depends on the supplied words. A line should not be rejected merely because it uses fewer facts than the source contains.",
    "Specificity: could this line plausibly have been written from this exact source? Reward distinctive collisions between supplied details.",
    "Creative force: reward double meaning, comic compression, status turn, reversal, sly understatement, or a phrase with an afterimage.",
    "Service receipt objective: the line should make the business look like it has a personality and should be easy to read/share. It does NOT need to summarize the whole service.",
    "Compression: prefer 3-7 words. A line over 7 words is not automatically bad if the extra words materially improve the punch.",
    "SUBJECT REFERENCE: after the subject is established, omission is preferred. Reusing the name is allowed when the name itself makes the line hit harder.",
    "Do not reward repeated 'Coco + verb + fact' construction across lines.",
    "Do not require a sentence to explain the relationship. Let the reader get it.",
    "Reject generic summaries such as 'happy and fun', 'special moment', 'joyful experience', or 'what a day' when they merely restate supplied emotion.",
    "A creative interpretation is allowed when it changes the reading of supplied details without fabricating a new concrete world fact.",
    "If all candidates fail, use decision=retry and bestIndex=-1. Never choose the least-bad candidate merely because one must be selected.",
    "When one candidate is punchy, source-specific, grounded, memorable, and commercially usable as a service receipt, ACCEPT it even if another candidate is more literal.",
    "Return JSON exactly with decision, bestIndex, reason, failureCodes, repairDirective, and scores.",
    "failureCodes must use only: invented_concrete_detail, invented_reaction, invented_event, invented_identity, beat_poisoned, weak_beat_fit, generic_summary, overexplained, repetitive, weak_specificity, weak_creative_force, weak_afterimage, too_long.",
    "repairDirective must be a short instruction for the next generation attempt, focused on the dominant failure.",
  ].join("\n");

  const user = JSON.stringify({
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    moviePremise: input.moviePremise ?? "",
    SUPPLIED_EVIDENCE: { facts: input.facts, moments: input.moments, memory: input.memory },
    GROUNDED_BEAT: input.beat,
    CANDIDATES: input.candidates,
    PREVIOUS_FAILURE: input.previousFailure ?? "",
  });

  const result = await localModelGenerate(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    "json",
    { numPredict: 360, temperature: 0.12 },
  );

  return parse(result.text) ?? {
    decision: "retry",
    bestIndex: -1,
    reason: "critic output could not be parsed",
    failureCodes: ["weak_specificity"],
    repairDirective: "Generate a shorter, concrete, source-specific line using one strong relationship from the evidence.",
  };
}
