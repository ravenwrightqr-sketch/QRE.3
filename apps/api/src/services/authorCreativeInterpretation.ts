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
  /\b(?:kept|continued|continue|continues|still|again|returned|return|back|again)\b/i,
  /\b(?:wanted|want|wanted\s+to|needed|need)\b.+\b(?:again|more|continue|talk)\b/i,
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

  const expectations = meaningful.filter((label) =>
    containsAny(label, EXPECTATION),
  );
  const continuation = meaningful.filter((label) =>
    containsAny(label, CONTINUATION),
  );
  const states = meaningful.filter((label) =>
    containsAny(label, STATE),
  );
  const recurrence = meaningful.filter((label) =>
    containsAny(label, RECURRENCE),
  );
  const contrasts = meaningful.filter((label) =>
    containsAny(label, CONTRAST),
  );
  const encounters = meaningful.filter((label) =>
    containsAny(label, ACTION_OR_ENCOUNTER),
  );

  const candidates: CreativeInterpretation[] = [];

  if (expectations.length && states.length && continuation.length) {
    const ids = orderedEventIds.filter((id) => {
      const label = labelFor(graph, id);
      return expectations.includes(label) ||
        states.includes(label) ||
        continuation.includes(label);
    });

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
    const ids = orderedEventIds.filter((id) => {
      const label = labelFor(graph, id);
      return encounters.includes(label) || continuation.includes(label);
    });

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

    for (const left of encounters) {
      for (const right of states) {
        const proximity = Math.max(
          ...orderedEventIds.map((id, index) => {
            const label = labelFor(graph, id);
            if (label !== left) return 0;
            const rightIndex = labels.findIndex((item) => item === right);
            if (rightIndex < 0) return 0;
            const distance = Math.abs(index - rightIndex);
            return distance <= 1 ? 1 : distance === 2 ? 0.78 : 0.5;
          }),
        );

        const semanticCarry = overlap(left, right);
        const score = proximity * 0.7 + semanticCarry * 0.3;
        if (score > bestPair.score) {
          bestPair = { left, right, score };
        }
      }
    }

    if (bestPair.score >= 0.7) {
      candidates.push(
        buildCandidate(
          "The important part of what happened is what it became.",
          "state_change",
          orderedEventIds.filter((id) =>
            labelFor(graph, id) === bestPair.left ||
            labelFor(graph, id) === bestPair.right,
          ),
          0.82,
        ),
      );
    }
  }

  if (recurrence.length && meaningful.length >= 3) {
    const ids = orderedEventIds.filter((id) =>
      recurrence.includes(labelFor(graph, id)),
    );

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
    const ids = orderedEventIds.filter((id) =>
      contrasts.includes(labelFor(graph, id)),
    );

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
