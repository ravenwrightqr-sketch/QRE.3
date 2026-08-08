export * from "./semanticAnalyzer.js";

export {
  resolveSemanticConcepts,
} from "./conceptResolver.js";

export * from "./genome/index.js";

/**
 * =====================================================
 * QRE SEMANTIC COMPILER
 * =====================================================
 *
 * Semantic graph construction layer.
 *
 * =====================================================
 */


export {
  buildSemanticIR
} from "./semanticBuilder.js";