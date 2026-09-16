/**
 * =====================================================
 * SEMANTIC CORTEX CONTRACT
 * =====================================================
 *
 * Human meaning interpretation layer.
 *
 * No runtime.
 * No database.
 *
 * =====================================================
 */

export interface SemanticInterpretation {

  intent:string[];

  concepts:string[];

  emotionalSignals:string[];

  worldSignals:string[];

  cognitiveSignals:string[];

  confidence:number;

}