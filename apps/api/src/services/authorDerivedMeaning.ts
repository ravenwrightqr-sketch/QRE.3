export type AuthorDerivedInterpretation = {
  id: string;
  interpretation: string;
  derivation: string;
};

export type AuthorDerivedRelation = {
  id: string;
  relation: string;
  groundingEventIds: string[];
  interpretations: AuthorDerivedInterpretation[];
};

export type AuthorDerivedMeaning = {
  kind: "DERIVED_MEANING";
  relations: AuthorDerivedRelation[];
};

export type AuthorDerivedMeaningIssue = {
  path: string;
  code: string;
};

export type AuthorDerivedMeaningValidation =
  | {
      valid: true;
      value: AuthorDerivedMeaning;
      issues: [];
    }
  | {
      valid: false;
      issues: AuthorDerivedMeaningIssue[];
    };

const MAX_ID_LENGTH = 64;
const MAX_RELATION_LENGTH = 180;
const MAX_INTERPRETATION_LENGTH = 180;
const MAX_DERIVATION_LENGTH = 240;

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const INVALID_TEXT_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: AuthorDerivedMeaningIssue[],
): boolean {
  const allowedKeys = new Set(allowed);
  let valid = true;

  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      issues.push({ path: `${path}.${key}`, code: "unexpected-key" });
      valid = false;
    }
  }

  return valid;
}

function isValidId(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ID_LENGTH &&
    value === value.trim() &&
    ID_PATTERN.test(value);
}

function readText(
  value: unknown,
  maxLength: number,
  path: string,
  code: string,
  issues: AuthorDerivedMeaningIssue[],
): string | undefined {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > maxLength ||
    INVALID_TEXT_CONTROL.test(value)
  ) {
    issues.push({ path, code });
    return undefined;
  }

  return value.trim();
}

/**
 * Checks only shape, identifier integrity, and event-ID authority.
 * It does not establish that a relation or interpretation is entailed by its evidence.
 */
export function validateAuthorDerivedMeaningStructure(
  input: unknown,
  suppliedEvents: readonly { id: string }[],
): AuthorDerivedMeaningValidation {
  const issues: AuthorDerivedMeaningIssue[] = [];
  const suppliedEventIds = new Set<string>();

  for (const [index, event] of suppliedEvents.entries()) {
    if (!event || !isValidId(event.id)) {
      issues.push({ path: `suppliedEvents[${index}].id`, code: "invalid-supplied-event-id" });
      continue;
    }
    if (suppliedEventIds.has(event.id)) {
      issues.push({ path: `suppliedEvents[${index}].id`, code: "duplicate-supplied-event-id" });
      continue;
    }
    suppliedEventIds.add(event.id);
  }

  if (!isRecord(input)) {
    issues.push({ path: "$", code: "expected-object" });
    return { valid: false, issues };
  }

  hasOnlyKeys(input, ["kind", "relations"], "$", issues);
  if (input.kind !== "DERIVED_MEANING") {
    issues.push({ path: "kind", code: "invalid-kind" });
  }
  if (!Array.isArray(input.relations)) {
    issues.push({ path: "relations", code: "expected-array" });
    return { valid: false, issues };
  }

  const relationIds = new Set<string>();
  const interpretationIds = new Set<string>();
  const relations: AuthorDerivedRelation[] = [];

  for (const [relationIndex, rawRelation] of input.relations.entries()) {
    const relationPath = `relations[${relationIndex}]`;
    if (!isRecord(rawRelation)) {
      issues.push({ path: relationPath, code: "expected-object" });
      continue;
    }

    hasOnlyKeys(
      rawRelation,
      ["id", "relation", "groundingEventIds", "interpretations"],
      relationPath,
      issues,
    );

    const id = rawRelation.id;
    const relation = readText(
      rawRelation.relation,
      MAX_RELATION_LENGTH,
      `${relationPath}.relation`,
      "invalid-relation-text",
      issues,
    );

    if (!isValidId(id)) {
      issues.push({ path: `${relationPath}.id`, code: "invalid-relation-id" });
    } else if (relationIds.has(id)) {
      issues.push({ path: `${relationPath}.id`, code: "duplicate-relation-id" });
    } else {
      relationIds.add(id);
    }

    const groundingEventIds: string[] = [];
    if (!Array.isArray(rawRelation.groundingEventIds)) {
      issues.push({ path: `${relationPath}.groundingEventIds`, code: "expected-array" });
    } else {
      if (!rawRelation.groundingEventIds.length) {
        issues.push({ path: `${relationPath}.groundingEventIds`, code: "empty-grounding-event-ids" });
      }

      const seenGroundingIds = new Set<string>();
      for (const [eventIndex, eventId] of rawRelation.groundingEventIds.entries()) {
        const eventPath = `${relationPath}.groundingEventIds[${eventIndex}]`;
        if (!isValidId(eventId)) {
          issues.push({ path: eventPath, code: "invalid-event-id" });
          continue;
        }
        if (seenGroundingIds.has(eventId)) {
          issues.push({ path: eventPath, code: "duplicate-grounding-event-id" });
          continue;
        }
        seenGroundingIds.add(eventId);
        if (!suppliedEventIds.has(eventId)) {
          issues.push({ path: eventPath, code: "unknown-grounding-event-id" });
          continue;
        }
        groundingEventIds.push(eventId);
      }

      if (seenGroundingIds.size < 2) {
        issues.push({
          path: `${relationPath}.groundingEventIds`,
          code: "relation-requires-two-distinct-events",
        });
      }
    }

    const interpretations: AuthorDerivedInterpretation[] = [];
    if (!Array.isArray(rawRelation.interpretations)) {
      issues.push({ path: `${relationPath}.interpretations`, code: "expected-array" });
    } else {
      if (!rawRelation.interpretations.length) {
        issues.push({ path: `${relationPath}.interpretations`, code: "empty-interpretations" });
      }

      for (const [interpretationIndex, rawInterpretation] of rawRelation.interpretations.entries()) {
        const interpretationPath = `${relationPath}.interpretations[${interpretationIndex}]`;
        if (!isRecord(rawInterpretation)) {
          issues.push({ path: interpretationPath, code: "expected-object" });
          continue;
        }

        hasOnlyKeys(
          rawInterpretation,
          ["id", "interpretation", "derivation"],
          interpretationPath,
          issues,
        );

        const interpretationId = rawInterpretation.id;
        const interpretation = readText(
          rawInterpretation.interpretation,
          MAX_INTERPRETATION_LENGTH,
          `${interpretationPath}.interpretation`,
          "invalid-interpretation-text",
          issues,
        );
        const derivation = readText(
          rawInterpretation.derivation,
          MAX_DERIVATION_LENGTH,
          `${interpretationPath}.derivation`,
          "invalid-derivation-text",
          issues,
        );

        if (!isValidId(interpretationId)) {
          issues.push({ path: `${interpretationPath}.id`, code: "invalid-interpretation-id" });
        } else if (interpretationIds.has(interpretationId)) {
          issues.push({ path: `${interpretationPath}.id`, code: "duplicate-interpretation-id" });
        } else {
          interpretationIds.add(interpretationId);
        }

        if (
          isValidId(interpretationId) &&
          interpretation &&
          derivation
        ) {
          interpretations.push({
            id: interpretationId,
            interpretation,
            derivation,
          });
        }
      }
    }

    if (isValidId(id) && relation && Array.isArray(rawRelation.groundingEventIds)) {
      relations.push({
        id,
        relation,
        groundingEventIds,
        interpretations,
      });
    }
  }

  if (issues.length) return { valid: false, issues };

  return {
    valid: true,
    value: {
      kind: "DERIVED_MEANING",
      relations,
    },
    issues: [],
  };
}
