/** QRE AUTHOR SEQUENCE CRITIC · acceptance-level sequence judge */
import { localModelGenerate } from "./localModelRuntime.js";

export type MouthSequenceCritique = {
  decision: "accept" | "retry";
  reason: string;
  failureCodes: string[];
  scores: {
    truth: number;
    cutDistinctness: number;
    progression: number;
    attentionPull: number;
    specificity: number;
    creativeForce: number;
    lensFit: number;
    payoff: number;
    overall: number;
  };
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function parse(raw: string): MouthSequenceCritique | undefined {
  const text = clean(raw).replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const value = JSON.parse(text) as MouthSequenceCritique;
    if (!value || typeof value !== "object") return undefined;
    if (value.decision !== "accept" && value.decision !== "retry") return undefined;
    if (!value.scores || typeof value.scores !== "object") return undefined;
    return value;
  } catch {
    return undefined;
  }
}

export async function critiqueMouthSequence(input: {
  subject: string;
  lens?: string;
  facts: string[];
  approvedBeats: unknown[];
  cuts: string[];
}): Promise<MouthSequenceCritique> {
  const system = [
    "You are QRE's sequence critic.",
    "Judge the entire ordered sequence, not one sentence at a time.",
    "The desired output is a sequence of short viewer-facing cuts that feels like a tiny moving experience.",
    "A strong sequence often moves through distinct functions such as establish, event, interpretation, consequence, payoff. Do not require this exact pattern when the supplied reality supports another structure.",
    "Each cut should earn the next cut by changing attention, meaning, context, expectation, or status.",
    "Do not reward a one-line summary when multiple supplied facts could become stronger as separate cuts.",
    "Fragments, questions, one-word cuts, labels, and short sentences are valid.",
    "A grounded quiet line can be excellent. Do not demand that every cut be flashy.",
    "Truth is absolute. Preferences can become open questions or possibilities, but may not become invented events.",
    "Lens is framing, never evidence. Explicit user lens should be respected; automatic lens use is good only when it materially fits the supplied reality.",
    "Judge the sequence for QRE feel: short, specific, memorable, progressive, truthful, and makes the viewer want the next cut.",
    "Do not punish omission. A sequence does not need to include every fact if the selected cuts create a stronger experience.",
    "Return JSON only with decision, reason, failureCodes, and scores.",
    "Score every numeric field from 0 to 1.",
    "Reject when the sequence invents reality, collapses into summary/prose, repeats itself, lacks meaningful progression, or has no useful payoff/landing.",
    "Accept when the sequence is truthful and materially behaves like a sequence of authored cuts even if individual cuts are quiet.",
  ].join("\n");

  const user = JSON.stringify({
    subject: input.subject,
    lens: input.lens ?? "",
    suppliedEvidence: input.facts,
    approvedBeats: input.approvedBeats,
    sequence: input.cuts.map((text, index) => ({ order: index + 1, text })),
  });

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
    reason: "sequence critic output could not be parsed",
    failureCodes: ["critic_parse_failure"],
    scores: {
      truth: 0,
      cutDistinctness: 0,
      progression: 0,
      attentionPull: 0,
      specificity: 0,
      creativeForce: 0,
      lensFit: 0,
      payoff: 0,
      overall: 0,
    },
  };
}
