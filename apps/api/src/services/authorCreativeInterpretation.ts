/**
 * QRE CREATIVE INTERPRETATION DISCOVERY
 *
 * Canonical Cognition-side discovery of the smallest unexpected meaning that
 * supplied reality already supports.
 *
 * This module does NOT write viewer prose and does NOT create facts.
 * It produces semantic interpretations that downstream cognition may rank and
 * later realize through Mouth.
 *
 * The important distinction is:
 *
 *   REALITY -> relationship among supplied meanings -> INTERPRETATION
 *   INTERPRETATION -> viewer-facing language -> MOUTH
 *
 * A sequence can contain a meaningful turn even when RealityGraph has no
 * explicit relation edge between adjacent events. In that case this module
 * derives sequence-backed interpretations from the supplied language itself.
 *
 * Creative compression law:
 *   DO NOT SUMMARIZE THE EVENTS.
 *   COMPRESS THE RELATIONSHIP THAT MAKES THE EVENTS FEEL DIFFERENT TOGETHER.
 *
 * The compression must remain grounded in supplied entities, states, concrete
 * objects, recurrence, status, contrast, and endpoint continuity. It should
 * become more specific as the supplied reality becomes more specific.
 */

import type {
  LatentMovieCandidate,
  RealityGraph,
} from "@qre/contracts";

export type CreativeInterpretationMechanism =
  | "expectation_shift"
  | "continuation"
  | "state_change"
  | "recurrence"
  | "convergence"
  | "contrast"
  | "consequence";

export type CreativeInterpretation = {
  statement: string;
  mechanism: CreativeInterpretationMechanism;
  evidenceEventIds: string[];
  confidence: number;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function labelFor(
  graph: RealityGraph,
  eventId: string,
): string {
  return clean(
    graph.events.find((event) => event.id === eventId)?.label,
  );
}

function tokens(value: string): Set<string> {
  return new Set(
    clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9'’-]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );
}

function overlap(
  left: string,
  right: string,
): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;

  let hits = 0;
  for (const token of a) {
    if (b.has(token)) hits += 1;
  }

  return hits / Math.max(1, Math.min(a.size, b.size));
}

function containsAny(
  value: string,
  patterns: readonly RegExp[],
): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

const EXPECTATION = [
  /\b(?:didn'?t|did not|never)\s+(?:expect|plan|think|assume)\b/i,
  /\b(?:unexpected|surpris(?:e|ed|ing)|unplanned|unlike\s+expected)\b/i,
];

const CONTINUATION = [
  /\b(?:kept|continued|continue|continues|still|again|returned|return|back)\b/i,
  /\b(?:wanted|want|needed|need)\b.+\b(?:again|more|continue|talk)\b/i,
];

const STATE = [
  /\b(?:felt|feel|feels|seemed|seem|became|become|was|were|is|are|looked|looks|look)\b/i,
  /\b(?:easy|hard|calm|nervous|happy|sad|proud|excited|confident|comfortable|relieved|fierce|cool|sharp|dapper|awkward|quiet|close|closer|distant|different|new|fabulous|ready|good|glad|pleased|delighted)\b/i,
];

const NEGATIVE_STATE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const POSITIVE_STATE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|sharp|dapper|ready)\b/i;

const RECURRENCE = [
  /\b(?:again|returned|return|back|second|third|another|repeated|repeat|once\s+more|still|remember(?:ed|ing)?)\b/i,
];

const CONTRAST = [
  /\b(?:but|yet|although|instead|rather|except|while|however|still)\b/i,
];

const ACTION_OR_ENCOUNTER = [
  /\b(?:met|meet|meeting|arrived|visited|started|called|texted|messaged|talked|talking|spoke|worked|played|danced|went|came|left|returned|watched|looked|chose|chosen|selected|picked|remembered)\b/i,
];

const OBJECT = /\b(?:bow|collar|tag|mirror|photo|picture|gift|key|keys|ring|flower|flowers|coat|dress|shirt|shoe|shoes|ticket|receipt|book|letter|phone|screen|car|room|bathroom|house|home|table|door|window|box|bag|cake|towel|towels|leash)\b/i;

const CALLBACK_WORD = /\b(?:same|still|again|returned|return|back|remember(?:ed|ing)?|kept)\b/i;

function buildCandidate(
  statement: string,
  mechanism: CreativeInterpretationMechanism,
  evidenceEventIds: readonly string[],
  confidence: number,
): CreativeInterpretation {
  return {
    statement: clean(statement),
    mechanism,
    evidenceEventIds: unique(evidenceEventIds),
    confidence: metric(confidence),
  };
}

function span(
  orderedEventIds: readonly string[],
  selectedIds: readonly string[],
): number {
  if (selectedIds.length < 2 || orderedEventIds.length < 2) return 0;
  const positions = selectedIds
    .map((id) => orderedEventIds.indexOf(id))
    .filter((index) => index >= 0);
  if (positions.length < 2) return 0;
  return metric(
    (Math.max(...positions) - Math.min(...positions)) /
      Math.max(1, orderedEventIds.length - 1),
  );
}

function subjectName(graph: RealityGraph): string {
  const continuity = [...(graph.entityContinuity ?? [])]
    .sort((a, b) => b.salienceScore - a.salienceScore)[0];
  return clean(continuity?.name);
}

function stateKind(label: string): "negative" | "positive" | "other" {
  if (NEGATIVE_STATE.test(label)) return "negative";
  if (POSITIVE_STATE.test(label)) return "positive";
  return "other";
}

function concreteTokens(value: string): string[] {
  return [...tokens(value)].filter((token) => OBJECT.test(token));
}

function bestConcreteCallback(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): {
  earlierId: string;
  laterId: string;
  object: string;
  score: number;
} | undefined {
  let best:
    | {
        earlierId: string;
        laterId: string;
        object: string;
        score: number;
      }
    | undefined;

  for (let i = 0; i < orderedEventIds.length; i += 1) {
    const earlierId = orderedEventIds[i]!;
    const earlier = labelFor(graph, earlierId);
    const earlierObjects = concreteTokens(earlier);
    if (!earlierObjects.length) continue;

    for (let j = i + 1; j < orderedEventIds.length; j += 1) {
      const laterId = orderedEventIds[j]!;
      const later = labelFor(graph, laterId);
      const laterObjects = concreteTokens(later);
      const shared = earlierObjects.filter((object) => laterObjects.includes(object));
      if (!shared.length) continue;

      const callback = CALLBACK_WORD.test(later);
      const distance = j - i;
      const spread = Math.min(0.2, distance * 0.03);
      const score =
        (callback ? 0.7 : 0.42) +
        Math.min(0.2, shared.length * 0.08) +
        spread;

      if (!best || score > best.score) {
        best = {
          earlierId,
          laterId,
          object: shared[0]!,
          score,
        };
      }
    }
  }

  return best;
}

function bestStateTransition(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): {
  startId: string;
  endId: string;
  startLabel: string;
  endLabel: string;
  score: number;
} | undefined {
  const states = orderedEventIds
    .map((id, index) => ({
      id,
      index,
      label: labelFor(graph, id),
    }))
    .filter((item) => STATE.some((pattern) => pattern.test(item.label)));

  let best:
    | {
        startId: string;
        endId: string;
        startLabel: string;
        endLabel: string;
        score: number;
      }
    | undefined;

  for (const start of states) {
    for (const end of states) {
      if (end.index <= start.index) continue;

      const startKind = stateKind(start.label);
      const endKind = stateKind(end.label);
      const polarity =
        startKind === "negative" && endKind === "positive"
          ? 1
          : startKind !== endKind && startKind !== "other" && endKind !== "other"
            ? 0.88
            : startKind === "negative" || endKind === "positive"
              ? 0.74
              : 0.58;
      const spread = Math.min(0.2, (end.index - start.index) * 0.035);
      const subjectTouch =
        subjectName(graph) &&
        (start.label.toLowerCase().includes(subjectName(graph).toLowerCase()) ||
          end.label.toLowerCase().includes(subjectName(graph).toLowerCase()))
          ? 0.08
          : 0;
      const score = polarity * 0.72 + spread + subjectTouch;

      if (!best || score > best.score) {
        best = {
          startId: start.id,
          endId: end.id,
          startLabel: start.label,
          endLabel: end.label,
          score,
        };
      }
    }
  }

  return best;
}

function bestSubjectStatusTurn(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): {
  startId: string;
  endId: string;
  startLabel: string;
  endLabel: string;
  score: number;
} | undefined {
  const subject = subjectName(graph).toLowerCase();
  if (!subject) return undefined;

  const direct = orderedEventIds
    .map((id, index) => ({ id, index, label: labelFor(graph, id) }))
    .filter((item) => item.label.toLowerCase().includes(subject));

  if (direct.length < 2) return undefined;

  let best:
    | {
        startId: string;
        endId: string;
        startLabel: string;
        endLabel: string;
        score: number;
      }
    | undefined;

  for (let i = 0; i < direct.length; i += 1) {
    for (let j = i + 1; j < direct.length; j += 1) {
      const start = direct[i]!;
      const end = direct[j]!;
      const startState = stateKind(start.label);
      const endState = stateKind(end.label);
      const statusShift =
        startState !== endState
          ? 1
          : POSITIVE_STATE.test(end.label)
            ? 0.84
            : 0.56;
      const callback = RECURRENCE.some((pattern) => pattern.test(end.label)) ? 0.14 : 0;
      const score = statusShift * 0.78 + callback + Math.min(0.14, (end.index - start.index) * 0.02);

      if (!best || score > best.score) {
        best = {
          startId: start.id,
          endId: end.id,
          startLabel: start.label,
          endLabel: end.label,
          score,
        };
      }
    }
  }

  return best;
}

export function deriveSequenceBackedCreativeInterpretations(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): CreativeInterpretation[] {
  const orderedEventIds = unique(
    candidate.trajectory.flatMap((step) => step.eventIds),
  );

  if (orderedEventIds.length < 2) return [];

  const labels = orderedEventIds.map((id) => labelFor(graph, id));
  const meaningful = labels.filter(Boolean);
  if (meaningful.length < 2) return [];

  const expectations = orderedEventIds.filter((id) =>
    containsAny(labelFor(graph, id), EXPECTATION),
  );
  const continuation = orderedEventIds.filter((id) =>
    containsAny(labelFor(graph, id), CONTINUATION),
  );
  const states = orderedEventIds.filter((id) =>
    containsAny(labelFor(graph, id), STATE),
  );
  const recurrence = orderedEventIds.filter((id) =>
    containsAny(labelFor(graph, id), RECURRENCE),
  );
  const contrasts = orderedEventIds.filter((id) =>
    containsAny(labelFor(graph, id), CONTRAST),
  );
  const encounters = orderedEventIds.filter((id) =>
    containsAny(labelFor(graph, id), ACTION_OR_ENCOUNTER),
  );

  const candidates: CreativeInterpretation[] = [];
  const subject = subjectName(graph);

  /*
   * 1. Concrete callback compression.
   *
   * A recurring supplied object is often a stronger cinematic carrier than an
   * abstract theme. Preserve its identity and compress only the fact that it
   * returned carrying continuity/recognition.
   */
  const concreteCallback = bestConcreteCallback(graph, orderedEventIds);
  if (concreteCallback) {
    const earlier = labelFor(graph, concreteCallback.earlierId);
    const later = labelFor(graph, concreteCallback.laterId);
    candidates.push(
      buildCandidate(
        `The ${concreteCallback.object} returns later as part of the same supplied experience.`,
        "recurrence",
        [concreteCallback.earlierId, concreteCallback.laterId],
        0.95 + Math.min(0.04, concreteCallback.score * 0.02),
      ),
    );
    // The concrete source labels remain available as evidence for the realizing layer.
    void earlier;
    void later;
  }

  /*
   * 2. Precise state transformation.
   *
   * Prefer the actual supplied endpoints over a generic "feeling changed"
   * sentence. This is where living memories such as nervous -> fabulous become
   * a compressible movie movement instead of a bland summary.
   */
  const stateTransition = bestStateTransition(graph, orderedEventIds);
  if (stateTransition) {
    const transitionIds = unique([
      stateTransition.startId,
      ...orderedEventIds.filter((id) => {
        const position = orderedEventIds.indexOf(id);
        return (
          position > orderedEventIds.indexOf(stateTransition.startId) &&
          position < orderedEventIds.indexOf(stateTransition.endId) &&
          (STATE.some((pattern) => pattern.test(labelFor(graph, id))) ||
            OBJECT.test(labelFor(graph, id)))
        );
      }),
      stateTransition.endId,
    ]);

    const subjectPrefix = subject ? `${subject} ` : "The supplied experience ";
    candidates.push(
      buildCandidate(
        `${subjectPrefix}moves from ${stateTransition.startLabel} to ${stateTransition.endLabel}.`,
        "state_change",
        transitionIds,
        0.96,
      ),
    );
  }

  /*
   * 3. Subject-specific status compression.
   *
   * When the same supplied subject is present at multiple meaningful moments,
   * preserve the status shift around that subject rather than treating each
   * event as an isolated caption.
   */
  const subjectStatus = bestSubjectStatusTurn(graph, orderedEventIds);
  if (subjectStatus) {
    candidates.push(
      buildCandidate(
        `${subject || "The subject"} is not in the same state at the later supplied moment.`,
        "state_change",
        [subjectStatus.startId, subjectStatus.endId],
        0.92 + Math.min(0.04, subjectStatus.score * 0.02),
      ),
    );
  }

  if (expectations.length && states.length && continuation.length) {
    const ids = unique([...expectations, ...states, ...continuation]);
    candidates.push(
      buildCandidate(
        "The supplied sequence does not end where its earlier expectation points.",
        "expectation_shift",
        ids,
        0.9,
      ),
    );
  }

  if (encounters.length && continuation.length) {
    const ids = unique([...encounters, ...continuation]);
    candidates.push(
      buildCandidate(
        "A supplied encounter continues beyond its first moment.",
        "continuation",
        ids,
        0.9,
      ),
    );
  }

  if (encounters.length && states.length) {
    let bestPair = { left: "", right: "", score: -1 };

    for (const leftId of encounters) {
      for (const rightId of states) {
        const left = labelFor(graph, leftId);
        const right = labelFor(graph, rightId);
        const leftIndex = orderedEventIds.indexOf(leftId);
        const rightIndex = orderedEventIds.indexOf(rightId);
        if (leftIndex < 0 || rightIndex < 0) continue;

        const distance = Math.abs(leftIndex - rightIndex);
        const proximity = distance <= 1 ? 1 : distance === 2 ? 0.78 : 0.5;
        const semanticCarry = overlap(left, right);
        const score = proximity * 0.7 + semanticCarry * 0.3;
        if (score > bestPair.score) {
          bestPair = { left: leftId, right: rightId, score };
        }
      }
    }

    if (bestPair.score >= 0.7) {
      candidates.push(
        buildCandidate(
          `The supplied encounter is followed by a concrete change in ${subject || "the subject"}.`,
          "state_change",
          [bestPair.left, bestPair.right],
          0.88,
        ),
      );
    }
  }

  if (continuation.length && expectations.length) {
    const ids = unique([...expectations, ...continuation]);
    const sequenceSpan = span(orderedEventIds, ids);
    candidates.push(
      buildCandidate(
        "The supplied moment keeps going past the point where it could have ended.",
        "consequence",
        ids,
        0.87 + sequenceSpan * 0.06,
      ),
    );
  }

  if (states.length >= 2 && continuation.length) {
    const ids = unique([...states, ...continuation]);
    const sequenceSpan = span(orderedEventIds, ids);
    candidates.push(
      buildCandidate(
        "Separate supplied changes converge on the same continuing thread.",
        "convergence",
        ids,
        0.84 + sequenceSpan * 0.08,
      ),
    );
  }

  if (recurrence.length && meaningful.length >= 3) {
    const ids = recurrence.slice();
    candidates.push(
      buildCandidate(
        "A supplied return turns an earlier detail into an ongoing thread.",
        "recurrence",
        ids,
        0.84,
      ),
    );
  }

  if (contrasts.length && meaningful.length >= 3) {
    const ids = contrasts.slice();
    candidates.push(
      buildCandidate(
        "The supplied material acquires a different reading after the contrast.",
        "contrast",
        ids,
        0.82,
      ),
    );
  }

  return candidates;
}

export function deriveSequenceBackedCreativeInterpretation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): CreativeInterpretation | undefined {
  return deriveSequenceBackedCreativeInterpretations(
    graph,
    candidate,
  )[0];
}
