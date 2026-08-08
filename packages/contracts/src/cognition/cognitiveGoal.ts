/**
 * =====================================================
 * QRE COGNITIVE GOAL CONTRACT
 * =====================================================
 *
 * Internal optimization objective.
 *
 * Goals allow cognition to move toward
 * desired future states.
 *
 *
 * A goal is not a task.
 *
 * A goal represents:
 *
 * Entity
 *    +
 * Meaning
 *    +
 * Desired Evolution
 *    +
 * Future State
 *
 *
 * Used by:
 *
 * - Cognition Loop
 * - Executive Layer
 * - Industry Adaptation
 * - Experience Compiler
 *
 * =====================================================
 */


/**
 * =====================================================
 * GOAL SOURCE
 * =====================================================
 */

export type CognitiveGoalSource =

 | "compiler"

 | "user"

 | "industry"

 | "memory"

 | "emergence"

 | "relationship"

 | "entity";





/**
 * =====================================================
 * GOAL DOMAIN
 * =====================================================
 *
 * Universal industries.
 *
 * =====================================================
 */

export type CognitiveGoalDomain =

 | "pet"

 | "wedding"

 | "relationship"

 | "home"

 | "object"

 | "warehouse"

 | "retail"

 | "health"

 | "education"

 | "event"

 | "general";





/**
 * =====================================================
 * COGNITIVE GOAL
 * =====================================================
 */

export interface CognitiveGoal {


 /**
  * Desired cognitive outcome.
  *
  * Example:
  *
  * "Preserve lifelong animal identity"
  */
 target:string;



 /**
  * Why this matters.
  */
 reason:string;



 /**
  * Importance weighting.
  *
  * 0 - 1
  */
 importance:number;



 /**
  * Completion state.
  */
 achieved:boolean;



 /**
  * Optimization pressure.
  *
  * How strongly cognition
  * should pursue this goal.
  */
 priority:number;



 /**
  * Origin of goal.
  */
 source:
 CognitiveGoalSource;



 /**
  * Industry/application domain.
  */
 domain?:
 CognitiveGoalDomain;



 /**
  * Entity this goal applies to.
  *
  * Example:
  *
  * Dog
  * Wedding
  * Product
  * Machine
  */
 entity?:
 string;



 /**
  * Relationships affected.
  *
  * Example:
  *
  * Pet ↔ Human
  * Product ↔ Owner
  */
 relationships?:
 string[];



 /**
  * Expected future change.
  */
 desiredEvolution?:
 string;



 /**
  * Executive alignment score.
  *
  * How well current cognition
  * supports this goal.
  */
 alignment?:
 number;



 /**
  * Historical reinforcement.
  *
  * How often this goal
  * has proven valuable.
  */
 reinforcement?:
 number;



 /**
  * Creation lifecycle state.
  */
 state?:

 | "discovered"

 | "active"

 | "progressing"

 | "achieved"

 | "archived";



}