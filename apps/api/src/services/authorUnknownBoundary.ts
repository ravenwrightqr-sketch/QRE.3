/**
 * QRE UNIVERSAL UNKNOWN BOUNDARY
 *
 * Unknown is a first-class state. Generative layers may interpret known
 * evidence, but they may not promote an unsupported identity attribute into
 * reality.
 */

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const FEMININE = /\b(?:female|woman|girl|she|her|hers)\b/i;
const MASCULINE = /\b(?:male|man|boy|he|him|his)\b/i;

function evidenceText(input: {
  subject?: string;
  facts?: readonly string[];
  moments?: readonly string[];
  memory?: readonly string[];
  subjectTruth?: unknown;
}): string {
  const truth =
    input.subjectTruth && typeof input.subjectTruth === "object"
      ? JSON.stringify(input.subjectTruth)
      : clean(input.subjectTruth);

  return [
    input.subject ?? "",
    ...(input.facts ?? []),
    ...(input.moments ?? []),
    ...(input.memory ?? []),
    truth,
  ].join(" ");
}

export function hasExplicitFeminineIdentity(input: Parameters<typeof evidenceText>[0]): boolean {
  return FEMININE.test(evidenceText(input));
}

export function hasExplicitMasculineIdentity(input: Parameters<typeof evidenceText>[0]): boolean {
  return MASCULINE.test(evidenceText(input));
}

export function unsupportedIdentityClaims(
  text: string,
  input: Parameters<typeof evidenceText>[0],
): string[] {
  const value = clean(text);
  const claims: string[] = [];
  const feminineKnown = hasExplicitFeminineIdentity(input);
  const masculineKnown = hasExplicitMasculineIdentity(input);

  if (!feminineKnown && /\b(?:she|her|hers|female|woman|girl)\b/i.test(value)) {
    claims.push("unsupported feminine identity");
  }

  if (!masculineKnown && /\b(?:he|him|his|male|man|boy)\b/i.test(value)) {
    claims.push("unsupported masculine identity");
  }

  return claims;
}

export function unknownBoundaryAllowsIdentity(
  text: string,
  input: Parameters<typeof evidenceText>[0],
): boolean {
  return unsupportedIdentityClaims(text, input).length === 0;
}
