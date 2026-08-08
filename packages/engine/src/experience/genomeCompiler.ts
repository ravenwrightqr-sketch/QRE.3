/**
 * Compatibility boundary.
 *
 * The canonical compiler now lives in ../compiler/coreCompiler.ts.
 * Keep this module temporarily so existing imports continue to resolve while
 * the legacy compiler tree is retired incrementally.
 */

export {
  compileExperience,
  compileExperienceGenome,
  genomeCompiler,
} from "../compiler/coreCompiler.js";
