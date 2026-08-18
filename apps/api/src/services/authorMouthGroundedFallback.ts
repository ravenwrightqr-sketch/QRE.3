import type {
  MouthCandidateBeat,
  MouthCandidate,
} from "./authorMouthCandidateSearch.js";
import type { RealityEnvelope } from "./authorRealityEnvelope.js";
import { scoreMouthCandidate } from "./authorMouthCandidateSearch.js";

const clean = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

function labelsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const ids = [
    ...(beat.eventIds ?? []),
    ...(beat.setsUp ?? []),
    ...(beat.paysOff ?? []),
  ].filter(Boolean);

  return [
    ...new Set(
      ids
        .map(
          (id) =>
            envelope.events.find(
              (event) =>
                event.id === id,
            )?.label,
        )
        .filter(
          (value): value is string =>
            Boolean(value),
        )
        .map(clean),
    ),
  ];
}

function relationKindsForBeat(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const ids = new Set(
    beat.eventIds ?? [],
  );

  return [
    ...new Set(
      envelope.relations
        .filter(
          (relation) =>
            ids.has(relation.from) ||
            ids.has(relation.to),
        )
        .sort(
          (a, b) =>
            b.strength -
            a.strength,
        )
        .map(
          (relation) =>
            relation.kind,
        ),
    ),
  ];
}

function suppliedStateLabels(
  labels: readonly string[],
  envelope: RealityEnvelope,
): string[] {
  const states = new Set(
    envelope.suppliedStates
      .map(clean)
      .filter(Boolean),
  );

  const recurring = new Set(
    envelope.recurringSignals
      .map(clean)
      .filter(Boolean),
  );

  return labels
    .filter((label) =>
      states.has(label),
    )
    .sort((left, right) => {
      const leftRecurring =
        recurring.has(left)
          ? 1
          : 0;
      const rightRecurring =
        recurring.has(right)
          ? 1
          : 0;
      return (
        rightRecurring -
        leftRecurring
      );
    });
}

function suppliedActionLabels(
  labels: readonly string[],
  envelope: RealityEnvelope,
): string[] {
  const actions = new Set(
    envelope.suppliedActions
      .map(clean)
      .filter(Boolean),
  );

  return labels.filter((label) =>
    [...actions].some(
      (action: string) =>
        clean(label)
          .toLowerCase()
          .includes(
            action.toLowerCase(),
          ),
    ),
  );
}

function isPayoff(
  beat: MouthCandidateBeat,
): boolean {
  const attention = clean(
    beat.attentionFunction,
  ).toLowerCase();
  const role = clean(
    beat.role,
  ).toLowerCase();

  return (
    attention === "payoff" ||
    attention === "release" ||
    role === "payoff" ||
    role === "release"
  );
}

function groundedVariants(
  beat: MouthCandidateBeat,
  envelope: RealityEnvelope,
): string[] {
  const labels = labelsForBeat(
    beat,
    envelope,
  );

  const first =
    labels[0] ?? "";
  const subject = clean(
    envelope.subject,
  );
  const attention = clean(
    beat.attentionFunction,
  ).toLowerCase();
  const role = clean(
    beat.role,
  ).toLowerCase();

  const relations =
    relationKindsForBeat(
      beat,
      envelope,
    );

  const states =
    suppliedStateLabels(
      labels,
      envelope,
    );

  const actions =
    suppliedActionLabels(
      labels,
      envelope,
    );

  const variants: string[] = [];

  /*
   * The fallback is a serialization safety net, not a second author.
   * It may compress supplied evidence, but it must not synthesize interpretation
   * or create a second endpoint construction path.
   */

  if (isPayoff(beat)) {
    const endpoint = clean(
      beat.paysOff?.[0] ??
        "",
    );

    if (endpoint) {
      variants.push(
        `${endpoint}.`,
      );
    }

    return [
      ...new Set(
        variants
          .map(clean)
          .filter(Boolean),
      ),
    ];
  }

  if (
    first &&
    (attention ===
      "hook" ||
      role === "arrival" ||
      role === "establish" ||
      !beat.realizationMode)
  ) {
    variants.push(
      `${first}.`,
    );
  }

  /*
   * Universal semantic recovery: when a state and supplied action form the
   * available evidence for a relational beat, connect them with a minimal
   * temporal/causal join. This performs movement without inventing a fact.
   */
  if (
    states.length >= 1 &&
    actions.length >= 1 &&
    (
      relations.includes(
        "changes",
      ) ||
      relations.includes(
        "contrasts",
      ) ||
      relations.includes(
        "recontextualizes",
      ) ||
      clean(
        beat.realizationMode,
      )
        .toLowerCase()
        .includes("turn")
    )
  ) {
    if (subject) {
      variants.push(
        `${subject} was ${states[0]}, then ${actions[0]}.`,
      );
    }

    variants.push(
      `${states[0]}, then ${actions[0]}.`,
    );
  }

  if (
    actions.length >= 1 &&
    states.length === 0 &&
    relations.includes(
      "changes",
    )
  ) {
    variants.push(
      `${actions[0]}.`,
    );
  }

  if (!variants.length && first) {
    variants.push(
      `${first}.`,
    );
  }

  return [
    ...new Set(
      variants
        .map(clean)
        .filter(Boolean),
    ),
  ].slice(0, 8);
}

export function buildGroundedFallbackCandidates(
  input: {
    beat: MouthCandidateBeat;
    envelope: RealityEnvelope;
    priorTexts?: readonly string[];
  },
): MouthCandidate[] {
  return groundedVariants(
    input.beat,
    input.envelope,
  ).map((text) =>
    scoreMouthCandidate({
      text,
      beat: input.beat,
      envelope: input.envelope,
      priorTexts:
        input.priorTexts ?? [],
    }),
  );
}
