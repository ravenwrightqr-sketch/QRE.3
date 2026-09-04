import type {
  MouthCandidateBeat,
  RealizationObligations,
} from "@qre/contracts";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";

const clean = (value: unknown): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const uniqueStrings = (
  values: readonly unknown[],
): string[] => [
  ...new Set(
    values
      .map(clean)
      .filter(Boolean),
  ),
];

function requiredConcreteAnchors(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  if (!/payoff|release/i.test(clean(beat.role))) {
    return [];
  }

  const eventIds = new Set(
    beat.eventIds ?? [],
  );

  const labels = uniqueStrings(
    envelope.events
      .filter((event) =>
        eventIds.has(event.id),
      )
      .map((event) => event.label),
  );

  const suppliedEntities =
    envelope.suppliedEntities ?? [];

  const anchors =
    suppliedEntities.filter((entity) =>
      labels.some((label) =>
        label
          .toLowerCase()
          .includes(
            clean(entity).toLowerCase(),
          ),
      ),
    );

  return anchors.length
    ? uniqueStrings(anchors).slice(0, 8)
    : uniqueStrings(labels).slice(0, 8);
}

export function buildRealizationObligations(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): RealizationObligations {
  return {
    openingIdentity: {
      required: beat.order === 1,
      subject: clean(envelope.subject),
    },

    requiredAnchors:
      requiredConcreteAnchors(
        beat,
        envelope,
      ),

    explanationPolicy: {
      forbidden:
        beat.observerExperience
          ?.explanationForbidden === true,
    },

    endpointPolicy: {
      mode:
        /payoff|release/i.test(
          clean(beat.role),
        )
          ? "preserve"
          : "none",
    },
  };
}