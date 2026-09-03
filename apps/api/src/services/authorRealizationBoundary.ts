/**
 * QRE ELITE REALIZATION BOUNDARY
 *
 * RealityGraph / EventStructure is the authority for concrete world claims.
 * Semantic realization and earned interpretation authority may transform
 * language, but they never become new world facts.
 *
 * Explicit identity/state assertions remain concrete claims unless cognition
 * explicitly authorizes that realization mode.
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

function explicitIdentityAssertion(text: string, subject?: string): boolean {
  const value = String(text ?? "").trim();
  const subjectText = String(subject ?? "").trim();
  if (!value || !subjectText) return false;

  const escaped = subjectText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^${escaped}\\s+(?:is|are|was|were|become|becomes|became)\\b`,
    "i",
  ).test(value);
}

function identityNoveltyTokens(
  subject: string | undefined,
  candidate: Set<string>,
  localReality: Set<string>,
): string[] {
  const subjectTokens = tokenSet([subject ?? ""]);
  return [...candidate].filter(
    (token) =>
      !subjectTokens.has(token) &&
      !localReality.has(token),
  );
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

  const novelConcreteTokens = [...candidate].filter(
    (token) =>
      !localReality.has(token) &&
      !semantic.has(token) &&
      !foreignTokens.includes(token),
  );

  const explicitIdentity = explicitIdentityAssertion(
    input.text,
    input.subject,
  );

  const explicitInterpretationAllowed =
    (input.permittedRealizationModes ?? []).some(
      (mode) =>
        /explicit[- ]?(?:identity|interpretation|characterization)/i.test(
          String(mode),
        ),
    ) && input.inferenceBudget !== "direct";

  const identityNovelty =
    explicitIdentity &&
    !explicitInterpretationAllowed &&
    approvedNovelLanguageTokens.length > 0;

  return {
    inventionRisk:
      foreignTokens.length > 0 ||
      novelConcreteTokens.length > 0 ||
      identityNovelty
        ? 0.95
        : 0,
    foreignTokens,
    novelConcreteTokens: identityNovelty
      ? identityNoveltyTokens(
          input.subject,
          candidate,
          localReality,
        )
      : novelConcreteTokens,
    approvedNovelLanguageTokens,
  };
}
