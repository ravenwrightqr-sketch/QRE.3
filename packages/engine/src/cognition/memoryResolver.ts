import type { UniversalMindContext } from "./universalMindContext.js";
import { buildWorldModel } from "./worldModel.js";

export type MemoryResolution = {
  matches: string[];
  places: string[];
  place?: string;
  participants: string[];
  relatedTerms: string[];
  questions: string[];
};

const clean = (value: unknown) =>
  typeof value === "string"
    ? value
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[.!?]+$/, "")
    : "";

const unique = (
  values: readonly string[],
) =>
  [...new Set(
    values
      .map(clean)
      .filter(Boolean),
  )];

const STOP_NAMES =
  /^(The|Then|At|And|My|Our|This|First|Later|Everyone|Grandma)$/i;

const TEMPORAL_TAIL =
  /\s+(?:at\s+)?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this\s+(?:morning|afternoon|evening)|last\s+night|two\s+weeks?\s+ago|three\s+years?\s+later|until\s+closing|at\s+(?:sunrise|sunset)|for\s+\w+\s+(?:minutes|hours|days|weeks|years))\b.*$/i;

const TEMPORAL_ONLY =
  /^(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{4}|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|yesterday|tomorrow|this\s+(?:morning|afternoon|evening)|last\s+night|two\s+weeks?\s+ago|three\s+years?\s+later|until\s+closing|at\s+(?:sunrise|sunset)|for\s+\w+\s+(?:minutes|hours|days|weeks|years))$/i;

const MEMORY_PLACE_RE =
  /\b(?:at|in|inside|near|on|onto|under|underneath|behind|beside|between|across|through|within|from|to|toward|towards)\s+(?:(?:the|a|an|my|our|your|his|her|their|this|that)\s+)?([A-Za-z0-9][A-Za-z0-9'’&.-]*(?:\s+[A-Za-z0-9][A-Za-z0-9'’&.-]*){0,8})/i;

const NAME_RE =
  /\b[A-Z][A-Za-z'’\-]*(?:\s+[A-Z][A-Za-z'’\-]*)?\b/g;

function strings(
  context: UniversalMindContext,
): string[] {
  return unique([
    ...(context.memorySummary ?? []),
    ...(context.memories ?? []).map(
      (value) =>
        typeof value === "string"
          ? value
          : JSON.stringify(value) ?? "",
    ),
  ]);
}

function normalizePlace(
  value: string,
): string {
  return clean(value)
    .replace(
      /^(?:the|a|an|my|our|your|his|her|their|this|that)\s+/i,
      "",
    )
    .replace(TEMPORAL_TAIL, "")
    .replace(
      /\s+(?:where|when|because|while|after|before)\b.*$/i,
      "",
    )
    .trim();
}

function usablePlace(
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;

  const candidate =
    normalizePlace(value);

  if (
    !candidate ||
    TEMPORAL_ONLY.test(candidate)
  ) {
    return undefined;
  }

  return candidate;
}

function memoryPlaceEvidence(
  entry: string,
): string[] {
  const worldPlaces =
    buildWorldModel(entry).places
      .map(usablePlace)
      .filter(
        (place): place is string =>
          Boolean(place),
      );

  if (worldPlaces.length) {
    return worldPlaces;
  }

  const match =
    entry.match(MEMORY_PLACE_RE);

  const fallback =
    usablePlace(match?.[1]);

  return fallback
    ? [fallback]
    : [];
}

function memoryEpisodes(
  entries: string[],
) {
  return entries.map(
    (entry, index) => ({
      entry,
      index,
      places:
        memoryPlaceEvidence(entry),
      world:
        buildWorldModel(entry),
    }),
  );
}

function currentWorldPlaces(
  prompt: string,
): string[] {
  return buildWorldModel(prompt)
    .places
    .map(usablePlace)
    .filter(
      (place): place is string =>
        Boolean(place),
    );
}

function namesInPrompt(
  prompt: string,
): string[] {
  return unique(
    [...prompt.matchAll(NAME_RE)]
      .map((match) => match[0] ?? "")
      .filter(
        (name) =>
          name &&
          !STOP_NAMES.test(name),
      ),
  );
}

function memoryParticipantsForCurrentPrompt(
  prompt: string,
  entries: readonly string[],
): string[] {
  const currentNames =
    namesInPrompt(prompt);

  if (!currentNames.length) {
    return [];
  }

  const normalizedPrompt =
    prompt.toLowerCase();

  return unique(
    entries.flatMap((entry) =>
      [...entry.matchAll(NAME_RE)]
        .map(
          (match) => match[0] ?? "",
        )
        .filter(
          (name) =>
            name &&
            !STOP_NAMES.test(name) &&
            currentNames.some(
              (current) =>
                current.toLowerCase() ===
                name.toLowerCase(),
            ) &&
            normalizedPrompt.includes(
              name.toLowerCase(),
            ),
        ),
    ),
  );
}

export function resolveMemory(
  prompt: string,
  context: UniversalMindContext,
): MemoryResolution {
  const memory =
    strings(context);

  if (!memory.length) {
    return {
      matches: [],
      places: [],
      participants: [],
      relatedTerms: [],
      questions: [],
    };
  }

  const promptWords =
    new Set(
      prompt
        .toLowerCase()
        .split(/\W+/)
        .filter(
          (word) => word.length >= 4,
        ),
    );

  const returning =
    /\b(?:back|again|returned|returning|same place|there|here)\b/i.test(
      prompt,
    );

  const scored =
    memory
      .map((entry, index) => {
        const words =
          entry
            .toLowerCase()
            .split(/\W+/)
            .filter(
              (word) => word.length >= 4,
            );

        const overlap =
          words.reduce(
            (score, word) =>
              score +
              (promptWords.has(word)
                ? 1
                : 0),
            0,
          );

        return {
          entry,
          score: overlap,
          index,
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.index - b.index,
      );

  /*
   * Normal memory lookup is advisory.
   *
   * It may identify related historical entries,
   * but it does NOT automatically import their places
   * or participants into the current world.
   */
  const relevant = returning
    ? scored
    : scored
        .filter(
          (item) => item.score > 0,
        )
        .slice(0, 6);

  const episodes =
    memoryEpisodes(
      relevant
        .slice(0, 12)
        .map(
          (item) => item.entry,
        ),
    );

  const placeBearingEpisodes =
    episodes.filter(
      (episode) =>
        episode.places.length > 0,
    );

  const rememberedPlaces =
    unique(
      placeBearingEpisodes.flatMap(
        (episode) =>
          episode.places,
      ),
    );

  const currentPlaces =
    currentWorldPlaces(prompt);

  const topEntries =
    episodes.map(
      (episode) => episode.entry,
    );

  /*
   * A remembered participant is only allowed into the
   * current cognitive context when that same identity is
   * explicitly present in the current prompt.
   *
   * Example:
   *
   * memory: "John visited Paris."
   * prompt: "Maya visited yesterday."
   *
   * John MUST NOT become a current participant.
   */
  const participants =
    memoryParticipantsForCurrentPrompt(
      prompt,
      topEntries,
    );

  const relatedTerms =
    unique(
      topEntries.flatMap(
        (entry) =>
          entry
            .split(/\W+/)
            .filter(
              (word) =>
                word.length >= 6,
            ),
      ),
    ).slice(0, 40);

  /*
   * Explicit current place is authoritative.
   *
   * Remembered places remain available only as historical
   * matches; they are not promoted into the current world.
   */
  if (
    returning &&
    currentPlaces.length > 0
  ) {
    return {
      matches: topEntries,
      places: currentPlaces,
      place: currentPlaces[0],
      participants,
      relatedTerms,
      questions: [],
    };
  }

  /*
   * Explicit return language gives memory permission to
   * resolve a place because the prompt itself asks for
   * continuity with a prior location.
   */
  if (returning) {
    if (
      placeBearingEpisodes.length >= 2
    ) {
      return {
        matches: topEntries,
        places: rememberedPlaces,
        participants,
        relatedTerms,
        questions: [
          "Which place did you go back to?",
        ],
      };
    }

    if (
      placeBearingEpisodes.length === 1
    ) {
      const resolvedPlace =
        placeBearingEpisodes[0]
          ?.places[0];

      return {
        matches: topEntries,
        places: resolvedPlace
          ? [resolvedPlace]
          : [],
        place: resolvedPlace,
        participants,
        relatedTerms,
        questions: [],
      };
    }

    return {
      matches: topEntries,
      places: [],
      participants,
      relatedTerms,
      questions: [
        "Where did you go back to?",
      ],
    };
  }

  /*
   * A single explicit place in the current prompt wins.
   *
   * Historical places are deliberately excluded from
   * `places` here. They remain discoverable through
   * `matches` and `relatedTerms`, but cannot become
   * current-world geography.
   */
  if (
    currentPlaces.length === 1
  ) {
    return {
      matches: topEntries,
      places: currentPlaces,
      place: currentPlaces[0],
      participants,
      relatedTerms,
      questions: [],
    };
  }

  /*
   * Multiple current places remain current-world data.
   * Do not collapse them through memory.
   */
  if (
    currentPlaces.length > 1
  ) {
    return {
      matches: topEntries,
      places: currentPlaces,
      participants,
      relatedTerms,
      questions: [],
    };
  }

  /*
   * No explicit current place:
   * memory may be relevant, but it does not become
   * current-world geography.
   */
  return {
    matches: topEntries,
    places: [],
    participants,
    relatedTerms,
    questions: [],
  };
}