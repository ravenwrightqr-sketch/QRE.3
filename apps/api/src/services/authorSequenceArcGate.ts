/**
 * STATUS: COMPATIBILITY
 * ROLE: Report sequence-shape diagnostics for an already-approved film spine.
 * MUST NOT: veto a grounded sequence because it lacks a preferred narrative score.
 */

export type SequenceArcBeat = {
  order: number;
  role?: string;
  attentionFunction?: string;
  creativeMove?: string;
  text: string;
  change?: string;
  next?: string;
  frontier?: string;
  setsUp?: string[];
  paysOff?: string[];
};

export type SequenceArcScore = {
  order: number;
  establishment: number;
  meaningTransition: number;
  escalation: number;
  setupLinkage: number;
  payoffLinkage: number;
  finality: number;
  score: number;
  reasons: string[];
};

export type SequenceArcEdit = {
  accepted: boolean;
  sequenceScore: number;
  establishment: number;
  meaningTransition: number;
  escalation: number;
  payoffLinkage: number;
  finalTransformation: number;
  beats: SequenceArcScore[];
  weakBeats: number[];
  failures: string[];
};

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const metric = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|what a day|everything changed|the journey|new chapter|happy ending|a moment to remember|the magic begins|cinematic|meaningful experience)\b/i;
const COLLAGE = /\b[^.!?]{1,45},\s*[^.!?]{1,45}(?:,\s*[^.!?]{1,45})+\b/;

function words(text: string): string[] {
  return clean(text).toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 3);
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / a.size;
}

function tokenSet(text: string): Set<string> {
  return new Set(words(text));
}

function scoreBeat(beat: SequenceArcBeat, priorTexts: string[], index: number, total: number): SequenceArcScore {
  const text = clean(beat.text);
  const prior = tokenSet(priorTexts.join(" "));
  const current = tokenSet(text);
  const carry = priorTexts.length ? overlap(current, prior) : 0.5;
  const establishment = index === 0 ? (text ? 1 : 0) : metric(0.5 + carry * 0.5);
  const meaningTransition = index === 0
    ? 0.5
    : metric(0.3 + carry * 0.3 + (beat.creativeMove && beat.creativeMove !== "none" ? 0.2 : 0) + (beat.next || beat.frontier ? 0.2 : 0));
  const escalation = ["escalation", "consequence"].includes(clean(beat.attentionFunction ?? beat.role)) ? 0.7 : 0.25;
  const setupLinkage = beat.setsUp?.length ? 0.65 : priorTexts.length ? 0.35 : 0.5;
  const payoffLinkage = beat.paysOff?.length ? 0.8 : 0.1;
  const finality = index === total - 1
    ? (["payoff", "release", "callback", "consequence"].includes(clean(beat.attentionFunction ?? beat.role)) || Boolean(beat.paysOff?.length) ? 0.9 : 0.65)
    : 0.05;
  const reasons: string[] = [];
  if (!text) reasons.push("missing-text");
  if (GENERIC.test(text)) reasons.push("generic-summary");
  if (COLLAGE.test(text)) reasons.push("anchor-collage");
  const score = metric(establishment * 0.18 + meaningTransition * 0.24 + escalation * 0.12 + setupLinkage * 0.14 + payoffLinkage * 0.14 + finality * 0.18);
  return { order: beat.order, establishment, meaningTransition, escalation, setupLinkage, payoffLinkage, finality, score, reasons };
}

export function evaluateSequenceArc(beats: SequenceArcBeat[]): SequenceArcEdit {
  if (!beats.length) {
    return { accepted: false, sequenceScore: 0, establishment: 0, meaningTransition: 0, escalation: 0, payoffLinkage: 0, finalTransformation: 0, beats: [], weakBeats: [], failures: ["empty-sequence"] };
  }

  const ordered = [...beats].sort((a, b) => a.order - b.order);
  const scores: SequenceArcScore[] = [];
  const priorTexts: string[] = [];

  for (let i = 0; i < ordered.length; i += 1) {
    const score = scoreBeat(ordered[i], priorTexts, i, ordered.length);
    scores.push(score);
    if (clean(ordered[i].text)) priorTexts.push(clean(ordered[i].text));
  }

  const first = scores[0];
  const last = scores[scores.length - 1];
  const establishment = first?.establishment ?? 0;
  const meaningTransition = metric(scores.reduce((sum, beat) => sum + beat.meaningTransition, 0) / scores.length);
  const escalation = metric(Math.max(...scores.map((beat) => beat.escalation)));
  const payoffLinkage = metric(Math.max(...scores.map((beat) => beat.payoffLinkage)));
  const finalTransformation = last ? metric(last.finality * 0.6 + last.payoffLinkage * 0.4) : 0;
  const sequenceScore = metric(establishment * 0.2 + meaningTransition * 0.25 + escalation * 0.15 + payoffLinkage * 0.15 + finalTransformation * 0.25);
  const weakBeats = scores.filter((beat) => beat.reasons.length > 0).map((beat) => beat.order);
  const failures = weakBeats.length ? ["diagnostic-weak-beats"] : [];

  // This layer is diagnostic compatibility only. The upstream Author and final cut policy
  // decide whether text is grounded. Narrative preference must never erase a valid film.
  const complete = ordered.every((beat) => Boolean(clean(beat.text)));

  return {
    accepted: complete,
    sequenceScore,
    establishment,
    meaningTransition,
    escalation,
    payoffLinkage,
    finalTransformation,
    beats: scores,
    weakBeats,
    failures,
  };
}
