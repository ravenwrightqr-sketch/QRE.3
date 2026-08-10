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

export function elevateStoryBeat(
  beat: StoryBeat,
  _index: number,
  plan?: CognitiveExperiencePlan,
): string {
  const [resolved] = attachCognitiveDirectives([beat], plan);
  return realizePremiseBeatV3(resolved ?? beat, plan);
}

export function elevateStoryBeats(
  beats: StoryBeat[],
  plan?: CognitiveExperiencePlan,
): StoryBeat[] {
  const authoritativeBeats = attachCognitiveDirectives(beats, plan);
  return realizePremiseBeatsV3(authoritativeBeats, plan);
}

export { isGenericCompilerProse };
