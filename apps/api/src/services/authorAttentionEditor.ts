/**
 * QRE ATTENTION EDITOR · CANONICAL
 *
 * Deterministic editorial layer over an already-discovered beat sequence.
 * It never creates facts. It measures whether each beat moves the viewer,
 * creates a reason to continue, and contributes to a setup/payoff arc.
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

const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|what a day|everything changed|the journey|new chapter|happy ending|so fabulous|poodle power|good girl)\b/i;
const PROCESS = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|narrative|realization|attention editor|information seeking|next beat)\b/i;
const INTERPRETIVE = /\b(?:lawyer|boss|ceo|diva|celebrity|negotiat(?:e|ion|or)|rebel|rebellion|evidence|case|trial|court|verdict|terms|deal|contract|royalty|queen|king|status|in charge|mission|operation|suspect|legend|undefeated|called the shots|peace|protest|formal complaint|under protest)\b/i;
const MOVE_WORDS = /\b(?:again|already|still|yet|only|just|then|back|except|until|before|after|temporarily|apparently|suddenly|instead|finally|now|once)\b/i;
const ACTION = /\b(?:walk(?:s|ed)?|run(?:s|ning|ran)?|jump(?:s|ed)?|leap(?:s|ed)?|grab(?:s|bed)?|steal(?:s|ing|stole)?|take(?:s|n|ing|took)?|put(?:s|ting)?|place(?:s|d)?|remove(?:s|d)?|pick(?:s|ed)?|throw(?:s|w|ing|ew)?|break(?:s|ing|broke)?|tie(?:s|d|ing)?|pull(?:s|ed)?|push(?:es|ed)?|sit(?:s|ting|sat)?|stand(?:s|ing|stood)?|laugh(?:s|ed)?|cry(?:s|ing|cried)?|smile(?:s|d)?|wag(?:s|ged)?|bite(?:s|bit)?|lick(?:s|ed)?|chew(?:s|ed)?)\b/i;

function words(text: string): string[] {
  return clean(text)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((word) => word.length >= 3 && !STOP.has(word));
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
  const interpretive = INTERPRETIVE.test(text) ? 0.34 : 0;
  return metric(Math.max(literal, interpretive));
}

function specificity(text: string): number {
  const tokenCount = words(text).length;
  let score = tokenCount >= 2 ? 0.25 : 0.08;
  if (tokenCount >= 4) score += 0.15;
  if (/\b(?:blue|bath|bow|box|kitchen|bathroom|time|minute|receipt|poodle|wedding|song|record|door|room|car|house)\b/i.test(text)) score += 0.25;
  if (INTERPRETIVE.test(text)) score += 0.2;
  if (!GENERIC.test(text)) score += 0.15;
  return metric(score);
}

function novelty(text: string, prior: string[]): number {
  if (!prior.length) return 1;
  const current = set(text);
  const previous = set(prior.join(" "));
  if (!current.size) return 0;
  return metric(1 - overlap(current, previous));
}

function statusChange(text: string): number {
  let score = 0.1;
  if (INTERPRETIVE.test(text)) score += 0.5;
  if (/\b(?:fierce|defiant|guarded|power|control|in charge|under protest|negotiat|rebel|boss|lawyer|peace|terms|evidence)\b/i.test(text)) score += 0.25;
  if (/\b(?:but|yet|still|instead|apparently|temporarily)\b/i.test(text)) score += 0.15;
  return metric(score);
}

function creativeMove(text: string): number {
  let score = 0.12;
  if (INTERPRETIVE.test(text)) score += 0.38;
  if (MOVE_WORDS.test(text)) score += 0.18;
  if (/\b(?:but|yet|still|apparently|temporarily|under protest|already)\b/i.test(text)) score += 0.17;
  if (ACTION.test(text)) score += 0.05;
  if (!GENERIC.test(text) && !PROCESS.test(text)) score += 0.1;
  return metric(score);
}

function nextBeatPull(text: string, next: string | undefined, role: string | undefined): number {
  const nextText = clean(next);
  let score = 0.08;
  if (nextText) score += 0.28;
  if (nextText.includes("?")) score += 0.2;
  if (/\b(?:what|why|how|who|will|can|does|did|where|which)\b/i.test(nextText)) score += 0.14;
  if (/\b(?:again|still|now|next|after|then|finally|temporarily|until|before)\b/i.test(nextText)) score += 0.1;
  if (INTERPRETIVE.test(text)) score += 0.12;
  if (["hook", "pressure", "escalation", "reframe", "question"].includes(clean(role))) score += 0.08;
  if (GENERIC.test(text) || PROCESS.test(text)) score -= 0.16;
  return metric(score);
}

function cinematicity(text: string): number {
  const count = words(text).length;
  let score = count <= 7 && count >= 2 ? 0.36 : 0.12;
  if (INTERPRETIVE.test(text)) score += 0.28;
  if (ACTION.test(text)) score += 0.12;
  if (MOVE_WORDS.test(text)) score += 0.1;
  if (GENERIC.test(text) || PROCESS.test(text)) score -= 0.3;
  return metric(score);
}

function repetition(text: string, prior: string[]): number {
  if (!prior.length) return 0;
  return metric(overlap(set(text), set(prior.join(" "))));
}

function inventionRisk(text: string, evidence: string[]): number {
  const source = evidence.join(" ");
  let score = 0;
  if (ACTION.test(text) && !ACTION.test(source)) score += 0.45;
  if (/\b(?:groomer|cleaner|worker|owner|customer|client|lawyer)\b/i.test(text) && !/\b(?:groomer|cleaner|worker|owner|customer|client|lawyer)\b/i.test(source)) score += 0.2;
  if (/\b(?:will always|forever|ever again|from now on)\b/i.test(text)) score += 0.25;
  return metric(score);
}

function setupContribution(text: string, role: string | undefined): number {
  let score = 0.08;
  if (["hook", "question", "pressure"].includes(clean(role))) score += 0.28;
  if (INTERPRETIVE.test(text)) score += 0.22;
  if (/\b(?:why|what|who|how|will|can)\b/i.test(text)) score += 0.18;
  if (MOVE_WORDS.test(text)) score += 0.12;
  return metric(score);
}

function payoffContribution(text: string, role: string | undefined, prior: string[]): number {
  let score = ["payoff", "release", "callback", "consequence"].includes(clean(role)) ? 0.42 : 0.06;
  if (INTERPRETIVE.test(text)) score += 0.2;
  if (prior.length && /\b(?:again|back|still|temporarily|finally|now|then)\b/i.test(text)) score += 0.16;
  if (prior.length && overlap(set(text), set(prior.join(" "))) > 0.15) score += 0.12;
  return metric(score);
}

export function scoreAttentionBeat(input: AttentionBeatInput, priorTexts: string[], evidence: string[]): AttentionBeatScore {
  const factual = factuality(input.text, evidence);
  const specific = specificity(input.text);
  const novel = novelty(input.text, priorTexts);
  const status = statusChange(input.text);
  const creative = creativeMove(input.text);
  const pull = nextBeatPull(input.text, input.next ?? input.frontier, input.role);
  const repeated = repetition(input.text, priorTexts);
  const cine = cinematicity(input.text);
  const payoff = payoffContribution(input.text, input.role, priorTexts);
  const setup = setupContribution(input.text, input.role);
  const invention = inventionRisk(input.text, evidence);

  const attention = metric(
    specific * 0.16 + novel * 0.12 + status * 0.14 + creative * 0.13 + pull * 0.22 + cine * 0.1 + payoff * 0.07 + setup * 0.06 - repeated * 0.07,
  );

  const score = metric(
    factual * 0.22 + specific * 0.12 + attention * 0.28 + status * 0.1 + pull * 0.12 + creative * 0.09 + payoff * 0.07 - invention * 0.18 - repeated * 0.05,
  );

  const reasons: string[] = [];
  if (factual < 0.28 && !INTERPRETIVE.test(input.text)) reasons.push("weak-factual-anchor");
  if (specific < 0.38) reasons.push("weak-specificity");
  if (pull < 0.35) reasons.push("weak-next-beat-pull");
  if (creative < 0.3) reasons.push("weak-creative-move");
  if (repeated > 0.72) reasons.push("repetitive");
  if (invention > 0.45) reasons.push("high-invention-risk");
  if (GENERIC.test(input.text)) reasons.push("generic-language");
  if (PROCESS.test(input.text)) reasons.push("process-language");

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
    score,
    keep: reasons.length === 0 && score >= 0.48,
    reasons,
  };
}

export function editAttentionSequence(input: {
  beats: AttentionBeatInput[];
  evidence: string[];
}): AttentionEdit {
  const scores: AttentionBeatScore[] = [];
  const prior: string[] = [];

  for (const beat of input.beats) {
    const score = scoreAttentionBeat(beat, prior, input.evidence);
    scores.push(score);
    prior.push(beat.text);
  }

  if (scores.length >= 2) {
    const first = scores[0];
    const last = scores[scores.length - 1];
    if (first) {
      first.setupValue = metric(first.setupValue + (scores.some((item) => item.payoffContribution > 0.5) ? 0.08 : 0));
    }
    if (last && last.payoffContribution < 0.35) {
      last.reasons.push("weak-payoff");
      last.keep = false;
    }
  }

  const weakBeats = scores.filter((score) => !score.keep).map((score) => score.order);
  const sequenceScore = metric(
    scores.length
      ? scores.reduce((sum, score) => sum + score.score, 0) / scores.length
      : 0,
  );

  const rewriteInstructions = [...new Set(
    scores.flatMap((score) => score.reasons.map((reason) => `Beat ${score.order}: ${reason}`)),
  )];

  return {
    accepted: weakBeats.length === 0 && sequenceScore >= 0.52,
    sequenceScore,
    beats: scores,
    weakBeats,
    rewriteNeeded: weakBeats.length > 0 || sequenceScore < 0.52,
    rewriteInstructions,
  };
}

export function buildAttentionRewritePrompt(edit: AttentionEdit): string {
  if (!edit.rewriteNeeded) return "";
  return [
    "ATTENTION EDITOR FEEDBACK:",
    `Sequence score: ${edit.sequenceScore}`,
    `Weak beats: ${edit.weakBeats.join(", ") || "none"}`,
    ...edit.rewriteInstructions,
    "Rewrite only the weak lines.",
    "Preserve beat order and supplied facts.",
    "Do not invent a concrete event.",
    "Prefer a tiny interpretive move that creates a reason to continue.",
    "Do not make the prose longer to compensate for weak movement.",
  ].join("\n");
}
