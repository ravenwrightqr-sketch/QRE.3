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
    "ATTENTION PULL: the line should make the reader want to keep watching, smile, pause, or wonder what comes next.",
    "DELIGHT: reward tiny clever turns, cute/funny collisions, satisfying phrasing, sly wordplay, and fresh surprises.",
    "CHARACTER ATTITUDE: strongly reward a line that turns supplied personality + situation into a vivid social stance, comparison, simile, personification, or imagined attitude.",
    "Example of the target: a fierce dog entering a groomer 'like the lawyer was already on retainer' is figurative characterization, not a literal claim that a lawyer was hired.",
    "Do NOT demand a mini-story. A single sharp line can be the complete realization of a beat.",
    "SOURCE TRUTH IS ABSOLUTE for literal reality: reject invented concrete people, objects, actions, locations, outcomes, dialogue, or events presented as if they actually happened.",
    "But a figurative comparison, metaphor, simile, personification, or comic framing may introduce an imagined comparison when the wording clearly signals that it is interpretation rather than fact.",
    "A line may be excellent even when it uses only one or two source details. Reward compression, not checklist coverage.",
    "Prefer character attitude and situation-based humor before punning on isolated nouns.",
    "Source-specific wordplay is valuable, but do not force bows/balls/ties into a joke merely because they are available.",
    "Specificity: could this line plausibly have been written from this exact subject, personality, and situation?",
    "Creative force: reward status reversal, vivid social framing, double meaning, sly understatement, comic compression, or a memorable comparison.",
    "Compression: prefer 4-8 words for short cinematic/service copy; allow up to 10 when the extra words materially improve the punch.",
    "SUBJECT REFERENCE: after the subject is established, omission is preferred. Reusing the name is allowed when it itself makes the line hit harder.",
    "Reject generic summaries such as 'happy and fun', 'special moment', 'joyful experience', or 'what a day' when they merely restate supplied emotion.",
    "If a candidate is catchy, grounded, characterful, and memorable, prefer it over a blandly literal sentence.",
    "If all candidates fail, use decision=retry and bestIndex=-1. Never choose the least-bad candidate merely because one must be selected.",
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
    repairDirective: "Generate a short, characterful line with a vivid social comparison or situation-based turn.",
  };
}
