/**
 * STATUS: CANONICAL
 * ROLE: Final viewer-facing text gate.
 * MUST NOT: require novelty at the expense of truth, reject rhetorical wording,
 * or force internal compiler concepts into the Mouth contract.
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
  characterTraits?: readonly string[];
  characterContradictions?: readonly string[];
  characterStatusPosture?: string;
  characterFrames?: readonly string[];
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

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();
const words = (value: string): string[] => clean(value).toLowerCase().split(/[^a-z0-9'-]+/i).filter((w) => w.length >= 3);
const set = (value: string): Set<string> => new Set(words(value));

const INTERNAL = /\b(?:qre|compiler|cognition|metadata|beat graph|meaning spine|information frontier|attention editor|operator mix|planner|planning|writing process|candidate pool|sequence beam|cut policy|author brief|viewer momentum)\b/i;
const CAMERA = /\b(?:camera|zoom|close-up|cut to|final shot|fade to|scene opens|we see)\b/i;
const GENERIC = /\b(?:beautiful transformation|magical moment|unforgettable experience|incredible journey|perfect day|special moment|living world|emotional journey|positive transformation)\b/i;
const EXPLANATION = /\b(?:because|therefore|which means|this means|in other words|the reason|symbolizes?|represents?|shows that|explains?)\b/i;
const FUTURE = /\b(?:will always|will never|forever|from now on|in the future|ever again)\b/i;
const INVENTED_PHYSICAL = /\b(?:glares?|sniffs?|stares?|smiles?|wags?|trembles?|blinks?|walks?|runs?|jumps?|grabs?|bites?|laughs?|cries?|hides?|opens?|closes?|throws?|pulls?|pushes?)\b/i;
const META_ADDRESS = /\b(?:the viewer|the audience|viewer sees|audience sees)\b/i;

function sourceText(world: CutWorld): string[] {
  return [
    world.prompt,
    world.subject,
    world.place,
    ...(world.identity ?? []),
    ...(world.facts ?? []),
    ...(world.moments ?? []),
    ...(world.memory ?? []),
    ...(world.trajectory ?? []),
    ...(world.presence ?? []),
  ].map(clean).filter(Boolean);
}

function groundedRatio(text: string, world: CutWorld): number {
  const current = words(text);
  if (!current.length) return 0;
  const source = new Set(sourceText(world).flatMap(words));
  let hits = 0;
  for (const word of current) if (source.has(word) || ["no", "yes", "still", "then", "just", "apparently", "only", "again", "absolutely", "temporary", "ready", "round"].includes(word)) hits += 1;
  return hits / current.length;
}

function novelty(text: string, prior: readonly string[]): number {
  if (!prior.length) return 1;
  const current = set(text);
  const previous = set(prior.join(" "));
  if (!current.size) return 0;
  const fresh = [...current].filter((word) => !previous.has(word)).length;
  return fresh / current.size;
}

function repetition(text: string, prior: readonly string[]): number {
  return 1 - novelty(text, prior);
}

function compression(text: string): number {
  const count = words(text).length;
  if (!count) return 0;
  if (count <= 7) return 1;
  if (count <= 10) return 0.5;
  return 0.1;
}

function implication(text: string): number {
  let value = compression(text) * 0.45;
  if (/\b(?:still|again|then|yet|only|apparently|already|after|before|now|round)\b/i.test(text)) value += 0.25;
  if (/\?|!/.test(text)) value += 0.15;
  if (!EXPLANATION.test(text)) value += 0.15;
  return Math.min(1, value);
}

function explanation(text: string): number {
  let value = 0;
  if (EXPLANATION.test(text)) value += 0.6;
  if (META_ADDRESS.test(text)) value += 0.3;
  if (words(text).length > 10) value += 0.15;
  return Math.min(1, value);
}

function inventionRisk(text: string, world: CutWorld): number {
  if (!text) return 1;
  const source = sourceText(world).join(" ");
  let risk = 0;
  if (INVENTED_PHYSICAL.test(text) && !INVENTED_PHYSICAL.test(source)) risk += 0.6;
  if (FUTURE.test(text)) risk += 0.25;
  return Math.min(1, risk);
}

function subjectReferenceCost(text: string, world: CutWorld, prior: readonly string[], established: boolean): number {
  const subject = clean(world.subject);
  if (!subject || !established) return 0;
  const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const explicit = new RegExp(`\\b${escaped}\\b`, "i").test(text);
  const repeated = prior.some((line) => new RegExp(`\\b${escaped}\\b`, "i").test(line));
  return explicit && repeated ? 0.55 : explicit ? 0.2 : 0;
}

function frontierValue(text: string, intent: CutIntent, prior: readonly string[]): number {
  const frontier = clean(intent.informationFrontier);
  if (!frontier) return 0.4 + novelty(text, prior) * 0.2;
  const current = set(text);
  const target = set(frontier);
  let hits = 0;
  for (const word of current) if (target.has(word)) hits += 1;
  return Math.min(1, hits / Math.max(1, target.size) * 0.7 + novelty(text, prior) * 0.3);
}

export function evaluateCut(textInput: string, world: CutWorld, intent: CutIntent = {}, priorCuts: readonly string[] = []): CutPolicyResult {
  const text = clean(textInput);
  const reasons: string[] = [];
  const wordCount = words(text).length;
  const grounded = groundedRatio(text, world);
  const novel = novelty(text, priorCuts);
  const repeated = repetition(text, priorCuts);
  const compressed = compression(text);
  const implied = implication(text);
  const explained = explanation(text);
  const invented = inventionRisk(text, world);
  const frontier = frontierValue(text, intent, priorCuts);
  const referenceCost = subjectReferenceCost(text, world, priorCuts, Boolean(intent.subjectEstablished));
  const factRestatement = sourceText(world).some((source) => clean(source).toLowerCase() === text.toLowerCase()) ? 1 : 0;
  const semanticDensity = Math.min(1, compressed * 0.6 + implied * 0.4);
  const questionLeak = 0;

  if (!text) reasons.push("empty");
  if (wordCount > 12) reasons.push("too-long");
  if (INTERNAL.test(text)) reasons.push("meta-language");
  if (CAMERA.test(text)) reasons.push("camera-language");
  if (GENERIC.test(text)) reasons.push("generic-prose");
  if (META_ADDRESS.test(text)) reasons.push("meta-audience-language");
  if (invented >= 0.75) reasons.push("invention-risk");
  if (explained >= 0.8) reasons.push("explanation-heavy");
  if (grounded < 0.2 && wordCount > 2) reasons.push("weak-grounding");
  if (repeated >= 0.98 && priorCuts.length) reasons.push("repetition");
  if (referenceCost >= 0.55 && explained >= 0.5 && novel < 0.25) reasons.push("wasted-subject-reference");

  return {
    accepted: reasons.length === 0,
    reasons,
    metrics: {
      wordCount,
      groundedTokenRatio: Number(grounded.toFixed(3)),
      novelty: Number(novel.toFixed(3)),
      implication: Number(implied.toFixed(3)),
      explanation: Number(explained.toFixed(3)),
      questionLeak,
      inventionRisk: Number(invented.toFixed(3)),
      repetition: Number(repeated.toFixed(3)),
      compression: Number(compressed.toFixed(3)),
      subjectReferenceCost: Number(referenceCost.toFixed(3)),
      frontierValue: Number(frontier.toFixed(3)),
      semanticDensity: Number(semanticDensity.toFixed(3)),
      factRestatement: Number(factRestatement.toFixed(3)),
    },
  };
}
