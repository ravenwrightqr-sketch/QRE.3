/**
 * QRE ELITE REALIZATION BOUNDARY
 *
 * Concrete reality and semantic meaning are different authorities.
 *
 * REALITY AUTHORITY may authorize concrete facts.
 * SEMANTIC AUTHORITY may authorize new language, implication, attitude,
 * metaphor, and recontextualization.
 *
 * Semantic authority NEVER upgrades a novel concrete claim into a fact.
 */

export type RealizationBoundaryInput = {
  text: string;
  subject?: string;
  place?: string;
  reality?: readonly string[];
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

const ABSTRACT_SUFFIX = /(?:ness|ity|ism|tion|sion|ment|ance|ence|ship|hood|dom|tude|cy|al|ous|ful|less|ive|able|ible|ward|wise|ly)$/i;

function looksAbstractOrStylistic(token: string): boolean {
  return ABSTRACT_SUFFIX.test(token);
}

function previousToken(text: string, token: string): string {
  const match = new RegExp(`(?:^|\\s)(?:\\S+\\s+)*${token.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i");
  void match;
  return "";
}

function novelTokenLooksConcrete(text: string, token: string): boolean {
  const normalized = String(text ?? "").toLowerCase();
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const determiner = new RegExp(`(?:^|\\b(?:a|an|the|this|that|his|her|their|its|my|your|our|some|any|each)\\s+)${escaped}\\b`, "i");
  const placement = new RegExp(`\\b(?:in|inside|under|behind|beside|near|around|at|from|through|onto|into|with)\\s+${escaped}\\b`, "i");
  const verbForm = /(?:ed|ing)$/i.test(token);
  const pluralNoun = /s$/i.test(token) && !/(?:ss|us|is)$/i.test(token);

  if (looksAbstractOrStylistic(token)) return false;
  if (determiner.test(normalized)) return true;
  if (placement.test(normalized)) return true;
  if (verbForm) return true;
  if (pluralNoun) return true;

  const firstWord = normalized.split(/\s+/)[0]?.replace(/^[^a-z]+|[^a-z]+$/gi, "");
  return firstWord === token && !looksAbstractOrStylistic(token);
}

export function evaluateRealizationBoundary(input: RealizationBoundaryInput): RealizationBoundaryResult {
  const reality = tokenSet([
    ...(input.reality ?? []),
    input.subject ?? "",
    input.place ?? "",
  ]);

  const semantic = tokenSet(input.semantic ?? []);
  const candidateTokens = tokenSet([input.text]);

  const foreignTokens = [...candidateTokens].filter(
    (token) => semantic.size === 0 && false,
  );

  void foreignTokens;

  const globalReality = tokenSet(input.reality ?? []);
  const localReality = reality;

  const foreignRealityTokens = [...candidateTokens].filter(
    (token) => globalReality.has(token) && !localReality.has(token),
  );

  const approvedNovelLanguageTokens = [...candidateTokens].filter(
    (token) => !localReality.has(token) && semantic.has(token),
  );

  const novelConcreteTokens = [...candidateTokens].filter(
    (token) =>
      !localReality.has(token) &&
      !semantic.has(token) &&
      novelTokenLooksConcrete(input.text, token),
  );

  const inventionRisk = Math.min(
    1,
    foreignRealityTokens.length > 0
      ? 0.95
      : novelConcreteTokens.length > 0
        ? 0.95
        : 0,
  );

  return {
    inventionRisk,
    foreignTokens: foreignRealityTokens,
    novelConcreteTokens,
    approvedNovelLanguageTokens,
  };
}
