/**
 * QRE ELITE REALIZATION BOUNDARY
 *
 * RealityGraph / EventStructure is the authority for concrete world claims.
 * Semantic realization is the authority for language transformation.
 * Those authorities are never interchangeable.
 *
 * Boundary rule:
 * - concrete language must be present in the authorized reality scope;
 * - novel language is allowed only when explicitly represented by semantic
 *   authority;
 * - anything else is treated as a novel concrete-world claim and rejected.
 *
 * This deliberately does not maintain an English verb/noun vocabulary. QRE
 * should remain universal across domains and languages rather than learning
 * reality from a hardcoded lexical list.
 */

export type RealizationBoundaryInput = {
  text: string;
  subject?: string;
  place?: string;
  localReality?: readonly string[];
  globalReality?: readonly string[];
  /** Semantic realization only. This can authorize language, never facts. */
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
    (token) => globalReality.has(token) && !localReality.has(token),
  );

  const approvedNovelLanguageTokens = [...candidate].filter(
    (token) => !localReality.has(token) && semantic.has(token),
  );

  /*
   * Critical boundary:
   *
   *   RealityGraph / EventStructure → localReality
   *   semantic realization          → semantic
   *
   * A token outside both authorities is not something Mouth may invent merely
   * because it resembles a stylistic word, verb, noun, adjective, or other
   * English category. Ambiguous novelty fails closed.
   */
  const novelConcreteTokens = [...candidate].filter(
    (token) => !localReality.has(token) && !semantic.has(token),
  );

  return {
    inventionRisk:
      foreignTokens.length > 0 || novelConcreteTokens.length > 0
        ? 0.95
        : 0,
    foreignTokens,
    novelConcreteTokens,
    approvedNovelLanguageTokens,
  };
}
