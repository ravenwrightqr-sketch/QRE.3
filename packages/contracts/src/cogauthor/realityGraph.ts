/**
 * Compatibility surface for legacy/direct COGAUTHOR imports.
 *
 * The canonical RealityGraph contract is owned by experience/realityGraph.ts.
 * Keep this file as a thin re-export so direct COGAUTHOR imports resolve to
 * the same immutable source-reality types used by the live Author path.
 */
export type {
  RealityEvidence,
  RealityEvent,
  RealityRelation,
  RealityGraph,
} from "../experience/realityGraph.js";
