/**
 * QRE ATTENTION EDITOR · CANONICAL
 *
 * Deterministic editorial layer over an already-discovered Beat Graph and
 * already-realized mouth lines.
 *
 * It never creates facts. It measures whether the mouth line executes the
 * approved beat, preserves grounding, creates movement, and remains usable
 * by the final cut policy.
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

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const metric = (value: number): number => Number(clamp01(value).toFixed(3));
const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const STOP = new Set(
  "the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten more".split(/\s+/),
);

const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|what a day|everything changed|the journey|new chapter|happy ending|so fabulous|poodle power|good girl|bathhouse|battle|fight|ritual of transformation)\b/i;
const PROCESS = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|narrative|realization|attention editor|information seeking|next beat|writing process|movie plan)\b/i;
const EXPLANATION = /\b(?:because|therefore|which means|this means|the reason|shows that|represents?|symbolizes?|in other words|in this context|was a cover for|reveals? that|the final revelation|the supplied .* reading)\b/i;
const META_VIEWER = /\b(?:the viewer|the audience|viewer sees|audience sees)\b/i;
const LABEL_LIKE = /^(?:the contrast|the unexpected|the transformation|the mystery|the payoff|the reframe|the reveal|the twist|the journey|the answer|the joke)$/i;
const INTERPRETIVE = /\b(?:lawyer|boss|ceo|diva|celebrity|negotiat(?:e|ion|or)|rebel|rebellion|defiant|defiance|evidence|case|trial|court|verdict|terms|deal|contract|royalty|queen|king|status|in charge|mission|operation|suspect|legend|undefeated|called the shots|peace|protest|under protest|guarded|attitude|upper hand|power)\b/i;
const ACTION = /\b(?:walk(?:s|ed)?|run(?:s|ning|ran)?|jump(?:s|ed)?|leap(?:s|ed)?|grab(?:s|bed)?|steal(?:s|ing|stole)?|take(?:s|n|ing|took)?|put(?:s|ting)?|place(?:s|d)?|remove(?:s|d)?|pick(?:s|ed)?|throw(?:s|w|ing|ew)?|break(?:s|ing|broke)?|tie(?:s|d|ing)?|pull(?:s|ed)?|push(?:es|ed)?|sit(?:s|ting|sat)?|stand(?:s|ing|stood)?|laugh(?:s|ed)?|cry(?:s|ing|cried)?|smile(?:s|d)?|wag(?:s|ged)?|bite(?:s|bit)?|lick(?:s|ed)?|chew(?:s|ed)?)\b/i;

function words(text: string): string[] {
  return clean(text).toLowerCase().split(/[^a-z0-9'-]+/i).filter((word) => word.length >= 3 && !STOP.has(word));
}

function set(text: string): Set<string> {
  return new Set(words(text));
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / a.size;
}

function factuality(text: string, evidence: string[]): number {
  if (!text) return 0;
  const candidate = set(text);
  const source = set(evidence.join(" "));
  if (!candidate.size || !source.size) return 0.1;
  const literal = overlap(candidate, source);
  const interpretive = INTERPRETIVE.test(text) ? 0.28 : 0;
  return metric(Math.max(literal, interpretive));
}

function specificity(text: string): number {
  const count = words(text).length;
  let score = count >= 2 ? 0.28 : 0;
  if (count >= 4) score += 0.16;
  if (/\b(?:blue|bath|bow|box|kitchen|bathroom|time|minute|receipt|poodle|wedding|song|record|door|room|car|house)\b/i.test(text)) score += 0.28;
  if (INTERPRETIVE.test(text)) score += 0.16;
  if (LABEL_LIKE.test(text)) score -= 0.3;
  if (GENERIC.test(text)) score -= 0.25;
  return metric(score);
}

function novelty(text: string, prior: string[]): number {
  if (!prior.length) return 1;
  const current = set(text);
  const previous = set(prior.join(" "));
  if (!current.size) return 0;
  return metric(1 - overlap(current, previous));
}

function repetition(text: string, prior: string[]): number {
  if (!prior.length) return 0;
  return metric(overlap(set(text), set(prior.join(" "))));
}

function statusChange(text: string): number {
  let score = 0.1;
  if (INTERPRETIVE.test(text)) score += 0.42;
  if (/\b(?:fierce|defiant|guarded|power|control|in charge|under protest|negotiat|rebel|boss|lawyer|peace|terms|evidence)\b/i.test(text)) score += 0.25;
  if (/\b(?:but|yet|still|instead|apparently|temporarily|only|except|back)\b/i.test(text)) score += 0.15;
  return metric(score);
}

function creativeMove(text: string): number {
  let score = 0.12;
  if (INTERPRETIVE.test(text)) score += 0.42;
  if (/\b(?:again|already|still|yet|only|just|then|back|except|until|before|after|temporarily|apparently|suddenly|instead|finally|now|once)\b/i.test(text)) score += 0.14;
  if (ACTION.test(text)) score += 0.05;
  if (!GENERIC.test(text) && !PROCESS.test(text) && !LABEL_LIKE.test(text)) score += 0.12;
  if (EXPLANATION.test(text)) score -= 0.25;
  return metric(score);
}

function nextBeatPull(
  text: string,
  nextText: string | undefined,
  nextFrontier: string | undefined,
  role: string | undefined,
  target: number | undefined,
): number {
  const current = set(text);
  const upcoming = set(clean(nextText));
  const frontier = set(clean(nextFrontier));

  let score = 0.05;
  if (clean(nextText)) score += 0.14;
  if (clean(nextFrontier)) score += 0.12;

  score += overlap(upcoming, current) * 0.18 + overlap(frontier, current) * 0.26;

  if (/\b(?:why|what|who|how|will|can|does|did|where|which)\b/i.test(clean(nextText))) score += 0.1;
  if (/\b(?:again|still|now|after|then|finally|until|before|back)\b/i.test(clean(nextText))) score += 0.08;
  if (["hook", "question", "pressure", "escalation", "reframe"].includes(clean(role))) score += 0.05;

  if (/^(?:the unexpected|the unknown|hidden intentions|viewer interest|information seeking)$/i.test(clean(nextFrontier))) score -= 0.3;
  if (GENERIC.test(text) || PROCESS.test(text) || LABEL_LIKE.test(text)) score -= 0.2;

  const plannerTarget = typeof target === "number" ? clamp01(target) : 0.5;
  score = score * 0.65 + plannerTarget * 0.35;
  return metric(score);
}

function cinematicity(text: string): number {
  const count = words(text).length;
  let score = count >= 2 && count <= 7 ? 0.42 : 0.08;
  if (INTERPRETIVE.test(text)) score += 0.22;
  if (ACTION.test(text)) score += 0.1;
  if (GENERIC.test(text) || PROCESS.test(text) || LABEL_LIKE.test(text)) score -= 0.3;
  if (EXPLANATION.test(text)) score -= 0.18;
  return metric(score);
}

function inventionRisk(text: string, evidence: string[]): number {
  const source = evidence.join(" ");
  let score = 0;
  if (ACTION.test(text) && !ACTION.test(source)) score += 0.35;
  if (/\b(?:groomer|cleaner|worker|owner|customer|client|lawyer)\b/i.test(text) && !/\b(?:groomer|cleaner|worker|owner|customer|client|lawyer)\b/i.test(source)) score += 0.2;
  if (/\b(?:will always|forever|ever again|from now on)\b/i.test(text)) score += 0.3;
  if (GENERIC.test(text)) score += 0.1;
  return metric(score);
}

function mouthUsability(text: string): number {
  const value = clean(text);
  if (!value) return 0;
  const count = words(value).length;
  let score = count <= 7 ? 1 : count === 8 ? 0.45 : count === 9 ? 0.2 : 0;
  if (value.includes("?")) score -= 0.25;
  if (EXPLANATION.test(value)) score -= 0.3;
  if (META_VIEWER.test(value) || PROCESS.test(value)) score -= 0.4;
  if (GENERIC.test(value) || LABEL_LIKE.test(value)) score -= 0.35;
  return metric(score);
}

function setupValue(input: AttentionBeatInput, text: string): number {
  let score = 0.06;
  const role = clean(input.attentionFunction ?? input.role);
  if (["hook", "question", "pressure", "turn", "reframe", "escalation"].includes(role)) score += 0.24;
  if ((input.setsUp ?? []).length) score += 0.2;
  if (INTERPRETIVE.test(text)) score += 0.16;
  if (/\b(?:why|what|who|how|will|can)\b/i.test(clean(input.next))) score += 0.12;
  return metric(score);
}

function payoffContribution(input: AttentionBeatInput, text: string, prior: string[]): number {
  let score = ["payoff", "release", "callback", "consequence"].includes(clean(input.attentionFunction ?? input.role)) ? 0.32 : 0.05;
  if ((input.paysOff ?? []).length) score += 0.22;
  if (prior.length && overlap(set(text), set(prior.join(" "))) > 0.12) score += 0.12;
  if (INTERPRETIVE.test(text)) score += 0.12;
  return metric(score);
}

function beatExecution(input: AttentionBeatInput, text: string): number {
  const role = clean(input.attentionFunction ?? input.role);
  let score = 0.12;
  if (role === "hook" && (input.setsUp ?? []).length) score += 0.28;
  if (["turn", "reframe"].includes(role) && INTERPRETIVE.test(text)) score += 0.32;
  if (role === "escalation" && (input.frontier || input.next)) score += 0.24;
  if (role === "callback" && (input.paysOff ?? []).length) score += 0.3;
  if (["payoff", "release"].includes(role) && (input.paysOff ?? []).length) score += 0.3;
  if ((input.creativeMove ?? "none") !== "none") score += 0.12;
  if (GENERIC.test(text) || PROCESS.test(text) || EXPLANATION.test(text)) score -= 0.25;
  return metric(score);
}

export function scoreAttentionBeat(input: AttentionBeatInput, priorTexts: string[], evidence: string[]): AttentionBeatScore {
  const text = clean(input.text);
  const factual = factuality(text, evidence);
  const specific = specificity(text);
  const novel = novelty(text, priorTexts);
  const status = statusChange(text);
  const creative = creativeMove(text);
  const pull = nextBeatPull(text, input.next, input.frontier, input.attentionFunction ?? input.role, input.nextBeatPullTarget);
  const repeated = repetition(text, priorTexts);
  const cine = cinematicity(text);
  const payoff = payoffContribution(input, text, priorTexts);
  const setup = setupValue(input, text);
  const invention = inventionRisk(text, evidence);
  const usability = mouthUsability(text);
  const execution = beatExecution(input, text);

  const attention = metric(
    specific * 0.14 +
      novel * 0.1 +
      status * 0.13 +
      creative * 0.14 +
      pull * 0.2 +
      cine * 0.09 +
      payoff * 0.08 +
      setup * 0.06 +
      execution * 0.06 -
      repeated * 0.08,
  );

  const score = metric(
    factual * 0.2 +
      specific * 0.1 +
      attention * 0.24 +
      status * 0.08 +
      pull * 0.1 +
      creative * 0.08 +
      payoff * 0.06 +
      execution * 0.08 +
      usability * 0.06 -
      invention * 0.2 -
      repeated * 0.05,
  );

  const reasons: string[] = [];
  const count = words(text).length;

  if (!text) reasons.push("missing-text");
  if (count > 7) reasons.push("too-long");
  if (factual < 0.28 && !INTERPRETIVE.test(text)) reasons.push("weak-factual-anchor");
  if (specific < 0.4) reasons.push("weak-specificity");
  if (creative < 0.4 && (input.creativeMove ?? "none") !== "none") reasons.push("weak-creative-move");
  if (pull < 0.35) reasons.push("weak-next-beat-pull");
  if (repeated > 0.72) reasons.push("repetitive");
  if (invention > 0.45) reasons.push("high-invention-risk");
  if (GENERIC.test(text)) reasons.push("generic-language");
  if (PROCESS.test(text)) reasons.push("process-language");
  if (EXPLANATION.test(text)) reasons.push("explanatory-language");
  if (META_VIEWER.test(text)) reasons.push("viewer-language");
  if (LABEL_LIKE.test(text)) reasons.push("label-like");
  if (usability < 0.55) reasons.push("mouth-unusable");
  if (execution < 0.38) reasons.push("beat-execution-weak");

  return {
    order: input.order,
    factuality: factual,
    specificity: specific,
    attention,
    novelty: novel,
    statusChange: status,
    nextBeatPull: pull,
    creativeMove: creative,
    repetition: repeated,
    cinematicity: cine,
    payoffContribution: payoff,
    setupValue: setup,
    inventionRisk: invention,
    mouthUsability: usability,
    beatExecution: execution,
    score,
    keep: reasons.length === 0 && score >= 0.54,
    reasons,
  };
}

export function editAttentionSequence(input: { beats: AttentionBeatInput[]; evidence: string[] }): AttentionEdit {
  const scores: AttentionBeatScore[] = [];
  const prior: string[] = [];

  for (const beat of input.beats) {
    const score = scoreAttentionBeat(beat, prior, input.evidence);
    scores.push(score);
    if (beat.text.trim()) prior.push(beat.text);
  }

  if (scores.length >= 2) {
    const first = scores[0];
    const last = scores[scores.length - 1];
    if (first && scores.some((score) => score.payoffContribution >= 0.5)) {
      first.setupValue = metric(first.setupValue + 0.08);
    }
    if (last && last.payoffContribution < 0.34) {
      last.reasons.push("weak-payoff");
      last.keep = false;
    }
  }

  const weakBeats = scores.filter((score) => !score.keep).map((score) => score.order);
  const sequenceScore = metric(scores.length ? scores.reduce((sum, score) => sum + score.score, 0) / scores.length : 0);
  const rewriteInstructions = [...new Set(scores.flatMap((score) => score.reasons.map((reason) => `Beat ${score.order}: ${reason}`)))];

  return {
    accepted: scores.length > 0 && weakBeats.length === 0 && sequenceScore >= 0.58,
    sequenceScore,
    beats: scores,
    weakBeats,
    rewriteNeeded: scores.length === 0 || weakBeats.length > 0 || sequenceScore < 0.58,
    rewriteInstructions,
  };
}

export function buildAttentionRewritePrompt(edit: AttentionEdit): string {
  if (!edit.rewriteNeeded) return "";

  return [
    "QRE ATTENTION EDITOR · BOUNDED MOUTH REWRITE",
    `Sequence score: ${edit.sequenceScore}`,
    `Weak beats: ${edit.weakBeats.join(", ") || "none"}`,
    ...edit.rewriteInstructions,
    "Rewrite only the weak lines.",
    "Preserve beat order and the approved Beat Graph.",
    "Preserve supplied facts and supplied character relationships.",
    "Do not invent a concrete event, prop, person, location, reaction, sound, or outcome.",
    "Execute the assigned attentionFunction and creativeMove instead of explaining them.",
    "Prefer 3-7 words; never exceed 7 words.",
    "Use an object, relationship, contrast, or status implication already supported by the source.",
    "Never use analyst language, generic emotional summaries, or labels such as 'the contrast' or 'the joke'.",
  ].join("\n");
}
