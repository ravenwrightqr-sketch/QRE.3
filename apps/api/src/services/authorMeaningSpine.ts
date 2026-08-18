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

const unique = (values: readonly string[]): string[] =>
  [...new Set(values.map(clean).filter(Boolean))];

function beatKind(beat: MouthCandidateBeat): MeaningSpineKind {
  const move = clean(beat.creativeMove).toLowerCase();
  const attention = clean(beat.attentionFunction).toLowerCase();
  const role = clean(beat.role).toLowerCase();

  if (attention === "payoff" || role === "payoff") return "payoff";
  if (attention === "release") return "release";
  if (move === "callback" || attention === "callback") return "callback";
  if (move === "contrast" || attention === "reframe") return "contrast";
  if (move === "recontextualization" || attention === "turn") return "recontextualize";
  if (attention === "escalation" || role === "escalation") return "escalate";
  if (role === "consequence") return "consequence";
  if (role === "discovery" || attention === "turn") return "converge";
  return "establish";
}

function eventLabels(
  envelope: RealityEnvelope,
  ids: readonly string[],
): string[] {
  const set = new Set(ids);
  return envelope.events
    .filter((event) => set.has(event.id))
    .map((event) => event.label);
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
    relationsFor(envelope, ids).map(
      (relation) => relation.kind,
    ),
  );
}

function strongestRelation(
  envelope: RealityEnvelope,
  ids: readonly string[],
): number {
  const relations = relationsFor(envelope, ids);
  return relations.length
    ? metric(
        Math.max(
          ...relations.map(
            (relation) => relation.strength,
          ),
        ),
      )
    : 0;
}

function obligationsFor(
  kind: MeaningSpineKind,
  sourceLabels: readonly string[],
  targetLabels: readonly string[],
): string[] {
  const source = sourceLabels.join(" | ");
  const target = targetLabels.join(" | ");

  switch (kind) {
    case "establish":
      return [
        `Anchor the line in supplied evidence: ${source || target}.`,
        "Do not spend the line explaining the entire subject.",
      ];
    case "contrast":
      return [
        `Make the supplied relationship between ${source || "the first signal"} and ${target || "the second signal"} felt without naming the operation.`,
        "The sentence must contain enough evidence for both sides of the contrast.",
      ];
    case "recontextualize":
      return [
        `Let ${target || "the new detail"} alter the reading of ${source || "the earlier detail"}.`,
        "Do not merely restate either source detail.",
      ];
    case "escalate":
      return [
        `Increase consequence or pressure around ${source || "the established signal"}.`,
        "Escalation must remain inside supplied reality.",
      ];
    case "callback":
      return [
        `Reuse ${source || "an earlier supplied signal"} with changed significance.`,
        "The callback must carry forward prior meaning.",
      ];
    case "consequence":
      return [
        `Show what ${source || "the prior detail"} makes newly meaningful.`,
        "Do not introduce a new event to create the consequence.",
      ];
    case "converge":
      return [
        `Connect ${source || "the supplied signals"} toward the selected endpoint.`,
        "The connection must come from an existing graph relationship.",
      ];
    case "payoff":
      return [
        `Make ${target || "the supplied ending"} feel earned by ${source || "the accumulated evidence"}.`,
        "The ending is supplied reality; do not invent a better ending.",
      ];
    case "release":
      return [
        "Release accumulated pressure without summarizing the experience.",
        "Preserve the supplied endpoint and character reading.",
      ];
  }
}

export function buildMeaningSpine(input: {
  envelope: RealityEnvelope;
  beats: readonly MouthCandidateBeat[];
  premise?: string;
}): MeaningSpine {
  const beats = [...input.beats]
    .sort((a, b) => a.order - b.order)
    .slice(0, 6);

  const spineBeats: MeaningSpineBeat[] = beats.map(
    (beat, index) => {
      const sourceEventIds = unique(
        beat.eventIds ?? [],
      );

      const previousIds =
        index > 0
          ? unique(
              beats[index - 1].eventIds ?? [],
            )
          : [];

      const inheritedEventIds = unique([
        ...previousIds,
        ...(beat.setsUp ?? []).flatMap(
          (label) =>
            input.envelope.events
              .filter(
                (event) =>
                  event.label === label,
              )
              .map((event) => event.id),
        ),
      ]);

      const sourceLabels = eventLabels(
        input.envelope,
        sourceEventIds,
      );

      const targetEventIds = unique(
        (beat.paysOff ?? []).flatMap(
          (label) =>
            input.envelope.events
              .filter(
                (event) =>
                  event.label === label,
              )
              .map((event) => event.id),
        ),
      );

      const targetLabels = eventLabels(
        input.envelope,
        targetEventIds,
      );

      const idsForRelations = unique([
        ...sourceEventIds,
        ...targetEventIds,
      ]);

      return {
        order: beat.order,
        kind: beatKind(beat),
        sourceEventIds,
        sourceLabels,
        targetEventIds,
        targetLabels,
        relationKinds: relationKindsFor(
          input.envelope,
          idsForRelations,
        ),
        relationStrength:
          strongestRelation(
            input.envelope,
            idsForRelations,
          ),
        inheritedEventIds,
        obligations: obligationsFor(
          beatKind(beat),
          sourceLabels,
          targetLabels,
        ),
      };
    },
  );

  const endpointId =
    input.envelope.endpointEventId;
  const endpointLabel =
    input.envelope.events.find(
      (event) => event.id === endpointId,
    )?.label ?? "";

  return {
    premise: clean(input.premise),
    beats: spineBeats,
    endpointEventId: endpointId,
    endpointLabel,
    globalObligations: [
      "Reality is immutable.",
      "Every realization must perform the approved meaning change rather than describe it.",
      "Later beats must inherit or recontextualize earlier supplied evidence.",
      "The final line must be supported by the supplied endpoint.",
      "Creative language may be surprising; concrete reality may not be invented.",
    ],
  };
}

export function meaningSpineForBeat(
  spine: MeaningSpine,
  order: number,
): MeaningSpineBeat | undefined {
  return spine.beats.find(
    (beat) => beat.order === order,
  );
}
