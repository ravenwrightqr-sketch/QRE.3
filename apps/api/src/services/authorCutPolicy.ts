/**
 * QRE AUTHOR CUT POLICY · CANONICAL
 *
 * One sequence cut is one short viewer-facing moment.
 * The policy protects truth, novelty, implication, attention density, and
 * compression without forcing creative language to reuse literal source words.
 */

export type CutWorld = {
  prompt?: string;
  subject?: string;
  place?: string;
  identity?: readonly string[];
  facts?: readonly string[];
  moments?: readonly string[];
  memory?: readonly string[];
  trajectory?: readonly string[];
  presence?: readonly string[];
};

export type CutIntent = {
  role?: string;
  gainKind?: string;
  change?: string;
  next?: string;
  text?: string;
  subjectEstablished?: boolean;
  informationFrontier?: string;
};

export type CutPolicyResult = {
  accepted: boolean;
  reasons: string[];
  metrics: {
    wordCount: number;
    groundedTokenRatio: number;
    novelty: number;
    implication: number;
    explanation: number;
    questionLeak: number;
    inventionRisk: number;
    repetition: number;
    compression: number;
    subjectReferenceCost: number;
    frontierValue: number;
    semanticDensity: number;
    factRestatement: number;
  };
};

const META = /\b(?:qre|prompt|compiler|cognition|metadata|language model|writing process|attention strategy|operator mix|beat plan)\b/i;
const CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|scene opens|we see|fade to)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|luxury experience|perfect day|special moment|living world|emotional journey|positive transformation)\b/i;
const LITERAL_QUESTION = /\?/;
const PROVIDER = /\b(?:groomer|cleaner|technician|barber|stylist|mechanic|plumber|employee|worker|staff|owner|customer|client)\b/i;
const PHYSICAL_ACTION = /\b(?:trembles?|shakes?|leaps?|jumps?|hides?|cries?|smiles?|wags?|runs?|grabs?|throws?|places?|removes?|approaches?|walks?|laughs?|chews?|licks?|bites?|drops?|pulls?|picks?|breaks?|shatters?|slams?|flies?|spills?|clinks?|cracks?)\b/i;
const EXPLANATION = /\b(?:because|therefore|which means|this means|so that|in other words|the reason|now understands|symbolizes?|represents?|shows that|learns that|proving that)\b/i;
const DIRECT_ADDRESS = /\b(?:you|your|viewer|audience)\b/i;
const FUTURE_CLAIM = /\b(?:from now on|will always|will never|forever|ever again|in the future)\b/i;
const GENERIC_EMOTION = /\b(?:happy|sad|angry|excited|afraid|scared|nervous|joyful|thrilled|content|confident|loving|furious|heartbroken|alarmed|relieved|anxious|delighted|worried|calm|proud|uneasy|gleeful|happiness)\b/i;
const SUBJECT_REFERENCE = /\b(?:he|she|they|it|him|her|them|his|her|their|its)\b/i;
const STOP = new Set("the a an and or but for to of in on at with from this that is are was were be been being as into by through after before then now very just still again his her their its it's he she they them you we me my our your what when where why how one two three four five six seven eight nine ten new more".split(/\s+/));
const IRREGULAR = new Map([["knives", "knife"], ["leaves", "leaf"], ["wives", "wife"], ["lives", "life"], ["puppies", "puppy"], ["stories", "story"]]);

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

function normalizeWord(word: string): string {
  const lower = word.toLowerCase();
  if (IRREGULAR.has(lower)) return IRREGULAR.get(lower)!;
  if (lower.length > 5 && lower.endsWith("ies")) return `${lower.slice(0, -3)}y`;
  if (lower.length > 5 && lower.endsWith("ing")) return lower.slice(0, -3);
  if (lower.length > 4 && lower.endsWith("ed")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.length > 4 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
}

function sourceText(world: CutWorld): string[] {
  return [world.prompt, world.subject, world.place, ...(world.identity ?? []), ...(world.facts ?? []), ...(world.moments ?? []), ...(world.memory ?? []), ...(world.trajectory ?? []), ...(world.presence ?? [])]
    .map(clean)
    .filter(Boolean);
}

function contentWords(text: string): string[] {
  return clean(text)
    .toLowerCase()
    .split(/[^a-z0-9'-]+/i)
    .filter((word) => word.length >= 3 && !STOP.has(word))
    .map(normalizeWord);
}

function groundedTokenRatio(text: string, world: CutWorld): number {
  const words = contentWords(text);
  if (!words.length) return 1;
  const sources = sourceText(world).map((item) => contentWords(item));
  const grounded = words.filter((word) => sources.some((source) => source.includes(word)));
  return grounded.length / words.length;
}

function noveltyScore(text: string, priorCuts: readonly string[]): number {
  if (!priorCuts.length) return 1;
  const current = new Set(contentWords(text));
  const prior = new Set(priorCuts.flatMap(contentWords));
  if (!current.size) return 0;
  const fresh = [...current].filter((word) => !prior.has(word)).length;
  return fresh / current.size;
}

function implicationScore(text: string): number {
  const words = contentWords(text);
  if (!words.length) return 0;
  let score = 0.2;
  if (words.length <= 7) score += 0.25;
  if (/\b(?:again|already|still|yet|apparently|finally|only|just|even|back|then)\b/i.test(text)) score += 0.2;
  if (/\b(?:no|yes|mine|ours|same|different|except|until|before|after)\b/i.test(text)) score += 0.15;
  if (!EXPLANATION.test(text)) score += 0.2;
  return Math.min(1, score);
}

function explanationScore(text: string): number {
  let score = 0;
  if (EXPLANATION.test(text)) score += 0.5;
  if (text.split(/\s+/).length > 8) score += 0.2;
  if (/\b(?:the|this|that)\b.*\b(?:because|means|shows|represents?)\b/i.test(text)) score += 0.2;
  if (DIRECT_ADDRESS.test(text)) score += 0.1;
  return Math.min(1, score);
}

function inventionRisk(text: string, world: CutWorld): number {
  const worldTextValue = sourceText(world).join(" ");
  let risk = 0;
  if (PHYSICAL_ACTION.test(text) && !PHYSICAL_ACTION.test(worldTextValue)) risk += 0.35;
  if (PROVIDER.test(text) && !PROVIDER.test(worldTextValue)) risk += 0.25;
  if (FUTURE_CLAIM.test(text)) risk += 0.3;
  return Math.min(1, risk);
}

function repetitionScore(text: string, priorCuts: readonly string[]): number {
  if (!priorCuts.length) return 0;
  const current = new Set(contentWords(text));
  const prior = new Set(priorCuts.flatMap(contentWords));
  if (!current.size) return 1;
  const repeated = [...current].filter((word) => prior.has(word)).length;
  return repeated / current.size;
}

function compressionScore(text: string): number {
  const words = clean(text).split(/\s+/).filter(Boolean).length;
  if (words <= 2) return 1;
  if (words <= 4) return 0.98;
  if (words <= 6) return 0.94;
  if (words === 7) return 0.9;
  return 0;
}

function semanticDensity(text: string): number {
  const raw = clean(text);
  const words = contentWords(raw);
  if (!words.length) return 0;
  let value = 0.2;
  if (words.length >= 2) value += 0.2;
  if (words.length >= 4) value += 0.15;
  if (PHYSICAL_ACTION.test(raw)) value += 0.15;
  if (/\b(?:again|already|still|yet|only|even|back|different|same|but|except|until|before|after)\b/i.test(raw)) value += 0.15;
  if (GENERIC_EMOTION.test(raw)) value -= 0.05;
  return Math.max(0, Math.min(1, value));
}

function factRestatement(text: string, world: CutWorld): number {
  const normalized = contentWords(text).join(" ");
  if (!normalized) return 1;
  const known = sourceText(world).map((item) => contentWords(item).join(" "));
  if (known.includes(normalized)) return 1;
  return 0;
}

function subjectReferenceCost(text: string, world: CutWorld, priorCuts: readonly string[], subjectEstablished: boolean): number {
  const subject = clean(world.subject);
  if (!subject || !subjectEstablished) return 0;
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const explicit = new RegExp(`\\b${escaped}\\b`, "i").test(text);
  const pronoun = SUBJECT_REFERENCE.test(text);
  if (explicit && priorCuts.some((cut) => new RegExp(`\\b${escaped}\\b`, "i").test(cut))) return 0.55;
  if (explicit) return 0.2;
  if (pronoun) return 0.05;
  return 0;
}

function frontierValue(text: string, intent: CutIntent, priorCuts: readonly string[]): number {
  const frontier = clean(intent.informationFrontier);
  if (!frontier) return 0.2;
  const candidate = new Set(contentWords(text));
  const frontierWords = new Set(contentWords(frontier));
  const hits = [...candidate].filter((word) => frontierWords.has(word)).length;
  return Math.min(1, (hits / Math.max(1, frontierWords.size)) * 0.55 + noveltyScore(text, priorCuts) * 0.45);
}

export function evaluateCut(textInput: string, world: CutWorld, intent: CutIntent = {}, priorCuts: readonly string[] = []): CutPolicyResult {
  const text = clean(textInput);
  const reasons: string[] = [];
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const grounded = groundedTokenRatio(text, world);
  const novelty = noveltyScore(text, priorCuts);
  const implication = implicationScore(text);
  const explanation = explanationScore(text);
  const questionLeak = LITERAL_QUESTION.test(text) && !sourceText(world).some((item) => item.includes(text)) ? 1 : 0;
  const invention = inventionRisk(text, world);
  const repetition = repetitionScore(text, priorCuts);
  const compression = compressionScore(text);
  const referenceCost = subjectReferenceCost(text, world, priorCuts, Boolean(intent.subjectEstablished));
  const frontier = frontierValue(text, intent, priorCuts);
  const density = semanticDensity(text);
  const restatement = factRestatement(text, world);

  if (!text) reasons.push("empty");
  if (wordCount > 7) reasons.push("too-long");
  if (META.test(text)) reasons.push("meta-language");
  if (CAMERA.test(text)) reasons.push("camera-language");
  if (GENERIC.test(text)) reasons.push("generic-prose");
  if (questionLeak) reasons.push("question-leak");
  if (invention >= 0.6) reasons.push("invention-risk");
  if (explanation >= 0.75) reasons.push("explanation-heavy");
  if (grounded < 0.16 && wordCount > 2) reasons.push("weak-grounding");
  if (repetition >= 0.92 && priorCuts.length) reasons.push("repetition");
  if (referenceCost >= 0.5) reasons.push("wasted-subject-reference");
  if (wordCount === 1 && density < 0.5) reasons.push("subject-or-label-only");
  if (restatement >= 0.9) reasons.push("known-fact-restatement");
  if (density < 0.2 && wordCount <= 3) reasons.push("low-semantic-density");
  if (["hook", "reframe", "callback"].includes(clean(intent.role)) && compression < 0.85) reasons.push("low-impact-density");
  if (clean(intent.gainKind) === "question" && questionLeak) reasons.push("cognitive-question-in-mouth");
  if (frontier < 0.08 && novelty < 0.15 && wordCount > 2) reasons.push("frontier-starvation");

  return {
    accepted: reasons.length === 0,
    reasons,
    metrics: {
      wordCount,
      groundedTokenRatio: Number(grounded.toFixed(3)),
      novelty: Number(novelty.toFixed(3)),
      implication: Number(implication.toFixed(3)),
      explanation: Number(explanation.toFixed(3)),
      questionLeak,
      inventionRisk: Number(invention.toFixed(3)),
      repetition: Number(repetition.toFixed(3)),
      compression: Number(compression.toFixed(3)),
      subjectReferenceCost: Number(referenceCost.toFixed(3)),
      frontierValue: Number(frontier.toFixed(3)),
      semanticDensity: Number(density.toFixed(3)),
      factRestatement: Number(restatement.toFixed(3)),
    },
  };
}
