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
  | "weak_viewer_reward"
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
    viewerReward: number;
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
    "The goal is a line a real person or business would enjoy showing someone else: specific, human, compact, and worth sharing.",
    "VIEWER REWARD IS THE CORE QUALITY TARGET: ask whether the line gives the viewer a satisfying felt or cognitive payoff appropriate to the moment.",
    "Viewer reward is NOT the same thing as positivity or wholesomeness. A line can reward through humor, tension, shock, irony, mischief, menace, recognition, attitude, status, beauty, curiosity, relief, surprise, or an earned emotional turn.",
    "A dark, rude, sad, chaotic, or unsettling beat may be excellent when the realization makes the viewer feel something sharp and satisfying.",
    "ATTENTION PULL: the line should make the reader want to keep watching, smile, pause, wonder, wince, laugh, or think 'oh shit' / 'oh damn' / 'yes'. It does not need to be a cliffhanger.",
    "DELIGHT: reward clever collisions, fresh phrasing, satisfying rhythm, sly wordplay, reversal, comic compression, earned attitude, or a memorable afterimage.",
    "Do NOT demand a mini-story. A first memory may be sparse. A sequence can be a compact reconstruction of supplied facts, not a forced plot.",
    "SOURCE DOMAIN DOES NOT DICTATE GENRE: judge whether a lens creatively reframes the supplied reality, not whether the source topic normally belongs to that genre.",
    "GENRE/LENS IS NOT FACT: courtroom, heist, noir, game, rom-com, royal, cyberpunk, spy, military, horror, and documentary framing may shape wording and attitude, but they must not smuggle in new props, settings, actions, people, outcomes, chronology, or events.",
    "SOURCE TRUTH IS ABSOLUTE: reject any concrete person, object, action, location, setting, dialogue, outcome, body position, wardrobe placement, event, or social reaction not supported by supplied evidence.",
    "TRUTH GATE BOUNDARY: approvedEvidence is the only material that may be asserted as concrete reality. forbiddenClaims are prohibited. creativeOpportunity is an interpretive search direction, not a fact.",
    "A supplied preference or topic may be realized as a question or open possibility without asserting its occurrence. Example: 'likes squirrels' can support 'Any squirrels around today?' but not 'chased squirrels.'",
    "Do not punish creative phrasing, metaphor, idiom, implication, juxtaposition, wordplay, or personification when it is clearly an interpretation rather than a new factual event.",
    "A line may be excellent even when it uses only one or two source details. Reward compression and selectivity, not checklist coverage.",
    "Source-specific wordplay is HIGH specificity when the turn depends on the supplied words.",
    "Specificity: could this line plausibly have been written from this exact source?",
    "Creative force: reward double meaning, reversal, status turn, sly understatement, comic compression, attitude, or a phrase that leaves an afterimage.",
    "Compression: prefer the minimum language that lands. Do not impose a rigid word count.",
    "SUBJECT REFERENCE: once the subject is established, omission is preferred. Reusing the name is allowed only when it improves emphasis, disambiguation, rhythm, or the punch.",
    "Do not reward repeated 'subject + verb + fact' construction across a sequence.",
    "Treat the established subject as active context. Spend the next line on what changed, collided, mattered, or became interesting.",
    "Reject generic summaries such as 'happy and fun', 'special moment', 'joyful experience', or 'what a day' when they merely restate emotion.",
    "Do not force wholesomeness. Do not reject a line merely because its felt effect is dark, sarcastic, tense, rude, dangerous, bittersweet, or chaotic.",
    "A creative interpretation is allowed when it changes the reading of supplied details without fabricating a new concrete world fact.",
    "When a candidate is grounded, source-specific, emotionally or cognitively rewarding, and naturally phrased, prefer it over a blandly literal sentence.",
    "If all candidates are weak, use decision=retry and bestIndex=-1. Never choose the least-bad candidate merely because one must be selected.",
    "Return JSON exactly with decision, bestIndex, reason, failureCodes, repairDirective, and scores.",
    "Each score object must include truth, beatFit, specificity, creativeForce, compression, character, surprise, afterimage, attentionPull, delight, and viewerReward, each from 0 to 1.",
    "viewerReward should reflect the experienced payoff of the line, not whether the underlying event is pleasant.",
    "failureCodes must use only: invented_concrete_detail, invented_reaction, invented_event, invented_identity, beat_poisoned, weak_beat_fit, generic_summary, overexplained, repetitive, weak_specificity, weak_creative_force, weak_afterimage, weak_attention_pull, weak_delight, weak_viewer_reward, too_long.",
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
    { numPredict: 420, temperature: 0.14 },
  );

  return parse(result.text) ?? {
    decision: "retry",
    bestIndex: -1,
    reason: "critic output could not be parsed",
    failureCodes: ["weak_viewer_reward"],
    repairDirective: "Realize the supplied semantic move with sharper attitude, compression, surprise, or implication. Preserve truth and avoid invented concrete action.",
  };
}
