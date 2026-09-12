/**
 * Explicit truth accumulated by QRE for the current subject.
 *
 * The author may use these fields only when they are explicitly established
 * by source, memory, or runtime truth. Creative inference must never promote
 * itself into subject identity.
 */
export type SubjectPronounSet = {
  subject: "he" | "she" | "they";
  object: "him" | "her" | "them";
  possessive: "his" | "her" | "their";
  reflexive: "himself" | "herself" | "themselves";
};

export type SubjectTruth = {
  name?: string;
  kind?: "person" | "animal" | "object" | "place" | "organization" | "event" | "unknown";
  sex?: "male" | "female" | "unknown";
  pronouns?: SubjectPronounSet;
  identityFacts?: string[];
  provenance?: "explicit" | "memory" | "runtime";
};
