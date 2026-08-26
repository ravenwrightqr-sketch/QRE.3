import { localModelGenerate } from "./localModelRuntime.js";
import { unsupportedIdentityClaims } from "./authorUnknownBoundary.js";

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
  subjectTruth?: unknown;
  facts: string[];
  moments: string[];
  memory: string[];
  moviePremise?: string;
  beat: unknown;
  candidates: string[];
  previousFailure?: string;
}): Promise<MouthCritique> {
  const identityRejected = input.candidates.findIndex((candidate) =>
    unsupportedIdentityClaims(candidate, {
      subject: input.subject,
      subjectTruth: input.subjectTruth,
      facts: input.facts,
      moments: input.moments,
      memory: input.memory,
    }).length > 0,
  );

  const legalCandidates = input.candidates.filter((candidate) =>
    unsupportedIdentityClaims(candidate, {
      subject: input.subject,
      subjectTruth: input.subjectTruth,
      facts: input.facts,
      moments: input.moments,
      memory: input.memory,
    }).length === 0,
  );

  if (legalCandidates.length === 0 && input.candidates.length > 0) {
    return {
      decision: "retry",
      bestIndex: -1,
      reason: "all candidates contain unsupported identity claims",
      failureCodes: ["invented_identity"],
      repairDirective: "Remove every unsupported identity attribute or gendered pronoun. Unknown must remain unknown until supplied evidence establishes it.",
    };
  }

  const system = [
    "You are QRE's AUTHOR CRITIC for short-form experience copy.",
    "You judge the finished line, not the architecture.",
    "The goal is a line a real person or business would enjoy showing someone else: specific, human, compact, and worth sharing.",
    "VIEWER REWARD IS THE CORE QUALITY TARGET: ask whether the line gives the viewer a satisfying felt or cognitive payoff appropriate to the moment.",
    "Viewer reward is NOT the same thing as positivity or wholesomeness. A line can reward through humor, tension, shock, irony, mischief, menace, recognition, attitude, status, beauty, curiosity, relief, surprise, or an earned emotional turn.",
    "A dark, rude, sad, chaotic, or unsettling beat may be excellent when the realization makes the viewer feel something sharp and satisfying.",
    "ATTENTION PULL: make the viewer want to keep experiencing the next beat. It may be a smile, pause, laugh, wince, question, surprise, recognition, dread, or 'oh shit' moment. It does not have to be a cliffhanger.",
    "DELIGHT: reward clever collisions, fresh phrasing, satisfying rhythm, sly wordplay, reversal, comic compression, earned attitude, or a memorable afterimage.",
    "Do NOT demand a mini-story. A single sharp line can be the complete realization of a beat.",
    "SOURCE TRUTH IS ABSOLUTE: reject any concrete person, object, action, location, setting, dialogue, outcome, body position, wardrobe placement, event, or social reaction not supported by supplied evidence.",
    "TRUTH GATE BOUNDARY: approvedEvidence is the only material that may be asserted as concrete reality. forbiddenClaims are prohibited. creativeOpportunity is an interpretive search direction, not a fact.",
    "UNKNOWN IS ALSO TRUTH: if an identity attribute, relationship, preference, history, location, or other fact is not established by supplied evidence or authorized memory, leave it unknown. Do not fill the blank.",
    "Do not punish creative phrasing, metaphor, idiom, implication, juxtaposition, wordplay, or personification when it is clearly an interpretation rather than a new factual event.",
    "A line may be excellent even when it uses only one or two source details. Reward compression and selectivity, not checklist coverage.",
    "Specificity: could this line plausibly have been written from this exact source?",
    "Creative force: reward double meaning, reversal, status turn, sly understatement, comic compression, attitude, or a phrase that leaves an afterimage.",
    "Compression: prefer the minimum language that lands. Do not impose a rigid word count.",
    "SUBJECT REFERENCE: once the subject is established, omission is preferred. Reusing the name is allowed only when it improves emphasis, disambiguation, rhythm, or the punch.",
    "Do not reward repeated 'subject + verb + fact' construction across a sequence.",
    "Treat the established subject as active context. Spend the next line on what changed, collided, mattered, or became interesting.",
    "Reject generic summaries that merely restate emotion or explain the supplied event.",
    "Do not force wholesomeness. Do not reject a line merely because its felt effect is dark, sarcastic, tense, rude, dangerous, bittersweet, or chaotic.",
    "If all legal candidates are weak, use decision=retry and bestIndex=-1. Never choose the least-bad candidate merely because one must be selected.",
    "Return JSON exactly with decision, bestIndex, reason, failureCodes, repairDirective, and scores.",
    "Each score object must include truth, beatFit, specificity, creativeForce, compression, character, surprise, afterimage, attentionPull, delight, and viewerReward, each from 0 to 1.",
    "viewerReward measures the experienced payoff of the realization, not whether the underlying event is pleasant.",
    "failureCodes must use only: invented_concrete_detail, invented_reaction, invented_event, invented_identity, beat_poisoned, weak_beat_fit, generic_summary, overexplained, repetitive, weak_specificity, weak_creative_force, weak_afterimage, weak_attention_pull, weak_delight, weak_viewer_reward, too_long.",
    "repairDirective must be a short instruction for the next generation attempt, focused on the dominant failure.",
  ].join("\n");

  const user = JSON.stringify({
    prompt: input.prompt,
    lens: input.lens ?? "",
    subject: input.subject ?? "",
    subjectTruth: input.subjectTruth ?? null,
    moviePremise: input.moviePremise ?? "",
    SUPPLIED_EVIDENCE: { facts: input.facts, moments: input.moments, memory: input.memory },
    GROUNDED_BEAT: input.beat,
    CANDIDATES: legalCandidates,
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

  const parsed = parse(result.text);
  if (!parsed) {
    return {
      decision: "retry",
      bestIndex: -1,
      reason: "critic output could not be parsed",
      failureCodes: ["weak_viewer_reward"],
      repairDirective: "Generate a source-specific line with sharper attitude, compression, surprise, or implication. Preserve truth and leave unknown attributes unknown.",
    };
  }

  // The model selected against filtered candidates, so map the winner back to
  // the original candidate positions before the caller uses bestIndex.
  if (parsed.bestIndex >= 0 && parsed.bestIndex < legalCandidates.length) {
    const winner = legalCandidates[parsed.bestIndex];
    parsed.bestIndex = input.candidates.indexOf(winner);
  }

  // Keep the explicit deterministic boundary visible in the failure record.
  if (identityRejected >= 0 && !parsed.failureCodes?.includes("invented_identity")) {
    parsed.failureCodes = [...(parsed.failureCodes ?? []), "invented_identity"];
  }

  return parsed;
}
