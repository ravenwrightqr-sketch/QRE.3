/**
 * Compatibility facade. No fixed scene library remains here.
 * Super Cog owns semantic scene selection.
 */

import {
  compileCognitiveExperience,
} from "../../experience/cognitiveExperienceCompiler.js";

import type {
  ExperienceGenome,
  ExperienceScene,
} from "@qre/contracts";

export function compileScenes(
  genome: ExperienceGenome,
): ExperienceScene[] {
  const result = compileCognitiveExperience(genome.meaning.why);

  return result.story.beats.map((beat) => ({
    id: beat.id,
    type: beat.kind,
    title: beat.kind,
    atmosphere: beat.emotionalTarget,
    emotionalIntent: beat.text,
    duration: 30,
  }));
}
