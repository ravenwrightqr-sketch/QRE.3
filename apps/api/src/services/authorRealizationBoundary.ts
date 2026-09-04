/**
 * QRE REALIZATION BOUNDARY
 *
 * RealityGraph / EventStructure owns concrete world truth.
 * Mouth may invent language freely inside the approved semantic meaning.
 * This boundary rejects only claims that actually introduce a new concrete
 * occurrence, spatial fact, or action by a known entity.
 *
 * Novel language is not evidence of invention.
 */

export type RealizationBoundaryInput = {
  text: string;
  subject?: string;
  place?: string;
  localReality?: readonly string[];
  globalReality?: readonly string[];
  semantic?: readonly string[];
  earnedInterpretations?: readonly string[];
  permittedRealizationModes?: readonly string[];
  inferenceBudget?:
    | "direct"
    | "compressed"
    | "interpretive"
    | "strongly-interpretive";
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
  "has", "have", "had", "got", "gets", "get",
]);

const tokens = (value: string): string[] =>
  String(value ?? "")
    .toLowerCase()
    .split(/[^a-z0-9'’-]+/g)
    .map((token) => token.replace(/[’']s$/i, ""))
    .filter((token) => token.length >= 3 && !STOP.has(token));

const tokenSet = (values: readonly string[]): Set<string> =>
  new Set(values.flatMap(tokens));

function unsupportedSpatialTokens(
  text: string,
  localReality: Set<string>,
  semantic: Set<string>,
): string[] {
  const out: string[] = [];
  const pattern = /\b(?:in|inside|outside|on|under|over|above|below|behind|beside|near|around|across|through|beneath|within|between)\s+(?:the|a|an)?\s*([a-z][a-z0-9'’-]{2,})\b/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(String(text ?? "")))) {
    const token = String(match[1] ?? "").toLowerCase();
    if (!token || STOP.has(token) || localReality.has(token) || semantic.has(token)) continue;
    out.push(token);
  }

  return [...new Set(out)];
}

function unsupportedSubjectActionTokens(
  text: string,
  subject: string | undefined,
  localReality: Set<string>,
  semantic: Set<string>,
): string[] {
  const subjectText = String(subject ?? "").trim();
  if (!subjectText) return [];

  const escaped = subjectText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const subjectPattern = new RegExp(
    `\\b${escaped}\\b(?:['’]s)?(?:\\s+[^.!?;:,]{0,32})?\\s+([a-z][a-z0-9'’-]{2,}(?:ed|ing|s))\\b`,
    "i",
  );

  const match = subjectPattern.exec(String(text ?? ""));
  if (!match) return [];

  const token = String(match[1] ?? "").toLowerCase();
  if (!token || STOP.has(token) || localReality.has(token) || semantic.has(token)) return [];
  return [token];
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

  const semantic = tokenSet([
    ...(input.semantic ?? []),
    ...(input.earnedInterpretations ?? []),
  ]);

  const candidate = tokenSet([input.text]);

  const foreignTokens = [...candidate].filter(
    (token) => globalReality.has(token) && !localReality.has(token),
  );

  const approvedNovelLanguageTokens = [...candidate].filter(
    (token) => !localReality.has(token) && semantic.has(token),
  );

  const unknownTokens = [...candidate].filter(
    (token) =>
      !localReality.has(token) &&
      !semantic.has(token) &&
      !foreignTokens.includes(token),
  );

  const spatialTokens = unsupportedSpatialTokens(
    input.text,
    localReality,
    semantic,
  );

  const subjectActionTokens = unsupportedSubjectActionTokens(
    input.text,
    input.subject,
    localReality,
    semantic,
  );

  const novelConcreteTokens = [
    ...new Set(
      [...spatialTokens, ...subjectActionTokens].filter((token) =>
        unknownTokens.includes(token),
      ),
    ),
  ];

  const concreteClaim =
    foreignTokens.length > 0 ||
    novelConcreteTokens.length > 0;

  return {
    inventionRisk: concreteClaim ? 0.95 : 0,
    foreignTokens,
    novelConcreteTokens,
    approvedNovelLanguageTokens,
  };
}
