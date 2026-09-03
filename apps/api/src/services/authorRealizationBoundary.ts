/**
 * QRE ELITE REALIZATION BOUNDARY
 *
 * Semantic authority authorizes language transformation.
 * Reality authority authorizes concrete world claims.
 * Those authorities are never interchangeable.
 */

export type RealizationBoundaryInput = {
  text: string;
  subject?: string;
  place?: string;
  localReality?: readonly string[];
  globalReality?: readonly string[];
  semantic?: readonly string[];
};

export type RealizationBoundaryResult = {
  inventionRisk: number;
  foreignTokens: string[];
  novelConcreteTokens: string[];
  approvedNovelLanguageTokens: string[];
};

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "by", "through",
  "after", "before", "then", "now", "still", "again", "this", "that", "it", "is", "are", "was", "were", "be",
  "been", "being", "as", "into", "my", "your", "our", "their", "his", "her", "its", "he", "she", "they", "them",
  "you", "we", "me", "very", "really", "just", "already", "apparently", "somehow", "perhaps", "maybe",
]);

const tokens = (value: string): string[] =>
  String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/g)
    .filter((token) => token.length >= 3 && !STOP.has(token));

const tokenSet = (values: readonly string[]): Set<string> =>
  new Set(values.flatMap(tokens));

const ABSTRACT_SUFFIX = /(?:ness|ity|ism|tion|sion|ment|ance|ence|ship|hood|dom|tude|cy|ous|ful|less|ive|able|ible|ward|wise|ly)$/i;

function isStylistic(token: string): boolean {
  return ABSTRACT_SUFFIX.test(token);
}

function likelyConcreteToken(text: string, token: string): boolean {
  const normalized = String(text ?? "").toLowerCase();
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const determiner = new RegExp(
    `(?:^|\\b(?:a|an|the|this|that|his|her|their|its|my|your|our|some|any|each)\\s+)${escaped}\\b`,
    "i",
  );

  const placement = new RegExp(
    `\\b(?:in|inside|under|behind|beside|near|around|at|from|through|onto|into|with)\\s+${escaped}\\b`,
    "i",
  );

  const verbForm = /(?:ed|ing)$/i.test(token);
  const pluralNoun = /s$/i.test(token) && !/(?:ss|us|is)$/i.test(token);

  if (isStylistic(token)) return false;
  if (determiner.test(normalized)) return true;
  if (placement.test(normalized)) return true;
  if (verbForm) return true;
  if (pluralNoun) return true;

  const firstWord = normalized
    .split(/\s+/)[0]
    ?.replace(/^[^a-z]+|[^a-z]+$/gi, "");

  return firstWord === token && !isStylistic(token);
}

export function evaluateRealizationBoundary(
  input: RealizationBoundaryInput,
): RealizationBoundaryResult {
  const localReality = tokenSet([
    ...(input.localReality ?? []),
    input.subject ?? "",
    input.place ?? "",
  ]);

  const globalReality = tokenSet(
    input.globalReality ?? input.localReality ?? [],
  );

  const semantic = tokenSet(input.semantic ?? []);
  const candidate = tokenSet([input.text]);

  const foreignTokens = [...candidate].filter(
    (token) =>
      globalReality.has(token) &&
      !localReality.has(token),
  );

  const approvedNovelLanguageTokens = [...candidate].filter(
    (token) =>
      !localReality.has(token) &&
      semantic.has(token),
  );

  const novelConcreteTokens = [...candidate].filter(
    (token) =>
      !localReality.has(token) &&
      !semantic.has(token) &&
      !foreignTokens.includes(token) &&
      likelyConcreteToken(input.text, token),
  );

  return {
    inventionRisk:
      foreignTokens.length || novelConcreteTokens.length
        ? 0.95
        : 0,
    foreignTokens,
    novelConcreteTokens,
    approvedNovelLanguageTokens,
  };
}
