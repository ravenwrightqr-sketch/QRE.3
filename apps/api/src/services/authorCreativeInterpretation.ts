/**
 * QRE CREATIVE INTERPRETATION DISCOVERY
 *
 * Canonical cognition-side compression of supplied reality into the smallest
 * unexpected relationship that downstream realization can preserve.
 *
 * Law:
 *   DO NOT SUMMARIZE THE EVENTS.
 *   COMPRESS THE RELATIONSHIP THAT MAKES THE EVENTS FEEL DIFFERENT TOGETHER.
 *
 * This layer never creates a concrete event, object, actor, chronology, or
 * outcome. It can only interpret relationships already supported by supplied
 * evidence and sequence structure.
 */

import type {
  LatentMovieCandidate,
  LatentSemanticMechanism,
  LatentSemanticRealization,
  RealityGraph,
} from "@qre/contracts";

export type CreativeInterpretationMechanism = LatentSemanticMechanism;

export type CreativeInterpretation = LatentSemanticRealization & {
  /** Diagnostic text only. Downstream realization must use semanticRealization fields. */
  statement: string;
};

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const metric = (value: number): number =>
  Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function labelFor(graph: RealityGraph, eventId: string): string {
  return clean(graph.events.find((event) => event.id === eventId)?.label);
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

function overlap(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(1, Math.min(a.size, b.size));
}

function subjectName(graph: RealityGraph): string {
  const continuity = [...(graph.entityContinuity ?? [])]
    .sort((a, b) => b.salienceScore - a.salienceScore)[0];
  return clean(continuity?.name);
}

const NEGATIVE_STATE = /\b(?:nervous|scared|afraid|anxious|worried|sad|angry|tired|awkward|uneasy|tense|stressed|uncomfortable)\b/i;
const POSITIVE_STATE = /\b(?:happy|proud|calm|excited|confident|comfortable|relieved|fabulous|good|glad|pleased|delighted|content|fierce|cool|sharp|dapper|ready|beautiful|handsome)\b/i;
const STATE_WORD = /\b(?:felt|feel|feels|seemed|seem|became|become|was|were|is|are|looked|looks|look|different|changed|new|old|quiet|wild|gentle)\b/i;
const CONTINUATION = /\b(?:kept|continued|continue|continues|still|again|returned|return|back|second|third|another|repeated|repeat|once\s+more|later|years?)\b/i;
const CALLBACK = /\b(?:same|still|remember(?:ed|ing|s)?|again|returned|return|back|kept)\b/i;
const EXPECTATION = /\b(?:didn'?t|did not|never)\s+(?:expect|plan|think|assume)|\b(?:unexpected|surpris(?:e|ed|ing)|unplanned|unlike\s+expected)\b/i;
const CONTRAST = /\b(?:but|yet|although|instead|rather|except|while|however|still)\b/i;
const ACTION = /\b(?:arrived|arrive|visited|started|called|texted|messaged|talked|spoke|worked|played|danced|went|came|left|returned|watched|looked|chose|chosen|selected|picked|remembered|met|made|gave|found|lost|fixed|repaired|groomed|dyed|tailored|installed|built|bought|sold|celebrated)\b/i;
const OBJECT = /\b(?:bow|collar|tag|mirror|photo|picture|gift|key|keys|ring|flower|flowers|coat|dress|shirt|shoe|shoes|ticket|receipt|book|letter|phone|screen|car|room|bathroom|house|home|table|door|window|box|bag|cake|towel|towels|leash|tool|tools|food|drink|coffee|music)\b/i;

function isState(label: string): boolean {
  return STATE_WORD.test(label) || NEGATIVE_STATE.test(label) || POSITIVE_STATE.test(label);
}

function stateKind(label: string): "negative" | "positive" | "other" {
  if (NEGATIVE_STATE.test(label)) return "negative";
  if (POSITIVE_STATE.test(label)) return "positive";
  return "other";
}

function concreteTokens(label: string): string[] {
  return [...tokens(label)].filter((token) => OBJECT.test(token));
}

function buildCandidate(
  statement: string,
  mechanism: CreativeInterpretationMechanism,
  evidenceEventIds: readonly string[],
  confidence: number,
  semantic: Partial<LatentSemanticRealization> = {},
): CreativeInterpretation {
  const ids = unique(evidenceEventIds);
  return {
    statement: clean(statement),
    mechanism,
    evidenceEventIds: ids,
    beforeEventIds: semantic.beforeEventIds ?? [],
    afterEventIds: semantic.afterEventIds ?? [],
    before: semantic.before,
    after: semantic.after,
    subject: semantic.subject,
    callback: semantic.callback,
    relation: semantic.relation,
    realizationMove: semantic.realizationMove ?? "recognize",
    creativeOpportunity: semantic.creativeOpportunity,
    confidence: metric(confidence),
  };
}

function span(
  orderedEventIds: readonly string[],
  selectedIds: readonly string[],
): number {
  const positions = selectedIds
    .map((id) => orderedEventIds.indexOf(id))
    .filter((index) => index >= 0);
  if (positions.length < 2 || orderedEventIds.length < 2) return 0;
  return metric(
    (Math.max(...positions) - Math.min(...positions)) /
      Math.max(1, orderedEventIds.length - 1),
  );
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
    .map((id, index) => ({ id, index, label: labelFor(graph, id) }))
    .filter((item) => isState(item.label));

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
      const from = stateKind(start.label);
      const to = stateKind(end.label);
      const polarity =
        from === "negative" && to === "positive"
          ? 1
          : from !== to && from !== "other" && to !== "other"
            ? 0.9
            : from === "negative" || to === "positive"
              ? 0.76
              : 0.55;
      const subject = subjectName(graph).toLowerCase();
      const subjectTouch =
        subject &&
        (start.label.toLowerCase().includes(subject) ||
          end.label.toLowerCase().includes(subject))
          ? 0.1
          : 0;
      const distance = Math.min(0.18, (end.index - start.index) * 0.03);
      const score = polarity * 0.7 + subjectTouch + distance;
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
    const earlierObjects = concreteTokens(labelFor(graph, earlierId));
    if (!earlierObjects.length) continue;

    for (let j = i + 1; j < orderedEventIds.length; j += 1) {
      const laterId = orderedEventIds[j]!;
      const laterLabel = labelFor(graph, laterId);
      const laterObjects = concreteTokens(laterLabel);
      const shared = earlierObjects.filter((object) => laterObjects.includes(object));
      if (!shared.length) continue;

      const callback = CALLBACK.test(laterLabel);
      const distance = Math.min(0.18, (j - i) * 0.03);
      const score = (callback ? 0.78 : 0.5) + Math.min(0.14, shared.length * 0.07) + distance;
      if (!best || score > best.score) {
        best = { earlierId, laterId, object: shared[0]!, score };
      }
    }
  }

  return best;
}

function bestSubjectReturn(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): { startId: string; returnId: string; score: number } | undefined {
  const subject = subjectName(graph).toLowerCase();
  if (!subject) return undefined;

  const direct = orderedEventIds
    .map((id, index) => ({ id, index, label: labelFor(graph, id) }))
    .filter((item) => item.label.toLowerCase().includes(subject));

  if (direct.length < 2) return undefined;
  const start = direct[0]!;
  const returns = direct.filter((item) => item.index > start.index && CONTINUATION.test(item.label));
  if (!returns.length) return undefined;

  const result = returns[returns.length - 1]!;
  return {
    startId: start.id,
    returnId: result.id,
    score: 0.82 + Math.min(0.16, (result.index - start.index) * 0.02),
  };
}

function callbackEventIds(
  graph: RealityGraph,
  orderedEventIds: readonly string[],
): string[] {
  const callback = bestConcreteCallback(graph, orderedEventIds);
  return callback ? [callback.earlierId, callback.laterId] : [];
}

export function deriveSequenceBackedCreativeInterpretations(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): CreativeInterpretation[] {
  const orderedEventIds = unique(candidate.trajectory.flatMap((step) => step.eventIds));
  if (orderedEventIds.length < 2) return [];

  const labels = orderedEventIds.map((id) => labelFor(graph, id)).filter(Boolean);
  if (labels.length < 2) return [];

  const subject = subjectName(graph);
  const continuations = orderedEventIds.filter((id) => CONTINUATION.test(labelFor(graph, id)));
  const expectations = orderedEventIds.filter((id) => EXPECTATION.test(labelFor(graph, id)));
  const contrasts = orderedEventIds.filter((id) => CONTRAST.test(labelFor(graph, id)));
  const encounters = orderedEventIds.filter((id) => ACTION.test(labelFor(graph, id)));
  const states = orderedEventIds.filter((id) => isState(labelFor(graph, id)));

  const result: CreativeInterpretation[] = [];
  const concreteCallback = bestConcreteCallback(graph, orderedEventIds);
  const stateTransition = bestStateTransition(graph, orderedEventIds);
  const subjectReturn = bestSubjectReturn(graph, orderedEventIds);

  if (stateTransition && concreteCallback) {
    const subjectPrefix = subject ? `${subject} ` : "The subject ";
    const callbackPhrase = `${concreteCallback.object} remains in the later supplied moment`;
    result.push(
      buildCandidate(
        `${subjectPrefix}moves from ${stateTransition.startLabel} to ${stateTransition.endLabel}; the same ${callbackPhrase}.`,
        "state_change",
        unique([
          stateTransition.startId,
          stateTransition.endId,
          concreteCallback.earlierId,
          concreteCallback.laterId,
        ]),
        0.995,
        {
          subject,
          beforeEventIds: [stateTransition.startId],
          afterEventIds: [stateTransition.endId],
          before: stateTransition.startLabel,
          after: stateTransition.endLabel,
          callback: {
            detail: concreteCallback.object,
            eventIds: [concreteCallback.earlierId, concreteCallback.laterId],
            role: "recontextualization",
          },
          realizationMove: "recontextualize_callback",
          creativeOpportunity: "state_to_callback",
        },
      ),
    );
  }

  if (concreteCallback) {
    result.push(
      buildCandidate(
        `The supplied ${concreteCallback.object} returns as a concrete continuity marker in the later moment.`,
        "recurrence",
        [concreteCallback.earlierId, concreteCallback.laterId],
        0.91 + Math.min(0.07, concreteCallback.score * 0.05),
        {
          beforeEventIds: [concreteCallback.earlierId],
          afterEventIds: [concreteCallback.laterId],
          before: labelFor(graph, concreteCallback.earlierId),
          after: labelFor(graph, concreteCallback.laterId),
          callback: {
            detail: concreteCallback.object,
            eventIds: [concreteCallback.earlierId, concreteCallback.laterId],
            role: "continuity",
          },
          realizationMove: "recognize_callback",
          creativeOpportunity: "callback_recontextualization",
        },
      ),
    );
  }

  if (stateTransition) {
    const middle = orderedEventIds.filter((id) => {
      const index = orderedEventIds.indexOf(id);
      const start = orderedEventIds.indexOf(stateTransition.startId);
      const end = orderedEventIds.indexOf(stateTransition.endId);
      return index > start && index < end && (isState(labelFor(graph, id)) || OBJECT.test(labelFor(graph, id)));
    });
    const prefix = subject ? `${subject} ` : "The supplied experience ";
    result.push(
      buildCandidate(
        `${prefix}moves from ${stateTransition.startLabel} to ${stateTransition.endLabel}.`,
        "state_change",
        [stateTransition.startId, ...middle, stateTransition.endId],
        0.97,
        {
          subject,
          beforeEventIds: [stateTransition.startId],
          afterEventIds: [stateTransition.endId],
          before: stateTransition.startLabel,
          after: stateTransition.endLabel,
          realizationMove: "feel_state_transition",
          creativeOpportunity: "status_turn",
        },
      ),
    );
  }

  if (subjectReturn && stateTransition) {
    result.push(
      buildCandidate(
        `${subject || "The subject"} returns after the supplied state has changed.`,
        "continuation",
        unique([stateTransition.startId, stateTransition.endId, subjectReturn.returnId]),
        0.9,
        {
          subject,
          beforeEventIds: [stateTransition.startId],
          afterEventIds: [subjectReturn.returnId],
          before: stateTransition.startLabel,
          after: labelFor(graph, subjectReturn.returnId),
          realizationMove: "return_with_new_status",
          creativeOpportunity: "return_with_new_status",
        },
      ),
    );
  }

  if (expectations.length && continuations.length) {
    result.push(
      buildCandidate(
        "The supplied sequence continues beyond its earlier expectation.",
        "expectation_shift",
        unique([...expectations, ...continuations]),
        0.83,
        {
          beforeEventIds: expectations.slice(0, 1),
          afterEventIds: continuations.slice(-1),
          realizationMove: "recognize",
          creativeOpportunity: "recognition",
        },
      ),
    );
  }

  if (encounters.length && states.length) {
    let bestPair: { left: string; right: string; score: number } | undefined;
    for (const leftId of encounters) {
      for (const rightId of states) {
        const leftIndex = orderedEventIds.indexOf(leftId);
        const rightIndex = orderedEventIds.indexOf(rightId);
        if (leftIndex < 0 || rightIndex < 0) continue;
        const distance = Math.abs(leftIndex - rightIndex);
        const score = (distance <= 1 ? 1 : distance === 2 ? 0.78 : 0.52) * 0.8 + overlap(labelFor(graph, leftId), labelFor(graph, rightId)) * 0.2;
        if (!bestPair || score > bestPair.score) bestPair = { left: leftId, right: rightId, score };
      }
    }
    if (bestPair && bestPair.score >= 0.72) {
      result.push(
        buildCandidate(
          `A supplied encounter is followed by a concrete change in ${subject || "the subject"}.`,
          "state_change",
          [bestPair.left, bestPair.right],
          0.76,
          {
            subject,
            beforeEventIds: [bestPair.left],
            afterEventIds: [bestPair.right],
            before: labelFor(graph, bestPair.left),
            after: labelFor(graph, bestPair.right),
            realizationMove: "feel_state_transition",
            creativeOpportunity: "status_turn",
          },
        ),
      );
    }
  }

  if (states.length >= 2 && continuations.length) {
    const ids = unique([...states, ...continuations]);
    result.push(
      buildCandidate(
        "The supplied changes converge without requiring a new event.",
        "convergence",
        ids,
        0.58,
        {
          beforeEventIds: states.slice(0, 1),
          afterEventIds: continuations.slice(-1),
          realizationMove: "recognize",
          creativeOpportunity: "recognition",
        },
      ),
    );
  }

  if (contrasts.length >= 1 && labels.length >= 3) {
    result.push(
      buildCandidate(
        "The supplied material acquires a different reading after the contrast.",
        "contrast",
        contrasts,
        0.66,
        {
          evidenceEventIds: contrasts,
          beforeEventIds: contrasts.slice(0, 1),
          afterEventIds: contrasts.slice(-1),
          realizationMove: "hold_contrast",
          creativeOpportunity: "contrast_reframe",
        },
      ),
    );
  }

  if (continuations.length >= 1 && labels.length >= 3) {
    result.push(
      buildCandidate(
        "The supplied return keeps an earlier detail alive.",
        "recurrence",
        unique([...callbackEventIds(graph, orderedEventIds), ...continuations]),
        0.68,
        {
          beforeEventIds: continuations.slice(0, 1),
          afterEventIds: continuations.slice(-1),
          realizationMove: "recognize_callback",
          creativeOpportunity: "callback_recontextualization",
        },
      ),
    );
  }

  return result;
}

export function deriveSequenceBackedCreativeInterpretation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): CreativeInterpretation | undefined {
  return deriveSequenceBackedCreativeInterpretations(graph, candidate)[0];
}
