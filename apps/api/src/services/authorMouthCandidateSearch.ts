/**
 * Compatibility shim only.
 *
 * Production Mouth ownership lives in authorMouthCandidateSearchCanonical.ts.
 * Viewer-state ownership lives in authorViewerStateCut.ts.
 * This file contains no generation, scoring, truth, or selection logic.
 *
 * Existing test/diagnostic imports can remain temporarily while callers are
 * migrated. Production code must import the canonical owners directly.
 */

export {
  buildMouthCandidateMessages,
  parseMouthCandidateBatch,
  scoreMouthCandidate,
} from "./authorMouthCandidateSearchCanonical.js";

export type {
  MouthCandidateGenerationInput,
} from "./authorMouthCandidateSearchCanonical.js";

export type {
  MouthCandidate,
  MouthCandidateBatch,
  MouthCandidateBeat,
  MouthCandidateSelection,
} from "@qre/contracts";

export { deriveViewerStateCut } from "./authorViewerStateCut.js";
