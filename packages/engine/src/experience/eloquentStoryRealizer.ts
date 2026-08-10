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
 * compiler's heuristic subject. The strongest available source is the most
 * specific directive/premise subject, followed by the plan's central subject.
 * This matters for prompts such as "Max the poodle": the cognitive premise
 * may preserve the proper name even when the normalized plan subject has
 * become a broader noun phrase.
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
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort((left, right) => {
      const leftWords = left.split(/\s+/).filter(Boolean).length;
      const rightWords = right.split(/\s+/).filter(Boolean).length;
      return rightWords - leftWords;
    });
}

function ensureDirectiveSubject(
  text: string,
  beat: StoryBeat,
  plan?: CognitiveExperiencePlan,
): string {
  const subjects = authoritativeSubjects(beat, plan);
  if (!subjects.length) return text;

  // The most specific conserved subject is authoritative. Do not accept a
  // generic subject merely because it happens to survive downstream.
  const strongestSubject =
    subjects
      .slice()
      .sort(
        (a, b) =>
          b.split(/\s+/).filter(Boolean).length -
            a.split(/\s+/).filter(Boolean).length ||
          b.length - a.length,
      )[0] ?? subjects[0];

  const normalizeToken = (value: string) =>
    value
      .replace(/[^\p{L}\p{N}'’-]/gu, "")
      .toLocaleLowerCase();

  // Preserve concrete evidence carried by every authoritative subject.
  // This prevents language realization from silently erasing details such as
  // "Max", "poodle", "billionaire", "spa", or other prompt-grounded facts.
  const evidenceTokens = [
    ...new Set(
      subjects
        .flatMap((subject) => subject.split(/\s+/))
        .map(normalizeToken)
        .filter((token) => token.length > 1),
    ),
  ];

  if (!evidenceTokens.length) return text;

  const normalizedText = text.toLocaleLowerCase();

  const missing = evidenceTokens.filter(
    (token) => !normalizedText.includes(token),
  );

  if (!missing.length) {
    return text;
  }

  // Restore the strongest conserved representation rather than isolated
  // missing words so concrete relationships remain intact.
  return `${text.replace(/[.!?]+$/, "")}. ${strongestSubject} remains at the center of this beat.`;
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