/**
 * QRE MEANING SPINE · DETERMINISTIC SEMANTIC CONTRACT
 *
 * The Meaning Spine is the bridge between a selected latent movie and
 * sentence realization.
 *
 * Reality answers WHAT EXISTS.
 * The movie answers WHY THIS ORDER.
 * The spine answers WHAT CHANGES BETWEEN EACH BEAT.
 * The mouth answers HOW TO SAY IT.
 *
 * This module never invents facts. It derives realization obligations from
 * approved beat metadata plus the immutable RealityEnvelope.
 *
 * IMPORTANT:
 * The semantic change is owned upstream by the selected Beat Graph.
 * This layer preserves and operationalizes that discovered change.
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
  Number(Math.max(0, Math.min(1, value)).toFixed(3));

const unique = (
  values: readonly string[],
): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function beatKind(
  beat: MouthCandidateBeat,
): MeaningSpineKind {
  const move = clean(
    beat.creativeMove,
  ).toLowerCase();
  const attention = clean(
    beat.attentionFunction,
  ).toLowerCase();
  const role = clean(
    beat.role,
  ).toLowerCase();

  if (
    attention === "payoff" ||
    role === "payoff"
  ) return "payoff";

  if (
    attention === "release" ||
    role === "release"
  ) return "release";

  if (
    move === "callback" ||
    attention === "callback"
  ) return "callback";

  if (
    move === "contrast" ||
    attention === "reframe"
  ) return "contrast";

  if (
    move === "recontextualization" ||
    attention === "turn"
  ) return "recontextualize";

  if (
    attention === "escalation" ||
    role === "escalation"
  ) return "escalate";

  if (
    role === "consequence"
  ) return "consequence";

  if (
    role === "discovery" ||
    attention === "turn"
  ) return "converge";

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
      (event) => event.label,
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

function obligationsFor(
  kind: MeaningSpineKind,
  sourceLabels: readonly string[],
  targetLabels: readonly string[],
  change: string,
  next: string,
): string[] {
  const source =
    sourceLabels.join(" | ");
  const target =
    targetLabels.join(" | ");
  const obligations: string[] = [];

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
        "Preserve enough evidence for the viewer to perceive the semantic difference.",
      );
      break;

    case "recontextualize":
      obligations.push(
        `Allow ${target || "the later supplied evidence"} to alter the reading of ${source || "the earlier evidence"}.`,
      );
      obligations.push(
        "Do not merely restate the source and target as separate facts.",
      );
      break;

    case "escalate":
      obligations.push(
        `Increase the consequence, pressure, or attention value around ${source || "the established evidence"} using only approved reality.`,
      );
      break;

    case "callback":
      obligations.push(
        `Reuse ${source || "earlier supplied evidence"} with its approved changed significance.`,
      );
      obligations.push(
        "The callback must carry forward accumulated meaning.",
      );
      break;

    case "consequence":
      obligations.push(
        `Show what ${source || "the prior evidence"} makes newly meaningful.`,
      );
      obligations.push(
        "Do not invent a new event to manufacture the consequence.",
      );
      break;

    case "converge":
      obligations.push(
        `Connect ${source || "the approved source signals"} toward ${target || "the approved destination"} through an existing graph relationship.`,
      );
      break;

    case "payoff":
      obligations.push(
        `Make ${target || "the supplied endpoint"} feel earned by ${source || "the accumulated evidence"}.`,
      );
      obligations.push(
        "Preserve the supplied endpoint rather than replacing it with a newly invented outcome.",
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

  return unique(obligations);
}

export function buildMeaningSpine(input: {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  premise?: string;
}): MeaningSpine {
  const beats = [...input.beats]
    .sort(
      (a, b) =>
        a.order - b.order,
    )
    .slice(0, 6);

  const spineBeats = beats.map(
    (beat, index) => {
      const sourceEventIds =
        unique(
          beat.eventIds ?? [],
        );

      const previousIds =
        index > 0
          ? unique(
              beats[
                index - 1
              ].eventIds ?? [],
            )
          : [];

      const inheritedEventIds =
        unique([
          ...previousIds,
          ...(beat.setsUp ?? []).flatMap(
            (label) =>
              input.envelope.events
                .filter(
                  (event) =>
                    event.label ===
                    label,
                )
                .map(
                  (event) =>
                    event.id,
                ),
          ),
        ]);

      const sourceLabels =
        eventLabels(
          input.envelope,
          sourceEventIds,
        );

      const targetEventIds =
        unique(
          (beat.paysOff ?? []).flatMap(
            (label) =>
              input.envelope.events
                .filter(
                  (event) =>
                    event.label ===
                    label,
                )
                .map(
                  (event) =>
                    event.id,
                ),
          ),
        );

      const targetLabels =
        eventLabels(
          input.envelope,
          targetEventIds,
        );

      const idsForRelations =
        unique([
          ...sourceEventIds,
          ...targetEventIds,
        ]);

      const kind =
        beatKind(beat);
      const change =
        clean(beat.change);
      const next = clean(
        beat.next ||
          beat.frontier,
      );

      return {
        order: beat.order,
        kind,
        sourceEventIds,
        sourceLabels,
        targetEventIds,
        targetLabels,
        relationKinds:
          relationKindsFor(
            input.envelope,
            idsForRelations,
          ),
        relationStrength:
          strongestRelation(
            input.envelope,
            idsForRelations,
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
          ),
      };
    },
  );

  const endpointId =
    input.envelope.endpointEventId;

  const endpointLabel =
    input.envelope.events.find(
      (event) =>
        event.id === endpointId,
    )?.label ?? "";

  return {
    premise: clean(
      input.premise,
    ),
    beats: spineBeats,
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
