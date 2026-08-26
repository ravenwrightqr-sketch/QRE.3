import type {
  CognitiveMindState,
  CognitiveCreativeLearning,
} from "@qre/contracts";

import type { WorldModel } from "./worldModel.js";
import type { CreativeCandidate } from "./creativePolicy.js";
import type { UniversalMindContext } from "./universalMindContext.js";

const clean = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const unique = (
  values: readonly string[],
): string[] =>
  [...new Set(
    values
      .map(clean)
      .filter(Boolean),
  )];

const keyOf = (value: string): string =>
  clean(value).toLowerCase();



/**
 * Feedback is behavioral input, not world evidence.
 *
 * Convert free-form user feedback into governed preference
 * tokens before it enters persistent cognitive learning.
 *
 * Example:
 *
 * "too long and too explanatory"
 *
 * becomes:
 *
 * ["short", "explanation"]
 *
 * and never becomes a learned source-world phrase.
 */
function feedbackTokens(values: readonly string[]): string[] {
  const out: string[] = [];

  for (const raw of values) {
    const value = clean(raw).toLowerCase();

    if (!value) continue;

    if (
      /\b(?:short|shorter|punchy|sharp|tight|terse|quick|fast|snappy)\b/.test(
        value,
      )
    ) {
      out.push("short");
    }

    if (
      /\b(?:callback|revisit|revisited|recall|returning|continuity)\b/.test(
        value,
      )
    ) {
      out.push("callback");
    }

    if (
      /\b(?:surprise|surprising|unexpected|reveal|twist|jolt|contrast|reframe|recontextual)\b/.test(
        value,
      )
    ) {
      out.push("surprise");
    }

    if (
      /\b(?:pace|tempo|accelerat|tighten|early hit|hook|move faster)\b/.test(
        value,
      )
    ) {
      out.push("acceleration");
    }

    if (
      /\b(?:explain|explanatory|explanation|longform|essay|wordy|verbose|too much context|too much setup)\b/.test(
        value,
      )
    ) {
      out.push("explanation");
    }

    if (
      /\b(?:repeat|repetitive|same wording|restart|retread|again and again)\b/.test(
        value,
      )
    ) {
      out.push("repetition");
    }

    if (
      /\b(?:comedy|funny|humor|humour|playful|absurd|ridiculous|witty|hilarious)\b/.test(
        value,
      )
    ) {
      out.push("comedy");
    }

    if (
      /\b(?:horror|scary|creepy|dark|sinister|terrifying|frightening)\b/.test(
        value,
      )
    ) {
      out.push("horror");
    }

    if (
      /\b(?:romance|romantic|intimate|tender|love)\b/.test(
        value,
      )
    ) {
      out.push("romance");
    }

    if (
      /\b(?:mystery|mysterious|surreal)\b/.test(
        value,
      )
    ) {
      out.push("mystery");
    }

    if (
      /\b(?:wild|chaotic|unhinged)\b/.test(
        value,
      )
    ) {
      out.push("wild");
    }
  }

  return unique(out);
}

function lensFromFeedback(
  values: readonly string[],
): CognitiveMindState["lastLens"] | undefined {
  const tokens = feedbackTokens(values);

  if (tokens.includes("comedy")) return "comedy";
  if (tokens.includes("horror")) return "horror";
  if (tokens.includes("romance")) return "romance";
  if (tokens.includes("mystery")) return "mysterious";
  if (tokens.includes("wild")) return "wild";

  return undefined;
}

export function hydrateMindState(
  context: UniversalMindContext,
): CognitiveMindState {
  const prior = context.state?.creativeLearning;
  const analytics = context.analytics;

  const feedbackRejected = feedbackTokens(
    context.feedback?.rejected ?? [],
  );

  const feedbackAccepted = feedbackTokens(
    context.feedback?.accepted ?? [],
  );

  const initialPressure = Math.max(
    0.15,
    Math.min(
      0.98,
      prior?.noveltyPressure ??
        (0.5 + (analytics?.friction ?? 0) * 0.2),
    ),
  );

  const feedbackPressure =
    feedbackRejected.length > 0
      ? 0.12
      : 0;

  const creativeLearning: CognitiveCreativeLearning = {
    accepted: unique([
      ...(prior?.accepted ?? []),
      ...feedbackAccepted,
      ...(analytics?.accepted ?? []),
    ]),

    rejected: unique([
      ...(prior?.rejected ?? []),
      ...feedbackRejected,
      ...(analytics?.rejected ?? []),
    ]),

    preferences: unique([
      ...(prior?.preferences ?? []),
      ...feedbackAccepted,
      ...(context.creativePreferences ?? []),
      ...(analytics?.preferences ?? []),
    ]),

    successfulLenses: [
      ...(prior?.successfulLenses ?? []),
    ],

    avoidedPatterns: [
      ...(prior?.avoidedPatterns ?? []),
    ],

    usedPhrases: [
      ...(prior?.usedPhrases ?? []),
    ],

    noveltyPressure: Math.max(
      0.15,
      Math.min(
        0.98,
        initialPressure + feedbackPressure,
      ),
    ),
  };

  return {
    compileCount:
      context.state?.compileCount ?? 0,

    entityStates: [
      ...(context.state?.entityStates ?? []),
    ],

    relationships: [
      ...(context.state?.relationships ?? []),
    ],

    eventHistory: [
      ...(context.state?.eventHistory ?? []),
    ],

    creativeLearning,

    lastLens:
      context.state?.lastLens,

    lastMomentCount:
      context.state?.lastMomentCount,
  };
}

export function learningInput(
  state: CognitiveMindState,
  context?: UniversalMindContext,
) {
  const analytics = context?.analytics;

  const feedbackAccepted = feedbackTokens(
    context?.feedback?.accepted ?? [],
  );

  const feedbackRejected = feedbackTokens(
    context?.feedback?.rejected ?? [],
  );

  return {
    preferences: unique([
      ...state.creativeLearning.preferences,
      ...feedbackAccepted,
      ...(analytics?.preferences ?? []),
    ]),

    accepted: unique([
      ...state.creativeLearning.accepted,
      ...feedbackAccepted,
      ...(analytics?.accepted ?? []),
    ]),

    rejected: unique([
      ...state.creativeLearning.rejected,
      ...feedbackRejected,
      ...(analytics?.rejected ?? []),
    ]),

    usedPhrases:
      state.creativeLearning.usedPhrases,

    noveltyPressure: Math.max(
      state.creativeLearning.noveltyPressure,
      analytics?.friction ?? 0,
    ),
  };
}

export function evolveMindState(
  state: CognitiveMindState,
  world: WorldModel,
  selected: CreativeCandidate[],
  context: UniversalMindContext,
): CognitiveMindState {
  const accepted = feedbackTokens(
    context.feedback?.accepted ?? [],
  );

  const rejected = feedbackTokens(
    context.feedback?.rejected ?? [],
  );

  const analytics = context.analytics;

  const lensAccepted =
    lensFromFeedback(
      context.feedback?.accepted ?? [],
    ) ??
    (
      accepted.includes("comedy")
        ? "comedy"
        : accepted.includes("horror")
          ? "horror"
          : accepted.includes("romance")
            ? "romance"
            : accepted.includes("mystery")
              ? "mysterious"
              : accepted.includes("wild")
                ? "wild"
                : undefined
    );

  const entityMap =
    new Map(
      state.entityStates.map(
        (entity) => [
          keyOf(entity.entity),
          {
            ...entity,
            places: [...entity.places],
            relationships: [
              ...entity.relationships,
            ],
            states: [...entity.states],
          },
        ],
      ),
    );

  const relationshipMap =
    new Map(
      state.relationships.map(
        (relationship) => [
          `${keyOf(relationship.from)}|${relationship.relation}|${keyOf(relationship.to)}`,
          {
            ...relationship,
          },
        ],
      ),
    );

  for (const event of world.events) {
    for (const participant of event.participants) {
      const key = keyOf(participant);

      const prior =
        entityMap.get(key) ?? {
          entity: participant,
          appearances: 0,
          places: [],
          relationships: [],
          states: [],
        };

      entityMap.set(
        key,
        {
          entity: prior.entity,
          appearances:
            prior.appearances + 1,
          lastEventId:
            event.id,
          places: unique([
            ...prior.places,
            ...(event.place
              ? [event.place]
              : []),
          ]),
          relationships: unique([
            ...prior.relationships,
            ...event.participants.filter(
              (other) =>
                keyOf(other) !== key,
            ),
          ]),
          states: unique([
            ...prior.states,
            ...(event.state
              ? [event.state]
              : []),
          ]),
        },
      );
    }

    for (
      const participant of event.participants
    ) {
      if (!event.place) continue;

      const key =
        `${keyOf(participant)}|experienced_at|${keyOf(event.place)}`;

      const prior =
        relationshipMap.get(key);

      relationshipMap.set(
        key,
        {
          from: participant,
          to: event.place,
          relation: "experienced_at",
          strength: Math.min(
            1,
            (prior?.strength ?? 0.2) +
              0.15,
          ),
          eventCount:
            (prior?.eventCount ?? 0) +
            1,
        },
      );
    }

    for (
      let i = 0;
      i < event.participants.length;
      i += 1
    ) {
      for (
        let j = i + 1;
        j < event.participants.length;
        j += 1
      ) {
        const from =
          event.participants[i]!;

        const to =
          event.participants[j]!;

        const key =
          `${keyOf(from)}|shared_event|${keyOf(to)}`;

        const prior =
          relationshipMap.get(key);

        relationshipMap.set(
          key,
          {
            from,
            to,
            relation: "shared_event",
            strength: Math.min(
              1,
              (prior?.strength ?? 0.25) +
                0.2,
            ),
            eventCount:
              (prior?.eventCount ?? 0) +
              1,
          },
        );
      }
    }
  }


  const selectedMoves =
    selected.flatMap(
      (candidate) =>
        candidate.creativeDetails,
    );

  const behaviorPressure =
    analytics
      ? (analytics.friction * 0.12) -
        (analytics.engagement * 0.05)
      : 0;

  return {
    compileCount:
      state.compileCount + 1,

    entityStates: [
      ...entityMap.values(),
    ],

    relationships: [
      ...relationshipMap.values(),
    ],

    eventHistory: unique([
      ...state.eventHistory,
      ...world.events.map(
        (event) => event.raw,
      ),
    ]).slice(-100),

    creativeLearning: {
      accepted: unique([
        ...state.creativeLearning.accepted,
        ...accepted,
        ...(analytics?.accepted ?? []),
      ]).slice(-100),

      rejected: unique([
        ...state.creativeLearning.rejected,
        ...rejected,
        ...(analytics?.rejected ?? []),
      ]).slice(-100),

      preferences: unique([
        ...state.creativeLearning.preferences,
        ...accepted,
        ...(context.creativePreferences ?? []),
        ...(analytics?.preferences ?? []),
      ]).slice(-100),

      successfulLenses: unique([
        ...state.creativeLearning.successfulLenses,
        ...(lensAccepted
          ? [lensAccepted]
          : []),
      ]),

      avoidedPatterns: unique([
        ...state.creativeLearning.avoidedPatterns,
        ...rejected,
        ...(analytics?.rejected ?? []),
        ...selectedMoves.filter(
          (move) =>
            /template|generic|cliche/i.test(
              move,
            ),
        ),
      ]).slice(-100),
       usedPhrases: unique([
      ...state.creativeLearning.usedPhrases,
       ...selectedMoves,
       ]).slice(-150),
      noveltyPressure: Math.max(
        0.2,
        Math.min(
          0.98,
          state.creativeLearning
            .noveltyPressure +
            (rejected.length
              ? 0.12
              : 0) -
            (accepted.length
              ? 0.03
              : 0) +
            behaviorPressure,
        ),
      ),
    },

    lastLens:
      world.lens,

    lastMomentCount:
      selected.length,
  };
}