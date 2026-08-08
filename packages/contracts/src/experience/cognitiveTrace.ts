/**
 * =====================================================
 * QRE COGNITIVE TRACE CONTRACT
 * =====================================================
 *
 * Cognitive Reasoning Lineage
 *
 * Records how the compiler arrived at an experience.
 *
 * This is NOT execution.
 * This is NOT memory.
 * This is NOT runtime.
 *
 * It is the reasoning pathway connecting every
 * cognitive layer into one explainable artifact.
 *
 * Prompt
 *    ↓
 * Understanding
 *    ↓
 * Genome
 *    ↓
 * SemanticIR
 *    ↓
 * NUVO
 *    ↓
 * REVIK
 *    ↓
 * MOVER ARC
 *    ↓
 * KAIVO
 *    ↓
 * ORION
 *    ↓
 * Compiled Experience
 *
 * =====================================================
 */
 export interface CognitiveTraceStep {

  layer:
    | "understanding"
    | "genome"
    | "semanticIR"
    | "nuvo"
    | "revik"
    | "moverArc"
    | "moverTopology"
    | "kaivo"
    | "orion";

  title:string;

  purpose:string;

  inputs:string[];

  observations:string[];

  reasoning:string;

  outcome:string;

  confidence:number;

}


export interface CognitiveReasoningEdge {

  from:CognitiveTraceStep["layer"];

  to:CognitiveTraceStep["layer"];

  relationship:string;

}

export interface ExperienceCognitiveTrace {

  steps:CognitiveTraceStep[];

  edges:CognitiveReasoningEdge[];

  compilerConclusion:string;

  dominantReasoning:string;

  unresolvedQuestions:string[];

  confidence:number;

  version:number;

}