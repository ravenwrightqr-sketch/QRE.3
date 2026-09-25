

/**
 * QRE MEANING SPINE · DETERMINISTIC SEMANTIC CONTRACT
 *
 * Reality answers WHAT EXISTS.
 * The selected latent movie answers WHY THIS ORDER.
 * The Beat Graph answers WHAT CHANGES.
 * The Meaning Spine answers WHAT THE MOUTH MUST REALIZE.
 * The Mouth answers HOW TO SAY IT.
 *
 * This module never invents facts.
 *
 * Canonical authority:
 *
 *   RealityEnvelope
 *        ↓
 *   Beat Graph
 *        ↓
 *   Meaning Spine
 *        ↓
 *   Realization Slots
 *
 * The source-derived endpoint is carried explicitly from the
 * RealityEnvelope into the final spine beat whenever that beat is
 * a payoff/landing operation.
 */

import type { MouthCandidateBeat } from "./authorMouthCandidateSearch.js";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

export type MeaningSpineKind =
  | "establish"
  | "contrast"
  | "recontextualize"
  | "escalate"
  | "callback"
  | "consequence"
  | "converge"
  | "payoff"
  | "release";

export type MeaningSpineBeat = {
  order: number;
  kind: MeaningSpineKind;

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
};

export type MeaningSpine = {
  premise: string;
  beats: MeaningSpineBeat[];

  endpointEventId: string;
  endpointLabel: string;

  globalObligations: string[];
};

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const metric = (value: number): number =>
  Number(
    Math.max(0, Math.min(1, value)).toFixed(3),
  );

const unique = (
  values: readonly string[],
): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function normalizeValue(
  value: unknown,
): string {
  return clean(value)
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * Semantic authority precedence:
 *
 *   explicit creative move
 *        ↓
 *   explicit attention function
 *        ↓
 *   role
 *
 * This prevents attention labels such as "reframe" from accidentally
 * overriding a more specific creative operation such as
 * "recontextualization".
 */
function beatKind(
  beat: MouthCandidateBeat,
): MeaningSpineKind {
  const move = normalizeValue(
    beat.creativeMove,
  );

  const attention = normalizeValue(
    beat.attentionFunction,
  );

  const role = normalizeValue(
    beat.role,
  );

  if (
    role === "payoff" ||
    attention === "payoff"
  ) {
    return "payoff";
  }

  if (
    role === "release" ||
    attention === "release"
  ) {
    return "release";
  }

  if (
    move === "callback" ||
    attention === "callback" ||
    role === "callback"
  ) {
    return "callback";
  }

  if (
    move === "recontextualization"
  ) {
    return "recontextualize";
  }

  if (
    move === "contrast"
  ) {
    return "contrast";
  }

  if (
    move === "status_inversion"
  ) {
    return "recontextualize";
  }

  if (
    attention === "turn"
  ) {
    return "recontextualize";
  }

  if (
    attention === "reframe"
  ) {
    return "recontextualize";
  }

  if (
    role === "escalation" ||
    attention === "escalation"
  ) {
    return "escalate";
  }

  if (
    role === "consequence"
  ) {
    return "consequence";
  }

  if (
    role === "discovery"
  ) {
    return "converge";
  }

  if (
    attention === "hook" ||
    role === "arrival" ||
    role === "opening" ||
    role === "setup"
  ) {
    return "establish";
  }

  return "establish";
}

function eventLabels(
  envelope: RealityEnvelope,
  ids: readonly string[],
): string[] {
  const set = new Set(ids);

  return envelope.events
    .filter((event) =>
      set.has(event.id),
    )
    .map(
      (event) =>
        event.label,
    );
}

function eventIdsForLabels(
  envelope: RealityEnvelope,
  labels: readonly string[],
): string[] {
  const requested = new Set(
    labels
      .map(clean)
      .filter(Boolean),
  );

  if (!requested.size) {
    return [];
  }

  return unique(
    envelope.events
      .filter((event) =>
        requested.has(
          clean(event.label),
        ),
      )
      .map(
        (event) =>
          event.id,
      ),
  );
}

function relationsFor(
  envelope: RealityEnvelope,
  ids: readonly string[],
) {
  const set = new Set(ids);

  return envelope.relations.filter(
    (relation) =>
      set.has(relation.from) &&
      set.has(relation.to),
  );
}

function relationKindsFor(
  envelope: RealityEnvelope,
  ids: readonly string[],
): string[] {
  return unique(
    relationsFor(
      envelope,
      ids,
    ).map(
      (relation) =>
        relation.kind,
    ),
  );
}

function strongestRelation(
  envelope: RealityEnvelope,
  ids: readonly string[],
): number {
  const relations =
    relationsFor(
      envelope,
      ids,
    );

  return relations.length
    ? metric(
        Math.max(
          ...relations.map(
            (relation) =>
              relation.strength,
          ),
        ),
      )
    : 0;
}

function appendUnique(
  target: string[],
  values: readonly string[],
): void {
  for (const value of values) {
    const cleaned = clean(value);

    if (
      cleaned &&
      !target.includes(cleaned)
    ) {
      target.push(cleaned);
    }
  }
}

function obligationsFor(
  kind: MeaningSpineKind,
  sourceLabels: readonly string[],
  targetLabels: readonly string[],
  change: string,
  next: string,
  endpointLabel: string,
): string[] {
  const source =
    sourceLabels.join(" | ");

  const target =
    targetLabels.join(" | ");

  const obligations: string[] =
    [];

  if (change) {
    obligations.push(
      `Perform the approved semantic change: ${change}.`,
    );
  }

  if (next) {
    obligations.push(
      `Maintain forward movement toward the approved frontier: ${next}.`,
    );
  }

  switch (kind) {
    case "establish":
      obligations.push(
        `Anchor the realization in supplied evidence: ${source || target || "approved source evidence"}.`,
      );
      obligations.push(
        "Do not spend the line explaining the entire experience.",
      );
      break;

    case "contrast":
      obligations.push(
        `Make the approved relationship between ${source || "the source evidence"} and ${target || "the target evidence"} perceptible without naming the operation.`,
      );
      obligations.push(
        "Preserve enough evidence for the semantic difference to be felt.",
      );
      break;

    case "recontextualize":
      obligations.push(
        `Allow ${target || "later supplied evidence"} to alter the reading of ${source || "earlier supplied evidence"}.`,
      );
      obligations.push(
        "Do not merely restate source facts as independent facts.",
      );
      break;

    case "escalate":
      obligations.push(
        `Increase the consequence, pressure, or attention value around ${source || "established evidence"} using only approved reality.`,
      );
      obligations.push(
        "Escalation must come from changed significance, not invented events.",
      );
      break;

    case "callback":
      obligations.push(
        `Reuse ${source || "earlier supplied evidence"} with its approved changed significance.`,
      );
      obligations.push(
        "The callback must carry accumulated meaning forward.",
      );
      break;

    case "consequence":
      obligations.push(
        `Show what ${source || "the prior evidence"} makes newly meaningful.`,
      );
      obligations.push(
        "Do not invent a new event to manufacture consequence.",
      );
      break;

    case "converge":
      obligations.push(
        `Connect ${source || "approved source signals"} toward ${target || "the approved destination"} through an existing graph relationship.`,
      );
      obligations.push(
        "Do not invent a bridge outside the approved evidence graph.",
      );
      break;

    case "payoff":
      obligations.push(
        `Make ${endpointLabel || target || "the supplied endpoint"} feel earned by ${source || "the accumulated evidence"}.`,
      );
      obligations.push(
        "Preserve the source-derived endpoint exactly.",
      );
      obligations.push(
        "Do not append earlier beats to the endpoint line.",
      );
      break;

    case "release":
      obligations.push(
        "Release accumulated pressure without summarizing the experience.",
      );
      obligations.push(
        "Preserve the selected semantic trajectory and source-derived endpoint.",
      );
      break;
  }

  return unique(
    obligations,
  );
}

function resolveTargetIds(
  envelope: RealityEnvelope,
  beat: MouthCandidateBeat,
  kind: MeaningSpineKind,
  finalBeat: boolean,
): string[] {
  const explicitTargets =
    eventIdsForLabels(
      envelope,
      beat.paysOff ?? [],
    );

  if (
    finalBeat ||
    kind === "payoff"
  ) {
    if (
      envelope.endpointEventId &&
      !explicitTargets.includes(
        envelope.endpointEventId,
      )
    ) {
      explicitTargets.push(
        envelope.endpointEventId,
      );
    }
  }

  return unique(
    explicitTargets,
  );
}

function resolveInheritedIds(
  envelope: RealityEnvelope,
  beat: MouthCandidateBeat,
  previousBeat: MouthCandidateBeat | undefined,
): string[] {
  const inherited: string[] =
    [];

  appendUnique(
    inherited,
    previousBeat?.eventIds ??
      [],
  );

  appendUnique(
    inherited,
    eventIdsForLabels(
      envelope,
      beat.setsUp ?? [],
    ),
  );

  return unique(
    inherited,
  );
}

export function buildMeaningSpine(
  input: {
    envelope: RealityEnvelope;
    beats: readonly MouthCandidateBeat[];
    premise?: string;
  },
): MeaningSpine {
  const beats = [
    ...input.beats,
  ]
    .sort(
      (a, b) =>
        a.order - b.order,
    )
    .slice(
      0,
      6,
    );

  const spineBeats =
    beats.map(
      (
        beat,
        index,
      ) => {
        const finalBeat =
          index ===
          beats.length - 1;

        const kind =
          beatKind(
            beat,
          );

        const sourceEventIds =
          unique(
            beat.eventIds ??
              [],
          );

        const previousBeat =
          index > 0
            ? beats[
                index - 1
              ]
            : undefined;

        const inheritedEventIds =
          resolveInheritedIds(
            input.envelope,
            beat,
            previousBeat,
          );

        const sourceLabels =
          eventLabels(
            input.envelope,
            sourceEventIds,
          );

        const targetEventIds =
          resolveTargetIds(
            input.envelope,
            beat,
            kind,
            finalBeat,
          );

        const targetLabels =
          eventLabels(
            input.envelope,
            targetEventIds,
          );

        const semanticIds =
          unique([
            ...sourceEventIds,
            ...targetEventIds,
            ...inheritedEventIds,
          ]);

        const change =
          clean(
            beat.change,
          );

        const next =
          clean(
            beat.next ||
              beat.frontier,
          );

        return {
          order:
            index + 1,

          kind,

          sourceEventIds,

          sourceLabels,

          targetEventIds,

          targetLabels,

          relationKinds:
            relationKindsFor(
              input.envelope,
              semanticIds,
            ),

          relationStrength:
            strongestRelation(
              input.envelope,
              semanticIds,
            ),

          inheritedEventIds,

          change,

          next,

          obligations:
            obligationsFor(
              kind,
              sourceLabels,
              targetLabels,
              change,
              next,
              input.envelope
                .endpointEventId
                ? (
                    input.envelope.events.find(
                      (event) =>
                        event.id ===
                        input.envelope.endpointEventId,
                    )?.label ??
                    ""
                  )
                : "",
            ),
        };
      },
    );

  const endpointId =
    clean(
      input.envelope
        .endpointEventId,
    );

  const endpointLabel =
    input.envelope.events.find(
      (event) =>
        event.id ===
        endpointId,
    )?.label ?? "";

  /*
   * Hard invariant:
   *
   * If an endpoint exists and there is at least one spine beat,
   * the final beat must know the endpoint.
   */
  if (
    spineBeats.length &&
    endpointId
  ) {
    const final =
      spineBeats[
        spineBeats.length -
          1
      ];

    if (
      !final.targetEventIds.includes(
        endpointId,
      )
    ) {
      final.targetEventIds =
        unique([
          ...final.targetEventIds,
          endpointId,
        ]);

      appendUnique(
        final.targetLabels,
        endpointLabel
          ? [endpointLabel]
          : [],
      );

      final.obligations =
        obligationsFor(
          final.kind ===
          "payoff"
            ? "payoff"
            : final.kind,
          final.sourceLabels,
          final.targetLabels,
          final.change,
          final.next,
          endpointLabel,
        );
    }
  }

  return {
    premise:
      clean(
        input.premise,
      ),

    beats:
      spineBeats,

    endpointEventId:
      endpointId,

    endpointLabel,

    globalObligations: [
      "Reality is immutable.",
      "The selected movie is an interpretation of supplied reality, never a new fact source.",
      "Every realization must perform the approved semantic change rather than merely describe it.",
      "Later beats should inherit, transform, or recontextualize approved earlier evidence when the selected movie requires it.",
      "Concrete language must remain within the supplied evidence boundary.",
      "The source-derived endpoint is part of the selected trajectory; do not invent a replacement ending.",
      "The final realization must terminate at the source-derived endpoint rather than concatenate earlier beats into it.",
      "Creative language may be surprising without changing the underlying reality.",
    ],
  };
}

export function meaningSpineForBeat(
  spine: MeaningSpine,
  order: number,
): MeaningSpineBeat | undefined {
  return spine.beats.find(
    (beat) =>
      beat.order === order,
  );
}
