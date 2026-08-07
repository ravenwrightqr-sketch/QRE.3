/**
 * =====================================================
 * QRE COGNITIVE EXECUTIVE CONTRACT
 * =====================================================
 *
 * ROLE:
 *Input state consumed by the Executive Reasoning Layer.
 *
 *
 * The Executive acts as the compiler's
 * prefrontal control system.
 *
 *
 * It does not create ideas.
 *
 * It decides:
 *
 * - what matters
 * - what requires attention
 * - what should be explored
 * - what should be remembered
 * - what strategy should activate
 *
 *
 * Architecture:
 *
 * Cognitive State
 *        ↓
 * Executive Evaluation
 *        ↓
 * Decision
 *        ↓
 * Strategy
 *        ↓
 * Experience Evolution
 *
 * Biological prefrontal cortex
 *
 * =====================================================
 */
 import type {
 ExecutiveAction
} from "@qre/contracts";





export interface ExecutiveInput {



 /**
  * =====================================================
  * CORE COGNITION SIGNALS
  * =====================================================
  */


 /**
  * Curiosity pressure.
  */
 curiosity:number;



 /**
  * Confidence in current understanding.
  */
 confidence:number;



 /**
  * Unexpected information.
  */
 surprise:number;



 /**
  * Continuity of memory/context.
  */
 continuity:number;



 /**
  * Novelty generation.
  */
 novelty:number;



 /**
  * Internal stability.
  */
 stability:number;



 /**
  * Number/severity of contradictions.
  */
 contradictions:number;



 /**
  * Emotional resonance.
  */
 emotionalResonance:number;



 /**
  * Open cognitive questions.
  */
 unresolvedQuestions:number;



 /**
  * Emerging discoveries.
  */
 emergenceSignals:number;



 /**
  * Cognitive complexity pressure.
  *
  * Represents:
  *
  * concepts
  * relationships
  * dependencies
  * reasoning depth
  */
 complexity:number;
 /**
  * Semantic uncertainty.
  */
 uncertainty:number;
 /**
  * Memory importance.
  */
 memoryPressure:number;
 /**
  * =====================================================
  * EXPERIENCE VALUE SIGNALS
  * =====================================================
  *
  * Determines why this creation matters.
  *
  */
 /**
  * Human value created.
  *
  * Emotional, practical,
  * or personal benefit.
  */
 userValue:number;
 /**
  * Business or ecosystem potential.
  */
 businessPotential:number;
 /**
  * Importance of preserving this experience.
  */
 memoryImportance:number;
 /**
  * Strength of relationships involved.
  *
  * Examples:
  *
  * pet ↔ owner
  * family ↔ home
  * customer ↔ product
  */
 relationshipDepth:number;
 /**
  * Immediate need for action.
  */
 urgency:number;

 /**
  * =====================================================
  * STRATEGIC INTELLIGENCE
  * =====================================================
  */
 /**
  * Current optimization target.
  *
  * Examples:
  *
  * memory
  * discovery
  * safety
  * efficiency
  * relationship
  */
 objective?:string;
 /**
  * Industry/domain context.
  *
  * Examples:
  *
  * pet
  * wedding
  * retail
  * warehouse
  * healthcare
  */
 domain?:string;
 /**
  * Number of possible future paths.
  */
 possibilitySpace?:number;
 /**
  * Long-term evolutionary importance.
  */
 legacyPotential?:number;

}



export interface ExecutiveDecision {


 /**
  * Chosen cognitive behavior.
  */
 action:
 ExecutiveAction;



 /**
  * Explanation.
  */
 reason:string;



 /**
  * Importance score.
  */
 priority:number;



 /**
  * Required cognition depth.
  */
 depth:number;



 /**
  * Confidence in decision.
  */
 confidence:number;



 /**
  * Driving signals.
  */
 signals:string[];
 

 /**
  * Why this action benefits
  * the future system.
  */
 strategicValue:number;



 /**
  * Cognitive goal alignment.
  */
 goalAlignment:number;



 /**
  * Expected evolution impact.
  */
 evolutionImpact:number;


}