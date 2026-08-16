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

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRe = new RegExp(`\\b${escaped}\\b`, "i");
  const explicitStatements = [prompt].map(clean).filter((value) => nameRe.test(value));

  const subjectEntityIds = new Set(
    (memory?.entities ?? [])
      .filter((entity) => entity.canonicalKey?.toLowerCase() === name.toLowerCase() || entity.name?.toLowerCase() === name.toLowerCase())
      .map((entity) => entity.id),
  );

  const memoryStatements = (memory?.facts ?? [])
    .filter((fact) => fact.status === "active")
    .filter((fact) => fact.kind === "identity" || fact.kind === "attribute")
    .filter((fact) => !fact.entityId || subjectEntityIds.has(fact.entityId))
    .map((fact) => `${fact.predicate}: ${fact.value}`)
    .map(clean)
    .filter(Boolean);

  const explicitCorpus = explicitStatements.join(" | ");
  const memoryCorpus = memoryStatements.join(" | ");
  const corpus = [explicitCorpus, memoryCorpus].filter(Boolean).join(" | ");
  if (!corpus) return undefined;

  const truth: SubjectTruth = {
    name,
    kind: undefined,
    sex: "unknown",
    provenance: explicitStatements.length ? "explicit" : "memory",
    identityFacts: [...explicitStatements, ...memoryStatements].slice(0, 12),
  };

  const kindCorpus = [explicitCorpus, memoryCorpus].join(" ");
  if (/\b(?:dog|poodle|puppy|cat|pet|animal)\b/i.test(kindCorpus)) truth.kind = "animal";
  else if (/\b(?:woman|man|person|human)\b/i.test(kindCorpus)) truth.kind = "person";

  const explicitPronouns = pronounSet(explicitCorpus);
  const memoryPronouns = pronounSet(memoryCorpus);
  const pronouns = explicitPronouns ?? memoryPronouns;
  if (pronouns) {
    truth.pronouns = pronouns;
    truth.sex = pronouns.subject === "he" ? "male" : pronouns.subject === "she" ? "female" : "unknown";
  }

  const explicitSex = explicitCorpus.match(/\b(?:male|female|boy|girl|man|woman)\b/i);
  const memorySex = memoryCorpus.match(/\b(?:male|female|boy|girl|man|woman)\b/i);
  const sex = explicitSex?.[0] ?? memorySex?.[0];
  if (sex) truth.sex = /male|boy|man/i.test(sex) ? "male" : /female|girl|woman/i.test(sex) ? "female" : "unknown";

  return truth;
}
