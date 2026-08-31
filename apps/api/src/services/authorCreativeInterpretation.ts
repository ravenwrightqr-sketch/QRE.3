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
  /\b(?:felt|feel|feels|seemed|seem|became|become|was|were|is|are)\b/i,
  /\b(?:easy|hard|calm|nervous|happy|sad|strange|familiar|awkward|comfortable|quiet|close|closer|distant|different|new|important|meaningful)\b/i,
];

const RECURRENCE = [
  /\b(?:again|returned|return|back|second|third|another|repeated|repeat|once\s+more)\b/i,
];

const CONTRAST = [
  /\b(?:but|yet|although|instead|rather|except|while|however|still)\b/i,
];

const ACTION_OR_ENCOUNTER = [
  /\b(?:met|meet|meeting|arrived|visited|started|called|texted|messaged|talked|talking|spoke|worked|played|danced|went|came|left|returned)\b/i,
];

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

function sequenceIds(
  orderedEventIds: readonly string[],
  predicate: (label: string) => boolean,
): string[] {
  return orderedEventIds.filter((id) => predicate(labelFor as never));
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

/**
 * Discover every bounded semantic interpretation supported by the selected
 * sequence. Candidate generation deliberately preserves discovery order.
 * Ranking/selection belongs downstream so the full cognitive competition can
 * be inspected and differentiated rather than collapsed here.
 */
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

  if (expectations.length && states.length && continuation.length) {
    const ids = unique([...expectations, ...states, ...continuation]);
    candidates.push(
      buildCandidate(
        "What began unexpectedly acquired a reason to continue.",
        "expectation_shift",
        ids,
        0.92,
      ),
    );
  }

  if (encounters.length && continuation.length) {
    const ids = unique([...encounters, ...continuation]);
    candidates.push(
      buildCandidate(
        "The experience moved from an encounter into something wanted again.",
        "continuation",
        ids,
        0.87,
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
          "The important part of what happened is what it became.",
          "state_change",
          [bestPair.left, bestPair.right],
          0.82,
        ),
      );
    }
  }

  if (continuation.length && expectations.length) {
    const ids = unique([...expectations, ...continuation]);
    const sequenceSpan = span(orderedEventIds, ids);
    candidates.push(
      buildCandidate(
        "The expectation matters because the experience continued past it.",
        "consequence",
        ids,
        0.78 + sequenceSpan * 0.08,
      ),
    );
  }

  if (states.length >= 2 && continuation.length) {
    const ids = unique([...states, ...continuation]);
    const sequenceSpan = span(orderedEventIds, ids);
    candidates.push(
      buildCandidate(
        "Several supplied moments accumulate toward the same change in feeling.",
        "convergence",
        ids,
        0.75 + sequenceSpan * 0.1,
      ),
    );
  }

  if (recurrence.length && meaningful.length >= 3) {
    const ids = recurrence.slice();
    candidates.push(
      buildCandidate(
        "A return turns an isolated detail into a thread.",
        "recurrence",
        ids,
        0.79,
      ),
    );
  }

  if (contrasts.length && meaningful.length >= 3) {
    const ids = contrasts.slice();
    candidates.push(
      buildCandidate(
        "The supplied material holds two readings at once.",
        "contrast",
        ids,
        0.76,
      ),
    );
  }

  return candidates;
}

/**
 * Backward-compatible single-winner API. New code should consume the plural
 * API above so Cognition can inspect and differentiate the candidate set.
 */
export function deriveSequenceBackedCreativeInterpretation(
  graph: RealityGraph,
  candidate: LatentMovieCandidate,
): CreativeInterpretation | undefined {
  return deriveSequenceBackedCreativeInterpretations(
    graph,
    candidate,
  )[0];
}
