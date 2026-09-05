/** QRE CANONICAL MOUTH CRITIC · final sentence judge */
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
  scores?: Array<{
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
  }>;
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function parse(raw: string): MouthCritique | undefined {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(text) as MouthCritique;
    if (!value || typeof value !== "object") return undefined;
    if (!["accept", "reject", "retry"].includes(value.decision)) return undefined;
    if (!Number.isInteger(value.bestIndex) && value.bestIndex !== -1) return undefined;
    if (value.failureCodes && !Array.isArray(value.failureCodes)) return undefined;
    return value;
  } catch {
    return undefined;
  }
}

export async function critiqueMouthCandidates(input: {
  prompt?: string;
  lens?: string;
  subject: string;
  facts: string[];
  moments: string[];
  memory: string[];
  moviePremise?: string;
  beat: unknown;
  candidates: string[];
  previousFailure?: string;
}): Promise<MouthCritique> {
  const system = [
    "You are QRE's ONE MOUTH CRITIC.",
    "Judge only the candidate language for the approved beat. Do not redesign the architecture or invent a new story.",
    "TRUTH is mandatory: reject any candidate that asserts a concrete person, object, action, location, body reaction, psychological state, dialogue, outcome, or event not supported by supplied evidence.",
    "CREATIVE FRAMING IS ALLOWED: metaphor, simile, implication, status language, double meaning, juxtaposition, personification, rhetorical questions, and genre framing may use new vocabulary when the line clearly expresses an approved meaning rather than asserting a new occurrence.",
    "Examples: 'Any squirrels around today?' is valid for a known squirrel preference; 'Coco chased squirrels' is not without a supplied encounter. 'Coco walked in like a lawyer was already contacted' may be valid framing; 'A lawyer arrived' is invented reality.",
    "Do not punish a strong creative line merely because its wording is not literally present in the evidence. Judge whether its semantic move is earned by the evidence and approved beat.",
    "The goal is not fact coverage. The goal is the strongest next attention-bearing realization inside the truth.",
    "Reward: truth, beat fit, specificity, creative force, compression, character, surprise, afterimage, attention pull, delight.",
    "Sparse first memories are allowed to be fragmentary. Do not demand a conventional plot or exposition.",
    "Reject repetition, generic summary, explanation, poetry soup, and mechanical 'subject + verb + fact' restatement.",
    "A candidate should make the observer want the next line or recognize something on their own.",
    "If all candidates are weak, use retry and bestIndex=-1.",
    "Return JSON exactly with decision, bestIndex, reason, failureCodes, repairDirective, and scores.",
  ].join("\n");

  const user = JSON.stringify({
    prompt: clean(input.prompt),
    lens: clean(input.lens),
    subject: clean(input.subject),
    moviePremise: clean(input.moviePremise),
    SUPPLIED_EVIDENCE: { facts: input.facts, moments: input.moments, memory: input.memory },
    APPROVED_BEAT: input.beat,
    CANDIDATES: input.candidates,
    PREVIOUS_FAILURE: clean(input.previousFailure),
  });

  try {
    const result = await localModelGenerate(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      "json",
      { numPredict: 420, temperature: 0.12 },
    );
    return parse(result.text) ?? {
      decision: "retry",
      bestIndex: -1,
      reason: "critic output could not be parsed",
      failureCodes: ["weak_attention_pull"],
      repairDirective: "Make the line shorter, more specific, more creative, and strictly grounded in the approved beat.",
    };
  } catch {
    return {
      decision: "retry",
      bestIndex: -1,
      reason: "critic model unavailable",
      failureCodes: ["weak_attention_pull"],
      repairDirective: "Generate three short, materially different realizations of the approved semantic move.",
    };
  }
}
