import type { MemoryContext, SubjectTruth } from "@qre/contracts";

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

function pronounSet(value: string) {
  const text = value.toLowerCase();
  if (/\bhe\/him\b|\bmale\b|\bboy\b|\bman\b/.test(text)) {
    return { subject: "he" as const, object: "him" as const, possessive: "his" as const, reflexive: "himself" as const };
  }
  if (/\bshe\/her\b|\bfemale\b|\bgirl\b|\bwoman\b/.test(text)) {
    return { subject: "she" as const, object: "her" as const, possessive: "her" as const, reflexive: "herself" as const };
  }
  if (/\bthey\/them\b|\bnonbinary\b/.test(text)) {
    return { subject: "they" as const, object: "them" as const, possessive: "their" as const, reflexive: "themselves" as const };
  }
  return undefined;
}

export function resolveSubjectTruth(subject: string | undefined, prompt: string, memory?: MemoryContext): SubjectTruth | undefined {
  const name = clean(subject);
  if (!name) return undefined;

  const truth: SubjectTruth = {
    name,
    kind: undefined,
    sex: "unknown",
    provenance: "explicit",
    identityFacts: [],
  };

  const explicit = [prompt];
  const memoryFacts = (memory?.facts ?? [])
    .filter((fact) => fact.status === "active")
    .filter((fact) => fact.kind === "identity" || fact.kind === "attribute")
    .map((fact) => `${fact.predicate}: ${fact.value}`);

  const statements = [...explicit, ...memoryFacts].map(clean).filter(Boolean);
  const corpus = statements.join(" | ");
  const lower = corpus.toLowerCase();
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (new RegExp(`\\b${escaped}\\b`, "i").test(corpus)) {
    if (/\b(?:dog|poodle|puppy|cat|pet|animal)\b/i.test(corpus)) truth.kind = "animal";
    else if (/\b(?:woman|man|person|groom|bride|groom|human)\b/i.test(corpus)) truth.kind = "person";
  }

  const pronouns = pronounSet(corpus);
  if (pronouns) {
    truth.pronouns = pronouns;
    truth.sex = pronouns.subject === "he" ? "male" : pronouns.subject === "she" ? "female" : "unknown";
  }

  const explicitSex = lower.match(new RegExp(`\\b${escaped}\\b[^.\\n]{0,80}\\b(male|female|boy|girl|man|woman)\\b`, "i"));
  if (explicitSex) {
    truth.sex = /male|boy|man/i.test(explicitSex[1]) ? "male" : "female";
  }

  const facts = statements.filter((statement) => {
    const value = statement.toLowerCase();
    return value.includes(name.toLowerCase()) || /^(?:sex|gender|pronoun|pronouns|breed|species|identity)\s*:/i.test(statement);
  });
  truth.identityFacts = facts.slice(0, 12);

  return truth.pronouns || truth.sex !== "unknown" || truth.identityFacts.length ? truth : undefined;
}
