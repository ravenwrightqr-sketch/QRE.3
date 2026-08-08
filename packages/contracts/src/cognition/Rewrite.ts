/**
 * =====================================================
 * QRE SELF EVOLUTION REWRITER  contracts
 * =====================================================
 *
 * Problem Signal
 *        ↓
 * Failure Interpretation
 *        ↓
 * Architectural Improvement
 *        ↓
 * Evolution Proposal
 *
 * Discovers how the system should improve.
 *
 * NO DATABASE
 * NO RUNTIME
 * NO EXECUTION
 *
 * =====================================================
 */

export interface Rewrite {

    problem:string;

    proposedChange:string;

    expectedEffect:string;

    confidence:number;

    domain?:string;

    reasoning?:string;

}