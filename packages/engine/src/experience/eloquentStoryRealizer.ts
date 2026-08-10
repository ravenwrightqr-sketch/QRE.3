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

/**
 * The subject used by language realization is not allowed to regress to the
 * compiler's heuristic subject. The strongest available source is the
 * directive, followed by the conserved premise, then the plan's central
 * subject. This matters for prompts such as "Max the poodle": the cognitive
 * premise may preserve the proper name even when the normalized plan subject
 * has become a broader noun phrase.
 */
function authoritativeSubjects(
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string[] {
  const premiseSubjects =
    plan?.premise?.slots
      .filter((slot) => slot.role === "subject")
      .flatMap((slot) => slot.values)
      .filter((value): value is string => typeof value === "string") ?? [];

  return [
    beat.directive?.subject,
    ...premiseSubjects,
    plan?.centralSubject,
  ]
    .map((value) => value?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function ensureDirectiveSubject(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const subjects = authoritativeSubjects(beat, plan);
  if (!subjects.length) return text;

  let result = text;
  const normalized = () => result.toLocaleLowerCase();

  for (const subject of subjects) {
    const subjectWords = subject
      .split(/\s+/)
      .map((word) => word.replace(/[^\p{L}\p{N}'’-]/gu, ""))
      .filter(Boolean);

    const missing = subjectWords.filter((word) =>
      word.length > 1 && !normalized().includes(word.toLocaleLowerCase()),
    );

    if (!missing.length) {
      return result;
    }
  }

  // No authoritative subject representation survived. Restore the most
  // specific conserved subject, rather than allowing language realization to
  // silently erase cognition's observed subject.
  const subject = subjects.find((candidate) => candidate.split(/\s+/).length > 1) ?? subjects[0];
  return `${result.replace(/[.!?]+$/, "")}. ${subject} remains at the center of this beat.`;
}

export function elevateStoryBeat(
  beat: StoryBeat,
  _index: number,
  plan?: CognitiveExperiencePlan,
): string {
  const [resolved] = attachCognitiveDirectives([beat], plan);
  const realized = realizePremiseBeatV3(resolved ?? beat, plan);
  return ensureDirectiveSubject(realized, resolved ?? beat, plan);
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
      plan,
    ),
  }));
}

export { isGenericCompilerProse };