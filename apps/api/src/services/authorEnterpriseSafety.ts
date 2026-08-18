import type {
  AuthorSafetyViolationKind,
  AuthorMultimodalEvidence,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const META = /\b(?:viewer|audience|beat|strategy|operator|cognition|frontier|planner|planning|narrative|realization|writing process|author brief|meaning spine)\b/i;
const GENERIC = /\b(?:beautiful|magical|unforgettable|incredible|cinematic|journey|special|meaningful|new chapter|happy ending)\b/i;
const QUESTION = /\?/;
const DOMAIN = /\b(?:salon|groomer|clippers?|kennel|leash|dryer|shampoo|restaurant|waiter|chef|menu|wedding aisle|altar|realtor|listing|hotel lobby|staff|courtroom|doctor|hospital)\b/i;

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function tokens(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .split(/[^a-z0-9'-]+/i)
      .filter((word) => word.length >= 3),
  );
}

function sourceTokenSet(envelope: RealityEnvelope): Set<string> {
  return tokens([
    ...(envelope.suppliedTerms ?? []),
    ...(envelope.suppliedPhrases ?? []),
    ...envelope.events.map((event) => event.label),
  ].join(" "));
}

export function detectAuthorSafetyViolations(input: {
  text: string;
  envelope: RealityEnvelope;
  modalityEvidence?: readonly AuthorMultimodalEvidence[];
}): AuthorSafetyViolationKind[] {
  const text = clean(input.text);
  const source = sourceTokenSet(input.envelope);
  const words = tokens(text);
  const violations: AuthorSafetyViolationKind[] = [];

  if (!text) return ["unsupported_action"];
  if (META.test(text)) violations.push("analytic_language");
  if (GENERIC.test(text)) violations.push("generic_filler");
  if (QUESTION.test(text)) violations.push("analytic_language");

  let unsupportedConcrete = 0;
  for (const word of words) {
    if (!source.has(word)) unsupportedConcrete += 1;
  }

  if (unsupportedConcrete / Math.max(1, words.size) > 0.35) {
    violations.push("unsupported_action");
  }

  if (DOMAIN.test(text)) {
    const domainToken = [...tokens(text)].find((token) => DOMAIN.test(token));
    const explicitlySupplied = domainToken ? source.has(domainToken) : false;
    if (!explicitlySupplied) violations.push("domain_leakage");
  }

  if (input.modalityEvidence?.length) {
    const multimodalLabels = tokens(
      input.modalityEvidence.map((item) => item.label).join(" "),
    );
    const visualWords = ["photo", "image", "pictured", "visible", "shown", "sign", "building", "street", "room"];
    if (visualWords.some((word) => words.has(word)) && !visualWords.some((word) => multimodalLabels.has(word))) {
      violations.push("unsupported_setting");
    }
  }

  return [...new Set(violations)];
}

export function safetyScore(
  violations: readonly AuthorSafetyViolationKind[],
): number {
  const weights: Partial<Record<AuthorSafetyViolationKind, number>> = {
    unsupported_person: 0.3,
    unsupported_object: 0.3,
    unsupported_action: 0.4,
    unsupported_setting: 0.3,
    unsupported_emotion: 0.25,
    unsupported_reaction: 0.35,
    unsupported_chronology: 0.3,
    domain_leakage: 0.4,
    literalized_metaphor: 0.35,
    analytic_language: 0.25,
    keyword_collage: 0.2,
    generic_filler: 0.25,
  };

  const penalty = violations.reduce(
    (sum, violation) => sum + (weights[violation] ?? 0.2),
    0,
  );
  return Number(Math.max(0, 1 - Math.min(1, penalty)).toFixed(3));
}
