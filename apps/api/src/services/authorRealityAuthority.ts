export type AuthorRealityAuthority =
  | "ATTRIBUTE"
  | "PREFERENCE"
  | "EVENT"
  | "RELATIONSHIP"
  | "STATE"
  | "MEASUREMENT"
  | "SEQUENCE"
  | "UNKNOWN";

export type AuthorRealityEvidence = {
  id: string;
  text: string;
  authority?: AuthorRealityAuthority;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

export function inferAuthorRealityAuthority(
  evidence: Pick<AuthorRealityEvidence, "text" | "authority">,
): AuthorRealityAuthority {
  if (evidence.authority) return evidence.authority;

  const text = clean(evidence.text).toLowerCase();
  if (!text) return "UNKNOWN";

  if (/^(?:name|species|type|kind|category|color|colour|breed|model|title)\s*:/i.test(text)) {
    return "ATTRIBUTE";
  }

  if (/\b(?:loves?|likes?|prefers?|hates?|dislikes?|favorite|favourite)\b/i.test(text)) {
    return "PREFERENCE";
  }

  if (/\b(?:belongs to|owned by|owner of|married to|partner of|parent of|mother of|father of|child of|friend of|sibling of)\b/i.test(text)) {
    return "RELATIONSHIP";
  }

  if (/\b\d+(?:\.\d+)?\s*(?:%|seconds?|minutes?|hours?|days?|weeks?|months?|years?|mg|g|kg|oz|lbs?|ml|l|cm|mm|m|km|ft|inches?|miles?|mph|psi|rpm|°f|°c)\b/i.test(text)) {
    return "MEASUREMENT";
  }

  return "UNKNOWN";
}

export function projectAuthorRealityEvidence(
  evidence: readonly AuthorRealityEvidence[],
): Array<{ id: string; text: string; authority: AuthorRealityAuthority }> {
  return evidence.map((item) => ({
    id: clean(item.id),
    text: clean(item.text),
    authority: inferAuthorRealityAuthority(item),
  }));
}

export function unsupportedPreferenceOccurrenceReason(
  text: string,
  evidence: readonly AuthorRealityEvidence[],
): string | undefined {
  const authorities = projectAuthorRealityEvidence(evidence).map((item) => item.authority);
  const hasPreference = authorities.includes("PREFERENCE");
  const nonOccurrenceOnly = authorities.every((authority) =>
    authority === "ATTRIBUTE" ||
    authority === "PREFERENCE" ||
    authority === "RELATIONSHIP" ||
    authority === "MEASUREMENT",
  );

  if (!hasPreference || !nonOccurrenceOnly) return undefined;

  const candidate = clean(text).toLowerCase();
  const occurrencePhrases = [
    "went for a ",
    "went on a ",
    "walked to ",
    "walked through ",
    "walked into ",
    "took a walk",
    "took the walk",
    "during a walk",
    "during the walk",
    "arrived at ",
    "arrived in ",
    "left from ",
  ];

  return occurrencePhrases.some((phrase) => candidate.includes(phrase))
    ? "preference-promoted-to-concrete-occurrence"
    : undefined;
}

export const AUTHOR_REALITY_AUTHORITY_DOCTRINE = [
  "Every supplied truth has semantic authority. Creative interpretation may stretch meaning, never the kind of reality the evidence establishes.",
  "ATTRIBUTE establishes a property or identity fact. It does not establish an occurrence.",
  "PREFERENCE establishes disposition, taste, attraction, aversion, or importance. It does not establish that the preferred activity, object, encounter, or situation occurred.",
  "EVENT establishes only the supplied occurrence and its supplied consequences.",
  "RELATIONSHIP establishes only the supplied connection between entities.",
  "STATE establishes only the supplied condition.",
  "MEASUREMENT establishes only the supplied value and unit.",
  "SEQUENCE establishes ordering only when ordering is supplied.",
  "UNKNOWN remains usable as supplied reality but grants no extra event, chronology, motive, measurement, or outcome authority.",
] as const;
