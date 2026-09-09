import type { RecognitionBrief, RecognitionKnownEntity, RecognitionVocabulary } from "@qre/contracts";

export type RecognitionVocabularyInput = {
  businessName?: string;
  businessType?: string;
  templateData?: unknown;
  knownEntities?: RecognitionKnownEntity[];
};

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 500);
}

export function buildRecognitionBrief(input: RecognitionVocabularyInput & {
  purpose?: RecognitionBrief["purpose"];
  task?: string;
}): RecognitionBrief {
  const template = record(input.templateData);
  const website = record(template.websiteKnowledge);
  const categories = unique([
    ...strings(template.categories),
    ...strings(template.productCategories),
    ...strings(template.subjectKinds),
  ]);
  const brands = unique([
    ...strings(template.brands),
    ...strings(template.manufacturers),
  ]);
  const products = unique([
    ...strings(template.products),
    ...strings(template.productNames),
  ]);
  const variants = unique(strings(template.variants));
  const attributes = unique(strings(template.attributes));
  const aliasesRecord = record(template.aliases);
  const aliases: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(aliasesRecord)) aliases[key] = strings(value).slice(0, 50);

  return {
    purpose: input.purpose ?? "catalog",
    task: input.task ?? "Identify useful visible products and product evidence from the supplied image.",
    businessName: input.businessName || (typeof website.businessName === "string" ? website.businessName : undefined),
    businessType: input.businessType || (typeof website.businessType === "string" ? website.businessType : undefined),
    knownVocabulary: {
      brands,
      products,
      variants,
      categories,
      attributes,
      aliases,
    },
    knownEntities: input.knownEntities?.slice(0, 1000),
    allowNewEntities: true,
    allowOpenWorld: true,
  };
}
