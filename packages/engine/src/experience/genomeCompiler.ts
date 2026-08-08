/**
 * Compatibility boundary for legacy imports.
 *
 * The old compiler implementation is retired. These names now resolve to the
 * canonical Cognition V2 compiler so there is only one authoring pipeline.
 */

export {
  compileExperience,
  compileExperienceV2,
  compileExperienceGenomeV2 as compileExperienceGenome,
  compileExperienceGenomeV2 as genomeCompiler,
} from "../compiler/coreCompilerV2.js";
