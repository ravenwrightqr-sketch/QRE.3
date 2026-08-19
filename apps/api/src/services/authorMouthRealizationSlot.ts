
/**
 * QRE MOUTH REALIZATION SLOT · CANONICAL BOUNDARY
 *
 * Smallest creative unit the language model is allowed to solve.
 *
 * QRE owns:
 *   - source reality
 *   - semantic kind
 *   - semantic change
 *   - source/target evidence
 *   - endpoint
 *   - obligations
 *   - forbidden moves
 *
 * The model owns:
 *   - wording
 *   - rhythm
 *   - metaphor
 *   - compression
 *   - natural-language realization
 *
 * Canonical path:
 *
 *   RealityEnvelope
 *        ↓
 *   MeaningSpineBeat
 *        ↓
 *   RealizationSlot
 *        ↓
 *   MouthCandidateBeat
 *        ↓
 *   candidate generation
 *
 * No semantic authority is created here.
 */

import type { MouthCandidateBeat } from "./authorMouthCandidateSearch.js";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import {
  meaningSpineForBeat,
  type MeaningSpine,
  type MeaningSpineKind,
} from "./authorMeaningSpine.js";

export type RealizationSlot = {
  order: number;

  /**
   * Canonical semantic operation inherited from the Meaning Spine.
   */
  kind: MeaningSpineKind;

  /**
   * Language realization mode.
   *
   * This is descriptive guidance only.
   * It never overrides `kind`.
   */
  mode: string;

  sourceEventIds: string[];
  sourceLabels: string[];

  targetEventIds: string[];
  targetLabels: string[];

  relationKinds: string[];
  relationStrength: number;

  inheritedEventIds: string[];

  change: string;
  next: string;

  obligations: string[];

  forbiddenMoves: string[];

  endpointEventId: string;
  endpointLabel: string;

  candidateCount: number;
};

const clean = (
  value: unknown,
): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const unique = (
  values: readonly string[],
): string[] =>
  [
    ...new Set(
      values
        .map(clean)
        .filter(Boolean),
    ),
  ];

function forbiddenMovesFor(
  slotKind: MeaningSpineKind,
  isEndpoint: boolean,
): string[] {
  const base = [
    "new person",
    "new object",
    "new location",
    "new concrete action",
    "new body reaction",
    "new dialogue",
    "new sound",
    "new outcome",
    "new chronology",
    "planner vocabulary",
    "analytic explanation",
    "source-keyword collage",
  ];

  if (
    slotKind === "contrast" ||
    slotKind === "recontextualize" ||
    slotKind === "callback" ||
    slotKind === "payoff"
  ) {
    base.push(
      "naming the operation instead of performing it",
      "one-sided repetition without changed significance",
    );
  }

  if (isEndpoint) {
    base.push(
      "appending earlier beats to the endpoint",
      "adding a second outcome after the endpoint",
      "replacing the supplied endpoint",
      "qualifying the endpoint with invented facts",
    );
  }

  return unique(base);
}

function endpointFor(
  envelope: RealityEnvelope,
): {
  id: string;
  label: string;
} {
  const id = clean(
    envelope.endpointEventId,
  );

  if (!id) {
    return {
      id: "",
      label: "",
    };
  }

  return {
    id,
    label:
      clean(
        envelope.events.find(
          (event) =>
            event.id === id,
        )?.label,
      ),
  };
}

function normalizeMode(
  beat: MouthCandidateBeat,
  kind: MeaningSpineKind,
): string {
  const supplied = clean(
    beat.realizationMode,
  );

  if (supplied) {
    return supplied;
  }

  const attention = clean(
    beat.attentionFunction,
  );

  if (attention) {
    return attention;
  }

  return kind;
}

function buildSlot(
  beat: MouthCandidateBeat,
  spine: MeaningSpine,
  envelope: RealityEnvelope,
  candidateCount: number,
): RealizationSlot {
  const spineBeat =
    meaningSpineForBeat(
      spine,
      beat.order,
    );

  if (!spineBeat) {
    throw new Error(
      `REALIZATION SLOT INVARIANT FAILED: missing meaning-spine beat ${beat.order}.`,
    );
  }

  const endpoint =
    endpointFor(envelope);

  const isEndpoint =
    Boolean(
      endpoint.id,
    ) &&
    (
      spineBeat.kind ===
        "payoff" ||
      spineBeat.targetEventIds.includes(
        endpoint.id,
      )
    );

  /*
   * The slot inherits semantic authority exclusively from the Spine.
   * Beat-level mode metadata is allowed to describe realization style,
   * but cannot change the semantic operation.
   */
  const kind =
    spineBeat.kind;

  const sourceEventIds =
    unique([
      ...spineBeat.sourceEventIds,
    ]);

  const targetEventIds =
    unique([
      ...spineBeat.targetEventIds,
    ]);

  const inheritedEventIds =
    unique([
      ...spineBeat.inheritedEventIds,
    ]);

  const sourceLabels =
    unique([
      ...spineBeat.sourceLabels,
    ]);

  const targetLabels =
    unique([
      ...spineBeat.targetLabels,
    ]);

  const obligations =
    unique([
      ...spineBeat.obligations,
    ]);

  /*
   * Endpoint invariant:
   *
   * A payoff slot must explicitly carry the source-derived endpoint.
   * This prevents the Mouth from receiving only a vague "payoff" instruction.
   */
  if (
    endpoint.id &&
    isEndpoint &&
    !targetEventIds.includes(
      endpoint.id,
    )
  ) {
    targetEventIds.push(
      endpoint.id,
    );
  }

  if (
    endpoint.label &&
    isEndpoint &&
    !targetLabels.includes(
      endpoint.label,
    )
  ) {
    targetLabels.push(
      endpoint.label,
    );
  }

  if (
    endpoint.id &&
    isEndpoint
  ) {
    obligations.push(
      `Terminate on the supplied endpoint exactly: ${endpoint.label}.`,
    );
  }

  return {
    order:
      beat.order,

    kind,

    mode:
      normalizeMode(
        beat,
        kind,
      ),

    sourceEventIds,

    sourceLabels,

    targetEventIds,

    targetLabels,

    relationKinds:
      unique(
        spineBeat.relationKinds,
      ),

    relationStrength:
      spineBeat.relationStrength,

    inheritedEventIds,

    change:
      clean(
        spineBeat.change,
      ),

    next:
      clean(
        spineBeat.next,
      ),

    obligations:
      unique(
        obligations,
      ),

    forbiddenMoves:
      forbiddenMovesFor(
        kind,
        isEndpoint,
      ),

    endpointEventId:
      isEndpoint
        ? endpoint.id
        : "",

    endpointLabel:
      isEndpoint
        ? endpoint.label
        : "",

    candidateCount,
  };
}

export function buildRealizationSlots(
  input: {
    envelope: RealityEnvelope;
    beats: readonly MouthCandidateBeat[];
    spine: MeaningSpine;
    fast?: boolean;
  },
): RealizationSlot[] {
  const candidateCount =
    input.fast
      ? 3
      : 5;

  const ordered =
    [...input.beats]
      .sort(
        (a, b) =>
          a.order -
          b.order,
      )
      .slice(0, 6);

  const slots =
    ordered.map(
      (beat) =>
        buildSlot(
          beat,
          input.spine,
          input.envelope,
          candidateCount,
        ),
    );

  /*
   * Final endpoint invariant.
   *
   * If the RealityEnvelope has a source-derived endpoint, the final slot
   * must carry it. We fail loudly rather than allowing downstream language
   * generation to guess.
   */
  const endpoint =
    endpointFor(
      input.envelope,
    );

  if (
    endpoint.id &&
    slots.length
  ) {
    const final =
      slots[
        slots.length - 1
      ];

    if (
      !final.targetEventIds.includes(
        endpoint.id,
      )
    ) {
      final.targetEventIds.push(
        endpoint.id,
      );
    }

    if (
      endpoint.label &&
      !final.targetLabels.includes(
        endpoint.label,
      )
    ) {
      final.targetLabels.push(
        endpoint.label,
      );
    }

    if (
      final.kind ===
        "payoff" ||
      final.endpointEventId
    ) {
      final.endpointEventId =
        endpoint.id;

      final.endpointLabel =
        endpoint.label;

      final.forbiddenMoves =
        forbiddenMovesFor(
          final.kind,
          true,
        );

      final.obligations =
        unique([
          ...final.obligations,
          `Terminate on the supplied endpoint exactly: ${endpoint.label}.`,
          "Do not append earlier beats to the endpoint.",
          "Do not replace the endpoint with an invented outcome.",
        ]);
    }
  }

  return slots;
}

export function realizationSlotForBeat(
  slots: readonly RealizationSlot[],
  order: number,
): RealizationSlot | undefined {
  return slots.find(
    (slot) =>
      slot.order === order,
  );
}

