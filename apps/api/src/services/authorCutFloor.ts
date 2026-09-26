/**
 * QRE BARE AUTHOR CUT POLICY
 *
 * Deterministic viewer-facing safety/quality floor.
 * The model may invent language and perception; it may not invent concrete reality.
 * Semantic authority may license nonliteral framing even when surface words do not
 * overlap the source. Concrete-world authorization remains factual only.
 */
export type AuthorCutWorld = {
  subject?: string;
  facts: readonly string[];
  /**
   * Approved non-factual semantic authority from upstream Discovery.
   * This may authorize framing language, but never concrete reality.
   */
  semanticAuthority?: readonly string[];
};

export type AuthorCutPolicyResult = {
  accepted: boolean;
  reasons: string[];
  score: number;
  metrics: {
    groundedRatio: number;
    compression: number;
    implication: number;
    inventionRisk: number;
    explanation: number;
  };
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for",
  "with", "from", "by", "through", "after", "before", "then", "now", "this",
  "that", "it", "is", "are", "was", "were", "be", "been", "being", "as",
  "into", "my", "your", "our", "their", "his", "her", "its", "he", "she",
  "they", "them", "you", "we", "me",
]);

const INTERNAL =
  /\b(?:qre|compiler|cognition|metadata|prompt|beat plan|candidate|grounding|semantic gate|viewer|audience|author|mouth)\b/i;
const CAMERA =
  /\b(?:camera|zoom|close-up|cut to|final shot|fade to|scene opens|we see)\b/i;
const EXPLANATION =
  /\b(?:because|therefore|which means|this means|in other words|the reason|symbolizes?|represents?|shows that|explains?)\b/i;
const FUTURE =
  /\b(?:will always|will never|forever|from now on|in the future|ever again)\b/i;
const PHYSICAL_ACTION =
  /\b(?:smile|smiles|smiled|wag|wags|wagged|jump|jumps|jumped|run|runs|ran|walk|walks|walked|grab|grabs|grabbed|pull|pulls|pulled|yank|yanks|yanked|tug|tugs|tugged|bite|bites|bit|lick|licks|licked|shake|shakes|shook|tremble|trembles|trembled|shiver|shivers|shivered|stare|stares|stared|blink|blinks|blinked|nod|nods|nodded|laugh|laughs|laughed|cry|cries|cried|reach|reaches|reached|escape|escapes|escaped|release|releases|released)\b/i;
const BODY_OR_SCENE =
  /\b(?:tail|tails|paw|paws|eye|eyes|face|mouth|teeth|ears|ear|legs|leg|hands|hand|feet|foot|room|door|window|floor|wall|table|chair|street|road|sky|shadow|shadows|sun|sunbeam|breeze|wind|rain|perfume|scent|smell|mirror)\b/i;
const ATTEMPT =
  /\b(?:try|tries|tried|attempt|attempts|attempted)\b/i;
const COMPLETED_OUTCOME =
  /\b(?:free|freed|escaped|released|removed|gone|won|victory|succeeded|successfully)\b/i;
const ATTITUDE_ONLY =
  /^(?:no|yes|mine|ours|absolutely not|not happening|really|seriously|apparently|okay|fine|fight)[.!?]*$/i;
const TEMPORAL_COMPARISON =
  /\b(?:long|short|brief|briefly|quick|quickly|slow|slowly|fast|faster|slower)\b/i;

const RECURRENCE_CLAIM =
  /\b(?:again|returned|returns|returning|back|recurred|recurs|recurring|repeated|repeats|next\s+(?:day|week|month|year))\b/i;

function words(value: string): string[] {
  return clean(value)
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/i)
    .filter((word) => word.length >= 3 && !STOP.has(word));
}

function normalizedRoot(value: string): string {
  const word = value.toLowerCase();
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function factualSourceText(world: AuthorCutWorld): string {
  return [world.subject, ...world.facts].map(clean).filter(Boolean).join(" ");
}

function groundingSourceText(world: AuthorCutWorld): string {
  return [
    world.subject,
    ...world.facts,
    ...(world.semanticAuthority ?? []),
  ].map(clean).filter(Boolean).join(" ");
}

function groundedRatio(text: string, world: AuthorCutWorld): number {
  const candidate = words(text);
  if (!candidate.length) return 0;
  const source = new Set(words(groundingSourceText(world)).map(normalizedRoot));
  const grounded = candidate.filter((word) => source.has(normalizedRoot(word)));
  return grounded.length / candidate.length;
}

function lineEconomy(text: string): number {
  // Length is not a quality proxy. A tiny hit, a medium line, or a longer turn
  // may all be right. Explanation and grounding are judged separately.
  return clean(text) ? 1 : 0;
}

function implication(text: string): number {
  let score = 0.2;
  if (clean(text).split(/\s+/).filter(Boolean).length <= 7) score += 0.3;
  if (/\b(?:no|yes|mine|still|again|apparently|only|just|even|back|then)\b/i.test(text)) score += 0.25;
  if (!EXPLANATION.test(text)) score += 0.25;
  return Math.min(1, score);
}

function inventionRisk(text: string, world: AuthorCutWorld): number {
  const source = factualSourceText(world);
  let risk = 0;

  if (PHYSICAL_ACTION.test(text) && !PHYSICAL_ACTION.test(source)) risk += 0.65;
  if (BODY_OR_SCENE.test(text) && !BODY_OR_SCENE.test(source)) risk += 0.65;
  if (FUTURE.test(text)) risk += 0.35;

  if (RECURRENCE_CLAIM.test(text) && !RECURRENCE_CLAIM.test(source)) risk += 0.8;
  if (ATTEMPT.test(source) && COMPLETED_OUTCOME.test(text) && !COMPLETED_OUTCOME.test(source)) {
    risk += 0.8;
  }

  return Math.min(1, risk);
}

export function evaluateAuthorCut(
  textInput: string,
  world: AuthorCutWorld,
): AuthorCutPolicyResult {
  const text = clean(textInput);
  const reasons: string[] = [];
  const grounded = groundedRatio(text, world);
  const economical = lineEconomy(text);
  const implied = implication(text);
  const invented = inventionRisk(text, world);
  const explained = EXPLANATION.test(text) ? 1 : 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (!text) reasons.push("empty");
  if (wordCount > 12) reasons.push("overlong-cut");
  if (INTERNAL.test(text)) reasons.push("internal-language");
  if (CAMERA.test(text)) reasons.push("camera-language");
  if (invented >= 0.6) reasons.push("invented-concrete-reality");

  if (
    RECURRENCE_CLAIM.test(text) &&
    !RECURRENCE_CLAIM.test(factualSourceText(world))
  ) {
    reasons.push("unsupported-recurrence");
  }
  if (explained >= 1) reasons.push("explanation");
  if (
    TEMPORAL_COMPARISON.test(text) &&
    !TEMPORAL_COMPARISON.test(factualSourceText(world))
  ) {
    reasons.push("unsupported-temporal-comparison");
  }
  const hasSemanticAuthority = (world.semanticAuthority ?? [])
    .map(clean)
    .some(Boolean);

  if (
    grounded === 0 &&
    !hasSemanticAuthority &&
    wordCount >= 2 &&
    !ATTITUDE_ONLY.test(text)
  ) {
    reasons.push("unanchored-decoration");
  }

  const score = Math.max(
    0,
    Math.min(
      1,
      grounded * 0.34 +
        economical * 0.2 +
        implied * 0.3 +
        (1 - invented) * 0.16 -
        explained * 0.2,
    ),
  );

  return {
    accepted: reasons.length === 0,
    reasons,
    score: Number(score.toFixed(3)),
    metrics: {
      groundedRatio: Number(grounded.toFixed(3)),
      compression: Number(economical.toFixed(3)),
      implication: Number(implied.toFixed(3)),
      inventionRisk: Number(invented.toFixed(3)),
      explanation: explained,
    },
  };
}
