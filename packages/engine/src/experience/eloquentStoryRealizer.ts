import type {
  CognitiveExperiencePlan,
  StoryBeat,
} from "@qre/contracts";
import { isGenericCompilerProse } from "./premiseRealizer.js";
import {
  realizePremiseBeatV3,
  realizePremiseBeatsV3,
} from "./premiseRealizerV3.js";

/**
 * Compatibility facade for the story realization entry point.
 *
 * Cognition owns semantic meaning. The universal compiler owns narrative
 * structure. This boundary is where the authoritative cognitive directive is
 * attached to each structural StoryBeat before language realization.
 *
 * The language layer therefore consumes:
 *   directive + conserved premise + concrete evidence
 *
 * rather than trusting presentation text produced by an earlier compiler
 * realization pass.
 */

function attachCognitiveDirectives(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  if (!plan?.realization?.directives?.length) {
    return beats;
  }

  const directives = new Map(
    plan.realization.directives.map((directive) => [directive.kind, directive]),
  );

  return beats.map((beat) => {
    const directive = directives.get(beat.kind);

    if (!directive) {
      return beat;
    }

    return {
      ...beat,
      directive,
    };
  });
}

function ensureDirectiveSubject(
  text: string,
  beat: StoryBeat,
): string {
  const subject = beat.directive?.subject?.trim();
  if (!subject) return text;

  const normalized = text.toLocaleLowerCase();
  const subjectWords = subject
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}'’-]/gu, ""))
    .filter(Boolean);

  // The language layer may inflect or abbreviate surrounding prose, but it
  // must never erase the authoritative cognitive subject. For multi-word
  // subjects, require every distinctive token to survive.
  const missing = subjectWords.filter((word) =>
    word.length > 1 && !normalized.includes(word.toLocaleLowerCase()),
  );

  if (!missing.length) return text;

  return `${text.replace(/[.!?]+$/, "")}. ${subject} remains at the center of this beat.`;
}

export function elevateStoryBeat(
  beat: StoryBeat,
  _index: number,
  plan?: CognitiveExperiencePlan,
): string {
  const [resolved] = attachCognitiveDirectives([beat], plan);
  const realized = realizePremiseBeatV3(resolved ?? beat, plan);
  return ensureDirectiveSubject(realized, resolved ?? beat);
}

export function elevateStoryBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  const authoritativeBeats = attachCognitiveDirectives(beats, plan);

  return authoritativeBeats.map((beat) => ({
    ...beat,
    text: ensureDirectiveSubject(
      realizePremiseBeatV3(beat, plan),
      beat,
    ),
  }));
}

export { isGenericCompilerProse };
