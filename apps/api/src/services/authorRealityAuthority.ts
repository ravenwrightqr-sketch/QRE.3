export type AuthorRealityAuthority =
  | "ATTRIBUTE"
  | "PREFERENCE"
  | "EVENT"
  | "RELATIONSHIP"
  | "STATE"
  | "MEASUREMENT"
  | "UNKNOWN";

export type AuthorRealityEvidence = {
  id: string;
  text: string;
  authority: AuthorRealityAuthority;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

export function inferAuthorRealityAuthority(textInput: string): AuthorRealityAuthority {
  const text = clean(textInput).toLowerCase();
  if (!text) return "UNKNOWN";

  if (/\b(?:loves?|likes?|prefers?|hates?|dislikes?|favorite|favourite)\b/i.test(text)) {
    return "PREFERENCE";
  }

  if (/^(?:name|species|type|kind|category|breed|model|title|color|colour)\s*:/i.test(text)) {
    return "ATTRIBUTE";
  }

  if (/\b(?:belongs to|owned by|owner of|married to|partner of|parent of|mother of|father of|child of|friend of|sibling of)\b/i.test(text)) {
    return "RELATIONSHIP";
  }

  if (/\b\d+(?:\.\d+)?\s*(?:%|seconds?|minutes?|hours?|days?|weeks?|months?|years?|mg|g|kg|oz|lbs?|ml|l|cm|mm|km|ft|inches?|miles?|mph|psi|rpm|°f|°c)\b/i.test(text)) {
    return "MEASUREMENT";
  }

  if (/\b(?:went|walked|saw|met|said|arrived|started|began|cleaned|finished|completed|got|added|tried|left|talked|returned|visited|ate|drank|played|opened|closed|moved|called|wrote|bought|sold|lasted)\b/i.test(text)) {
    return "EVENT";
  }

  if (/\b(?:is|was|were|felt|feels|became|remained|stayed)\b/i.test(text)) {
    return "STATE";
  }

  return "UNKNOWN";
}

export function projectAuthorRealityEvidence(
  evidence: readonly { id: string; text: string }[],
): AuthorRealityEvidence[] {
  return evidence.map((item) => ({
    id: clean(item.id),
    text: clean(item.text),
    authority: inferAuthorRealityAuthority(item.text),
  }));
}

export const AUTHOR_REALITY_AUTHORITY_DOCTRINE = [
  "Supplied truths have semantic authority. Creative interpretation may stretch meaning, never what kind of reality the evidence establishes.",
  "PREFERENCE establishes taste, attraction, aversion, importance, or disposition. It may become attitude, status, anticipation, fixation, humor, question, or metaphor. It does not prove the preferred thing happened.",
  "EVENT establishes only the supplied occurrence and supplied consequences.",
  "ATTRIBUTE establishes what something is; it does not establish an occurrence.",
  "RELATIONSHIP establishes only the supplied connection.",
  "STATE establishes only the supplied condition.",
  "MEASUREMENT establishes only the supplied value.",
  "UNKNOWN remains usable as supplied reality but grants no extra event, chronology, motive, measurement, or outcome authority.",
  "Meaning may be wild. Concrete occurrence remains strict.",
] as const;
