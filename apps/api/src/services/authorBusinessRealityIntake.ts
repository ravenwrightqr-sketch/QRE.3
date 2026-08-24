import type { AuthorBrainTruth } from "@qre/contracts";

type BusinessRealityIntake = {
  subject: string;
  rawInput: string;
  facts: string[];
  observations: string[];
  temporal: string[];
  recurrence: string[];
  future: string[];
};

const clean = (value: string): string => value.replace(/\s+/g, " ").trim();
const unique = (values: string[]): string[] => [...new Set(values.map(clean).filter(Boolean))];

function splitReality(rawInput: string): string[] {
  const source = rawInput.replace(/\r/g, "").trim();
  if (!source) return [];

  const lines = source
    .split(/\n+/)
    .map((value) => clean(value.replace(/^[•*\-]+\s*/, "")))
    .filter(Boolean);

  if (lines.length > 1) return unique(lines.flatMap((line) => line.split(/\s*\/\s*|\s*;\s*/g)));

  return unique(source.split(/\s*\/\s*|\s*;\s*/g));
}

function extractTemporal(facts: string[]): string[] {
  return unique(
    facts.flatMap((fact) => fact.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi) ?? []),
  );
}

function extractRecurrence(facts: string[]): string[] {
  return unique(facts.filter((fact) => /\b(?:round\s*\d+|visit\s*\d+|again|repeat|returning|next time|same again)\b/i.test(fact)));
}

function extractFuture(facts: string[]): string[] {
  return unique(facts.filter((fact) => /\b(?:next time|next visit|next round|tomorrow|later|upcoming)\b/i.test(fact)));
}

function inferObservations(facts: string[]): string[] {
  return unique(
    facts.filter((fact) =>
      /\b(?:funny|weird|odd|unexpected|almost|close call|surprise|surprising|heading toward|nearly|hilarious|unreasonable|chaos|mud|leaves|knives|dog|cat|baby)\b/i.test(fact),
    ),
  );
}

export function parseBusinessRealityInput(subject: string, rawInput: string): BusinessRealityIntake {
  const facts = splitReality(rawInput);
  return {
    subject: clean(subject),
    rawInput,
    facts,
    observations: inferObservations(facts),
    temporal: extractTemporal(facts),
    recurrence: extractRecurrence(facts),
    future: extractFuture(facts),
  };
}

/**
 * Universal Author adapter.
 *
 * The intake does not create a business-specific brain. It turns fast,
 * messy operator input into the same AuthorBrainTruth used everywhere else.
 */
export function toAuthorBrainTruth(
  input: BusinessRealityIntake,
  prompt = "Create a short cinematic service receipt from the supplied reality.",
): AuthorBrainTruth {
  const temporalContext = input.temporal.length ? `Time: ${input.temporal.join(", ")}` : "";
  const recurrenceContext = input.recurrence.length ? `Recurrence: ${input.recurrence.join(" | ")}` : "";
  const futureContext = input.future.length ? `Future: ${input.future.join(" | ")}` : "";
  const sourceMoments = unique([
    ...input.observations,
    ...input.recurrence,
    ...input.future,
  ]);

  return {
    prompt: `${prompt} ${input.rawInput}`.trim(),
    subject: input.subject,
    facts: input.facts,
    sourceMoments,
    memoryContext: unique([temporalContext, recurrenceContext, futureContext]),
    trajectory: input.facts,
    creativeLearningContext: [],
    returning: input.recurrence.length > 0,
    visitNumber: 1,
    presenceSummary: [],
  };
}
