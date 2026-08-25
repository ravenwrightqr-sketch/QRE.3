/**
 * STATUS: CANONICAL
 * ROLE: Non-generative check over an already authored film sequence.
 * MUST NOT: call a model, rewrite beats, or invent narrative content.
 */

export type AttentionBeatInput = {
  order: number;
  role?: string;
  gainKind?: string;
  text: string;
  change?: string;
  next?: string;
  frontier?: string;
  sourceIds?: string[];
  attentionFunction?: string;
  setsUp?: string[];
  paysOff?: string[];
  creativeMove?: string;
  nextBeatPullTarget?: number;
};

export type AttentionBeatScore = {
  order: number;
  factuality: number;
  specificity: number;
  attention: number;
  novelty: number;
  statusChange: number;
  nextBeatPull: number;
  creativeMove: number;
  repetition: number;
  cinematicity: number;
  payoffContribution: number;
  setupValue: number;
  inventionRisk: number;
  mouthUsability: number;
  beatExecution: number;
  sourceCoverage: number;
  interpretationGrounding: number;
  sequenceCohesion: number;
  cumulativeMeaning: number;
  score: number;
  keep: boolean;
  reasons: string[];
};

export type AttentionEdit = {
  accepted: boolean;
  sequenceScore: number;
  beats: AttentionBeatScore[];
  weakBeats: number[];
  rewriteNeeded: boolean;
  rewriteInstructions: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).split(/\s+/).filter(Boolean);

const internalLeak = /\b(?:beat graph|meaning spine|information frontier|attention editor|cognition|planner|planning|creative move|operator mix|viewer sees|the viewer|the audience)\b/i;
const genericFiller = /^(?:the contrast|the reframe|the transformation|the reveal|the payoff|the punchline|the mystery|what happens next)$/i;
const obviousInvention = /\b(?:glares?|sniffs?|blinks?|stares?|smiles?|wags?|trembles?|runs?|jumps?|grabs?|bites?|walks?|enters?|leaves?)\b/i;

function scoreBeat(beat: AttentionBeatInput, prior: string[], total: number): AttentionBeatScore {
  const text = clean(beat.text);
  const wc = words(text).length;
  const repetition = prior.length
    ? Math.min(1, prior.filter((value) => clean(value).toLowerCase() === text.toLowerCase()).length)
    : 0;
  const role = clean(beat.attentionFunction ?? beat.role).toLowerCase();
  const short = wc > 0 && wc <= 7;
  const final = beat.paysOff?.length || role === "payoff" || role === "release";
  const illegal = !text || internalLeak.test(text) || genericFiller.test(text);
  const invention = obviousInvention.test(text) ? 0.25 : 0;
  const novelty = repetition ? 0 : 1;
  const attention = short ? 0.9 : wc <= 10 ? 0.6 : 0.2;
  const creativeMove = beat.creativeMove && beat.creativeMove !== "none" ? 0.8 : 0.55;
  const payoffContribution = final ? 0.95 : Math.max(0.15, (beat.nextBeatPullTarget ?? 0.55));
  const cohesion = prior.length ? 0.75 : 0.65;
  const score = Math.max(0, Math.min(1,
    attention * 0.2 + novelty * 0.12 + creativeMove * 0.13 + cohesion * 0.12 + payoffContribution * 0.18 + (1 - invention) * 0.25,
  ));

  const reasons: string[] = [];
  if (!text) reasons.push("missing-text");
  if (illegal) reasons.push("viewer-leak");
  if (repetition) reasons.push("repetition");
  if (invention) reasons.push("possible-invention");
  if (wc > 7) reasons.push("too-long");

  return {
    order: beat.order,
    factuality: illegal ? 0 : 0.8,
    specificity: short ? 0.85 : 0.55,
    attention,
    novelty,
    statusChange: 0.6,
    nextBeatPull: beat.nextBeatPullTarget ?? 0.55,
    creativeMove,
    repetition,
    cinematicity: short ? 0.9 : 0.55,
    payoffContribution,
    setupValue: beat.setsUp?.length ? 0.8 : 0.55,
    inventionRisk: invention,
    mouthUsability: illegal ? 0 : 0.9,
    beatExecution: illegal ? 0.2 : 0.82,
    sourceCoverage: beat.sourceIds?.length ? 0.75 : 0.55,
    interpretationGrounding: beat.creativeMove && beat.creativeMove !== "none" ? 0.72 : 0.55,
    sequenceCohesion: cohesion,
    cumulativeMeaning: prior.length ? 0.78 : 0.55,
    score: Number(score.toFixed(3)),
    keep: !illegal && !repetition && !invention,
    reasons,
  };
}

export function editAttentionSequence(input: {
  beats: AttentionBeatInput[];
  evidence: string[];
}): AttentionEdit {
  const beats: AttentionBeatScore[] = [];
  const prior: string[] = [];

  for (const beat of input.beats) {
    const scored = scoreBeat(beat, prior, input.beats.length);
    beats.push(scored);
    if (clean(beat.text)) prior.push(clean(beat.text));
  }

  const weakBeats = beats.filter((beat) => !beat.keep).map((beat) => beat.order);
  const sequenceScore = beats.length
    ? Number((beats.reduce((sum, beat) => sum + beat.score, 0) / beats.length).toFixed(3))
    : 0;
   
    return {
  accepted: weakBeats.length === 0,
  sequenceScore,
  beats,
  weakBeats,
  rewriteNeeded: weakBeats.length > 0,
  rewriteInstructions:
    weakBeats.length > 0
      ? weakBeats.map(
          (order) =>
            `Regenerate viewer-facing cut ${order} only.`,
        )
      : [],
};
}

export function buildAttentionRewritePrompt(input: AttentionEdit): string {
  return [
    "No generative repair is required by the canonical Mouth.",
    "Preserve the already authored film sequence.",
    `Diagnostics: ${JSON.stringify({ weakBeats: input.weakBeats, score: input.sequenceScore })}`,
  ].join("\n");
}

