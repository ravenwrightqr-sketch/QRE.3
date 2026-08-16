/** QRE AUTHOR CRITIC · sentence-level cognitive judge */
import { localModelGenerate } from "./localModelRuntime.js";

export type MouthFailureCode =
  | "invented_concrete_detail"
  | "invented_reaction"
  | "invented_event"
  | "invented_identity"
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
    "You are QRE's AUTHOR CRITIC.",
    "You do not write, rewrite, or invent. You judge finished sentence candidates.",
    "The movie and beat are already approved. Your only job is to decide whether a candidate deserves to exist.",
    "SOURCE TRUTH IS ABSOLUTE: reject any concrete person, object, action, location, setting, dialogue, outcome, body position, wardrobe placement, event, or social reaction not supported by supplied evidence.",
    "Do not punish creative phrasing, metaphor, implication, juxtaposition, wordplay, or personification when it does not assert a new concrete fact.",
    "Beat fit: the line must realize this beat, not merely mention one source noun.",
    "Specificity: prefer lines that could only come from this source, not generic AI prose.",
    "Creative force: prefer a real collision, reversal, double meaning, character turn, comic timing, or emotional precision.",
    "Compression: every word should earn space; prefer 3-7 words.",
    "Character: preserve the specific subject and supplied identity without stereotyping.",
    "Surprise: reward a fresh but grounded turn.",
    "Afterimage: the line should leave a thought/image behind rather than explain itself.",
    "REJECT phrases that merely summarize happy/fun/special/meaningful/joyful or explain the joke.",
    "A concrete invention is a truth failure even when the sentence is funny.",
    "A creative interpretation is allowed when it is clearly phrasing or implication rather than a newly asserted event or physical fact.",
    "If all candidates fail, use decision=retry and bestIndex=-1. Never choose the least-bad candidate merely because one must be selected.",
    "Return JSON exactly with decision, bestIndex, reason, failureCodes, repairDirective, and scores.",
    "failureCodes must use only: invented_concrete_detail, invented_reaction, invented_event, invented_identity, weak_beat_fit, generic_summary, overexplained, repetitive, weak_specificity, weak_creative_force, weak_afterimage, too_long.",
    "repairDirective must be a short instruction for the next generation attempt, focused on the dominant failure.",
  ].join("\n");

  const user = JSON.stringify({
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    moviePremise: input.moviePremise ?? "",
    SUPPLIED_EVIDENCE: { facts: input.facts, moments: input.moments, memory: input.memory },
    APPROVED_BEAT: input.beat,
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
    repairDirective: "Generate a shorter, concrete line using only supplied evidence.",
  };
}
