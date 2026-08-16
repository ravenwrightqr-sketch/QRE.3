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
  | "weak_attention_pull"
  | "weak_delight"
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
    attentionPull: number;
    delight: number;
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
    "The goal is a line a real person or business would enjoy showing someone else: short, catchy, specific, human, and worth sharing.",
    "ATTENTION PULL: the line should make the reader want to keep watching, smile, pause, or wonder what comes next. It can be tiny; it does not need to be profound.",
    "DELIGHT: reward 'neato' moments—small clever turns, cute/funny collisions, satisfying phrasing, sly wordplay, or a fresh little surprise that feels earned.",
    "Do NOT demand a mini-story. A single sharp line can be the complete realization of a beat.",
    "SOURCE TRUTH IS ABSOLUTE: reject any concrete person, object, action, location, setting, dialogue, outcome, body position, wardrobe placement, event, or social reaction not supported by supplied evidence.",
    "TRUTH GATE BOUNDARY: approvedEvidence is the only material that may be asserted as concrete reality. forbiddenClaims are prohibited. creativeOpportunity is an interpretive search direction, not a fact.",
    "Do not punish creative phrasing, metaphor, idiom, implication, juxtaposition, wordplay, or personification when it is clearly a creative interpretation rather than a new factual event.",
    "A line may be excellent even when it uses only one or two source details. Reward compression, not checklist coverage.",
    "Source-specific wordplay is HIGH specificity when the turn depends on the supplied words.",
    "Specificity: could this line plausibly have been written from this exact source?",
    "Creative force: reward double meaning, reversal, status turn, sly understatement, comic compression, or a phrase with an afterimage.",
    "Compression: prefer 3-7 words. A slightly longer line may still win when the punch materially improves.",
    "SUBJECT REFERENCE: after the subject is established, omission is preferred. Reusing the name is allowed when the name itself makes the line hit harder.",
    "Do not reward repeated 'subject + verb + fact' construction across lines.",
    "Reject generic summaries such as 'happy and fun', 'special moment', 'joyful experience', or 'what a day' when they merely restate supplied emotion.",
    "A creative interpretation is allowed when it changes the reading of supplied details without fabricating a new concrete world fact.",
    "When a candidate is catchy, grounded, source-specific, and simply fun to read, prefer it over a blandly literal sentence.",
    "If all candidates are weak, use decision=retry and bestIndex=-1. Never choose the least-bad candidate merely because one must be selected.",
    "Return JSON exactly with decision, bestIndex, reason, failureCodes, repairDirective, and scores.",
    "failureCodes must use only: invented_concrete_detail, invented_reaction, invented_event, invented_identity, beat_poisoned, weak_beat_fit, generic_summary, overexplained, repetitive, weak_specificity, weak_creative_force, weak_afterimage, weak_attention_pull, weak_delight, too_long.",
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
    { numPredict: 380, temperature: 0.14 },
  );

  return parse(result.text) ?? {
    decision: "retry",
    bestIndex: -1,
    reason: "critic output could not be parsed",
    failureCodes: ["weak_attention_pull"],
    repairDirective: "Generate a short, source-specific line with a small clever turn that makes the reader want the next beat.",
  };
}
